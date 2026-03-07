import { describe, expect, it } from "vitest";
import { extractDslCodeBlock } from "@/lib/prompt/dsl-extractor";

describe("extractDslCodeBlock", () => {
  it("extracts ts code block", () => {
    const output = "```ts\nexport function buildDocument() { return null; }\n```";
    expect(extractDslCodeBlock(output)).toContain("buildDocument");
  });

  it("throws if code block missing", () => {
    expect(() => extractDslCodeBlock("no code here")).toThrow(
      "TypeScript code block"
    );
  });
});
