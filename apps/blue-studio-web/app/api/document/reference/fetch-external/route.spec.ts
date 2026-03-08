import { describe, expect, it, vi } from "vitest";

const retrieveMock = vi.fn();

vi.mock("@blue-labs/myos-js", () => ({
  MyOsClient: class MockMyOsClient {
    documents = {
      retrieve: (...args: unknown[]) => retrieveMock(...args),
    };
  },
}));

import { POST } from "@/app/api/document/reference/fetch-external/route";

describe("POST /api/document/reference/fetch-external", () => {
  it("prefers schema/yaml source when available", async () => {
    retrieveMock.mockResolvedValueOnce({
      documentId: "doc-1",
      schema: { fields: [{ name: "counter", type: "Integer" }] },
    });

    const response = await POST(
      new Request("http://localhost/api/document/reference/fetch-external", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          credentials: {
            openAiApiKey: "sk-test",
            myOsApiKey: "myos-test",
            myOsAccountId: "acc-1",
            myOsBaseUrl: "https://api.dev.myos.blue/",
          },
          sessionId: "session_1",
        }),
      })
    );

    expect(response.status).toBe(200);
    const payload = (await response.json()) as {
      ok: boolean;
      sourceType: string;
      contextLabel: string;
    };
    expect(payload.ok).toBe(true);
    expect(payload.sourceType).toBe("yaml");
    expect(payload.contextLabel).toBe("External MyOS session");
  });

  it("falls back to live-json mode when schema is unavailable", async () => {
    retrieveMock.mockResolvedValueOnce({
      documentId: "doc-1",
      document: { counter: 5 },
    });

    const response = await POST(
      new Request("http://localhost/api/document/reference/fetch-external", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          credentials: {
            openAiApiKey: "sk-test",
            myOsApiKey: "myos-test",
            myOsAccountId: "acc-1",
            myOsBaseUrl: "https://api.dev.myos.blue/",
          },
          sessionId: "session_1",
        }),
      })
    );

    expect(response.status).toBe(200);
    const payload = (await response.json()) as {
      ok: boolean;
      sourceType: string;
      contextLabel: string;
    };
    expect(payload.ok).toBe(true);
    expect(payload.sourceType).toBe("live-json-fallback");
    expect(payload.contextLabel).toBe("External MyOS session (best-effort)");
  });

  it("returns 400 for invalid payload", async () => {
    const response = await POST(
      new Request("http://localhost/api/document/reference/fetch-external", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          credentials: {},
        }),
      })
    );
    expect(response.status).toBe(400);
    const payload = (await response.json()) as { ok: boolean };
    expect(payload.ok).toBe(false);
  });
});
