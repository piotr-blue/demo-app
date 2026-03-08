import { describe, expect, it } from "vitest";
import { buildDocumentQaInput } from "@/lib/document/qa/build-input";

describe("buildDocumentQaInput", () => {
  it("uses neutral viewer fallback when viewer is missing", () => {
    const input = buildDocumentQaInput({
      blueprint: "STATE: ready\nTYPE: Document",
      viewer: null,
      question: "What can this document do?",
      state: null,
      allowedOperations: [],
    });

    expect(input).toContain("VIEWER:\nneutral");
    expect(input).toContain("STATE is null because the document has not been bootstrapped yet");
  });

  it("uses explicit viewer when provided", () => {
    const input = buildDocumentQaInput({
      blueprint: "STATE: ready\nTYPE: Document",
      viewer: "ownerChannel",
      question: "What can this document do?",
      state: { counter: 1 },
      allowedOperations: ["increment"],
    });

    expect(input).toContain("VIEWER:\nownerChannel");
    expect(input).toContain("allowedOperations: increment");
  });
});
