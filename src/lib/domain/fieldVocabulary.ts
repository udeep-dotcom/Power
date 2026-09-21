/**
 * Semantic field-normalization layer (Section 6).
 *
 * Grounded in the documents this actually runs on: ConnectIPS / IPS / RTGS
 * interbank fund transfer slips from Nepali banks, filled from marine
 * insurance policies, proforma invoices, and supplier/customs paperwork.
 *
 * Two naming worlds meet here and they deliberately stay separate:
 *
 *  - The *form* speaks ISO 20022 payment language — Debtor (the applicant
 *    paying) and Creditor (the beneficiary being paid).
 *  - The *source documents* speak their own domain — an insurance policy has
 *    an insurer and an insured, a proforma invoice has a supplier and a buyer.
 *
 * The two are joined by the reconciliation step (reconcileFields.ts), not by
 * name equality, because which party becomes the Creditor depends on what is
 * being paid: an insurance premium makes the insurer the creditor, a supplier
 * payment makes the supplier the creditor. Listing both worlds here keeps each
 * side's key names stable enough for that step to reason about.
 */

/** What a ConnectIPS / IPS / RTGS transfer slip asks for. */
export const FORM_FIELD_KEYS = [
  "debtor_name",
  "debtor_account_number",
  "debtor_bank_branch",
  "debtor_contact_details",
  "reference_number",
  "transaction_purpose",
  "currency",
  "amount_in_figure",
  "amount_in_words",
  "creditor_name",
  "creditor_account_number",
  "creditor_code",
  "creditor_bank_name",
  "creditor_bank_branch",
  "branch",
  "date",
  "signature",
] as const;

/** What the supporting documents typically carry. */
export const SOURCE_FIELD_KEYS = [
  // Insurance policy
  "insurer_name",
  "insurer_address",
  "insured_name",
  "insured_address",
  "policy_number",
  "acceptance_number",
  "total_premium",
  "value_added_tax",
  "stamp_duty",
  "total_amount_payable",
  "sum_insured",
  "policy_date",
  // Proforma / commercial invoice
  "supplier_name",
  "supplier_address",
  "supplier_bank_name",
  "supplier_account_number",
  "supplier_bank_swift",
  "buyer_name",
  "invoice_number",
  "invoice_date",
  "invoice_amount",
  "goods_description",
  // Shared / other
  "pan_number",
  "contact_phone",
  "contact_email",
  "lc_number",
  "customs_office",
  "bill_of_lading_number",
] as const;

export const CANONICAL_FIELD_KEYS = [...FORM_FIELD_KEYS, ...SOURCE_FIELD_KEYS] as const;

export type CanonicalFieldKey = (typeof CANONICAL_FIELD_KEYS)[number];

export function normalizeFieldKey(key: string): string {
  return key
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}
