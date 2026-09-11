import Decimal from "decimal.js";

export type NumberFormatStyle = "1,000.00" | "1000.00" | "1,000" | "CODE 1,000.00";

/**
 * Deterministic amount formatting (Section 41). Never use floating-point
 * arithmetic for money — Decimal.js avoids the classic 0.1 + 0.2 problem.
 */
export function formatAmount(
  amount: number | string,
  style: NumberFormatStyle = "1,000.00",
  currencyCode?: string,
): string {
  const decimal = new Decimal(amount);
  const negative = decimal.isNegative();
  const abs = decimal.abs();

  let result: string;
  switch (style) {
    case "1000.00":
      result = abs.toFixed(2);
      break;
    case "1,000":
      result = groupThousands(abs.toFixed(0));
      break;
    case "1,000.00":
    case "CODE 1,000.00":
    default: {
      const fixed = abs.toFixed(2);
      const [intPart, decPart] = fixed.split(".");
      result = `${groupThousands(intPart)}.${decPart}`;
      break;
    }
  }

  if (style === "CODE 1,000.00" && currencyCode) {
    result = `${currencyCode} ${result}`;
  }

  return negative ? `-${result}` : result;
}

function groupThousands(digits: string): string {
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

/** Compares two amounts safely without floating-point error. */
export function amountsEqual(a: number | string, b: number | string): boolean {
  return new Decimal(a).equals(new Decimal(b));
}

export function amountGreaterThan(a: number | string, b: number | string): boolean {
  return new Decimal(a).greaterThan(new Decimal(b));
}
