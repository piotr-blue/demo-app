import { beforeEach, describe, expect, it, vi } from "vitest";

const createWebhookMock = vi.fn();
const storeMock = {
  getRegistrationByBrowserAccount: vi.fn(),
  upsertRegistration: vi.fn(),
};

vi.mock("@blue-labs/myos-js", () => ({
  MyOsClient: class MockMyOsClient {
    webhooks = {
      create: (...args: unknown[]) => createWebhookMock(...args),
    };
  },
}));

vi.mock("@/lib/myos/live/store", () => ({
  getLiveStore: () => storeMock,
}));

import { POST } from "@/app/api/myos/webhooks/register/route";

describe("POST /api/myos/webhooks/register", () => {
  beforeEach(() => {
    createWebhookMock.mockReset();
    storeMock.getRegistrationByBrowserAccount.mockReset();
    storeMock.upsertRegistration.mockReset();
  });

  it("creates webhook registration when none exists", async () => {
    storeMock.getRegistrationByBrowserAccount.mockResolvedValue(null);
    createWebhookMock.mockResolvedValue({ id: "webhook_1" });

    const response = await POST(
      new Request("http://localhost/api/myos/webhooks/register", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          credentials: {
            openAiApiKey: "sk-test",
            myOsApiKey: "myos-test",
            myOsAccountId: "acc-1",
            myOsBaseUrl: "https://api.dev.myos.blue/",
          },
          browserId: "browser-1",
          accountHash: "account-hash-1",
        }),
      })
    );

    expect(response.status).toBe(200);
    const payload = (await response.json()) as {
      ok: boolean;
      reused: boolean;
      registration: { webhookId: string };
    };
    expect(payload.ok).toBe(true);
    expect(payload.reused).toBe(false);
    expect(payload.registration.webhookId).toBe("webhook_1");
    expect(createWebhookMock).toHaveBeenCalledWith(
      expect.objectContaining({
        settings: expect.objectContaining({
          url: expect.stringContaining("/api/myos/webhooks/incoming/"),
        }),
      })
    );
  });

  it("reuses existing registration for browser/account pair", async () => {
    storeMock.getRegistrationByBrowserAccount.mockResolvedValue({
      registrationId: "reg_1",
      webhookId: "webhook_1",
      browserId: "browser-1",
      accountHash: "account-hash-1",
      myOsBaseUrl: "https://api.dev.myos.blue/",
      callbackPath: "/api/myos/webhooks/incoming/reg_1",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    const response = await POST(
      new Request("http://localhost/api/myos/webhooks/register", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          credentials: {
            openAiApiKey: "sk-test",
            myOsApiKey: "myos-test",
            myOsAccountId: "acc-1",
            myOsBaseUrl: "https://api.dev.myos.blue/",
          },
          browserId: "browser-1",
          accountHash: "account-hash-1",
        }),
      })
    );

    expect(response.status).toBe(200);
    const payload = (await response.json()) as { ok: boolean; reused: boolean };
    expect(payload.ok).toBe(true);
    expect(payload.reused).toBe(true);
    expect(createWebhookMock).not.toHaveBeenCalled();
  });
});
