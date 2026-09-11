import type { Prisma } from "@prisma/client";

/**
 * Deterministic field mapping (Section 11 / 75): match each detected form
 * field to the highest-confidence extracted candidate sharing the same
 * normalized field key. No AI call here — the semantic alignment already
 * happened when both sides were asked to use the shared vocabulary.
 */
export interface MappingCandidate {
  extractedValueId: string;
  fieldKey: string;
  value: string;
  confidence: number;
}

export interface MappedFormValue {
  formFieldId: string;
  extractedValueId: string | null;
  value: string;
  confidence: number;
  hasConflict: boolean;
}

export function mapExtractedValuesToFields(
  formFields: { id: string; fieldKey: string }[],
  candidates: MappingCandidate[],
): MappedFormValue[] {
  const byKey = new Map<string, MappingCandidate[]>();
  for (const c of candidates) {
    const list = byKey.get(c.fieldKey) ?? [];
    list.push(c);
    byKey.set(c.fieldKey, list);
  }

  const results: MappedFormValue[] = [];
  for (const field of formFields) {
    const matches = (byKey.get(field.fieldKey) ?? []).slice().sort((a, b) => b.confidence - a.confidence);
    if (matches.length === 0) continue;

    const best = matches[0];
    const distinctValues = new Set(matches.map((m) => normalizeForComparison(m.value)));
    const hasConflict = distinctValues.size > 1;

    results.push({
      formFieldId: field.id,
      extractedValueId: best.extractedValueId,
      value: best.value,
      confidence: hasConflict ? Math.min(best.confidence, 0.5) : best.confidence,
      hasConflict,
    });
  }
  return results;
}

function normalizeForComparison(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

export function toFormValueCreateInput(
  transactionId: string,
  mapped: MappedFormValue,
): Prisma.FormValueUncheckedCreateInput {
  return {
    transactionId,
    formFieldId: mapped.formFieldId,
    extractedValueId: mapped.extractedValueId,
    value: mapped.value,
    source: "AI",
    confidence: mapped.confidence,
    confirmed: false,
  };
}
