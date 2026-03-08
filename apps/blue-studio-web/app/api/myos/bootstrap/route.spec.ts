import { beforeEach, describe, expect, it, vi } from "vitest";

const bootstrapMock = vi.fn(async (..._args: unknown[]) => ({ sessionId: "session_123" }));
const retrieveMock = vi.fn(async () => ({
  type: "Document",
}));
const listMock = vi.fn(async () => ({ items: [] }));

vi.mock("@blue-labs/myos-js", () => ({
  MyOsClient: class MockMyOsClient {
    documents = {
      bootstrap: bootstrapMock,
      retrieve: retrieveMock,
      list: listMock,
    };
  },
}));

import { POST } from "@/app/api/myos/bootstrap/route";

describe("POST /api/myos/bootstrap", () => {
  beforeEach(() => {
    bootstrapMock.mockClear();
    retrieveMock.mockClear();
    listMock.mockClear();
  });

  it("returns 400 for invalid payload", async () => {
    const response = await POST(
      new Request("http://localhost/api/myos/bootstrap", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({}),
      })
    );
    expect(response.status).toBe(400);
  });

  it("returns sessionId for valid payload", async () => {
    const response = await POST(
      new Request("http://localhost/api/myos/bootstrap", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          credentials: {
            openAiApiKey: "sk-test",
            myOsApiKey: "myos-test",
            myOsAccountId: "acc-1",
            myOsBaseUrl: "https://api.dev.myos.blue/",
          },
          documentJson: { name: "Counter" },
          bindings: [
            {
              channelName: "ownerChannel",
              mode: "accountId",
              value: "acc-1",
            },
          ],
        }),
      })
    );

    expect(response.status).toBe(200);
    const payload = (await response.json()) as { ok: boolean; sessionId: string };
    expect(payload.ok).toBe(true);
    expect(payload.sessionId).toBe("session_123");
  });

  it("rewrites Core/Channel types before bootstrap (temporary dirty fix)", async () => {
    const response = await POST(
      new Request("http://localhost/api/myos/bootstrap", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          credentials: {
            openAiApiKey: "sk-test",
            myOsApiKey: "myos-test",
            myOsAccountId: "acc-1",
            myOsBaseUrl: "https://api.dev.myos.blue/",
          },
          documentJson: {
            name: "Counter",
            contracts: {
              ownerChannel: {
                type: "Core/Channel",
              },
              nested: [
                {
                  type: "Core/Channel",
                },
                "Core/Channel",
              ],
            },
          },
          bindings: [
            {
              channelName: "ownerChannel",
              mode: "accountId",
              value: "acc-1",
            },
          ],
        }),
      })
    );

    expect(response.status).toBe(200);
    const [bootstrappedDocument] = bootstrapMock.mock.calls[0] ?? [];
    expect(bootstrappedDocument).toEqual({
      name: "Counter",
      contracts: {
        ownerChannel: {
          type: "MyOS/MyOS Timeline Channel",
        },
        nested: [
          {
            type: "MyOS/MyOS Timeline Channel",
          },
          "MyOS/MyOS Timeline Channel",
        ],
      },
    });
  });
});
