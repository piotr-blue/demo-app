import { describe, expect, it, vi } from "vitest";

const { countMock, generateMock } = vi.hoisted(() => ({
  countMock: vi.fn(async () => 200),
  generateMock: vi.fn(async () => ({
    text: "STATE: questions\nQUESTION: Who can approve?",
    inputTokens: 200,
  })),
}));

vi.mock("@/lib/prompts/load-prompts", () => ({
  getBlueprintArchitectPrompt: vi.fn(async () => "system prompt"),
}));

vi.mock("@/lib/openai/client", () => ({
  OPENAI_TEXT_MODEL: "gpt-5.4",
  countInputTokens: countMock,
  generateTextWithResponsesApi: generateMock,
}));

vi.mock("@/lib/openai/token-meter", () => ({
  assertWithinTokenBudget: vi.fn(),
}));

import { POST } from "@/app/api/chat/route";

describe("POST /api/chat", () => {
  it("returns stream response with parse error details on invalid payload", async () => {
    const response = await POST(
      new Request("http://localhost/api/chat", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({}),
      })
    );

    expect(response.status).toBe(200);
    const body = await response.text();
    expect(body).toContain("blueprint");
  });

  it("returns question stream for valid payload", async () => {
    countMock.mockClear();
    generateMock.mockClear();
    const response = await POST(
      new Request("http://localhost/api/chat", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          messages: [
            {
              id: "u1",
              role: "user",
              parts: [{ type: "text", text: "Create approval flow" }],
            },
          ],
          credentials: {
            openAiApiKey: "sk-test",
            myOsApiKey: "myos-test",
            myOsAccountId: "acc-1",
            myOsBaseUrl: "https://api.dev.myos.blue/",
          },
          attachments: [],
          qaPairs: [],
          currentBlueprint: null,
        }),
      })
    );

    expect(response.status).toBe(200);
    const body = await response.text();
    expect(body).toContain("Who can approve?");
    expect(countMock).toHaveBeenCalledWith(
      expect.objectContaining({ model: "gpt-5.4" })
    );
    expect(generateMock).toHaveBeenCalledWith(
      expect.objectContaining({ model: "gpt-5.4" })
    );
  });
});
