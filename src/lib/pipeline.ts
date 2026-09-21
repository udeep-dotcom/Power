import { prisma } from "@/lib/prisma";
import { getStorageDriver } from "@/lib/storage";
import { getAIProvider, estimateCostUsd } from "@/lib/ai/provider";
import { extractPdfLayout, layoutToPlainText } from "@/lib/pdf/extractText";
import { assessTextQuality, isLikelyGarbledText } from "@/lib/pdf/textQuality";
import { analyzeBlankForm } from "@/lib/pdf/analyzeForm";
import { extractFromText, extractFromImage } from "@/lib/pdf/extractDocument";
import { mapExtractedValuesToFields, toFormValueCreateInput } from "@/lib/pdf/mapFields";
import { reconcileFieldValues } from "@/lib/pdf/reconcileFields";
import { assertTransition } from "@/lib/workflow";
import { logAudit } from "@/lib/audit";
import type { DocumentKind } from "@prisma/client";

async function recordAIUsage(
  transactionId: string,
  purpose: string,
  usage: { promptTokens: number; completionTokens: number; provider: string; model: string },
) {
  await prisma.aIUsage.create({
    data: {
      transactionId,
      provider: usage.provider,
      model: usage.model,
      promptTokens: usage.promptTokens,
      completionTokens: usage.completionTokens,
      costUsd: estimateCostUsd(usage.model, usage.promptTokens, usage.completionTokens),
      purpose,
    },
  });
}

export class UnreadableDocumentError extends Error {}

async function loadPdfBuffer(storageKey: string): Promise<Buffer> {
  const storage = getStorageDriver();
  return storage.get(storageKey);
}

/** Section 6/13: reads the blank form and detects its fields. */
export async function analyzeForm(transactionId: string): Promise<void> {
  const transaction = await prisma.transaction.findUniqueOrThrow({ where: { id: transactionId } });
  assertTransition(transaction.status, "FORM_ANALYZED");

  const blankForm = await prisma.document.findFirst({
    where: { transactionId, kind: "BLANK_FORM" as DocumentKind },
  });
  if (!blankForm) throw new Error("No blank form uploaded for this transaction");

  if (blankForm.mimeType !== "application/pdf") {
    throw new UnreadableDocumentError(
      "Only digital PDF blank forms are supported in this version. Image-based forms and scanned " +
        "PDFs are a documented Phase 2 item (see PROJECT_PLAN.md).",
    );
  }

  // Cost/latency shortcut (lightweight stand-in for the full Section 14-16
  // template system): the same handful of bank/customs forms get reused
  // verbatim day after day. If this exact file (by hash) was already
  // analyzed for an earlier transaction in this org, copy its detected
  // fields instead of paying for another AI call. This is the highest-
  // leverage cost lever available before real template fingerprint/fuzzy
  // matching exists (that's still Phase 2 — this only fires on an exact
  // byte-for-byte match).
  const reused = await prisma.document.findFirst({
    where: {
      kind: "BLANK_FORM" as DocumentKind,
      fileHash: blankForm.fileHash,
      id: { not: blankForm.id },
      transaction: { organizationId: transaction.organizationId },
    },
    orderBy: { createdAt: "desc" },
    include: { transaction: { include: { formFields: true } } },
  });

  if (reused && reused.transaction.formFields.length > 0) {
    await prisma.$transaction([
      prisma.formField.deleteMany({ where: { transactionId } }),
      prisma.formField.createMany({
        data: reused.transaction.formFields.map((f) => ({
          transactionId,
          fieldKey: f.fieldKey,
          label: f.label,
          page: f.page,
          x: f.x,
          y: f.y,
          width: f.width,
          height: f.height,
          fontSize: f.fontSize,
          dataType: f.dataType,
          dateFormat: f.dateFormat,
          required: f.required,
        })),
      }),
      prisma.transaction.update({ where: { id: transactionId }, data: { status: "FORM_ANALYZED" } }),
    ]);

    await logAudit({
      transactionId,
      action: "FORM_ANALYSIS_REUSED",
      detail: {
        reusedFromTransactionId: reused.transactionId,
        fieldsReused: reused.transaction.formFields.length,
      },
    });
    return;
  }

  const buffer = await loadPdfBuffer(blankForm.storageKey);
  const layout = await extractPdfLayout(buffer);

  if (!layout.some((page) => page.hasTextLayer)) {
    throw new UnreadableDocumentError(
      "This PDF has no extractable text layer (it looks like a scanned image). Please provide a " +
        "digital PDF, or ask an admin about enabling scanned-document support.",
    );
  }

  // A scan that was OCR'd elsewhere *has* a text layer, it's just wrong.
  // Proceeding would place fields using misread labels and silently produce
  // an incorrect filled form, so this is rejected as firmly as a missing layer.
  const formQuality = assessTextQuality(layoutToPlainText(layout));
  if (isLikelyGarbledText(formQuality)) {
    throw new UnreadableDocumentError(
      "This PDF's text layer looks like low-quality OCR of a scan rather than a digital form — " +
        `for example: ${formQuality.examples.join(", ")}. Filling a form from misread labels would ` +
        "produce a wrong document, so it's been stopped here. Please upload the original digital " +
        "PDF (the file as generated by the bank, not a scan or photo of a printout).",
    );
  }

  const ai = getAIProvider();
  const result = await analyzeBlankForm(layout, ai);

  await prisma.$transaction([
    prisma.formField.deleteMany({ where: { transactionId } }),
    prisma.formField.createMany({
      data: result.fields.map((f) => ({
        transactionId,
        fieldKey: f.fieldKey,
        label: f.label,
        page: f.page,
        x: f.x,
        y: f.y,
        width: f.width,
        height: f.height,
        fontSize: f.fontSize,
        dataType: f.dataType,
        required: f.required,
      })),
    }),
    prisma.transaction.update({ where: { id: transactionId }, data: { status: "FORM_ANALYZED" } }),
  ]);

  await recordAIUsage(transactionId, "form-analysis", result.usage);
  await logAudit({
    transactionId,
    action: "FORM_ANALYZED",
    detail: { fieldsDetected: result.fields.length, unresolved: result.unresolved },
  });
}

