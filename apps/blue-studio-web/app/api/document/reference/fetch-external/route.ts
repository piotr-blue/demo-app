import { NextResponse } from "next/server";
import { z } from "zod";
import { MyOsClient } from "@blue-labs/myos-js";
import { parseRouteCredentials } from "@/lib/api/credentials";
import {
  chooseExternalReferenceSource,
  contextLabelForSourceType,
} from "@/lib/document/reference/reference";
import { safeErrorMessage } from "@/lib/security/redact";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const requestSchema = z.object({
  credentials: z.unknown(),
  sessionId: z.string().min(1),
  displayName: z.string().optional(),
});

function readString(value: unknown): string | null {
  return typeof value === "string" && value.trim().length > 0 ? value : null;
}

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
    const source = chooseExternalReferenceSource(retrieved);
    const contextLabel = contextLabelForSourceType(source.sourceType);
    const retrievedRecord =
      typeof retrieved === "object" && retrieved !== null
        ? (retrieved as Record<string, unknown>)
        : {};

    return NextResponse.json({
      ok: true,
      sourceType: source.sourceType,
      content: source.content,
      contextLabel,
      sourceMeta: {
        sessionId: body.sessionId,
        displayName: body.displayName ?? null,
        documentId: readString(retrievedRecord.documentId),
        retrievalStatus: readString(retrievedRecord.processingStatus) ?? readString(retrievedRecord.status),
      },
    });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: safeErrorMessage(error) },
      { status: 400 }
    );
  }
}
