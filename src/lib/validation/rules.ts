import Decimal from "decimal.js";

/**
 * Deterministic validation rules (Section 19). None of this is delegated to
 * an LLM — format checks must be exact and reproducible.
 */

const SWIFT_REGEX = /^[A-Z]{6}[A-Z0-9]{2}([A-Z0-9]{3})?$/;

export function isValidSwift(value: string): boolean {
  return SWIFT_REGEX.test(value.trim().toUpperCase());
}

const ISO_CURRENCY_REGEX = /^[A-Z]{3}$/;

export function isValidCurrencyCode(value: string): boolean {
  return ISO_CURRENCY_REGEX.test(value.trim().toUpperCase());
}

/**
 * Account numbers must be treated as opaque strings, never as numbers —
 * leading zeros are significant and must be preserved exactly (Section 19).
 */
export function normalizeAccountNumber(value: string): string {
  return value.trim().replace(/\s+/g, "");
}

export function isPlausibleAccountNumber(value: string): boolean {
  const normalized = normalizeAccountNumber(value);
  return /^[A-Za-z0-9-]{4,34}$/.test(normalized);
}

export interface ValidationWarning {
  code: string;
  message: string;
}

export function checkAmountAgainstInvoice(
  paymentAmount: string,
  invoiceAmount: string,
): ValidationWarning | null {
  const payment = new Decimal(paymentAmount);
  const invoice = new Decimal(invoiceAmount);
  if (payment.greaterThan(invoice)) {
    return {
      code: "PAYMENT_EXCEEDS_INVOICE",
      message: `Payment amount (${paymentAmount}) exceeds invoice amount (${invoiceAmount}). Confirm before proceeding.`,
    };
  }
  return null;
}

export function checkCurrencyConsistency(currencies: string[]): ValidationWarning | null {
  const unique = new Set(currencies.map((c) => c.trim().toUpperCase()).filter(Boolean));
  if (unique.size > 1) {
    return {
      code: "CURRENCY_MISMATCH",
      message: `Multiple currencies found across documents: ${Array.from(unique).join(", ")}.`,
    };
  }
  return null;
}

export function checkBankDetailsChanged(
  previousAccount: string | null | undefined,
  newAccount: string,
): ValidationWarning | null {
  if (!previousAccount) return null;
  if (normalizeAccountNumber(previousAccount) !== normalizeAccountNumber(newAccount)) {
    return {
      code: "BANK_DETAILS_CHANGED",
      message: `Supplier's bank account differs from previously approved account (${previousAccount}). Verify before proceeding.`,
    };
  }
  return null;
}
