import { describe, it, expect } from "vitest";
import { mapExtractedValuesToFields } from "@/lib/pdf/mapFields";

describe("mapExtractedValuesToFields", () => {
  const formFields = [
    { id: "field-1", fieldKey: "beneficiary_name" },
    { id: "field-2", fieldKey: "invoice_amount" },
    { id: "field-3", fieldKey: "swift_code_never_extracted" },
  ];

  it("picks the highest-confidence candidate for each field", () => {
    const results = mapExtractedValuesToFields(formFields, [
      { extractedValueId: "e1", fieldKey: "beneficiary_name", value: "Acme Corp", confidence: 0.6 },
      { extractedValueId: "e2", fieldKey: "beneficiary_name", value: "Acme Corp", confidence: 0.95 },
    ]);
    const match = results.find((r) => r.formFieldId === "field-1");
    expect(match?.extractedValueId).toBe("e2");
    expect(match?.confidence).toBe(0.95);
  });

  it("never fabricates a value for a field with no candidates", () => {
    const results = mapExtractedValuesToFields(formFields, [
      { extractedValueId: "e1", fieldKey: "beneficiary_name", value: "Acme Corp", confidence: 0.9 },
    ]);
    expect(results.find((r) => r.formFieldId === "field-3")).toBeUndefined();
  });

  it("flags a conflict and caps confidence when candidates disagree", () => {
    const results = mapExtractedValuesToFields(formFields, [
      { extractedValueId: "e1", fieldKey: "invoice_amount", value: "1000.00", confidence: 0.9 },
      { extractedValueId: "e2", fieldKey: "invoice_amount", value: "1200.00", confidence: 0.85 },
    ]);
    const match = results.find((r) => r.formFieldId === "field-2");
    expect(match?.hasConflict).toBe(true);
    expect(match?.confidence).toBeLessThanOrEqual(0.5);
  });

  it("does not flag a conflict when values only differ by formatting", () => {
    const results = mapExtractedValuesToFields(formFields, [
      { extractedValueId: "e1", fieldKey: "beneficiary_name", value: "Acme Corp", confidence: 0.9 },
      { extractedValueId: "e2", fieldKey: "beneficiary_name", value: "acme corp", confidence: 0.8 },
    ]);
    const match = results.find((r) => r.formFieldId === "field-1");
    expect(match?.hasConflict).toBe(false);
  });
});
