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

function readString(value: unknown): string | null {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
}

function parseLinkEntriesFromContracts(value: unknown): Array<{ anchorKey: string; childSessionId: string }> {
  const contracts = readRecord(value);
  if (!contracts) {
    return [];
  }
  const linksContract = readRecord(contracts.links);
  if (!linksContract || readString(linksContract.type) !== "MyOS/Document Links") {
    return [];
  }
  const entries: Array<{ anchorKey: string; childSessionId: string }> = [];
  for (const [key, linkValue] of Object.entries(linksContract)) {
    if (key === "type") {
      continue;
    }
    const linkRecord = readRecord(linkValue);
    if (!linkRecord || readString(linkRecord.type) !== "MyOS/MyOS Session Link") {
      continue;
    }
    const anchorKey = readString(linkRecord.anchor);
    const childSessionId = readString(linkRecord.sessionId);
    if (!anchorKey || !childSessionId) {
      continue;
    }
    entries.push({ anchorKey, childSessionId });
  }
  return entries;
}

function parseLinksResponse(value: unknown): Array<{ anchorKey: string; childSessionId: string }> {
  const record = readRecord(value);
  if (!record) {
    return [];
  }
  const items = Array.isArray(record.items)
    ? record.items.filter((item): item is Record<string, unknown> => Boolean(readRecord(item)))
    : [];
  const entries: Array<{ anchorKey: string; childSessionId: string }> = [];
  for (const item of items) {
    entries.push(...parseLinkEntriesFromContracts(item.contracts));
    const documentRecord = readRecord(item.document);
    if (documentRecord) {
      entries.push(...parseLinkEntriesFromContracts(documentRecord.contracts));
    }
  }
  return entries;
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
    const linkedFromLinksApi = parseLinksResponse(links);
    const linked = Array.from(
      new Map(
        [...mapped.linkedSessionIds, ...linkedFromLinksApi].map((entry) => [
          `${entry.anchorKey}::${entry.childSessionId}`,
          { anchorKey: entry.anchorKey, childSessionId: entry.childSessionId },
        ])
      ).values()
    );

    return NextResponse.json({
      ok: true,
      sessionId: body.sessionId,
      mappedDocument: mapped.document,
      mappedAnchors: mapped.anchors,
      linked,
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
