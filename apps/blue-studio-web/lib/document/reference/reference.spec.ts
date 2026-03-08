import { describe, expect, it } from "vitest";
import {
  buildDocumentReferencePromptInput,
  chooseExternalReferenceSource,
  contextLabelForSourceType,
  inferDocumentReferenceFileName,
} from "@/lib/document/reference/reference";

describe("document reference helpers", () => {
  it("builds render prompt input", () => {
    const input = buildDocumentReferencePromptInput({
      sourceType: "blueprint",
      content: "STATE: ready",
    });
    expect(input).toContain("SOURCE_TYPE:\nblueprint");
    expect(input).toContain("CONTENT:\nSTATE: ready");
  });

  it("infers stable file names and context labels", () => {
    expect(
      inferDocumentReferenceFileName({
        sourceType: "blueprint",
        threadTitle: "Counter Thread",
      })
    ).toBe("counter-thread.myos.txt");
    expect(contextLabelForSourceType("live-json-fallback")).toBe(
      "External MyOS session (best-effort)"
    );
  });

  it("prefers yaml/schema-like external source fields", () => {
    const preferred = chooseExternalReferenceSource({
      sessionId: "session_1",
      schema: { fields: [{ name: "counter" }] },
    });
    expect(preferred.sourceType).toBe("yaml");

    const fallback = chooseExternalReferenceSource({
      sessionId: "session_1",
      document: { counter: 1 },
    });
    expect(fallback.sourceType).toBe("live-json-fallback");
    expect(fallback.content).toContain("counter");
  });
});
