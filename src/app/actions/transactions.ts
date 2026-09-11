"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth/session";
import { generateDocumentNumber } from "@/lib/documentNumber";
import { getStorageDriver, buildStorageKey } from "@/lib/storage";
import { validateUploadedFile, maxUploadSizeBytes } from "@/lib/upload/validateFile";
import { sha256, logAudit } from "@/lib/audit";
import {
  analyzeForm,
  analyzeSupportingDocuments,
  mapFields,
  UnreadableDocumentError,
} from "@/lib/pipeline";
import { overlayValuesOnPdf } from "@/lib/pdf/overlay";
import { assertTransition } from "@/lib/workflow";
import type { DocumentKind } from "@prisma/client";

type ActionResult = { ok: true } | { ok: false; error: string };
type UploadResult = { ok: true; warning?: string } | { ok: false; error: string };

async function getOwnedTransaction(transactionId: string, organizationId: string) {
  const transaction = await prisma.transaction.findFirst({
    where: { id: transactionId, organizationId },
  });
  if (!transaction) throw new Error("Transaction not found");
  return transaction;
}

export async function createTransactionAction() {
  const session = await requireSession();
  const documentNumber = await generateDocumentNumber(session.user.organizationId);

  const transaction = await prisma.transaction.create({
    data: {
      documentNumber,
      organizationId: session.user.organizationId,
      createdById: session.user.id,
      status: "NEW",
    },
  });

  await logAudit({ transactionId: transaction.id, userId: session.user.id, action: "TRANSACTION_CREATED" });
  redirect(`/transactions/${transaction.id}`);
}

