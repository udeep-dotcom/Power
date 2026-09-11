import type { TransactionStatus } from "@prisma/client";

/** Confidence system (Section 10): green/yellow/red visual signal. */
export function ConfidenceBadge({ confidence }: { confidence: number }) {
  const pct = Math.round(confidence * 100);
  let classes = "bg-red-50 text-red-700 ring-red-600/20";
  let label = "Low";
  if (confidence >= 0.85) {
    classes = "bg-green-50 text-green-700 ring-green-600/20";
    label = "High";
  } else if (confidence >= 0.6) {
    classes = "bg-amber-50 text-amber-700 ring-amber-600/20";
    label = "Medium";
  }
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${classes}`}>
      {label} · {pct}%
    </span>
  );
}

const STATUS_LABELS: Record<TransactionStatus, string> = {
  NEW: "New",
  FILES_UPLOADED: "Files Uploaded",
  FORM_ANALYZED: "Reading Form",
  DOCUMENTS_ANALYZED: "Reading Documents",
  MAPPING_COMPLETE: "Matching Fields",
  REVIEW_REQUIRED: "Needs Review",
  APPROVED_FOR_GENERATION: "Approved",
  GENERATED: "Generated",
  ARCHIVED: "Archived",
  FAILED: "Failed",
};

const STATUS_CLASSES: Partial<Record<TransactionStatus, string>> = {
  GENERATED: "bg-green-50 text-green-700 ring-green-600/20",
  ARCHIVED: "bg-slate-100 text-slate-600 ring-slate-500/20",
  REVIEW_REQUIRED: "bg-amber-50 text-amber-700 ring-amber-600/20",
  FAILED: "bg-red-50 text-red-700 ring-red-600/20",
};

export function StatusBadge({ status }: { status: TransactionStatus }) {
  const classes = STATUS_CLASSES[status] ?? "bg-slate-50 text-slate-700 ring-slate-500/20";
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${classes}`}>
      {STATUS_LABELS[status]}
    </span>
  );
}
