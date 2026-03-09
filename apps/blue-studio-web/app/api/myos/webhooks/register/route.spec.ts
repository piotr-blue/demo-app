import { createHash } from "node:crypto";
import { beforeEach, describe, expect, it, vi } from "vitest";

const createWebhookMock = vi.fn();
const deleteWebhookMock = vi.fn();
const listWebhookMock = vi.fn();
const retrieveWebhookMock = vi.fn();
const storeMock = {
  getRegistrationByBrowserAccount: vi.fn(),
  deleteRegistration: vi.fn(),
  upsertRegistration: vi.fn(),
};

vi.mock("@blue-labs/myos-js", () => ({
  MyOsClient: class MockMyOsClient {
    webhooks = {
      list: (...args: unknown[]) => listWebhookMock(...args),
      create: (...args: unknown[]) => createWebhookMock(...args),
      del: (...args: unknown[]) => deleteWebhookMock(...args),
      retrieve: (...args: unknown[]) => retrieveWebhookMock(...args),
    };
  },
}));

vi.mock("@/lib/myos/live/store", () => ({
  getLiveStore: () => storeMock,
}));

import { POST } from "@/app/api/myos/webhooks/register/route";

function stableRegistrationId(browserId: string, accountHash: string): string {
  const digest = createHash("sha256")
    .update(`${browserId}:${accountHash}`)
    .digest("hex")
    .slice(0, 24);
  return `reg_${digest}`;
}

