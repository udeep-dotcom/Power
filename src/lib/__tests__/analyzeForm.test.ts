import { describe, it, expect, vi } from "vitest";
import { analyzeBlankForm } from "@/lib/pdf/analyzeForm";
import type { PdfPageLayout, PdfTextItem } from "@/lib/pdf/extractText";
import type { AIProvider } from "@/lib/ai/provider";

function item(text: string, x: number, y: number): PdfTextItem {
  return { text, x, y, width: text.length * 5, height: 10 };
}

/**
 * A transfer slip printed twice on one page — a Bank Copy above a Customer
 * Copy — where "Branch:" labels both the debtor's and the creditor's branch.
 * The same label therefore occurs four times.
 */
function twoCopyPage(): PdfPageLayout {
  const items: PdfTextItem[] = [];
  for (const copyTop of [700, 300]) {
    items.push(item("Debtor Name:", 40, copyTop));
    items.push(item("Branch:", 300, copyTop));
    items.push(item("Creditor Name:", 40, copyTop - 100));
    items.push(item("Branch:", 300, copyTop - 100));
  }
  return { page: 1, width: 595, height: 842, items, hasTextLayer: true };
}

function providerDetecting(fields: unknown[]): AIProvider {
  return {
    name: "test",
    model: "test-model",
    complete: vi.fn().mockResolvedValue({
      data: { fields },
      promptTokens: 1,
      completionTokens: 1,
      provider: "test",
      model: "test-model",
    }),
    completeVision: vi.fn(),
  } as unknown as AIProvider;
}

const DEBTOR_BRANCH = {
  fieldKey: "debtor_bank_branch",
  label: "Branch:",
  anchorText: "Branch:",
  page: 1,
  placement: "right",
  dataType: "TEXT",
  required: false,
};
const CREDITOR_BRANCH = { ...DEBTOR_BRANCH, fieldKey: "creditor_bank_branch" };

describe("analyzeBlankForm anchor allocation", () => {
  it("places a field once per printed copy of the form", async () => {
    const ai = providerDetecting([
      { ...DEBTOR_BRANCH, fieldKey: "debtor_name", label: "Debtor Name:", anchorText: "Debtor Name:" },
    ]);

    const result = await analyzeBlankForm([twoCopyPage()], ai);

    // Bank Copy and Customer Copy both get filled from one detected field.
    expect(result.fields).toHaveLength(2);
    expect(new Set(result.fields.map((f) => f.fieldKey))).toEqual(new Set(["debtor_name"]));
    expect(result.fields[0].y).not.toBe(result.fields[1].y);
  });

  it("does not let two fields sharing a label claim the same box", async () => {
    const ai = providerDetecting([DEBTOR_BRANCH, CREDITOR_BRANCH]);

    const result = await analyzeBlankForm([twoCopyPage()], ai);

    const debtor = result.fields.filter((f) => f.fieldKey === "debtor_bank_branch");
    const creditor = result.fields.filter((f) => f.fieldKey === "creditor_bank_branch");

    // Four "Branch:" occurrences, two fields — each takes two, and crucially
    // they are different two. Sharing them would stamp the debtor's branch
    // into the creditor's box.
    expect(debtor).toHaveLength(2);
    expect(creditor).toHaveLength(2);

    const positions = (fs: typeof result.fields) => fs.map((f) => `${f.x}:${f.y}`);
    const shared = positions(debtor).filter((p) => positions(creditor).includes(p));
    expect(shared).toEqual([]);
  });

  it("gives an occurrence to the more specific label", async () => {
    // "Branch" would otherwise also match inside every "Branch:".
    const ai = providerDetecting([
      { ...DEBTOR_BRANCH, fieldKey: "branch", label: "Branch", anchorText: "Branch" },
      CREDITOR_BRANCH,
    ]);

    const result = await analyzeBlankForm([twoCopyPage()], ai);

    const creditor = result.fields.filter((f) => f.fieldKey === "creditor_bank_branch");
    const bare = result.fields.filter((f) => f.fieldKey === "branch");
    const overlap = creditor
      .map((f) => `${f.x}:${f.y}`)
      .filter((p) => bare.map((b) => `${b.x}:${b.y}`).includes(p));

    expect(creditor.length).toBeGreaterThan(0);
    expect(overlap).toEqual([]);
  });

  it("reports a field whose label is not on the page instead of guessing a position", async () => {
    const ai = providerDetecting([
      { ...DEBTOR_BRANCH, fieldKey: "nowhere", label: "Nowhere", anchorText: "Not On This Form" },
    ]);

    const result = await analyzeBlankForm([twoCopyPage()], ai);

    expect(result.fields).toHaveLength(0);
    expect(result.unresolved).toHaveLength(1);
    expect(result.unresolved[0].fieldKey).toBe("nowhere");
  });
});