/** Section 7: reads every supporting document and extracts candidate field values. */
export async function analyzeSupportingDocuments(transactionId: string): Promise<void> {
  const transaction = await prisma.transaction.findUniqueOrThrow({ where: { id: transactionId } });
  assertTransition(transaction.status, "DOCUMENTS_ANALYZED");

  const documents = await prisma.document.findMany({
    where: { transactionId, kind: "SUPPORTING" as DocumentKind },
  });
  if (documents.length === 0) throw new Error("No supporting documents uploaded for this transaction");

  // Idempotent on retry: drop any values from a previous, possibly failed, run.
  await prisma.extractedValue.deleteMany({ where: { transactionId } });

  const ai = getAIProvider();

  for (const doc of documents) {
    const buffer = await loadPdfBuffer(doc.storageKey);
    let extraction;

    if (doc.mimeType === "application/pdf") {
      const layout = await extractPdfLayout(buffer);
      if (!layout.some((page) => page.hasTextLayer)) {
        await logAudit({
          transactionId,
          action: "DOCUMENT_UNREADABLE",
          detail: { documentId: doc.id, reason: "no text layer (scanned PDF)" },
        });
        continue;
      }

      const plainText = layoutToPlainText(layout);
      // Same reasoning as the blank form: a garbled OCR layer yields confident
      // nonsense values, which is worse than extracting nothing at all.
      const quality = assessTextQuality(plainText);
      if (isLikelyGarbledText(quality)) {
        await logAudit({
          transactionId,
          action: "DOCUMENT_UNREADABLE",
          detail: {
            documentId: doc.id,
            reason: "garbled text layer (OCR'd scan)",
            malformedRatio: Number(quality.malformedRatio.toFixed(3)),
            examples: quality.examples,
          },
        });
        continue;
      }

      extraction = await extractFromText(plainText, ai);
    } else {
      extraction = await extractFromImage(buffer.toString("base64"), doc.mimeType, ai);
    }

    if (extraction.candidates.length > 0) {
      await prisma.extractedValue.createMany({
        data: extraction.candidates.map((c) => ({
          transactionId,
          documentId: doc.id,
          fieldKey: c.fieldKey,
          value: c.value,
          sourceText: c.sourceText,
          sourcePage: c.sourcePage,
          confidence: c.confidence,
          extractionMethod: doc.mimeType === "application/pdf" ? "llm-structured-text" : "llm-vision",
        })),
      });
    }

    await recordAIUsage(transactionId, "document-extraction", extraction.usage);
  }

  const anyExtracted = await prisma.extractedValue.count({ where: { transactionId } });
  if (anyExtracted === 0) {
    throw new UnreadableDocumentError(
      "None of the supporting documents could be read automatically. Please provide digital PDFs or " +
        "clear photos (JPG/PNG).",
    );
  }

  await prisma.transaction.update({ where: { id: transactionId }, data: { status: "DOCUMENTS_ANALYZED" } });
  await logAudit({ transactionId, action: "DOCUMENTS_ANALYZED", detail: { documentCount: documents.length } });
}

