import { TransactionStatus } from "@prisma/client";

/**
 * Transaction state machine (Section 33). Transitions are one-directional
 * except for the explicit REVIEW_REQUIRED loop (a user can keep correcting
 * values) and FAILED, which any in-flight state can move to on error.
 */
const ALLOWED_TRANSITIONS: Record<TransactionStatus, TransactionStatus[]> = {
  NEW: ["FILES_UPLOADED", "FAILED"],
  FILES_UPLOADED: ["FORM_ANALYZED", "FAILED"],
  FORM_ANALYZED: ["DOCUMENTS_ANALYZED", "FAILED"],
  DOCUMENTS_ANALYZED: ["MAPPING_COMPLETE", "FAILED"],
  MAPPING_COMPLETE: ["REVIEW_REQUIRED", "FAILED"],
  REVIEW_REQUIRED: ["REVIEW_REQUIRED", "APPROVED_FOR_GENERATION", "FAILED"],
  APPROVED_FOR_GENERATION: ["GENERATED", "REVIEW_REQUIRED", "FAILED"],
  GENERATED: ["ARCHIVED"],
  ARCHIVED: [],
  FAILED: ["FILES_UPLOADED"],
};

export function canTransition(from: TransactionStatus, to: TransactionStatus): boolean {
  return ALLOWED_TRANSITIONS[from]?.includes(to) ?? false;
}

export function assertTransition(from: TransactionStatus, to: TransactionStatus): void {
  if (!canTransition(from, to)) {
    throw new Error(`Invalid transaction state transition: ${from} -> ${to}`);
  }
}
