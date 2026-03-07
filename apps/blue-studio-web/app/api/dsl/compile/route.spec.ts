import { describe, expect, it } from "vitest";
import { POST } from "@/app/api/dsl/compile/route";

describe("POST /api/dsl/compile", () => {
  it("returns ok for compilable DSL", async () => {
    const response = await POST(
      new Request("http://localhost/api/dsl/compile", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          code: `
            export function buildDocument() {
              return {
                name: 'Counter',
                counter: 0,
                contracts: {
                  ownerChannel: {
                    type: 'Conversation/Timeline Channel',
                    timelineId: 'owner-timeline',
                  },
                },
              };
            }
          `,
        }),
      })
    );
    expect(response.status).toBe(200);
    const payload = (await response.json()) as { ok: boolean };
    expect(payload.ok).toBe(true);
  });

  it("returns 400 for invalid code", async () => {
    const response = await POST(
      new Request("http://localhost/api/dsl/compile", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ code: "export const a =" }),
      })
    );
    expect(response.status).toBe(400);
  });
});
