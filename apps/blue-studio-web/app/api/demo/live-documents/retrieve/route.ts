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
  accountId: z.string().min(1).optional(),
  accountName: z.string().min(1).optional(),
});

function readRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === "object" && value !== null ? (value as Record<string, unknown>) : null;
}

export async function POST(request: Request) {
  try {
    const body = requestSchema.parse(await request.json());
    const client = createLiveMyOsClient(body.credentials);
    const retrieved = (await client.documents.retrieve(body.sessionId)) as Record<string, unknown>;
    const mapped = mapMyOsRetrievedToDocumentRecord({
      retrieved,
      ownerAccountId: body.accountId ?? "account_piotr_blue",
      ownerName: body.accountName ?? "piotr-blue",
      existingDocument: null,
    });

    const links = await client.documents.links.list(body.sessionId);
    const linksRecord = readRecord(links);

    return NextResponse.json({
      ok: true,
      sessionId: body.sessionId,
      mappedDocument: mapped.document,
      mappedAnchors: mapped.anchors,
      linked: mapped.linkedSessionIds.map((entry) => ({
        anchorKey: entry.anchorKey,
        childSessionId: entry.childSessionId,
      })),
      raw: {
        retrieved,
        links: linksRecord ?? links,
      },
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
