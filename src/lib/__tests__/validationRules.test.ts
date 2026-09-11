import { describe, it, expect } from "vitest";
import {
  isValidSwift,
  isValidCurrencyCode,
  normalizeAccountNumber,
  isPlausibleAccountNumber,
  checkAmountAgainstInvoice,
  checkCurrencyConsistency,
  checkBankDetailsChanged,
} from "@/lib/validation/rules";

describe("isValidSwift", () => {
  it("accepts 8-character SWIFT codes", () => {
    expect(isValidSwift("NABINPKA")).toBe(true);
  });

  it("accepts 11-character SWIFT codes with branch", () => {
    expect(isValidSwift("NABINPKAXXX")).toBe(true);
  });

  it("rejects malformed codes", () => {
    expect(isValidSwift("ABC")).toBe(false);
    expect(isValidSwift("1234ABCD")).toBe(false);
  });
});

describe("isValidCurrencyCode", () => {
  it("accepts ISO codes", () => {
    expect(isValidCurrencyCode("USD")).toBe(true);
    expect(isValidCurrencyCode("npr")).toBe(true);
  });

  it("rejects non-ISO codes", () => {
    expect(isValidCurrencyCode("DOLLAR")).toBe(false);
  });
});

describe("account numbers", () => {
  it("preserves leading zeros — never treated as a number", () => {
    expect(normalizeAccountNumber("0001234567")).toBe("0001234567");
  });

  it("strips whitespace", () => {
    expect(normalizeAccountNumber(" 001 234 567 ")).toBe("001234567");
  });

  it("accepts plausible account numbers", () => {
    expect(isPlausibleAccountNumber("0012345678")).toBe(true);
  });

  it("rejects implausible account numbers", () => {
    expect(isPlausibleAccountNumber("ab")).toBe(false);
  });
});

describe("checkAmountAgainstInvoice", () => {
  it("warns when payment exceeds invoice", () => {
    const warning = checkAmountAgainstInvoice("1500", "1000");
    expect(warning?.code).toBe("PAYMENT_EXCEEDS_INVOICE");
  });

  it("does not warn when payment is within invoice amount", () => {
    expect(checkAmountAgainstInvoice("1000", "1000")).toBeNull();
    expect(checkAmountAgainstInvoice("900", "1000")).toBeNull();
  });
});

describe("checkCurrencyConsistency", () => {
  it("flags mixed currencies", () => {
    expect(checkCurrencyConsistency(["USD", "usd", "EUR"])?.code).toBe("CURRENCY_MISMATCH");
  });

  it("passes when all currencies match", () => {
    expect(checkCurrencyConsistency(["USD", "usd", "USD"])).toBeNull();
  });
});

describe("checkBankDetailsChanged", () => {
  it("flags a changed account number", () => {
    expect(checkBankDetailsChanged("0001234", "0009999")?.code).toBe("BANK_DETAILS_CHANGED");
  });

  it("passes when unchanged", () => {
    expect(checkBankDetailsChanged("0001234", "0001234")).toBeNull();
  });

  it("passes when there is no previous value to compare", () => {
    expect(checkBankDetailsChanged(null, "0001234")).toBeNull();
  });
});
