import { beforeEach, describe, expect, it, vi } from "vitest";

const deleteWebhookMock = vi.fn();
const storeMock = {
  getRegistrationById: vi.fn(),
  deleteRegistration: vi.fn(),
  deleteSubscription: vi.fn(),
};

vi.mock("@blue-labs/myos-js", () => ({
  MyOsClient: class MockMyOsClient {
    webhooks = {
      del: (...args: unknown[]) => deleteWebhookMock(...args),
    };
  },
}));

vi.mock("@/lib/myos/live/store", () => ({
  getLiveStore: () => storeMock,
}));

import { POST } from "@/app/api/myos/webhooks/unregister/route";

describe("POST /api/myos/webhooks/unregister", () => {
  beforeEach(() => {
    deleteWebhookMock.mockReset();
    storeMock.getRegistrationById.mockReset();
    storeMock.deleteRegistration.mockReset();
    storeMock.deleteSubscription.mockReset();
  });

  it("deletes webhook and registration metadata", async () => {
    storeMock.getRegistrationById.mockResolvedValue({
      registrationId: "reg_1",
      webhookId: "webhook_1",
      browserId: "browser-1",
      accountHash: "account-hash-1",
    });
    deleteWebhookMock.mockResolvedValue({});

    const response = await POST(
      new Request("http://localhost/api/myos/webhooks/unregister", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          credentials: {
            openAiApiKey: "sk-test",
            myOsApiKey: "myos-test",
            myOsAccountId: "acc-1",
            myOsBaseUrl: "https://api.dev.myos.blue/",
          },
          registrationId: "reg_1",
        }),
      })
    );

    expect(response.status).toBe(200);
    const payload = (await response.json()) as { ok: boolean; removed: boolean };
    expect(payload.ok).toBe(true);
    expect(payload.removed).toBe(true);
    expect(deleteWebhookMock).toHaveBeenCalledWith("webhook_1");
    expect(storeMock.deleteRegistration).toHaveBeenCalledWith("reg_1");
  });

  it("returns removed false when registration is unknown", async () => {
    storeMock.getRegistrationById.mockResolvedValue(null);
    const response = await POST(
      new Request("http://localhost/api/myos/webhooks/unregister", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          credentials: {
            openAiApiKey: "sk-test",
            myOsApiKey: "myos-test",
            myOsAccountId: "acc-1",
            myOsBaseUrl: "https://api.dev.myos.blue/",
          },
          registrationId: "missing",
        }),
      })
    );
    expect(response.status).toBe(200);
    const payload = (await response.json()) as { ok: boolean; removed: boolean };
    expect(payload.ok).toBe(true);
    expect(payload.removed).toBe(false);
  });
});
