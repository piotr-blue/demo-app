import { beforeEach, describe, expect, it, vi } from "vitest";

const generateMock = vi.fn();

vi.mock("@/lib/prompts/load-prompts", () => ({
  getDocumentStatusTemplatesPrompt: vi.fn(async () => "status prompt"),
}));

vi.mock("@/lib/openai/client", () => ({
  countInputTokens: vi.fn(async () => 42),
  generateTextWithResponsesApi: (...args: unknown[]) => generateMock(...args),
}));

vi.mock("@/lib/openai/token-meter", () => ({
  assertWithinTokenBudget: vi.fn(),
}));

import { POST } from "@/app/api/document/status-templates/route";

describe("POST /api/document/status-templates", () => {
  beforeEach(() => {
    generateMock.mockReset();
  });

  it("returns parsed template bundle for valid request", async () => {
    generateMock.mockResolvedValue({
      text: JSON.stringify({
        viewer: "ownerChannel",
        templates: [
          { when: "doc('/status') === 'draft'", title: "Draft", body: "Draft body" },
          { when: "true", title: "Ready", body: "Ready body" },
        ],
      }),
      inputTokens: 42,
    });

    const response = await POST(
      new Request("http://localhost/api/document/status-templates", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          credentials: {
            openAiApiKey: "sk-test",
            myOsApiKey: "myos-test",
            myOsAccountId: "acc-1",
            myOsBaseUrl: "https://api.dev.myos.blue/",
          },
          blueprint: "STATE: ready\nTYPE: Document\nBLUEPRINT: Counter",
          viewer: "ownerChannel",
        }),
      })
    );

    expect(response.status).toBe(200);
    const payload = (await response.json()) as {
      ok: boolean;
      bundle: { viewer: string; templates: Array<{ when: string }> };
    };
    expect(payload.ok).toBe(true);
    expect(payload.bundle.viewer).toBe("ownerChannel");
    expect(payload.bundle.templates.at(-1)?.when).toBe("true");
  });

  it("returns ok false for malformed model JSON", async () => {
    generateMock.mockResolvedValue({
      text: "{ invalid json",
      inputTokens: 42,
    });

    const response = await POST(
      new Request("http://localhost/api/document/status-templates", {
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
        }),
      })
    );

    expect(response.status).toBe(400);
    const payload = (await response.json()) as { ok: boolean };
    expect(payload.ok).toBe(false);
  });

  it("redacts secret-like values from errors", async () => {
    generateMock.mockRejectedValue(new Error("upstream key sk-secret-value leaked"));

    const response = await POST(
      new Request("http://localhost/api/document/status-templates", {
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
        }),
      })
    );
    const payload = (await response.json()) as { ok: boolean; error: string };
    expect(payload.ok).toBe(false);
    expect(payload.error).toContain("[REDACTED]");
    expect(payload.error).not.toContain("sk-secret-value");
  });
});

