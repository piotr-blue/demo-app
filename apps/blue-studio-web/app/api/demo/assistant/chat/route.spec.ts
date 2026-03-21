import { describe, expect, it, vi } from "vitest";

const { generateMock } = vi.hoisted(() => ({
  generateMock: vi.fn(async () => ({ text: "OpenAI scoped response", inputTokens: 10 })),
}));

vi.mock("@/lib/openai/client", () => ({
  OPENAI_TEXT_MODEL: "gpt-5.4",
  generateTextWithResponsesApi: generateMock,
}));

import { POST } from "@/app/api/demo/assistant/chat/route";

const baseBody = {
  scope: {
    id: "scope_1",
    type: "workspace" as const,
    name: "Alice Shop",
    templateKey: "shop",
    anchors: ["#orders"],
    threadSummaries: [],
    documentSummaries: [],
    workspaceSummaries: [],
    rootDocuments: [],
  },
  messages: [{ role: "user" as const, text: "Please keep monitoring this every day." }],
};

describe("POST /api/demo/assistant/chat", () => {
  it("returns 400 on invalid payload", async () => {
    const response = await POST(
      new Request("http://localhost/api/demo/assistant/chat", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({}),
      })
    );
    expect(response.status).toBe(400);
  });

  it("returns fallback response when OpenAI key missing", async () => {
    const response = await POST(
      new Request("http://localhost/api/demo/assistant/chat", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          ...baseBody,
          credentials: { openAiApiKey: "" },
        }),
      })
    );

    expect(response.status).toBe(200);
    const payload = (await response.json()) as { ok: boolean; message: string };
    expect(payload.ok).toBe(true);
    expect(payload.message).toContain("create a thread");
  });

  it("uses OpenAI response when key is provided", async () => {
    generateMock.mockClear();
    const response = await POST(
      new Request("http://localhost/api/demo/assistant/chat", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          ...baseBody,
          credentials: { openAiApiKey: "sk-test" },
        }),
      })
    );
    expect(response.status).toBe(200);
    const payload = (await response.json()) as { ok: boolean; message: string };
    expect(payload.ok).toBe(true);
    expect(payload.message).toBe("OpenAI scoped response");
    expect(generateMock).toHaveBeenCalledTimes(1);
  });
});
