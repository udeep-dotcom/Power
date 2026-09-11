"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { TransactionStatus, FieldDataType, ValueSource, DocumentKind } from "@prisma/client";
import {
  uploadDocumentAction,
  runFormAnalysisAction,
  runDocumentAnalysisAction,
  runFieldMappingAction,
  updateFormValueAction,
  generateFormAction,
} from "@/app/actions/transactions";
import { StatusBadge, ConfidenceBadge } from "@/components/ui/badges";

interface DocumentInfo {
  id: string;
  kind: DocumentKind;
  originalName: string;
  mimeType: string;
  url: string;
}

interface FieldInfo {
  id: string;
  fieldKey: string;
  label: string;
  page: number;
  dataType: FieldDataType;
  required: boolean;
  value: string;
  confidence: number;
  source: ValueSource | null;
  hasMappedValue: boolean;
  hasConflict: boolean;
}

interface Props {
  transaction: {
    id: string;
    documentNumber: string;
    status: TransactionStatus;
    errorMessage: string | null;
  };
  documents: DocumentInfo[];
  fields: FieldInfo[];
  generatedDocument: { url: string } | null;
}

const PROCESSING_STAGES = [
  "Reading form",
  "Reading documents",
  "Extracting data",
  "Matching fields",
] as const;

export function TransactionWorkspace({ transaction, documents, fields, generatedDocument }: Props) {
  const router = useRouter();
  const [stageIndex, setStageIndex] = useState<number | null>(null);
  const [pipelineError, setPipelineError] = useState<string | null>(transaction.errorMessage);
  const [isPending, startTransition] = useTransition();

  const blankForm = documents.find((d) => d.kind === "BLANK_FORM");
  const supportingDocs = documents.filter((d) => d.kind === "SUPPORTING");
  const readyToAnalyze = !!blankForm && supportingDocs.length > 0;
  const showUploadStage = ["NEW", "FILES_UPLOADED", "FAILED"].includes(transaction.status) && fields.length === 0;
  const showReview = ["REVIEW_REQUIRED", "APPROVED_FOR_GENERATION", "FAILED"].includes(transaction.status) && fields.length > 0;
  const showGenerated = transaction.status === "GENERATED" || (transaction.status === "ARCHIVED");

  async function runPipeline() {
    setPipelineError(null);
    setStageIndex(0);
    const formResult = await runFormAnalysisAction(transaction.id);
    if (!formResult.ok) {
      setPipelineError(formResult.error);
      setStageIndex(null);
      return;
    }
    setStageIndex(1);
    const docsResult = await runDocumentAnalysisAction(transaction.id);
    if (!docsResult.ok) {
      setPipelineError(docsResult.error);
      setStageIndex(null);
      return;
    }
    setStageIndex(3);
    const mapResult = await runFieldMappingAction(transaction.id);
    if (!mapResult.ok) {
      setPipelineError(mapResult.error);
      setStageIndex(null);
      return;
    }
    setStageIndex(null);
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-slate-900">{transaction.documentNumber}</h1>
          <StatusBadge status={transaction.status} />
        </div>
      </div>

      {pipelineError && (
        <div className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <p>{pipelineError}</p>
          {transaction.status === "FAILED" && fields.length > 0 && stageIndex === null && (
            <button
              type="button"
              disabled={isPending}
              onClick={() => startTransition(runPipeline)}
              className="mt-3 rounded-md bg-red-700 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-800 disabled:opacity-50"
            >
              Retry Analysis
            </button>
          )}
        </div>
      )}

      {stageIndex !== null && (
        <div className="rounded-md border border-slate-200 bg-white p-4">
          <p className="text-sm font-medium text-slate-900">{PROCESSING_STAGES[stageIndex]}…</p>
          <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full bg-slate-900 transition-all"
              style={{ width: `${((stageIndex + 1) / PROCESSING_STAGES.length) * 100}%` }}
            />
          </div>
        </div>
      )}

      {showUploadStage && stageIndex === null && (
        <div className="grid gap-6 sm:grid-cols-2">
          <UploadCard
            title="A. Upload Blank Form"
            description="The form you need filled (PDF)."
            kind="BLANK_FORM"
            transactionId={transaction.id}
            existing={blankForm}
            accept="application/pdf"
          />
          <UploadCard
            title="B. Upload Supporting Documents"
            description="Invoices, bank letters, POs, etc. (PDF, JPG, PNG). You can upload more than one."
            kind="SUPPORTING"
            transactionId={transaction.id}
            existing={undefined}
            multipleExisting={supportingDocs}
            accept="application/pdf,image/jpeg,image/png"
            multiple
          />
        </div>
      )}

      {showUploadStage && stageIndex === null && (
        <div className="rounded-lg border border-slate-200 bg-white p-6">
          <h2 className="text-sm font-semibold text-slate-900">C. Analyze &amp; Fill</h2>
          <p className="mt-1 text-sm text-slate-500">
            Once both the blank form and at least one supporting document are uploaded, start processing.
          </p>
          <button
            type="button"
            disabled={!readyToAnalyze || isPending}
            onClick={() => startTransition(runPipeline)}
            className="mt-4 rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Start Analysis
          </button>
        </div>
      )}

      {showReview && (
        <ReviewTable transactionId={transaction.id} fields={fields} status={transaction.status} />
      )}

      {showGenerated && generatedDocument && (
        <div className="rounded-lg border border-green-200 bg-green-50 p-6">
          <p className="text-sm font-medium text-green-800">Form generated successfully.</p>
          <a
            href={generatedDocument.url}
            target="_blank"
            rel="noreferrer"
            className="mt-3 inline-block rounded-md bg-green-700 px-4 py-2 text-sm font-medium text-white hover:bg-green-800"
          >
            Download Filled Form
          </a>
        </div>
      )}
    </div>
  );
}

