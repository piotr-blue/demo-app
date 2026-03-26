import { NextResponse } from "next/server";
import { z } from "zod";
import { safeErrorMessage } from "@/lib/security/redact";
import { parseRouteCredentials } from "@/lib/api/credentials";
import { createLiveMyOsClient } from "@/lib/myos/live-documents/client";
import { mapMyOsListItemToDocumentRecord } from "@/lib/myos/live-documents/map";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const requestSchema = z.object({
  credentials: z.unknown(),
  ownerAccountId: z.string().min(1),
  ownerName: z.string().min(1),
  pageSize: z.number().int().positive().max(100).optional(),
});

function readItems(value: unknown): Array<Record<string, unknown>> {
  if (!Array.isArray(value)) {
    return [];
  }
  return value.filter((entry): entry is Record<string, unknown> => typeof entry === "object" && entry !== null);
}

export async function POST(request: Request) {
  try {
    const body = requestSchema.parse(await request.json());
    const credentials = parseRouteCredentials(body.credentials);
    const client = createLiveMyOsClient(credentials);
    const response = (await client.me.documents.list({
      pageSize: body.pageSize ?? 50,
      accessType: "all",
      sessionType: "excludeAgents",
    })) as Record<string, unknown>;
    const items = readItems(response.items);
    const documents = items
      .map((item) =>
        mapMyOsListItemToDocumentRecord({
          item,
          ownerAccountId: body.ownerAccountId,
          ownerName: body.ownerName,
        })
      )
      .filter((entry): entry is NonNullable<typeof entry> => Boolean(entry));

    return NextResponse.json({
      ok: true,
      documents,
      nextPageToken: typeof response.nextPageToken === "string" ? response.nextPageToken : null,
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
