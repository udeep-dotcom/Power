import Decimal from "decimal.js";

const ONES = [
  "",
  "One",
  "Two",
  "Three",
  "Four",
  "Five",
  "Six",
  "Seven",
  "Eight",
  "Nine",
  "Ten",
  "Eleven",
  "Twelve",
  "Thirteen",
  "Fourteen",
  "Fifteen",
  "Sixteen",
  "Seventeen",
  "Eighteen",
  "Nineteen",
];

const TENS = [
  "",
  "",
  "Twenty",
  "Thirty",
  "Forty",
  "Fifty",
  "Sixty",
  "Seventy",
  "Eighty",
  "Ninety",
];

const SCALES = ["", "Thousand", "Million", "Billion", "Trillion"];

function threeDigitsToWords(n: number): string {
  const parts: string[] = [];
  const hundreds = Math.floor(n / 100);
  const remainder = n % 100;
  if (hundreds > 0) parts.push(`${ONES[hundreds]} Hundred`);
  if (remainder > 0) {
    if (remainder < 20) {
      parts.push(ONES[remainder]);
    } else {
      const tens = Math.floor(remainder / 10);
      const ones = remainder % 10;
      parts.push(ones > 0 ? `${TENS[tens]}-${ONES[ones]}` : TENS[tens]);
    }
  }
  return parts.join(" ");
}

/** Converts a non-negative integer to English words. Deterministic; never delegated to an LLM (Section 42). */
export function integerToWords(value: number | string): string {
  const n = new Decimal(value);
  if (n.isNegative()) throw new Error("integerToWords does not support negative numbers");
  if (n.isZero()) return "Zero";
  if (!n.isInteger()) throw new Error("integerToWords requires an integer");
  if (n.greaterThan("999999999999999")) throw new Error("Number too large to convert to words");

  let remaining = n;
  const groups: number[] = [];
  const thousand = new Decimal(1000);
  while (remaining.greaterThan(0)) {
    groups.push(remaining.mod(thousand).toNumber());
    remaining = remaining.dividedToIntegerBy(thousand);
  }

  const words: string[] = [];
  for (let i = groups.length - 1; i >= 0; i--) {
    if (groups[i] === 0) continue;
    const groupWords = threeDigitsToWords(groups[i]);
    words.push(SCALES[i] ? `${groupWords} ${SCALES[i]}` : groupWords);
  }
  return words.join(" ");
}

/**
 * Converts a currency amount to words for bank-form "amount in words" fields,
 * e.g. amountToWords("1234.56", "USD") ->
 * "US Dollars One Thousand Two Hundred Thirty-Four and 56/100 Only"
 */
export function amountToWords(amount: number | string, currencyLabel: string): string {
  const decimal = new Decimal(amount);
  if (decimal.isNegative()) throw new Error("amountToWords does not support negative amounts");

  const wholePart = decimal.truncated();
  const cents = decimal.minus(wholePart).times(100).toDecimalPlaces(0).abs();

  const wholeWords = integerToWords(wholePart.toString());
  const centsStr = cents.toNumber().toString().padStart(2, "0");

  return `${currencyLabel} ${wholeWords} and ${centsStr}/100 Only`;
}
