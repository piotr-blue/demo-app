import { NextResponse } from "next/server";
import { z } from "zod";
import { MyOsClient } from "@blue-labs/myos-js";
import { parseRouteCredentials } from "@/lib/api/credentials";
import { safeErrorMessage } from "@/lib/security/redact";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const requestSchema = z.object({
  credentials: z.unknown(),
  sessionId: z.string().min(1),
});

export async function POST(request: Request) {
  try {
    const body = requestSchema.parse(await request.json());
    const credentials = parseRouteCredentials(body.credentials);
    const client = new MyOsClient({
      apiKey: credentials.myOsApiKey,
      baseUrl: credentials.myOsBaseUrl,
      timeoutMs: 45_000,
      maxRetries: 2,
    });

    const retrieved = await client.documents.retrieve(body.sessionId);
    return NextResponse.json({
      ok: true,
      retrieved,
    });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: safeErrorMessage(error) },
      { status: 400 }
    );
  }
}
