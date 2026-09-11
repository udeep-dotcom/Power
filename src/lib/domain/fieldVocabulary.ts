/**
 * Semantic field-normalization layer (Section 6). Different forms and
 * documents use different wording for the same concept ("Beneficiary Name",
 * "Payee Name", "Supplier Name"); both form-field detection and
 * document extraction are asked to map onto this shared vocabulary so a
 * value extracted from an invoice lines up with the field it belongs in on
 * the form, without string-matching label text between documents.
 *
 * This list is deliberately not exhaustive — the AI may propose a new
 * snake_case key for a concept not listed here, which is preserved as-is
 * (Section 6 requires understanding fields even where the exact concept
 * wasn't anticipated), but grounding the common ones improves consistency.
 */
export const CANONICAL_FIELD_KEYS = [
  "beneficiary_name",
  "beneficiary_address",
  "beneficiary_account_number",
  "beneficiary_bank_name",
  "beneficiary_bank_address",
  "beneficiary_bank_swift",
  "intermediary_bank_swift",
  "intermediary_bank_name",
  "remitter_name",
  "remitter_address",
  "remitter_account_number",
  "applicant_name",
  "invoice_number",
  "invoice_date",
  "invoice_amount",
  "currency",
  "payment_amount",
  "payment_purpose",
  "payment_reference",
  "value_date",
  "amount_in_words",
  "supplier_name",
  "supplier_address",
  "supplier_country",
  "purchase_order_number",
  "shipment_reference",
  "bill_of_lading_number",
  "lc_number",
  "customs_declaration_number",
  "importer_code",
  "contact_person",
  "contact_phone",
  "contact_email",
  "company_pan_vat",
  "bank_charges_option",
  "signature",
  "date",
] as const;

export type CanonicalFieldKey = (typeof CANONICAL_FIELD_KEYS)[number];

export function normalizeFieldKey(key: string): string {
  return key
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}
