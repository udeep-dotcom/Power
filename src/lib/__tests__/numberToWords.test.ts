import { describe, it, expect } from "vitest";
import { integerToWords, amountToWords } from "@/lib/format/numberToWords";

describe("integerToWords", () => {
  it("handles zero", () => {
    expect(integerToWords(0)).toBe("Zero");
  });

  it("handles small numbers", () => {
    expect(integerToWords(7)).toBe("Seven");
    expect(integerToWords(19)).toBe("Nineteen");
    expect(integerToWords(42)).toBe("Forty-Two");
  });

  it("handles hundreds", () => {
    expect(integerToWords(105)).toBe("One Hundred Five");
    expect(integerToWords(999)).toBe("Nine Hundred Ninety-Nine");
  });

  it("handles thousands and millions", () => {
    expect(integerToWords(1000)).toBe("One Thousand");
    expect(integerToWords(1234)).toBe("One Thousand Two Hundred Thirty-Four");
    expect(integerToWords(1000000)).toBe("One Million");
    expect(integerToWords(2500000)).toBe("Two Million Five Hundred Thousand");
  });

  it("rejects negative numbers", () => {
    expect(() => integerToWords(-5)).toThrow();
  });

  it("rejects non-integers", () => {
    expect(() => integerToWords("5.5")).toThrow();
  });
});

describe("amountToWords", () => {
  it("formats a whole amount", () => {
    expect(amountToWords("1000", "US Dollars")).toBe("US Dollars One Thousand and 00/100 Only");
  });

  it("formats cents correctly", () => {
    expect(amountToWords("1234.56", "US Dollars")).toBe(
      "US Dollars One Thousand Two Hundred Thirty-Four and 56/100 Only",
    );
  });

  it("pads single-digit cents", () => {
    expect(amountToWords("10.05", "USD")).toBe("USD Ten and 05/100 Only");
  });

  it("rejects negative amounts", () => {
    expect(() => amountToWords("-10", "USD")).toThrow();
  });
});
