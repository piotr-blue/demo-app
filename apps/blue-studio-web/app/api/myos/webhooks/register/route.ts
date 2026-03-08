import { NextResponse } from "next/server";
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
});

function nowId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function readWebhookId(value: unknown): string | null {
  if (!value || typeof value !== "object") {
    return null;
  }
  const id = (value as Record<string, unknown>).id;
  return typeof id === "string" && id.length > 0 ? id : null;
}

export async function POST(request: Request) {
  try {
    const body = requestSchema.parse(await request.json());
    const credentials = parseRouteCredentials(body.credentials);
    const store = getLiveStore();

    const existing = await store.getRegistrationByBrowserAccount(
      body.browserId,
      body.accountHash
    );
    if (existing) {
      return NextResponse.json({
        ok: true,
        registration: existing,
        reused: true,
      });
    }

    const registrationId = nowId("reg");
    const callbackPath = `/api/myos/webhooks/incoming/${registrationId}`;
    const callbackUrl = `${new URL(request.url).origin}${callbackPath}`;

    const client = new MyOsClient({
      apiKey: credentials.myOsApiKey,
      baseUrl: credentials.myOsBaseUrl,
      timeoutMs: 45_000,
      maxRetries: 2,
    });
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
