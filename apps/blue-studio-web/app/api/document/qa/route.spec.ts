import { beforeEach, describe, expect, it, vi } from "vitest";

const generateMock = vi.fn();

vi.mock("@/lib/prompts/load-prompts", () => ({
  getDocumentQaPrompt: vi.fn(async () => "qa prompt"),
}));

vi.mock("@/lib/openai/client", () => ({
  countInputTokens: vi.fn(async () => 33),
  generateTextWithResponsesApi: (...args: unknown[]) => generateMock(...args),
}));

vi.mock("@/lib/openai/token-meter", () => ({
  assertWithinTokenBudget: vi.fn(),
}));

import { POST } from "@/app/api/document/qa/route";

describe("POST /api/document/qa", () => {
  beforeEach(() => {
    generateMock.mockReset();
    generateMock.mockResolvedValue({
      text: "This document can increment and reset the counter.",
      inputTokens: 33,
    });
  });

  it("returns blueprint-only mode when state is null", async () => {
    const response = await POST(
      new Request("http://localhost/api/document/qa", {
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
          viewer: "ownerChannel",
          question: "What can this document do?",
          state: null,
        }),
      })
    );

    expect(response.status).toBe(200);
    const payload = (await response.json()) as { ok: boolean; mode: string; answer: string };
    expect(payload.ok).toBe(true);
    expect(payload.mode).toBe("blueprint-only");
    expect(payload.answer.length).toBeGreaterThan(0);
  });

  it("returns live-state mode when state exists", async () => {
    const response = await POST(
      new Request("http://localhost/api/document/qa", {
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
          viewer: "ownerChannel",
          question: "What can this document do?",
          state: { counter: 2, status: "running" },
          allowedOperations: ["increment", "reset"],
        }),
      })
    );

    expect(response.status).toBe(200);
    const payload = (await response.json()) as { ok: boolean; mode: string };
    expect(payload.ok).toBe(true);
    expect(payload.mode).toBe("live-state");
  });

  it("fails validation for missing blueprint or viewer", async () => {
    const response = await POST(
      new Request("http://localhost/api/document/qa", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          credentials: {
            openAiApiKey: "sk-test",
            myOsApiKey: "myos-test",
            myOsAccountId: "acc-1",
            myOsBaseUrl: "https://api.dev.myos.blue/",
          },
          question: "Hi",
          state: null,
        }),
      })
    );

    expect(response.status).toBe(400);
    const payload = (await response.json()) as { ok: boolean };
    expect(payload.ok).toBe(false);
  });
});

