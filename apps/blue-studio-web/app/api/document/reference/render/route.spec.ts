import { beforeEach, describe, expect, it, vi } from "vitest";

const { countMock, generateMock } = vi.hoisted(() => ({
  countMock: vi.fn(async () => 24),
  generateMock: vi.fn(),
}));

vi.mock("@/lib/prompts/load-prompts", () => ({
  getDocumentReferenceRendererPrompt: vi.fn(async () => "reference prompt"),
}));

vi.mock("@/lib/openai/client", () => ({
  OPENAI_TEXT_MODEL: "gpt-5.4",
  countInputTokens: countMock,
  generateTextWithResponsesApi: generateMock,
}));

vi.mock("@/lib/openai/token-meter", () => ({
  assertWithinTokenBudget: vi.fn(),
}));

import { POST } from "@/app/api/document/reference/render/route";

describe("POST /api/document/reference/render", () => {
  beforeEach(() => {
    countMock.mockClear();
    generateMock.mockReset();
    generateMock.mockResolvedValue({
      text: "name: Counter\noperations:\n  - increment",
      inputTokens: 24,
    });
  });

  it("renders canonical text attachment for blueprint source", async () => {
    const response = await POST(
      new Request("http://localhost/api/document/reference/render", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          credentials: {
            openAiApiKey: "sk-test",
            myOsApiKey: "myos-test",
            myOsAccountId: "acc-1",
            myOsBaseUrl: "https://api.dev.myos.blue/",
          },
          sourceType: "blueprint",
          content: "STATE: ready\nTYPE: Document",
          threadTitle: "Counter Thread",
          sessionId: "session-from-thread-1",
        }),
      })
    );

    expect(response.status).toBe(200);
    const payload = (await response.json()) as {
      ok: boolean;
      fileName: string;
      text: string;
      contextLabel: string;
    };
    expect(payload.ok).toBe(true);
    expect(payload.fileName).toBe("counter-thread.myos.txt");
    expect(payload.contextLabel).toBe("App document reference");
    expect(payload.text).toContain("sessionId: session-from-thread-1");
    expect(payload.text).toContain("operations");
    expect(countMock).toHaveBeenCalledWith(
      expect.objectContaining({ model: "gpt-5.4" })
    );
  });

  it("returns validation errors for invalid input", async () => {
    const response = await POST(
      new Request("http://localhost/api/document/reference/render", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          credentials: {},
          sourceType: "blueprint",
          content: "",
        }),
      })
    );
    expect(response.status).toBe(400);
    const payload = (await response.json()) as { ok: boolean };
    expect(payload.ok).toBe(false);
  });
});
