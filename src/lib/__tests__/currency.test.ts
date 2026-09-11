import { describe, it, expect } from "vitest";
import { formatAmount, amountsEqual, amountGreaterThan } from "@/lib/format/currency";

describe("formatAmount", () => {
  it("formats with thousands separators by default", () => {
    expect(formatAmount("1234567.5")).toBe("1,234,567.50");
  });

  it("formats without separators", () => {
    expect(formatAmount("1234567.5", "1000.00")).toBe("1234567.50");
  });

  it("formats as whole numbers", () => {
    expect(formatAmount("1234567.9", "1,000")).toBe("1,234,568");
  });

  it("prefixes currency code when requested", () => {
    expect(formatAmount("1000", "CODE 1,000.00", "USD")).toBe("USD 1,000.00");
  });

  it("preserves negative sign", () => {
    expect(formatAmount("-1000")).toBe("-1,000.00");
  });

  it("never loses precision to floating point", () => {
    // 0.1 + 0.2 === 0.30000000000000004 in plain JS floats.
    expect(formatAmount((0.1 + 0.2).toString(), "1000.00")).not.toBe("0.30000000000000004");
    expect(formatAmount("0.3", "1000.00")).toBe("0.30");
  });
});

describe("amount comparisons", () => {
  it("treats equal decimals as equal despite formatting differences", () => {
    expect(amountsEqual("1000.00", "1000")).toBe(true);
  });

  it("detects greater-than correctly", () => {
    expect(amountGreaterThan("1000.01", "1000")).toBe(true);
    expect(amountGreaterThan("999.99", "1000")).toBe(false);
  });
});
