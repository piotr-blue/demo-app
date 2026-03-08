import { NextResponse } from "next/server";
import { createHash } from "node:crypto";
import { z } from "zod";
import { MyOsClient } from "@blue-labs/myos-js";
import { parseRouteCredentials } from "@/lib/api/credentials";
import { getLiveStore } from "@/lib/myos/live/store";
import type { WebhookRegistrationRecord } from "@/lib/myos/live/types";
import { safeErrorMessage } from "@/lib/security/redact";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const requestSchema = z.object({
  credentials: z.unknown(),
  browserId: z.string().min(1),
  accountHash: z.string().min(1),
  knownRegistrationId: z.string().min(1).optional(),
  knownWebhookId: z.string().min(1).optional(),
});

function stableRegistrationId(browserId: string, accountHash: string): string {
  const digest = createHash("sha256")
    .update(`${browserId}:${accountHash}`)
    .digest("hex")
    .slice(0, 24);
  return `reg_${digest}`;
}

function sanitizeRegistrationId(value: string | undefined): string | null {
  if (!value) {
    return null;
  }
  const trimmed = value.trim();
  if (!/^[a-zA-Z0-9_-]{1,120}$/.test(trimmed)) {
    return null;
  }
  return trimmed;
}

function readWebhookId(value: unknown): string | null {
  if (!value || typeof value !== "object") {
    return null;
  }
  const id = (value as Record<string, unknown>).id;
  return typeof id === "string" && id.length > 0 ? id : null;
}

function isLocalhostRequestOrigin(requestUrl: string): boolean {
  try {
    const hostname = new URL(requestUrl).hostname;
    return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1";
  } catch {
    return false;
  }
}

