import { describe, expect, it, vi, beforeEach } from "vitest";

const listMock = vi.hoisted(() => vi.fn());
const createClientMock = vi.hoisted(() =>
  vi.fn(() => ({
    me: {
      documents: {
        list: listMock,
      },
    },
  }))
);

vi.mock("@/lib/myos/live-documents/client", () => ({
  createLiveMyOsClient: createClientMock,
}));

import { POST } from "@/app/api/demo/live-documents/list/route";

describe("POST /api/demo/live-documents/list", () => {
  beforeEach(() => {
    listMock.mockReset();
    createClientMock.mockClear();
  });

  it("returns 400 for invalid payload", async () => {
    const response = await POST(
      new Request("http://localhost/api/demo/live-documents/list", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({}),
      })
    );

    expect(response.status).toBe(400);
  });

  it("returns mapped live documents and filters bootstrap entries", async () => {
    listMock.mockResolvedValueOnce({
      items: [
        {
          sessionId: "bootstrap_1",
          type: "MyOS/Document Session Bootstrap",
        },
        {
          sessionId: "session_live_1",
          documentId: "myos_doc_1",
          name: "Morning Brew",
          description: "Shop workspace",
          isPublic: true,
          processingStatus: "RUNNING",
        },
      ],
      nextPageToken: "next_123",
    });

    const response = await POST(
      new Request("http://localhost/api/demo/live-documents/list", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          credentials: {
            openAiApiKey: "sk-test",
            myOsApiKey: "myos-test",
            myOsAccountId: "acc-1",
            myOsBaseUrl: "https://api.dev.myos.blue/",
          },
          ownerAccountId: "account_piotr_blue",
          ownerName: "piotr-blue",
        }),
      })
    );

    expect(response.status).toBe(200);
    const payload = (await response.json()) as {
      ok: boolean;
      documents: Array<{ id: string; title: string; isPublic: boolean }>;
      nextPageToken: string | null;
    };

    expect(payload.ok).toBe(true);
    expect(payload.documents).toHaveLength(1);
    expect(payload.documents[0]).toMatchObject({
      id: "doc_live_session_live_1",
      title: "Morning Brew",
      isPublic: true,
    });
    expect(payload.nextPageToken).toBe("next_123");
    expect(listMock).toHaveBeenCalledTimes(1);
  });
});
