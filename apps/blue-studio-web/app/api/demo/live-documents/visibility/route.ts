import { NextResponse } from "next/server";
import { z } from "zod";
import { safeErrorMessage } from "@/lib/security/redact";
import { createLiveMyOsClient } from "@/lib/myos/live-documents/client";
import { mapMyOsRetrievedToDocumentRecord } from "@/lib/myos/live-documents/map";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const requestSchema = z.object({
  credentials: z.object({
    openAiApiKey: z.string().min(1),
    myOsApiKey: z.string().min(1),
    myOsAccountId: z.string().min(1),
    myOsBaseUrl: z.string().url(),
  }),
  sessionId: z.string().min(1),
  enabled: z.boolean(),
});

function isLikelyVisibilityUnsupported(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return /(permission|forbidden|not supported|validation|invalid|unknown)/iu.test(message);
}

export async function POST(request: Request) {
  try {
    const body = requestSchema.parse(await request.json());
    const credentials = {
      openAiApiKey: body.credentials.openAiApiKey.trim(),
      myOsApiKey: body.credentials.myOsApiKey.trim(),
      myOsAccountId: body.credentials.myOsAccountId.trim(),
      myOsBaseUrl: body.credentials.myOsBaseUrl.trim(),
    };

    const client = createLiveMyOsClient(credentials);

    try {
      await client.documents.update(body.sessionId, {
        isPublic: body.enabled,
      } as never);
    } catch (error) {
      if (isLikelyVisibilityUnsupported(error)) {
        return NextResponse.json(
          {
            ok: false,
            unsupported: true,
            error: "Public visibility updates are not supported by the current MyOS API path.",
          },
          { status: 400 }
        );
      }
      throw error;
    }

    const retrieved = (await client.documents.retrieve(body.sessionId)) as Record<string, unknown>;
    const mapped = mapMyOsRetrievedToDocumentRecord({
      retrieved,
      ownerAccountId: "account_piotr_blue",
      ownerName: "piotr-blue",
      existingDocument: null,
    });

    return NextResponse.json({
      ok: true,
      sessionId: body.sessionId,
      enabled: body.enabled,
      mappedDocument: mapped.document,
      mappedAnchors: mapped.anchors,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: safeErrorMessage(error),
      },
      { status: 400 }
    );
  }
}
