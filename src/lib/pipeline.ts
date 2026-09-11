import { prisma } from "@/lib/prisma";
import { getStorageDriver } from "@/lib/storage";
import { getAIProvider, estimateCostUsd } from "@/lib/ai/provider";
import { extractPdfLayout, layoutToPlainText } from "@/lib/pdf/extractText";
import { analyzeBlankForm } from "@/lib/pdf/analyzeForm";
import { extractFromText, extractFromImage } from "@/lib/pdf/extractDocument";
import { mapExtractedValuesToFields, toFormValueCreateInput } from "@/lib/pdf/mapFields";
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

  const buffer = await loadPdfBuffer(blankForm.storageKey);
  const layout = await extractPdfLayout(buffer);

  if (!layout.some((page) => page.hasTextLayer)) {
    throw new UnreadableDocumentError(
      "This PDF has no extractable text layer (it looks like a scanned image). Please provide a " +
        "digital PDF, or ask an admin about enabling scanned-document support.",
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
      extraction = await extractFromText(layoutToPlainText(layout), ai);
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

  const mapped = mapExtractedValuesToFields(
    formFields,
    extractedValues.map((v) => ({
      extractedValueId: v.id,
      fieldKey: v.fieldKey,
      value: v.value,
      confidence: v.confidence,
    })),
  );

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
