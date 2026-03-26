import { beforeEach, describe, expect, it, vi } from "vitest";
import { POST } from "@/app/api/demo/live-documents/create/route";
import { POST as bootstrapPost } from "@/app/api/myos/bootstrap/route";
import { POST as retrievePost } from "@/app/api/myos/retrieve/route";

vi.mock("@/app/api/myos/bootstrap/route", () => ({
  POST: vi.fn(),
}));
vi.mock("@/app/api/myos/retrieve/route", () => ({
  POST: vi.fn(),
}));

describe("POST /api/demo/live-documents/create", () => {
  const mockedBootstrap = bootstrapPost as unknown as ReturnType<typeof vi.fn>;
  const mockedRetrieve = retrievePost as unknown as ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockedBootstrap.mockReset();
    mockedRetrieve.mockReset();
  });

  it("returns 400 for invalid payload", async () => {
    const response = await POST(
      new Request("http://localhost/api/demo/live-documents/create", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({}),
      })
    );
    expect(response.status).toBe(400);
  });

  it("creates live document through bootstrap and retrieve", async () => {
    mockedBootstrap.mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          ok: true,
          sessionId: "session_live_1",
        }),
        { status: 200, headers: { "content-type": "application/json" } }
      )
    );
    mockedRetrieve.mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          ok: true,
          retrieved: {
            documentId: "myos_live_doc_1",
          },
        }),
        { status: 200, headers: { "content-type": "application/json" } }
      )
    );

    const response = await POST(
      new Request("http://localhost/api/demo/live-documents/create", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          credentials: {
            openAiApiKey: "sk-test",
            myOsApiKey: "myos-test",
            myOsAccountId: "acc-1",
            myOsBaseUrl: "https://api.dev.myos.blue/",
          },
          doc: {
            kind: "plan",
            name: "Roadmap",
            description: "Q4 priorities",
            fields: {
              owner: "piotr-blue",
            },
            anchors: [],
          },
          link: null,
        }),
      })
    );

    expect(response.status).toBe(200);
    const payload = (await response.json()) as {
      ok: boolean;
      sessionId: string | null;
      myosDocumentId: string | null;
      created: {
        kind: string;
        name: string;
        description: string;
        fields: Record<string, string>;
        anchors: Array<{ key: string; label: string; purpose: string }>;
      };
      link: { parentDocumentId: string; anchorKey: string } | null;
      linked: Array<{ anchorKey: string; childSessionId: string }>;
    };
    expect(payload.ok).toBe(true);
    expect(payload.sessionId).toBe("session_live_1");
    expect(payload.myosDocumentId).toBe("myos_live_doc_1");
    expect(payload.created).toEqual({
      kind: "plan",
      name: "Roadmap",
      description: "Q4 priorities",
      fields: {
        owner: "piotr-blue",
      },
      anchors: [],
    });
    expect(payload.link).toBe(null);
    expect(payload.linked).toEqual([]);
  });

  it("surfaces bootstrap failure", async () => {
    mockedBootstrap.mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          ok: false,
          error: "bootstrap failed",
        }),
        { status: 400, headers: { "content-type": "application/json" } }
      )
    );

    const response = await POST(
      new Request("http://localhost/api/demo/live-documents/create", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          credentials: {
            openAiApiKey: "sk-test",
            myOsApiKey: "myos-test",
            myOsAccountId: "acc-1",
            myOsBaseUrl: "https://api.dev.myos.blue/",
          },
          doc: {
            kind: "plan",
            name: "Roadmap",
            description: "Q4 priorities",
            fields: {},
            anchors: [],
          },
          link: null,
        }),
      })
    );

    expect(response.status).toBe(400);
    const payload = (await response.json()) as { ok: boolean; error: string };
    expect(payload.ok).toBe(false);
    expect(payload.error).toContain("bootstrap failed");
  });

  it("creates child link document when link payload is provided", async () => {
    mockedBootstrap
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            ok: true,
            sessionId: "session_child_1",
          }),
          { status: 200, headers: { "content-type": "application/json" } }
        )
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            ok: true,
            sessionId: "session_link_1",
          }),
          { status: 200, headers: { "content-type": "application/json" } }
        )
      );
    mockedRetrieve
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            ok: true,
            retrieved: {
              sessionId: "session_child_1",
              documentId: "myos_child_1",
              processingStatus: "RUNNING",
              document: {
                name: "Order — Bob",
                description: "Order linked to shop",
                kind: "order",
                contracts: {
                  anchors: {
                    type: "MyOS/Document Anchors",
                  },
                },
              },
            },
          }),
          { status: 200, headers: { "content-type": "application/json" } }
        )
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            ok: true,
            retrieved: {
              sessionId: "session_link_1",
              documentId: "myos_link_1",
            },
          }),
          { status: 200, headers: { "content-type": "application/json" } }
        )
      );

    const response = await POST(
      new Request("http://localhost/api/demo/live-documents/create", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          credentials: {
            openAiApiKey: "sk-test",
            myOsApiKey: "myos-test",
            myOsAccountId: "acc-1",
            myOsBaseUrl: "https://api.dev.myos.blue/",
          },
          doc: {
            kind: "order",
            name: "Order — Bob",
            description: "Order linked to shop",
            fields: {
              customerName: "Bob",
            },
            anchors: [],
          },
          link: {
            parentDocumentId: "doc_live_parent123",
            anchorKey: "orders",
          },
        }),
      })
    );

    expect(response.status).toBe(200);
    const payload = (await response.json()) as {
      ok: boolean;
      linked: Array<{ anchorKey: string; childSessionId: string; linkSessionId: string | null }>;
      link: { parentDocumentId: string; anchorKey: string } | null;
    };
    expect(payload.ok).toBe(true);
    expect(payload.link).toEqual({
      parentDocumentId: "doc_live_parent123",
      anchorKey: "orders",
    });
    expect(payload.linked).toEqual([
      {
        anchorKey: "orders",
        childSessionId: "session_child_1",
        childDocumentId: "doc_live_session_child_1",
        linkSessionId: "session_link_1",
      },
    ]);
    expect(mockedBootstrap).toHaveBeenCalledTimes(2);
  });
});
