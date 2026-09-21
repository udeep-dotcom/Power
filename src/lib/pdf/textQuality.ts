/**
 * Text-layer quality assessment.
 *
 * `hasTextLayer` only proves a PDF contains *some* text. A scanned document
 * that was already OCR'd elsewhere (by a scanner, phone app, or Acrobat)
 * carries a text layer made of the OCR engine's guesses — "Currency:" comes
 * back as "Cunenc!,:", "Branch Date" as "Branch l)ate". pdf.js reports that
 * faithfully, so the existing has-a-text-layer guard passes and the pipeline
 * proceeds to fill a form from nonsense.
 *
 * That silently produces a wrong filled form, which is the one outcome this
 * project refuses to ship. This module scores how word-like the extracted
 * text is so a bad layer can be rejected as loudly as a missing one.
 *
 * Deliberately deterministic — no AI call. Tuned against real OCR'd bank
 * forms and Bills of Lading; see textQuality.test.ts.
 */

/**
 * Characters that essentially never occur inside a word on a business form.
 * Note what's absent: `/` ("Invoice/Bill", "N/A", "12/05/2026") and `<>`
 * ("<End to End Id>") are ordinary form furniture, and flagging them
 * punishes clean documents.
 */
const STRAY_SYMBOL = /[[\]{}|\\~^*#@&_=+]/;
/**
 * Punctuation that never occurs inside a word, unlike . , : ; ' - which do.
 * `%` ("5% interest") and `$` ("US$") are legitimate and excluded.
 */
const STRAY_PUNCTUATION = /[!?]/;
const HAS_LETTER = /[a-z]/i;
const VOWEL = /[aeiouy]/i;
/** A digit wedged between two letters, e.g. OCR reading "EQUIPMENT" as "EQUIPIT4ENT". */
const INTERIOR_DIGIT = /[a-z]\d[a-z]/i;
/** Leading/trailing punctuation is normal and shouldn't count against a token. */
const EDGE_PUNCTUATION = /^[^a-z0-9]+|[^a-z0-9]+$/gi;

export interface TextQualityReport {
  /** Fraction of word-like tokens that look malformed, 0..1. */
  malformedRatio: number;
  /** How many tokens were assessed — a small sample isn't worth judging. */
  wordTokenCount: number;
  /** A few offending tokens, to show the user why their file was rejected. */
  examples: string[];
}

function isMalformed(token: string): boolean {
  if (STRAY_SYMBOL.test(token)) return true;
  if (STRAY_PUNCTUATION.test(token) && HAS_LETTER.test(token)) return true;
  if (INTERIOR_DIGIT.test(token)) return true;

  const core = token.replace(EDGE_PUNCTUATION, "");
  // A longer run of letters with no vowel at all ("ffhrtn") is not a word.
  // Short ones are exempt: business forms are full of legitimate vowel-less
  // abbreviations (NPR, HBL, LTD, PAN, VAT, No), and flagging those would
  // penalise exactly the documents we want to accept.
  if (core.length > 4 && /^[a-z]+$/i.test(core) && !VOWEL.test(core)) return true;

  return false;
}

export function assessTextQuality(text: string): TextQualityReport {
  const tokens = text.split(/\s+/).filter((t) => t.length > 0 && HAS_LETTER.test(t));

  const malformed = tokens.filter(isMalformed);
  return {
    malformedRatio: tokens.length === 0 ? 0 : malformed.length / tokens.length,
    wordTokenCount: tokens.length,
    examples: [...new Set(malformed)].slice(0, 6),
  };
}

/**
 * Below this many word tokens there isn't enough signal to judge, and a
 * sparse-but-valid form shouldn't be rejected on a handful of odd tokens.
 */
export const MIN_TOKENS_TO_JUDGE = 40;

/**
 * Calibrated against real documents: a clean digital form scores 0.00, while
 * OCR'd scans of a bank form and a Bill of Lading score 0.099 and 0.059.
 * 0.04 sits in the gap, biased toward letting a marginal file through — a
 * false rejection blocks real work, and human review catches the rest.
 *
 * This is a heuristic tuned on a small sample, not a guarantee: a
 * high-quality OCR layer can score below the limit and get through. It
 * exists to catch the obvious garbage that would otherwise silently produce
 * a wrong filled form, and should be revisited as real documents accumulate.
 */
export const MALFORMED_RATIO_LIMIT = 0.04;

export function isLikelyGarbledText(report: TextQualityReport): boolean {
  if (report.wordTokenCount < MIN_TOKENS_TO_JUDGE) return false;
  return report.malformedRatio > MALFORMED_RATIO_LIMIT;
}
