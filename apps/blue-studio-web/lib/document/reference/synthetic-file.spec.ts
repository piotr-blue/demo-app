import { describe, expect, it } from "vitest";
import { createSyntheticReferenceFile } from "@/lib/document/reference/synthetic-file";

describe("createSyntheticReferenceFile", () => {
  it("creates a plain text synthetic File with expected name", () => {
    const file = createSyntheticReferenceFile({
      fileName: "counter-reference.myos.txt",
      text: "name: Counter",
    });

    expect(file.name).toBe("counter-reference.myos.txt");
    expect(file.type).toBe("text/plain");
  });

  it("falls back to default file name when empty", () => {
    const file = createSyntheticReferenceFile({
      fileName: "   ",
      text: "name: Counter",
    });
    expect(file.name).toBe("document-reference.myos.txt");
  });
});
