import { beforeEach, describe, expect, it, vi } from "vitest";

const verifyMock = vi.fn();
const publishMock = vi.fn();
const storeMock = {
  getRegistrationById: vi.fn(),
  markDeliverySeen: vi.fn(),
  listSubscriptionsByAccount: vi.fn(),
};

vi.mock("@/lib/myos/live/verify", () => ({
  verifyIncomingWebhookRequest: (...args: unknown[]) => verifyMock(...args),
}));

vi.mock("@/lib/myos/live/store", () => ({
  getLiveStore: () => storeMock,
}));

vi.mock("@/lib/myos/live/hub", () => ({
  getLiveEventHub: () => ({
    publish: (...args: unknown[]) => publishMock(...args),
  }),
}));

import { POST } from "@/app/api/myos/webhooks/incoming/[registrationId]/route";

describe("POST /api/myos/webhooks/incoming/[registrationId]", () => {
  beforeEach(() => {
    verifyMock.mockReset();
    publishMock.mockReset();
    storeMock.getRegistrationById.mockReset();
    storeMock.markDeliverySeen.mockReset();
    storeMock.listSubscriptionsByAccount.mockReset();
  });

  it("rejects invalid signatures", async () => {
    storeMock.getRegistrationById.mockResolvedValue({
      registrationId: "reg_1",
      accountHash: "account_1",
      myOsBaseUrl: "https://api.dev.myos.blue/",
    });
    verifyMock.mockResolvedValue({ ok: false, error: "Invalid webhook signature." });

    const response = await POST(
      new Request("http://localhost/api/myos/webhooks/incoming/reg_1", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-myos-delivery-id": "delivery-1",
        },
        body: JSON.stringify({ sessionId: "session-1" }),
      }),
      { params: Promise.resolve({ registrationId: "reg_1" }) }
    );

    expect(response.status).toBe(401);
    const payload = (await response.json()) as { ok: boolean };
    expect(payload.ok).toBe(false);
  });

  it("dedupes repeated delivery ids", async () => {
    storeMock.getRegistrationById.mockResolvedValue({
      registrationId: "reg_1",
      accountHash: "account_1",
      myOsBaseUrl: "https://api.dev.myos.blue/",
    });
    verifyMock.mockResolvedValue({ ok: true });
    storeMock.markDeliverySeen.mockResolvedValue(false);

    const response = await POST(
      new Request("http://localhost/api/myos/webhooks/incoming/reg_1", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-myos-delivery-id": "delivery-1",
        },
        body: JSON.stringify({ sessionId: "session-1" }),
      }),
      { params: Promise.resolve({ registrationId: "reg_1" }) }
    );

    expect(response.status).toBe(409);
    const payload = (await response.json()) as { ok: boolean };
    expect(payload.ok).toBe(false);
  });

  it("publishes invalidation event for matching subscriptions", async () => {
    storeMock.getRegistrationById.mockResolvedValue({
      registrationId: "reg_1",
      accountHash: "account_1",
      myOsBaseUrl: "https://api.dev.myos.blue/",
    });
    verifyMock.mockResolvedValue({ ok: true });
    storeMock.markDeliverySeen.mockResolvedValue(true);
    storeMock.listSubscriptionsByAccount.mockResolvedValue([
      {
        browserId: "browser-1",
        accountHash: "account_1",
        sessionIds: ["session-1"],
      },
      {
        browserId: "browser-2",
        accountHash: "account_1",
        sessionIds: ["session-2"],
      },
    ]);
    publishMock.mockReturnValue(1);

    const response = await POST(
      new Request("http://localhost/api/myos/webhooks/incoming/reg_1", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-myos-delivery-id": "delivery-2",
        },
        body: JSON.stringify({ sessionId: "session-1", eventId: "event-1", epoch: 2 }),
      }),
      { params: Promise.resolve({ registrationId: "reg_1" }) }
    );

    expect(response.status).toBe(200);
    const payload = (await response.json()) as {
      ok: boolean;
      delivered: boolean;
      matchingSubscriptions: number;
    };
    expect(payload.ok).toBe(true);
    expect(payload.delivered).toBe(true);
    expect(payload.matchingSubscriptions).toBe(1);
    expect(publishMock).toHaveBeenCalledWith(
      "browser-1:account_1",
      expect.objectContaining({
        type: "myos-epoch-advanced",
        sessionId: "session-1",
        deliveryId: "delivery-2",
      })
    );
  });
});
