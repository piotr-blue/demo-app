import { beforeEach, describe, expect, it, vi } from "vitest";
import { POST } from "@/app/api/demo/live-documents/retrieve/route";
import { MyOsClient } from "@blue-labs/myos-js";

const retrieveMock = vi.hoisted(() => vi.fn());
const linksListMock = vi.hoisted(() => vi.fn());

vi.mock("@blue-labs/myos-js", () => ({
  MyOsClient: vi.fn().mockImplementation(() => ({
    documents: {
      retrieve: retrieveMock,
      links: {
        list: linksListMock,
      },
    },
  })),
}));

describe("POST /api/demo/live-documents/retrieve", () => {
  beforeEach(() => {
    retrieveMock.mockReset();
    linksListMock.mockReset();
  });

  it("returns 400 for invalid payload", async () => {
    const response = await POST(
      new Request("http://localhost/api/demo/live-documents/retrieve", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({}),
      })
    );
    expect(response.status).toBe(400);
  });

  it("retrieves and maps live document payload", async () => {
    retrieveMock.mockResolvedValueOnce({
      sessionId: "session_live_abc",
      documentId: "myos_doc_abc",
      processingStatus: "RUNNING",
      isPublic: true,
      document: {
        kind: "shop",
        name: "Morning Brew",
        description: "Coffee shop space",
        contracts: {
          anchors: {
            type: "MyOS/Document Anchors",
            orders: {
              type: "MyOS/Document Anchor",
              label: "Orders",
              purpose: "Track customer orders",
            },
          },
        },
      },
    });
    linksListMock.mockResolvedValueOnce({ items: [] });

    const response = await POST(
      new Request("http://localhost/api/demo/live-documents/retrieve", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          credentials: {
            openAiApiKey: "sk-test",
            myOsApiKey: "myos-test",
            myOsAccountId: "acc-1",
            myOsBaseUrl: "https://api.dev.myos.blue/",
          },
          sessionId: "session_live_abc",
          accountId: "account_piotr_blue",
          accountName: "piotr-blue",
        }),
      })
    );

    expect(response.status).toBe(200);
    const payload = (await response.json()) as {
      ok: boolean;
      sessionId: string;
      mappedDocument: { id: string; title: string; kind: string; sessionId: string };
      mappedAnchors: Array<{ key: string; label: string; documentId: string }>;
      linked: Array<{ anchorKey: string; childSessionId: string }>;
    };
    expect(payload.ok).toBe(true);
    expect(payload.sessionId).toBe("session_live_abc");
    expect(payload.mappedDocument).toMatchObject({
      id: "doc_live_session_live_abc",
      title: "Morning Brew",
      kind: "shop",
      sessionId: "session_live_abc",
    });
    expect(payload.mappedAnchors).toHaveLength(1);
    expect(payload.mappedAnchors[0]).toMatchObject({
      key: "orders",
      label: "Orders",
      documentId: "doc_live_session_live_abc",
    });
    expect(payload.linked).toEqual([]);
    expect(retrieveMock).toHaveBeenCalledWith("session_live_abc");
    expect(linksListMock).toHaveBeenCalledWith("session_live_abc");
    expect(MyOsClient).toHaveBeenCalledTimes(1);
  });

  it("maps session links from links.list payload when retrieve contracts have none", async () => {
    retrieveMock.mockResolvedValueOnce({
      sessionId: "session_parent_1",
      documentId: "myos_parent_1",
      processingStatus: "RUNNING",
      isPublic: false,
      document: {
        kind: "shop",
        name: "Parent Shop",
        description: "Parent document",
        contracts: {
          anchors: {
            type: "MyOS/Document Anchors",
            orders: {
              type: "MyOS/Document Anchor",
              label: "Orders",
              purpose: "Track orders",
            },
          },
        },
      },
    });
    linksListMock.mockResolvedValueOnce({
      items: [
        {
          contracts: {
            links: {
              type: "MyOS/Document Links",
              link_orders_1: {
                type: "MyOS/MyOS Session Link",
                anchor: "orders",
                sessionId: "session_child_1",
              },
            },
          },
        },
      ],
    });

    const response = await POST(
      new Request("http://localhost/api/demo/live-documents/retrieve", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          credentials: {
            openAiApiKey: "sk-test",
            myOsApiKey: "myos-test",
            myOsAccountId: "acc-1",
            myOsBaseUrl: "https://api.dev.myos.blue/",
          },
          sessionId: "session_parent_1",
          accountId: "account_piotr_blue",
          accountName: "piotr-blue",
        }),
      })
    );

    expect(response.status).toBe(200);
    const payload = (await response.json()) as {
      ok: boolean;
      linked: Array<{ anchorKey: string; childSessionId: string }>;
    };
    expect(payload.ok).toBe(true);
    expect(payload.linked).toEqual([
      {
        anchorKey: "orders",
        childSessionId: "session_child_1",
      },
    ]);
  });
});
