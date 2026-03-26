import { describe, expect, it, vi } from "vitest";
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
            name: "Roadmap",
            description: "Q4 priorities",
          },
        }),
      })
    );

    expect(response.status).toBe(200);
    const payload = (await response.json()) as {
      ok: boolean;
      sessionId: string | null;
      myosDocumentId: string | null;
      created: { name: string; description: string };
    };
    expect(payload.ok).toBe(true);
    expect(payload.sessionId).toBe("session_live_1");
    expect(payload.myosDocumentId).toBe("myos_live_doc_1");
    expect(payload.created).toEqual({
      name: "Roadmap",
      description: "Q4 priorities",
    });
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
            name: "Roadmap",
            description: "Q4 priorities",
          },
        }),
      })
    );

    expect(response.status).toBe(400);
    const payload = (await response.json()) as { ok: boolean; error: string };
    expect(payload.ok).toBe(false);
    expect(payload.error).toContain("bootstrap failed");
  });
});
