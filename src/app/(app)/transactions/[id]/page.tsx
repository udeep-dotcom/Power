import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth/session";
import { getStorageDriver } from "@/lib/storage";
import { TransactionWorkspace } from "./TransactionWorkspace";

export default async function TransactionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await requireSession();

  const transaction = await prisma.transaction.findFirst({
    where: { id, organizationId: session.user.organizationId },
    include: {
      documents: { orderBy: { createdAt: "asc" } },
      formFields: { orderBy: [{ page: "asc" }, { y: "desc" }], include: { formValues: true } },
      extractedValues: true,
      generatedDocuments: { orderBy: { createdAt: "desc" }, take: 1 },
    },
  });

  if (!transaction) notFound();
  const tx = transaction;

  const storage = getStorageDriver();

  // Previously-analyzed blank forms this org can reuse without re-uploading
  // (see reuseBlankFormAction + analyzeForm's file-hash reuse path).
  const knownBlankForms =
    tx.documents.some((d) => d.kind === "BLANK_FORM")
      ? []
      : await prisma.document.findMany({
          where: {
            kind: "BLANK_FORM",
            transaction: { organizationId: session.user.organizationId, formFields: { some: {} } },
          },
          distinct: ["fileHash"],
          orderBy: { createdAt: "desc" },
          take: 20,
        });

  const documents = await Promise.all(
    tx.documents.map(async (d) => ({
      id: d.id,
      kind: d.kind,
      originalName: d.originalName,
      mimeType: d.mimeType,
      url: await storage.getUrl(d.storageKey),
    })),
  );

  function normalize(v: string) {
    return v.trim().toLowerCase();
  }
  function hasConflictFor(fieldKey: string): boolean {
    const distinctValues = new Set(
      tx.extractedValues.filter((v) => v.fieldKey === fieldKey).map((v) => normalize(v.value)),
    );
    return distinctValues.size > 1;
  }

  const fields = tx.formFields.map((f) => ({
    id: f.id,
    fieldKey: f.fieldKey,
    label: f.label,
    page: f.page,
    dataType: f.dataType,
    required: f.required,
    value: f.formValues[0]?.value ?? "",
    confidence: f.formValues[0]?.confidence ?? 0,
    source: f.formValues[0]?.source ?? null,
    hasMappedValue: f.formValues.length > 0,
    hasConflict: hasConflictFor(f.fieldKey),
  }));

  const generatedDocument = tx.generatedDocuments[0]
    ? { url: await storage.getUrl(tx.generatedDocuments[0].storageKey) }
    : null;

  return (
    <TransactionWorkspace
      transaction={{
        id: tx.id,
        documentNumber: tx.documentNumber,
        status: tx.status,
        errorMessage: tx.errorMessage,
      }}
      documents={documents}
      fields={fields}
      generatedDocument={generatedDocument}
      knownBlankForms={knownBlankForms.map((d) => ({
        id: d.id,
        originalName: d.originalName,
        lastUsedAt: d.createdAt.toISOString(),
      }))}
    />
  );
}
