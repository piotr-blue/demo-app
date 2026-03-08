import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/prompts/load-prompts", () => ({
  getBlueprintToJsDslPrompt: vi.fn(async () => "system prompt"),
}));

vi.mock("@/lib/openai/client", () => ({
  countInputTokens: vi.fn(async () => 100),
  generateTextWithResponsesApi: vi.fn(async () => ({
    text: "```ts\nexport function buildDocument() { return {}; }\n```",
    inputTokens: 100,
  })),
}));

vi.mock("@/lib/openai/token-meter", () => ({
  assertWithinTokenBudget: vi.fn(),
}));

vi.mock("@/lib/dsl/compile-harness", () => ({
  compileDslModule: vi.fn(async () => ({
    code: "export function buildDocument() { return {}; }",
    document: {},
    documentJson: { name: "Mocked" },
    structure: {
      name: "Mocked",
      description: undefined,
      type: "Document",
      fields: [],
      contracts: [],
      sections: [],
      policies: [],
      unclassifiedContracts: [],
    },
  })),
}));

import { POST } from "@/app/api/dsl/continue/route";

describe("POST /api/dsl/continue", () => {
  it("returns 400 for invalid payload", async () => {
    const response = await POST(
      new Request("http://localhost/api/dsl/continue", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({}),
      })
    );
    expect(response.status).toBe(400);
  });

  it("returns generated DSL payload for valid request", async () => {
    const response = await POST(
      new Request("http://localhost/api/dsl/continue", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          credentials: {
            openAiApiKey: "sk-test",
            myOsApiKey: "myos-test",
            myOsAccountId: "acc-1",
            myOsBaseUrl: "https://api.dev.myos.blue/",
          },
          blueprint: "STATE: ready\nTYPE: Document",
          attachments: [],
        }),
      })
    );

    expect(response.status).toBe(200);
    const payload = (await response.json()) as { ok: boolean; dsl: string };
    expect(payload.ok).toBe(true);
    expect(payload.dsl).toContain("buildDocument");
  });
});
