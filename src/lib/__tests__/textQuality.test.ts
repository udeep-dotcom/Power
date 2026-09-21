import { describe, it, expect } from "vitest";
import {
  assessTextQuality,
  isLikelyGarbledText,
  MIN_TOKENS_TO_JUDGE,
} from "@/lib/pdf/textQuality";

/**
 * Verbatim excerpts from a real OCR'd scan of an HBL NCHL-IPS fund transfer
 * form and a Bill of Lading. These are the inputs that previously sailed past
 * the has-a-text-layer check and produced a form filled from misread labels.
 */
const GARBLED_FORM = `
HBL &ffiffivsn#e*r*rJ*
NCHL-IPS Fund Transfer Form
-TT]
Branch l)ate [It [I-T
Amount (in Figure):
Cunenc!,: NPR/...........'.......
(CUST) tr Remittarce (REMI) tr Fee (FEEO) E lNurance (INSU)
Transactior Rcference <E d lo End Id> Owoice/Bill
_TI -T_T -rr
Creditor Name: f t=ff] frt T
Benefi ciary's Account Number
Recei!ed DalE:
Signatueverifiedby:- StaffID:
`;

const GARBLED_BILL_OF_LADING = `
Bill of lndjng for combilled traltspofi
VOLVO CONSTRUCT]ON EQUIPNIENT Cargo Container Line Ltd
33 ]OO KOON CIRCLE , SINGAPORE 62911
COUNTRYAND PO NT OF OR G]N
TO THE ORDER OF HII'4ALAYAN BANK LTD
ANNEXE BU]LDING LEVEL 2N1
SINGAPORE 53 3q] 2
EXPLORE EARTH 6 SPARE PARTS FoR HEAVY EQUIPIT4ENT
`;

/** The same kind of form, as a clean digital PDF would extract it. */
const CLEAN_FORM = `
NCHL-IPS Fund Transfer Form
Branch Date D D M M Y Y Y Y
Section 1: Fund Transfer Detail
Amount (in Figure):
Currency: NPR
Amount in Words:-
Customer Transfer (CUST) Remittance (REMI) Fee (FEEO) Insurance (INSU)
Transaction Reference <End to End Id> Invoice/Bill No.
Section 3: Beneficiary Information (Beneficiary Details)
Creditor Name: (Use CAPITAL Letters)
Beneficiary's Bank Name: Branch:
Beneficiary's Account Number
Sender's Account No
Contact Details Address:
Tel Mobile E-mail
Applicant's Signature (s) / Official Stamp
Received Date: Signature verified by:- Staff ID:
The Bank will levy fees and charges as per the standard tariff published.
`;

describe("assessTextQuality", () => {
  it("scores a clean digital form as unmalformed", () => {
    const report = assessTextQuality(CLEAN_FORM);
    expect(report.malformedRatio).toBeLessThan(0.04);
  });

  it("scores an OCR'd scan of a bank form as malformed", () => {
    const report = assessTextQuality(GARBLED_FORM);
    expect(report.malformedRatio).toBeGreaterThan(0.04);
  });

  it("scores an OCR'd scan of a Bill of Lading as malformed", () => {
    const report = assessTextQuality(GARBLED_BILL_OF_LADING);
    expect(report.malformedRatio).toBeGreaterThan(0.04);
  });

  it("reports offending tokens so the user can see why a file was rejected", () => {
    const report = assessTextQuality(GARBLED_BILL_OF_LADING);
    expect(report.examples.length).toBeGreaterThan(0);
    expect(report.examples.some((t) => t.includes("]"))).toBe(true);
  });

  it("does not flag legitimate vowel-less business abbreviations", () => {
    const report = assessTextQuality(
      "NPR HBL LTD PAN VAT No TEL CCL Ltd USD GBP SWIFT BIC IFSC",
    );
    expect(report.malformedRatio).toBe(0);
  });

  it("does not flag ordinary form punctuation", () => {
    const report = assessTextQuality(
      "Invoice/Bill N/A and/or 12/05/2026 <End to End Id> US$100 5% interest Fee/Charge",
    );
    expect(report.malformedRatio).toBe(0);
  });

  it("ignores tokens with no letters at all", () => {
    const report = assessTextQuality("1234 56.78 --- ___ ||| 2026");
    expect(report.wordTokenCount).toBe(0);
    expect(report.malformedRatio).toBe(0);
  });
});

describe("isLikelyGarbledText", () => {
  it("rejects an OCR'd scan", () => {
    expect(isLikelyGarbledText(assessTextQuality(GARBLED_FORM))).toBe(true);
    expect(isLikelyGarbledText(assessTextQuality(GARBLED_BILL_OF_LADING))).toBe(true);
  });

  it("accepts a clean digital form", () => {
    expect(isLikelyGarbledText(assessTextQuality(CLEAN_FORM))).toBe(false);
  });

  it("accepts a short sample rather than judging on too little evidence", () => {
    // Garbled, but far too few tokens to draw a conclusion from.
    const report = assessTextQuality("Cunenc!,: -TT] [It");
    expect(report.wordTokenCount).toBeLessThan(MIN_TOKENS_TO_JUDGE);
    expect(isLikelyGarbledText(report)).toBe(false);
  });
});
