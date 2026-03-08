import { NextResponse } from "next/server";
import { z } from "zod";
import { MyOsClient } from "@blue-labs/myos-js";
import { parseRouteCredentials } from "@/lib/api/credentials";
import { getLiveStore } from "@/lib/myos/live/store";
import { safeErrorMessage } from "@/lib/security/redact";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const requestSchema = z.object({
  credentials: z.unknown(),
  registrationId: z.string().min(1),
});

export async function POST(request: Request) {
  try {
    const body = requestSchema.parse(await request.json());
    const credentials = parseRouteCredentials(body.credentials);
    const store = getLiveStore();
    const registration = await store.getRegistrationById(body.registrationId);
    if (!registration) {
      return NextResponse.json({
        ok: true,
        removed: false,
      });
    }

    const client = new MyOsClient({
      apiKey: credentials.myOsApiKey,
      baseUrl: credentials.myOsBaseUrl,
      timeoutMs: 45_000,
      maxRetries: 2,
    });

    try {
      await client.webhooks.del(registration.webhookId);
    } catch {
      // best-effort delete, keep local cleanup behavior deterministic
    }

    await store.deleteRegistration(registration.registrationId);
    await store.deleteSubscription(registration.browserId, registration.accountHash);

    return NextResponse.json({
      ok: true,
      removed: true,
    });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: safeErrorMessage(error) },
      { status: 400 }
    );
  }
}