/** Section 11: deterministically map extracted values onto detected form fields, then require human review. */
export async function mapFields(transactionId: string): Promise<void> {
  const transaction = await prisma.transaction.findUniqueOrThrow({ where: { id: transactionId } });
  assertTransition(transaction.status, "MAPPING_COMPLETE");

  const [formFields, extractedValues] = await Promise.all([
    prisma.formField.findMany({ where: { transactionId } }),
    prisma.extractedValue.findMany({ where: { transactionId } }),
  ]);

  // The form repeats a field wherever it is printed (a slip with a Bank Copy
  // and a Customer Copy carries every field twice), so the model only needs to
  // see each distinct field once.
  const uniqueFormFields = [...new Map(formFields.map((f) => [f.fieldKey, f])).values()];

  let assignmentsByFormKey = new Map<string, { sourceFieldKey: string; confidence: number }>();

  if (uniqueFormFields.length > 0 && extractedValues.length > 0) {
    const reconciliation = await reconcileFieldValues(
      uniqueFormFields.map((f) => ({
        fieldKey: f.fieldKey,
        label: f.label,
        dataType: f.dataType,
      })),
      [...new Map(extractedValues.map((v) => [v.fieldKey, { fieldKey: v.fieldKey, value: v.value }])).values()],
      getAIProvider(),
    );

    assignmentsByFormKey = new Map(
      reconciliation.assignments.map((a) => [
        a.formFieldKey,
        { sourceFieldKey: a.sourceFieldKey, confidence: a.confidence },
      ]),
    );

    await recordAIUsage(transactionId, "field-reconciliation", reconciliation.usage);
    await logAudit({
      transactionId,
      action: "FIELDS_RECONCILED",
      detail: {
        assigned: reconciliation.assignments.length,
        formFields: uniqueFormFields.length,
        rejected: reconciliation.rejected,
        assignments: reconciliation.assignments.map((a) => ({
          field: a.formFieldKey,
          from: a.sourceFieldKey,
          reason: a.reason,
        })),
      },
    });
  }

  // Re-key each extracted value onto the form field the model assigned it to,
  // then let the existing deterministic mapper do the rest — it still handles
  // two documents disagreeing about the same field, and still caps confidence
  // when they do.
  const checkboxKeys = new Set(
    uniqueFormFields.filter((f) => f.dataType === "CHECKBOX").map((f) => f.fieldKey),
  );

  const candidates = extractedValues.flatMap((v) => {
    const targets = [...assignmentsByFormKey.entries()].filter(
      ([, a]) => a.sourceFieldKey === v.fieldKey,
    );
    return targets.map(([formFieldKey, a]) => ({
      extractedValueId: v.id,
      fieldKey: formFieldKey,
      // A checkbox gets a tick, never the source text — writing "NPR" (or
      // worse, an amount) into a tick box is how a currency selection turns
      // into a garbled form.
      value: checkboxKeys.has(formFieldKey) ? "yes" : v.value,
      // Both steps have to be confident: reading the value, and placing it.
      confidence: Math.min(v.confidence, a.confidence),
    }));
  });

  const mapped = mapExtractedValuesToFields(formFields, candidates);

  await prisma.$transaction([
    prisma.formValue.deleteMany({ where: { transactionId } }),
    ...mapped.map((m) =>
      prisma.formValue.create({ data: toFormValueCreateInput(transactionId, m) }),
    ),
    prisma.transaction.update({
      where: { id: transactionId },
      data: { status: "MAPPING_COMPLETE" },
    }),
  ]);

  await prisma.transaction.update({ where: { id: transactionId }, data: { status: "REVIEW_REQUIRED" } });

  await logAudit({
    transactionId,
    action: "MAPPING_COMPLETE",
    detail: {
      mappedFields: mapped.length,
      unmappedFields: formFields.length - mapped.length,
      conflicts: mapped.filter((m) => m.hasConflict).length,
    },
  });
}

/** Runs the full analysis pipeline (Sections 6, 7, 11) end to end for a transaction. */
export async function runAnalysisPipeline(transactionId: string): Promise<void> {
  await analyzeForm(transactionId);
  await analyzeSupportingDocuments(transactionId);
  await mapFields(transactionId);
}
