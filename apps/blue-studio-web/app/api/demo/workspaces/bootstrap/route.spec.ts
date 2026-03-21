import { afterEach, describe, expect, it, vi } from "vitest";
import { POST } from "@/app/api/demo/workspaces/bootstrap/route";

const originalFetch = global.fetch;

afterEach(() => {
  global.fetch = originalFetch;
  vi.restoreAllMocks();
});

describe("POST /api/demo/workspaces/bootstrap", () => {
  it("returns 400 for invalid payload", async () => {
    const response = await POST(
      new Request("http://localhost/api/demo/workspaces/bootstrap", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({}),
      })
    );
    expect(response.status).toBe(400);
  });

  it("returns session and document ids on success", async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes("/api/myos/bootstrap")) {
        return new Response(
          JSON.stringify({
            ok: true,
            sessionId: "session_123",
          }),
          { status: 200, headers: { "content-type": "application/json" } }
        );
      }
      if (url.includes("/api/myos/retrieve")) {
        return new Response(
          JSON.stringify({
            ok: true,
            retrieved: {
              documentId: "myos_doc_1",
            },
          }),
          { status: 200, headers: { "content-type": "application/json" } }
        );
      }
      return new Response(JSON.stringify({ ok: false }), {
        status: 400,
        headers: { "content-type": "application/json" },
      });
    });
    global.fetch = fetchMock as typeof fetch;

    const response = await POST(
      new Request("http://localhost/api/demo/workspaces/bootstrap", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          credentials: {
            myOsApiKey: "myos-test",
            myOsAccountId: "acc-1",
            myOsBaseUrl: "https://api.dev.myos.blue/",
          },
          templateKey: "shop",
          workspaceName: "Alice Shop",
        }),
      })
    );

    expect(response.status).toBe(200);
    const payload = (await response.json()) as {
      ok: boolean;
      sessionId: string | null;
      myosDocumentId: string | null;
    };
    expect(payload.ok).toBe(true);
    expect(payload.sessionId).toBe("session_123");
    expect(payload.myosDocumentId).toBe("myos_doc_1");
  });

  it("returns error when bootstrap endpoint fails", async () => {
    global.fetch = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes("/api/myos/bootstrap")) {
        return new Response(
          JSON.stringify({
            ok: false,
            error: "bootstrap failed",
          }),
          { status: 400, headers: { "content-type": "application/json" } }
        );
      }
      return new Response(JSON.stringify({ ok: false }), {
        status: 400,
        headers: { "content-type": "application/json" },
      });
    }) as typeof fetch;

    const response = await POST(
      new Request("http://localhost/api/demo/workspaces/bootstrap", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          credentials: {
            myOsApiKey: "myos-test",
            myOsAccountId: "acc-1",
            myOsBaseUrl: "https://api.dev.myos.blue/",
          },
          templateKey: "shop",
          workspaceName: "Alice Shop",
        }),
      })
    );
    expect(response.status).toBe(400);
    const payload = (await response.json()) as { ok: boolean; error: string };
    expect(payload.ok).toBe(false);
    expect(payload.error).toContain("bootstrap failed");
  });
});
