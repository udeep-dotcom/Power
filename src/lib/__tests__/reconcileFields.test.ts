import { describe, it, expect, vi } from "vitest";
import { reconcileFieldValues } from "@/lib/pdf/reconcileFields";
import type { AIProvider } from "@/lib/ai/provider";

const FORM_FIELDS = [
  { fieldKey: "creditor_name", label: "Creditor Name:", dataType: "TEXT" },
  { fieldKey: "debtor_name", label: "Debtor Name:", dataType: "TEXT" },
  { fieldKey: "amount_in_figure", label: "Amount in Figure:", dataType: "CURRENCY" },
];

const CANDIDATES = [
  { fieldKey: "insurer_name", value: "Siddhartha Premier Insurance Ltd." },
  { fieldKey: "insured_name", value: "Panchakanya Plast Pvt. Ltd." },
  { fieldKey: "total_amount_payable", value: "2,471.95" },
  { fieldKey: "sum_insured", value: "855,965.72" },
];

function providerReturning(assignments: unknown[]): AIProvider {
  return {
    name: "test",
    model: "test-model",
    complete: vi.fn().mockResolvedValue({
      data: { assignments },
      promptTokens: 10,
      completionTokens: 5,
      provider: "test",
      model: "test-model",
    }),
    completeVision: vi.fn(),
  } as unknown as AIProvider;
}

describe("reconcileFieldValues", () => {
  it("keeps assignments that reference supplied keys on both sides", async () => {
    const ai = providerReturning([
      { formFieldKey: "creditor_name", sourceFieldKey: "insurer_name", confidence: 0.9, reason: "premium paid to insurer" },
      { formFieldKey: "debtor_name", sourceFieldKey: "insured_name", confidence: 0.9, reason: "insured pays" },
    ]);

    const result = await reconcileFieldValues(FORM_FIELDS, CANDIDATES, ai);

    expect(result.assignments).toHaveLength(2);
    expect(result.rejected).toHaveLength(0);
    expect(result.assignments[0]).toMatchObject({
      formFieldKey: "creditor_name",
      sourceFieldKey: "insurer_name",
    });
  });

  it("rejects an assignment whose source key was never supplied", async () => {
    // The model inventing a source key means the value is not traceable to
    // any real document text, so it must not reach the form.
    const ai = providerReturning([
      { formFieldKey: "creditor_name", sourceFieldKey: "hallucinated_key", confidence: 0.99, reason: "made up" },
    ]);

    const result = await reconcileFieldValues(FORM_FIELDS, CANDIDATES, ai);

    expect(result.assignments).toHaveLength(0);
    expect(result.rejected).toHaveLength(1);
    expect(result.rejected[0].sourceFieldKey).toBe("hallucinated_key");
  });

  it("rejects an assignment targeting a form field that does not exist", async () => {
    const ai = providerReturning([
      { formFieldKey: "not_on_this_form", sourceFieldKey: "insurer_name", confidence: 0.9, reason: "wrong target" },
    ]);

    const result = await reconcileFieldValues(FORM_FIELDS, CANDIDATES, ai);

    expect(result.assignments).toHaveLength(0);
    expect(result.rejected).toHaveLength(1);
  });

  it("keeps only the first assignment when a field is claimed twice", async () => {
    const ai = providerReturning([
      { formFieldKey: "amount_in_figure", sourceFieldKey: "total_amount_payable", confidence: 0.9, reason: "payable total" },
      { formFieldKey: "amount_in_figure", sourceFieldKey: "sum_insured", confidence: 0.8, reason: "duplicate claim" },
    ]);

    const result = await reconcileFieldValues(FORM_FIELDS, CANDIDATES, ai);

    expect(result.assignments).toHaveLength(1);
    expect(result.assignments[0].sourceFieldKey).toBe("total_amount_payable");
  });

  it("reports token usage so the call can be costed", async () => {
    const ai = providerReturning([]);
    const result = await reconcileFieldValues(FORM_FIELDS, CANDIDATES, ai);
    expect(result.usage).toMatchObject({ promptTokens: 10, completionTokens: 5, provider: "test" });
  });

  it("passes the form labels and candidate values to the model", async () => {
    const ai = providerReturning([]);
    await reconcileFieldValues(FORM_FIELDS, CANDIDATES, ai);

    const request = (ai.complete as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(request.prompt).toContain("Creditor Name:");
    expect(request.prompt).toContain("Siddhartha Premier Insurance Ltd.");
    // The role mapping and the amount warning are what make the join correct.
    expect(request.system).toContain("CREDITOR");
    expect(request.system).toContain("SUM INSURED");
  });
});
