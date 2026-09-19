import { describe, it, expect } from "vitest";
import { buildStorageKey } from "@/lib/storage";

describe("buildStorageKey", () => {
  it("uses the file extension for normal filenames", () => {
    const key = buildStorageKey("blank-forms", "invoice.pdf");
    expect(key).toMatch(/^blank-forms\/[\w-]+\.pdf$/);
  });

  it("falls back to bin when there is no extension", () => {
    const key = buildStorageKey("blank-forms", "noextension");
    expect(key).toMatch(/^blank-forms\/[\w-]+\.bin$/);
  });

  it("strips non-alphanumeric characters from the extension (Content-Disposition header injection defense)", () => {
    const key = buildStorageKey("blank-forms", 'a."; foo=bar');
    // Everything after the malicious "." must be reduced to safe alnum chars only.
    expect(key).toMatch(/^blank-forms\/[\w-]+\.foobar$/);
    expect(key).not.toContain('"');
    expect(key).not.toContain(";");
    expect(key).not.toContain("=");
  });

  it("falls back to bin when the extension is entirely non-alphanumeric", () => {
    const key = buildStorageKey("blank-forms", 'a."";');
    expect(key).toMatch(/^blank-forms\/[\w-]+\.bin$/);
  });

  it("truncates unreasonably long extensions", () => {
    const key = buildStorageKey("blank-forms", `a.${"x".repeat(200)}`);
    const ext = key.split(".").pop();
    expect(ext?.length).toBeLessThanOrEqual(10);
  });
});
