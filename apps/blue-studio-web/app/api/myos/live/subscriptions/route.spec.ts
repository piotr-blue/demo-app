import { beforeEach, describe, expect, it, vi } from "vitest";

const storeMock = {
  upsertSubscription: vi.fn(),
};

vi.mock("@/lib/myos/live/store", () => ({
  getLiveStore: () => storeMock,
}));

import { POST } from "@/app/api/myos/live/subscriptions/route";

describe("POST /api/myos/live/subscriptions", () => {
  beforeEach(() => {
    storeMock.upsertSubscription.mockReset();
  });

  it("stores normalized subscriptions", async () => {
    const response = await POST(
      new Request("http://localhost/api/myos/live/subscriptions", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          browserId: "browser-1",
          accountHash: "account-1",
          sessionIds: ["session-1", "session-1", "  "],
          threadIds: ["thread-1", "thread-2", "thread-2"],
        }),
      })
    );
    expect(response.status).toBe(200);
    const payload = (await response.json()) as { ok: boolean; sessionCount: number };
    expect(payload.ok).toBe(true);
    expect(payload.sessionCount).toBe(1);
    expect(storeMock.upsertSubscription).toHaveBeenCalledWith(
      expect.objectContaining({
        browserId: "browser-1",
        accountHash: "account-1",
        sessionIds: ["session-1"],
      })
    );
  });
});
