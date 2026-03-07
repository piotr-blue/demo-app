import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/openai/client", () => ({
  countInputTokens: vi.fn(async () => 123),
}));

import { POST } from "@/app/api/token-count/route";

describe("POST /api/token-count", () => {
  it("returns token count for valid payload", async () => {
    const response = await POST(
      new Request("http://localhost/api/token-count", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          apiKey: "sk-test",
          systemPrompt: "system",
          input: "prompt",
        }),
      })
    );

    expect(response.status).toBe(200);
    const payload = (await response.json()) as { inputTokens: number };
    expect(payload.inputTokens).toBe(123);
  });

  it("returns 400 on invalid payload", async () => {
    const response = await POST(
      new Request("http://localhost/api/token-count", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({}),
      })
    );
    expect(response.status).toBe(400);
  });
});
