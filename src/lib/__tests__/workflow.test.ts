import { describe, it, expect } from "vitest";
import { canTransition, assertTransition } from "@/lib/workflow";

describe("transaction workflow state machine", () => {
  it("allows the documented happy path", () => {
    const path: Parameters<typeof canTransition>[] = [
      ["NEW", "FILES_UPLOADED"],
      ["FILES_UPLOADED", "FORM_ANALYZED"],
      ["FORM_ANALYZED", "DOCUMENTS_ANALYZED"],
      ["DOCUMENTS_ANALYZED", "MAPPING_COMPLETE"],
      ["MAPPING_COMPLETE", "REVIEW_REQUIRED"],
      ["REVIEW_REQUIRED", "APPROVED_FOR_GENERATION"],
      ["APPROVED_FOR_GENERATION", "GENERATED"],
      ["GENERATED", "ARCHIVED"],
    ];
    for (const [from, to] of path) {
      expect(canTransition(from, to)).toBe(true);
    }
  });

  it("allows looping back to REVIEW_REQUIRED for further corrections", () => {
    expect(canTransition("APPROVED_FOR_GENERATION", "REVIEW_REQUIRED")).toBe(true);
    expect(canTransition("REVIEW_REQUIRED", "REVIEW_REQUIRED")).toBe(true);
  });

  it("rejects skipping states", () => {
    expect(canTransition("NEW", "GENERATED")).toBe(false);
    expect(canTransition("FILES_UPLOADED", "REVIEW_REQUIRED")).toBe(false);
  });

  it("rejects moving backward out of a terminal state", () => {
    expect(canTransition("ARCHIVED", "GENERATED")).toBe(false);
  });

  it("allows recovering from FAILED back into the upload stage only", () => {
    expect(canTransition("FAILED", "FILES_UPLOADED")).toBe(true);
    expect(canTransition("FAILED", "GENERATED")).toBe(false);
  });

  it("assertTransition throws on an invalid move", () => {
    expect(() => assertTransition("NEW", "GENERATED")).toThrow();
  });

  it("assertTransition does not throw on a valid move", () => {
    expect(() => assertTransition("NEW", "FILES_UPLOADED")).not.toThrow();
  });
});