function UploadCard({
  title,
  description,
  kind,
  transactionId,
  existing,
  multipleExisting,
  accept,
  multiple,
}: {
  title: string;
  description: string;
  kind: DocumentKind;
  transactionId: string;
  existing?: DocumentInfo;
  multipleExisting?: DocumentInfo[];
  accept: string;
  multiple?: boolean;
}) {
  const router = useRouter();
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);

  async function handleFiles(fileList: FileList | null) {
    if (!fileList || fileList.length === 0) return;
    setUploading(true);
    setError(null);
    setWarning(null);
    for (const file of Array.from(fileList)) {
      const formData = new FormData();
      formData.set("file", file);
      const result = await uploadDocumentAction(transactionId, kind, formData);
      if (!result.ok) {
        setError(result.error);
        break;
      }
      if (result.warning) setWarning(result.warning);
    }
    setUploading(false);
    router.refresh();
  }

  const items = multipleExisting ?? (existing ? [existing] : []);

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-6">
      <h2 className="text-sm font-semibold text-slate-900">{title}</h2>
      <p className="mt-1 text-sm text-slate-500">{description}</p>

      <ul className="mt-3 space-y-1">
        {items.map((doc) => (
          <li key={doc.id} className="flex items-center gap-2 text-sm text-slate-700">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-green-500" /> {doc.originalName}
          </li>
        ))}
      </ul>

      <label className="mt-4 flex cursor-pointer items-center justify-center rounded-md border border-dashed border-slate-300 px-4 py-6 text-sm text-slate-500 hover:border-slate-400">
        {uploading ? "Uploading…" : "Click to choose file"}
        <input
          type="file"
          accept={accept}
          multiple={multiple}
          className="hidden"
          disabled={uploading}
          onChange={(e) => handleFiles(e.target.files)}
        />
      </label>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      {warning && <p className="mt-2 text-sm text-amber-600">{warning}</p>}
    </div>
  );
}

function ReviewTable({
  transactionId,
  fields,
  status,
}: {
  transactionId: string;
  fields: FieldInfo[];
  status: TransactionStatus;
}) {
  const router = useRouter();
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [values, setValues] = useState<Record<string, string>>(
    Object.fromEntries(fields.map((f) => [f.id, f.value])),
  );
  const [savingId, setSavingId] = useState<string | null>(null);

  async function handleBlur(fieldId: string) {
    const value = values[fieldId] ?? "";
    setSavingId(fieldId);
    await updateFormValueAction(transactionId, fieldId, value);
    setSavingId(null);
    router.refresh();
  }

  async function handleGenerate() {
    setGenerating(true);
    setError(null);
    const result = await generateFormAction(transactionId);
    setGenerating(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    router.refresh();
  }

  const missingRequired = fields.filter((f) => f.required && !f.value.trim());

  return (
    <div className="space-y-4">
      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-2">Form Field</th>
              <th className="px-4 py-2">Proposed Value</th>
              <th className="px-4 py-2">Source</th>
              <th className="px-4 py-2">Confidence</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {fields.map((f) => (
              <tr key={f.id} className={f.hasConflict ? "bg-amber-50" : undefined}>
                <td className="px-4 py-2 align-top">
                  <div className="font-medium text-slate-900">{f.label}</div>
                  {f.required && !f.value.trim() && (
                    <div className="text-xs text-red-600">Information Required</div>
                  )}
                  {f.hasConflict && (
                    <div className="text-xs text-amber-700">Conflicting values found across documents</div>
                  )}
                </td>
                <td className="px-4 py-2 align-top">
                  <input
                    className="w-full rounded-md border border-slate-300 px-2 py-1 text-sm focus:border-slate-500 focus:outline-none"
                    value={values[f.id] ?? ""}
                    onChange={(e) => setValues((prev) => ({ ...prev, [f.id]: e.target.value }))}
                    onBlur={() => handleBlur(f.id)}
                  />
                  {savingId === f.id && <span className="text-xs text-slate-400">Saving…</span>}
                </td>
                <td className="px-4 py-2 align-top text-slate-600">
                  {f.source === "MANUAL" ? "Manual" : f.hasMappedValue ? "AI" : "—"}
                </td>
                <td className="px-4 py-2 align-top">
                  {f.hasMappedValue ? <ConfidenceBadge confidence={f.confidence} /> : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {error && <div className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>}

      <div className="flex items-center gap-3">
        <button
          type="button"
          disabled={generating || status === "GENERATED"}
          onClick={handleGenerate}
          className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {generating ? "Generating…" : "Generate Filled Form"}
        </button>
        {missingRequired.length > 0 && (
          <span className="text-sm text-slate-500">{missingRequired.length} required field(s) still empty</span>
        )}
      </div>
    </div>
  );
}
