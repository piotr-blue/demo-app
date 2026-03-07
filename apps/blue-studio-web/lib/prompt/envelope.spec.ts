import { describe, expect, it } from "vitest";
import type { UIMessage } from "ai";
import { buildBlueprintEnvelope } from "@/lib/prompt/envelope";

describe("buildBlueprintEnvelope", () => {
  it("builds deterministic envelope with prompt, context, qa and current blueprint", () => {
    const messages: UIMessage[] = [
      {
        id: "1",
        role: "user",
        parts: [{ type: "text", text: "Create a counter document" }],
      },
      {
        id: "2",
        role: "user",
        parts: [{ type: "text", text: "Add reset operation" }],
      },
    ];

    const result = buildBlueprintEnvelope({
      messages,
      attachments: [
        {
          id: "att_1",
          name: "requirements.txt",
          mimeType: "text/plain",
          size: 14,
          contextLabel: "exact text",
          extractedText: "counter starts at 0",
          createdAt: "2025-01-01T00:00:00.000Z",
        },
      ],
      qaPairs: [{ question: "Who can increment?", answer: "ownerChannel only." }],
      currentBlueprint: "STATE: ready\nTYPE: Document",
    });

    expect(result).toContain("PROMPT:");
    expect(result).toContain("Create a counter document");
    expect(result).toContain("=== FILE: requirements.txt (exact text) ===");
    expect(result).toContain("Q1: Who can increment?");
    expect(result).toContain("CURRENT_BLUEPRINT:");
  });
});