export async function uploadDocumentAction(
  transactionId: string,
  kind: DocumentKind,
  formData: FormData,
): Promise<UploadResult> {
  const session = await requireSession();
  await getOwnedTransaction(transactionId, session.user.organizationId);

  const file = formData.get("file");
  if (!(file instanceof File)) {
    return { ok: false, error: "No file provided" };
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const validation = validateUploadedFile(file.type, buffer, maxUploadSizeBytes());
  if (!validation.ok || !validation.detectedType) {
    return { ok: false, error: validation.error ?? "Invalid file" };
  }

  const fileHash = sha256(buffer);

  // Section 43: duplicate protection. Warn, but never automatically block a
  // legitimate repeated use of the same document.
  let warning: string | undefined;
  if (kind === "SUPPORTING") {
    const duplicate = await prisma.document.findFirst({
      where: { fileHash, kind: "SUPPORTING", transactionId: { not: transactionId } },
      include: { transaction: { select: { documentNumber: true, organizationId: true } } },
    });
    if (duplicate && duplicate.transaction.organizationId === session.user.organizationId) {
      warning = `This file matches a document already used in transaction ${duplicate.transaction.documentNumber}.`;
    }
  }

  const storage = getStorageDriver();
  const storageKey = buildStorageKey(kind === "BLANK_FORM" ? "blank-forms" : "supporting-docs", file.name);
  await storage.put(storageKey, buffer, validation.detectedType);

  await prisma.document.create({
    data: {
      transactionId,
      kind,
      originalName: file.name,
      storageKey,
      mimeType: validation.detectedType,
      fileHash,
    },
  });

  const [blankCount, supportingCount] = await Promise.all([
    prisma.document.count({ where: { transactionId, kind: "BLANK_FORM" as DocumentKind } }),
    prisma.document.count({ where: { transactionId, kind: "SUPPORTING" as DocumentKind } }),
  ]);

  const transaction = await prisma.transaction.findUniqueOrThrow({ where: { id: transactionId } });
  if (transaction.status === "NEW" && blankCount > 0 && supportingCount > 0) {
    await prisma.transaction.update({ where: { id: transactionId }, data: { status: "FILES_UPLOADED" } });
  }

  await logAudit({
    transactionId,
    userId: session.user.id,
    action: "DOCUMENT_UPLOADED",
    detail: { kind, originalName: file.name },
  });

  revalidatePath(`/transactions/${transactionId}`);
  return { ok: true, warning };
}

export async function runFormAnalysisAction(transactionId: string): Promise<ActionResult> {
  const session = await requireSession();
  const transaction = await getOwnedTransaction(transactionId, session.user.organizationId);

  // Section 34: a previous failure must be retryable, not a dead end. FAILED
  // only transitions back to FILES_UPLOADED in the state machine, so reset
  // there first before re-running the pipeline from the top.
  if (transaction.status === "FAILED") {
    await prisma.transaction.update({ where: { id: transactionId }, data: { status: "FILES_UPLOADED", errorMessage: null } });
  }

  return runPipelineStep(transactionId, () => analyzeForm(transactionId));
}

export async function runDocumentAnalysisAction(transactionId: string): Promise<ActionResult> {
  const session = await requireSession();
  await getOwnedTransaction(transactionId, session.user.organizationId);
  return runPipelineStep(transactionId, () => analyzeSupportingDocuments(transactionId));
}

export async function runFieldMappingAction(transactionId: string): Promise<ActionResult> {
  const session = await requireSession();
  await getOwnedTransaction(transactionId, session.user.organizationId);
  return runPipelineStep(transactionId, () => mapFields(transactionId));
}

async function runPipelineStep(transactionId: string, step: () => Promise<void>): Promise<ActionResult> {
  try {
    await step();
    revalidatePath(`/transactions/${transactionId}`);
    return { ok: true };
  } catch (err) {
    const message =
      err instanceof UnreadableDocumentError
        ? err.message
        : err instanceof Error
          ? err.message
          : "Unknown error";

    await prisma.transaction.update({
      where: { id: transactionId },
      data: { status: "FAILED", errorMessage: message },
    });
    await logAudit({ transactionId, action: "PIPELINE_STEP_FAILED", detail: { message } });
    revalidatePath(`/transactions/${transactionId}`);
    return { ok: false, error: message };
  }
}

export async function updateFormValueAction(
  transactionId: string,
  formFieldId: string,
  value: string,
): Promise<ActionResult> {
  const session = await requireSession();
  await getOwnedTransaction(transactionId, session.user.organizationId);

  const field = await prisma.formField.findFirst({ where: { id: formFieldId, transactionId } });
  if (!field) return { ok: false, error: "Field not found" };

  // Section 11: manual corrections always override AI-generated values.
  await prisma.formValue.upsert({
    where: { transactionId_formFieldId: { transactionId, formFieldId } },
    update: { value, source: "MANUAL", confidence: 1, confirmed: true },
    create: {
      transactionId,
      formFieldId,
      value,
      source: "MANUAL",
      confidence: 1,
      confirmed: true,
    },
  });

  await logAudit({
    transactionId,
    userId: session.user.id,
    action: "FIELD_MANUALLY_CORRECTED",
    detail: { formFieldId, fieldKey: field.fieldKey },
  });

  revalidatePath(`/transactions/${transactionId}`);
  return { ok: true };
}

export async function generateFormAction(transactionId: string): Promise<ActionResult> {
  const session = await requireSession();
  const transaction = await getOwnedTransaction(transactionId, session.user.organizationId);

  try {
    assertTransition(transaction.status, "APPROVED_FOR_GENERATION");
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Invalid state" };
  }

  const [formFields, requiredMissing] = await Promise.all([
    prisma.formField.findMany({ where: { transactionId }, include: { formValues: true } }),
    prisma.formField.findMany({
      where: { transactionId, required: true, formValues: { none: {} } },
    }),
  ]);

  if (requiredMissing.length > 0) {
    return {
      ok: false,
      error: `Missing required fields: ${requiredMissing.map((f) => f.label).join(", ")}`,
    };
  }

  const blankForm = await prisma.document.findFirst({
    where: { transactionId, kind: "BLANK_FORM" as DocumentKind },
  });
  if (!blankForm) return { ok: false, error: "Blank form not found" };

  const storage = getStorageDriver();
  const originalPdf = await storage.get(blankForm.storageKey);

  const overlayFields = formFields
    .filter((f) => f.formValues.length > 0)
    .map((f) => ({
      page: f.page,
      x: f.x,
      y: f.y,
      width: f.width,
      height: f.height,
      fontSize: f.fontSize,
      value: f.formValues[0].value,
      dataType: f.dataType,
    }));

  await prisma.transaction.update({ where: { id: transactionId }, data: { status: "APPROVED_FOR_GENERATION" } });

  let generatedPdf: Buffer;
  try {
    generatedPdf = await overlayValuesOnPdf(originalPdf, overlayFields);
  } catch (err) {
    const message = err instanceof Error ? err.message : "PDF generation failed";
    await prisma.transaction.update({ where: { id: transactionId }, data: { status: "FAILED", errorMessage: message } });
    return { ok: false, error: message };
  }

  const storageKey = buildStorageKey("generated", `${transaction.documentNumber}.pdf`);
  await storage.put(storageKey, generatedPdf, "application/pdf");

  await prisma.generatedDocument.create({
    data: { transactionId, storageKey, fileHash: sha256(generatedPdf) },
  });

  await prisma.transaction.update({ where: { id: transactionId }, data: { status: "GENERATED" } });
  await logAudit({ transactionId, userId: session.user.id, action: "FORM_GENERATED" });

  revalidatePath(`/transactions/${transactionId}`);
  revalidatePath("/dashboard");
  return { ok: true };
}
