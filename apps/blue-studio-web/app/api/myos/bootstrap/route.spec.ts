import { beforeEach, describe, expect, it, vi } from "vitest";

const bootstrapMock = vi.fn(async (...args: unknown[]) => {
  void args;
  return { sessionId: "session_123" };
});
const retrieveMock = vi.fn(
  async (): Promise<Record<string, unknown>> => ({
    type: "Document",
  })
);
const listMock = vi.fn(async () => ({ items: [] }));
const runOperationMock = vi.fn(async () => ({}));

vi.mock("@blue-labs/myos-js", () => ({
  MyOsClient: class MockMyOsClient {
    documents = {
      bootstrap: bootstrapMock,
      retrieve: retrieveMock,
      list: listMock,
      runOperation: runOperationMock,
    };
  },
}));

import { POST } from "@/app/api/myos/bootstrap/route";

describe("POST /api/myos/bootstrap", () => {
  beforeEach(() => {
    bootstrapMock.mockClear();
    retrieveMock.mockClear();
    listMock.mockClear();
    runOperationMock.mockClear();
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
    const documentJson = { name: "Counter", contracts: { ownerChannel: { type: "Core/Channel" } } };
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
          documentJson,
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
    const payload = (await response.json()) as {
      ok: boolean;
      sessionId: string;
      bootstrapSucceeded: boolean;
    };
    expect(payload.ok).toBe(true);
    expect(payload.sessionId).toBe("session_123");
    expect(payload.bootstrapSucceeded).toBe(true);
    expect(bootstrapMock).toHaveBeenCalledWith(
      documentJson,
      {
        ownerChannel: {
          accountId: "acc-1",
          timelineId: undefined,
        },
      }
    );
  });

  it("starts bootstrap session and stores initiatorSessionId as target session", async () => {
    const initiatorSessionId = "11111111-1111-1111-1111-111111111111";
    retrieveMock
      .mockResolvedValueOnce({
        type: "MyOS/Document Session Bootstrap",
        status: "PENDING",
        allowedOperations: ["start"],
        document: {},
      })
      .mockResolvedValueOnce({
        type: "MyOS/Document Session Bootstrap",
        status: "RUNNING",
        document: {
          initiatorSessionId,
        },
      })
      .mockResolvedValueOnce({
        type: "Document",
        documentId: "doc-live-1",
      });

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
    const payload = (await response.json()) as {
      ok: boolean;
      sessionId: string;
      initiatorSessionId: string;
    };
    expect(payload.ok).toBe(true);
    expect(payload.sessionId).toBe(initiatorSessionId);
    expect(payload.initiatorSessionId).toBe(initiatorSessionId);
    expect(runOperationMock).toHaveBeenCalledWith("session_123", "start");
  });

  it("fails when bootstrap transitions into an error state", async () => {
    retrieveMock.mockResolvedValueOnce({
      type: "MyOS/Document Session Bootstrap",
      status: "ERROR",
      document: {},
    });

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

    expect(response.status).toBe(400);
    const payload = (await response.json()) as { ok: boolean; error: string };
    expect(payload.ok).toBe(false);
    expect(payload.error).toContain("Bootstrap failed");
  });
});
