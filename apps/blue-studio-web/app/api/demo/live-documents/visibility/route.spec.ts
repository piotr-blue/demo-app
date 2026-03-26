import { beforeEach, describe, expect, it, vi } from "vitest";
import { POST } from "@/app/api/demo/live-documents/visibility/route";
import { MyOsClient } from "@blue-labs/myos-js";

const retrieveMock = vi.hoisted(() => vi.fn());
const updateMock = vi.hoisted(() => vi.fn());

vi.mock("@blue-labs/myos-js", () => ({
  MyOsClient: vi.fn().mockImplementation(() => ({
    documents: {
      update: updateMock,
      retrieve: retrieveMock,
    },
  })),
}));

describe("POST /api/demo/live-documents/visibility", () => {
  beforeEach(() => {
    retrieveMock.mockReset();
    updateMock.mockReset();
    (MyOsClient as unknown as ReturnType<typeof vi.fn>).mockClear();
  });

  it("returns mapped document on successful visibility update", async () => {
    updateMock.mockResolvedValueOnce({ ok: true });
    retrieveMock.mockResolvedValueOnce({
      sessionId: "session_live_1",
      documentId: "myos_live_1",
      isPublic: true,
      processingStatus: "active",
      document: {
        name: "Morning Brew",
        description: "Shop document",
        kind: "shop",
      },
    });

    const response = await POST(
      new Request("http://localhost/api/demo/live-documents/visibility", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          credentials: {
            openAiApiKey: "sk-test",
            myOsApiKey: "myos-test",
            myOsAccountId: "acc-1",
            myOsBaseUrl: "https://api.dev.myos.blue/",
          },
          sessionId: "session_live_1",
          enabled: true,
        }),
      })
    );

    expect(response.status).toBe(200);
    const payload = (await response.json()) as {
      ok: boolean;
      enabled: boolean;
      mappedDocument: { isPublic: boolean } | null;
    };
    expect(payload.ok).toBe(true);
    expect(payload.enabled).toBe(true);
    expect(payload.mappedDocument?.isPublic).toBe(true);
    expect(updateMock).toHaveBeenCalledWith("session_live_1", {
      isPublic: true,
    });
  });

  it("returns explicit unsupported response when update path is unavailable", async () => {
    updateMock.mockRejectedValueOnce(new Error("not supported in current API"));

    const response = await POST(
      new Request("http://localhost/api/demo/live-documents/visibility", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          credentials: {
            openAiApiKey: "sk-test",
            myOsApiKey: "myos-test",
            myOsAccountId: "acc-1",
            myOsBaseUrl: "https://api.dev.myos.blue/",
          },
          sessionId: "session_live_1",
          enabled: false,
        }),
      })
    );

    expect(response.status).toBe(400);
    const payload = (await response.json()) as {
      ok: boolean;
      unsupported?: boolean;
      error: string;
    };
    expect(payload.ok).toBe(false);
    expect(payload.unsupported).toBe(true);
    expect(payload.error).toContain("not supported");
  });

  it("returns 400 for invalid payload", async () => {
    const response = await POST(
      new Request("http://localhost/api/demo/live-documents/visibility", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({}),
      })
    );
    expect(response.status).toBe(400);
  });

  it("instantiates MyOsClient for each request", async () => {
    const constructorMock = MyOsClient as unknown as ReturnType<typeof vi.fn>;
    constructorMock.mockClear();
    updateMock.mockResolvedValueOnce({ ok: true });
    retrieveMock.mockResolvedValueOnce({
      sessionId: "session_live_2",
      documentId: "myos_live_2",
      isPublic: false,
      processingStatus: "active",
      document: {
        name: "Private doc",
        description: "private",
        kind: "note",
      },
    });

    await POST(
      new Request("http://localhost/api/demo/live-documents/visibility", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          credentials: {
            openAiApiKey: "sk-test",
            myOsApiKey: "myos-test",
            myOsAccountId: "acc-1",
            myOsBaseUrl: "https://api.dev.myos.blue/",
          },
          sessionId: "session_live_2",
          enabled: false,
        }),
      })
    );

    expect(constructorMock).toHaveBeenCalledTimes(1);
  });
});