describe("POST /api/myos/webhooks/register", () => {
  beforeEach(() => {
    listWebhookMock.mockReset();
    createWebhookMock.mockReset();
    deleteWebhookMock.mockReset();
    retrieveWebhookMock.mockReset();
    storeMock.getRegistrationByBrowserAccount.mockReset();
    storeMock.deleteRegistration.mockReset();
    storeMock.upsertRegistration.mockReset();
    listWebhookMock.mockResolvedValue({ items: [] });
    retrieveWebhookMock.mockRejectedValue(new Error("not found"));
    delete process.env.VERCEL_AUTOMATION_BYPASS_SECRET;
  });

  it("creates webhook registration when none exists", async () => {
    storeMock.getRegistrationByBrowserAccount.mockResolvedValue(null);
    createWebhookMock.mockResolvedValue({ id: "webhook_1" });

    const response = await POST(
      new Request("https://studio.example.com/api/myos/webhooks/register", {
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
    expect(listWebhookMock).toHaveBeenCalledWith({ itemsPerPage: 3 });
    expect(createWebhookMock).toHaveBeenCalledWith(
      expect.objectContaining({
        settings: expect.objectContaining({
          url: expect.stringContaining("/api/myos/webhooks/incoming/"),
        }),
      })
    );
  });

  it("reuses existing registration for browser/account pair", async () => {
    const registrationId = stableRegistrationId("browser-1", "account-hash-1");
    storeMock.getRegistrationByBrowserAccount.mockResolvedValue({
      registrationId,
      webhookId: "webhook_1",
      browserId: "browser-1",
      accountHash: "account-hash-1",
      myOsBaseUrl: "https://api.dev.myos.blue/",
      callbackPath: `/api/myos/webhooks/incoming/${registrationId}`,
      callbackUrl: `https://studio.example.com/api/myos/webhooks/incoming/${registrationId}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    const response = await POST(
      new Request("https://studio.example.com/api/myos/webhooks/register", {
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
    expect(listWebhookMock).not.toHaveBeenCalled();
    expect(createWebhookMock).not.toHaveBeenCalled();
    expect(deleteWebhookMock).not.toHaveBeenCalled();
  });

  it("skips create when an existing webhook already has the callback URL", async () => {
    const registrationId = stableRegistrationId("browser-1", "account-hash-1");
    const callbackUrl = `https://studio.example.com/api/myos/webhooks/incoming/${registrationId}`;
    storeMock.getRegistrationByBrowserAccount.mockResolvedValue(null);
    listWebhookMock.mockResolvedValue({
      items: [
        { id: "webhook_other", settings: { url: "https://example.com/not-ours" } },
        { id: "webhook_existing", settings: { url: callbackUrl } },
      ],
    });

    const response = await POST(
      new Request("https://studio.example.com/api/myos/webhooks/register", {
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
    expect(payload.reused).toBe(true);
    expect(payload.registration.webhookId).toBe("webhook_existing");
    expect(createWebhookMock).not.toHaveBeenCalled();
  });

  it("reuses known webhook id from client when callback URL matches", async () => {
    const registrationId = stableRegistrationId("browser-1", "account-hash-1");
    const callbackUrl = `https://studio.example.com/api/myos/webhooks/incoming/${registrationId}`;
    storeMock.getRegistrationByBrowserAccount.mockResolvedValue(null);
    retrieveWebhookMock.mockResolvedValue({
      id: "webhook_known",
      settings: { url: callbackUrl },
    });

    const response = await POST(
      new Request("https://studio.example.com/api/myos/webhooks/register", {
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
          knownWebhookId: "webhook_known",
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
    expect(payload.reused).toBe(true);
    expect(payload.registration.webhookId).toBe("webhook_known");
    expect(retrieveWebhookMock).toHaveBeenCalledWith("webhook_known");
    expect(createWebhookMock).not.toHaveBeenCalled();
    expect(listWebhookMock).not.toHaveBeenCalled();
  });

  it("appends Vercel bypass token to callback URL when configured", async () => {
    process.env.VERCEL_AUTOMATION_BYPASS_SECRET = "bypass-secret";
    storeMock.getRegistrationByBrowserAccount.mockResolvedValue(null);
    createWebhookMock.mockResolvedValue({ id: "webhook_1" });

    const response = await POST(
      new Request("https://studio-preview.vercel.app/api/myos/webhooks/register", {
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
    expect(listWebhookMock).toHaveBeenCalledWith({ itemsPerPage: 3 });
    expect(createWebhookMock).toHaveBeenCalledWith(
      expect.objectContaining({
        settings: expect.objectContaining({
          url: expect.stringContaining("x-vercel-protection-bypass=bypass-secret"),
        }),
      })
    );
  });

  it("recreates registration when stored callback URL differs from expected", async () => {
    process.env.VERCEL_AUTOMATION_BYPASS_SECRET = "bypass-secret";
    storeMock.getRegistrationByBrowserAccount.mockResolvedValue({
      registrationId: "reg_legacy",
      webhookId: "webhook_legacy",
      browserId: "browser-1",
      accountHash: "account-hash-1",
      myOsBaseUrl: "https://api.dev.myos.blue/",
      callbackPath: "/api/myos/webhooks/incoming/reg_legacy",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    createWebhookMock.mockResolvedValue({ id: "webhook_new" });

    const response = await POST(
      new Request("https://studio-preview.vercel.app/api/myos/webhooks/register", {
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
    const payload = (await response.json()) as { reused: boolean };
    expect(payload.reused).toBe(false);
    expect(deleteWebhookMock).toHaveBeenCalledWith("webhook_legacy");
    expect(storeMock.deleteRegistration).toHaveBeenCalledWith("reg_legacy");
    expect(listWebhookMock).toHaveBeenCalledWith({ itemsPerPage: 3 });
    expect(createWebhookMock).toHaveBeenCalledTimes(1);
  });

  it("rejects registration requests from localhost origin", async () => {
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

    expect(response.status).toBe(400);
    const payload = (await response.json()) as { ok: boolean; error: string };
    expect(payload.ok).toBe(false);
    expect(payload.error).toContain("disabled on localhost");
    expect(storeMock.getRegistrationByBrowserAccount).not.toHaveBeenCalled();
    expect(listWebhookMock).not.toHaveBeenCalled();
    expect(createWebhookMock).not.toHaveBeenCalled();
  });
});