function readVercelBypassSecret(): string | null {
  const value = process.env.VERCEL_AUTOMATION_BYPASS_SECRET;
  if (!value) {
    return null;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function buildCallbackUrl(requestUrl: string, callbackPath: string): string {
  const url = new URL(callbackPath, requestUrl);
  const bypassSecret = readVercelBypassSecret();
  if (bypassSecret) {
    url.searchParams.set("x-vercel-protection-bypass", bypassSecret);
  }
  return url.toString();
}

function normalizeUrl(value: string): string | null {
  try {
    const parsed = new URL(value.trim());
    parsed.hash = "";
    if (parsed.pathname !== "/" && parsed.pathname.endsWith("/")) {
      parsed.pathname = parsed.pathname.slice(0, -1);
    }

    const sortedParams = [...parsed.searchParams.entries()].sort(([keyA], [keyB]) =>
      keyA.localeCompare(keyB)
    );
    parsed.search = "";
    for (const [key, paramValue] of sortedParams) {
      parsed.searchParams.append(key, paramValue);
    }
    return parsed.toString();
  } catch {
    return null;
  }
}

function readWebhookSettingsUrl(value: unknown): string | null {
  if (!value || typeof value !== "object") {
    return null;
  }
  const settings = (value as Record<string, unknown>).settings;
  if (!settings || typeof settings !== "object") {
    return null;
  }
  const url = (settings as Record<string, unknown>).url;
  return typeof url === "string" && url.trim().length > 0 ? url.trim() : null;
}

function readWebhookItems(value: unknown): unknown[] {
  if (!value || typeof value !== "object") {
    return [];
  }
  const items = (value as Record<string, unknown>).items;
  return Array.isArray(items) ? items.slice(0, 3) : [];
}

async function findExistingWebhookByCallbackUrl(params: {
  client: MyOsClient;
  callbackUrl: string;
}): Promise<string | null> {
  const targetUrl = normalizeUrl(params.callbackUrl);
  if (!targetUrl) {
    return null;
  }

  try {
    const listed = await params.client.webhooks.list({ itemsPerPage: 3 });
    const items = readWebhookItems(listed);
    for (const item of items) {
      if (!item || typeof item !== "object") {
        continue;
      }
      const webhookId = (item as Record<string, unknown>).id;
      const webhookUrl = readWebhookSettingsUrl(item);
      if (typeof webhookId !== "string" || !webhookUrl) {
        continue;
      }
      if (normalizeUrl(webhookUrl) === targetUrl) {
        return webhookId;
      }
    }
  } catch {
    // Best-effort dedupe only. Fail open and continue with create flow.
  }

  return null;
}

export async function POST(request: Request) {
  try {
    const body = requestSchema.parse(await request.json());
    if (isLocalhostRequestOrigin(request.url)) {
      return NextResponse.json(
        {
          ok: false,
          error: "Webhook registration is disabled on localhost.",
        },
        { status: 400 }
      );
    }

    const credentials = parseRouteCredentials(body.credentials);
    const store = getLiveStore();
    const client = new MyOsClient({
      apiKey: credentials.myOsApiKey,
      baseUrl: credentials.myOsBaseUrl,
      timeoutMs: 45_000,
      maxRetries: 2,
    });
    const registrationId =
      sanitizeRegistrationId(body.knownRegistrationId) ??
      stableRegistrationId(body.browserId, body.accountHash);
    const callbackPath = `/api/myos/webhooks/incoming/${registrationId}`;
    const callbackUrl = buildCallbackUrl(request.url, callbackPath);
    const normalizedCallbackUrl = normalizeUrl(callbackUrl);

    if (body.knownWebhookId && normalizedCallbackUrl) {
      try {
        const knownWebhook = await client.webhooks.retrieve(body.knownWebhookId);
        const knownWebhookUrl = readWebhookSettingsUrl(knownWebhook);
        if (knownWebhookUrl && normalizeUrl(knownWebhookUrl) === normalizedCallbackUrl) {
          const now = new Date().toISOString();
          const registration: WebhookRegistrationRecord = {
            registrationId,
            webhookId: body.knownWebhookId,
            browserId: body.browserId,
            accountHash: body.accountHash,
            myOsBaseUrl: credentials.myOsBaseUrl,
            callbackPath,
            callbackUrl,
            createdAt: now,
            updatedAt: now,
          };
          await store.upsertRegistration(registration);
          return NextResponse.json({
            ok: true,
            registration,
            reused: true,
          });
        }
      } catch {
        // Continue with fallback checks/create.
      }
    }

    const existing = await store.getRegistrationByBrowserAccount(
      body.browserId,
      body.accountHash
    );
    if (existing) {
      const existingCallbackUrl =
        typeof existing.callbackUrl === "string" && existing.callbackUrl.length > 0
          ? existing.callbackUrl
          : new URL(existing.callbackPath, request.url).toString();
      if (existingCallbackUrl === callbackUrl) {
        return NextResponse.json({
          ok: true,
          registration: existing,
          reused: true,
        });
      }

      try {
        await client.webhooks.del(existing.webhookId);
      } catch {
        // Best-effort cleanup. Continue to recreate registration.
      }
      await store.deleteRegistration(existing.registrationId);
    }

    const existingWebhookId = await findExistingWebhookByCallbackUrl({
      client,
      callbackUrl,
    });

    if (existingWebhookId) {
      const now = new Date().toISOString();
      const registration: WebhookRegistrationRecord = {
        registrationId,
        webhookId: existingWebhookId,
        browserId: body.browserId,
        accountHash: body.accountHash,
        myOsBaseUrl: credentials.myOsBaseUrl,
        callbackPath,
        callbackUrl,
        createdAt: now,
        updatedAt: now,
      };
      await store.upsertRegistration(registration);
      return NextResponse.json({
        ok: true,
        registration,
        reused: true,
      });
    }

    const webhook = await client.webhooks.create(
      {
        type: "HTTPS",
        status: "ACTIVE",
        settings: {
          url: callbackUrl,
        },
        myOSEventTypes: ["DOCUMENT_EPOCH_ADVANCED"],
      } as never
    );
    const webhookId = readWebhookId(webhook);
    if (!webhookId) {
      throw new Error("Webhook registration did not return a webhook id.");
    }

    const now = new Date().toISOString();
    const registration: WebhookRegistrationRecord = {
      registrationId,
      webhookId,
      browserId: body.browserId,
      accountHash: body.accountHash,
      myOsBaseUrl: credentials.myOsBaseUrl,
      callbackPath,
      callbackUrl,
      createdAt: now,
      updatedAt: now,
    };
    await store.upsertRegistration(registration);

    return NextResponse.json({
      ok: true,
      registration,
      reused: false,
    });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: safeErrorMessage(error) },
      { status: 400 }
    );
  }
}
