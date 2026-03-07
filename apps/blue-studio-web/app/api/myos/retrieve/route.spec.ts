import { describe, expect, it, vi } from "vitest";

const retrieveMock = vi.fn(async () => ({ allowedOperations: ["increment"] }));

vi.mock("@blue-labs/myos-js", () => ({
  MyOsClient: class MockMyOsClient {
    documents = {
      retrieve: retrieveMock,
    };
  },
}));

import { POST } from "@/app/api/myos/retrieve/route";

describe("POST /api/myos/retrieve", () => {
  it("returns 400 for invalid payload", async () => {
    const response = await POST(
      new Request("http://localhost/api/myos/retrieve", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({}),
      })
    );
    expect(response.status).toBe(400);
  });

  it("returns retrieved payload", async () => {
    const response = await POST(
      new Request("http://localhost/api/myos/retrieve", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          credentials: {
            openAiApiKey: "sk-test",
            myOsApiKey: "myos-test",
            myOsAccountId: "acc-1",
            myOsBaseUrl: "https://api.dev.myos.blue/",
          },
          sessionId: "session_123",
        }),
      })
    );

    expect(response.status).toBe(200);
    const payload = (await response.json()) as { ok: boolean; retrieved: unknown };
    expect(payload.ok).toBe(true);
    expect(payload.retrieved).toEqual({ allowedOperations: ["increment"] });
  });
});
