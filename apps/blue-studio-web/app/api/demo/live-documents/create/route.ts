import { NextResponse } from "next/server";
import { z } from "zod";
import { safeErrorMessage } from "@/lib/security/redact";
import { POST as bootstrapPost } from "@/app/api/myos/bootstrap/route";
import { POST as retrievePost } from "@/app/api/myos/retrieve/route";
import {
  liveDocCreateBodySchema,
  type LiveDocInput as RouteLiveDocInput,
  type LiveDocLinkInput as RouteLiveDocLinkInput,
} from "@/lib/myos/live-documents/contracts";
import { buildLiveDocumentJson, buildSessionLinkDocumentJson } from "@/lib/myos/live-documents/payload";
import {
  createLiveDocumentIdFromSessionId,
  mapMyOsRetrievedToDocumentRecord,
  type LiveMappedAnchorLink,
} from "@/lib/myos/live-documents/map";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const requestSchema = z.object({
  credentials: z.object({
    openAiApiKey: z.string().min(1),
    myOsApiKey: z.string().min(1),
    myOsAccountId: z.string().min(1),
    myOsBaseUrl: z.string().url(),
  }),
  ...liveDocCreateBodySchema.shape,
});

function readDocumentId(value: unknown): string | null {
  if (!value || typeof value !== "object") {
    return null;
  }
  const record = value as Record<string, unknown>;
  if (typeof record.documentId === "string" && record.documentId.length > 0) {
    return record.documentId;
  }
  const document = record.document;
  if (!document || typeof document !== "object") {
    return null;
  }
  const documentRecord = document as Record<string, unknown>;
  if (typeof documentRecord.id === "string" && documentRecord.id.length > 0) {
    return documentRecord.id;
  }
  if (typeof documentRecord.documentId === "string" && documentRecord.documentId.length > 0) {
    return documentRecord.documentId;
  }
  return null;
}

function readString(value: unknown): string | null {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
}

type LiveDocInput = RouteLiveDocInput;
type LiveDocLinkInput = RouteLiveDocLinkInput;

function normalizeCredentials(credentials: z.infer<typeof requestSchema>["credentials"]) {
  return {
    openAiApiKey: credentials.openAiApiKey.trim(),
    myOsApiKey: credentials.myOsApiKey.trim(),
    myOsAccountId: credentials.myOsAccountId.trim(),
    myOsBaseUrl: credentials.myOsBaseUrl.trim(),
  };
}

function normalizeDocInput(doc: LiveDocInput): LiveDocInput {
  return {
    kind: doc.kind.trim(),
    name: doc.name.trim(),
    description: doc.description.trim(),
    fields: Object.fromEntries(
      Object.entries(doc.fields).map(([key, value]) => [key.trim(), value.trim()])
    ),
    anchors: doc.anchors.map((anchor) => ({
      key: anchor.key.trim(),
      label: anchor.label.trim(),
      purpose: anchor.purpose.trim(),
    })),
  };
}

function normalizeLinkInput(link: LiveDocLinkInput | null): LiveDocLinkInput | null {
  if (!link) {
    return null;
  }
  return {
    parentDocumentId: link.parentDocumentId.trim(),
    anchorKey: link.anchorKey.trim(),
  };
}

function buildLinkRecords(params: {
  mappedLinks: LiveMappedAnchorLink[];
  knownSessionLinks: Record<string, string>;
}) {
  return params.mappedLinks.map((entry) => ({
    anchorKey: entry.anchorKey,
    childSessionId: entry.childSessionId,
    childDocumentId: createLiveDocumentIdFromSessionId(entry.childSessionId),
    linkSessionId: params.knownSessionLinks[entry.childSessionId] ?? null,
  }));
}

async function bootstrapLiveDocument(params: {
  credentials: ReturnType<typeof normalizeCredentials>;
  docJson: Record<string, unknown>;
}): Promise<{
  sessionId: string | null;
  myosDocumentId: string | null;
  retrieved: Record<string, unknown> | null;
}> {
  const bootstrapResponse = await bootstrapPost(
    new Request("http://localhost/api/myos/bootstrap", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        credentials: params.credentials,
        documentJson: params.docJson,
        bindings: [
          {
            channelName: "ownerChannel",
            mode: "accountId",
            value: params.credentials.myOsAccountId,
          },
        ],
      }),
    })
  );

  const bootstrapPayload = (await bootstrapResponse.json()) as
    | {
        ok: true;
        sessionId: string | null;
      }
    | {
        ok: false;
        error: string;
      };
  if (!bootstrapResponse.ok || !bootstrapPayload.ok) {
    throw new Error(
      "error" in bootstrapPayload
        ? bootstrapPayload.error
        : "Live document bootstrap failed."
    );
  }

  if (!bootstrapPayload.sessionId) {
    return {
      sessionId: null,
      myosDocumentId: null,
      retrieved: null,
    };
  }

  const retrieveResponse = await retrievePost(
    new Request("http://localhost/api/myos/retrieve", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        credentials: params.credentials,
        sessionId: bootstrapPayload.sessionId,
      }),
    })
  );

  if (!retrieveResponse.ok) {
    return {
      sessionId: bootstrapPayload.sessionId,
      myosDocumentId: null,
      retrieved: null,
    };
  }

  const retrievePayload = (await retrieveResponse.json()) as
    | { ok: true; retrieved: Record<string, unknown> }
    | { ok: false; error: string };

  if (!retrievePayload.ok) {
    return {
      sessionId: bootstrapPayload.sessionId,
      myosDocumentId: null,
      retrieved: null,
    };
  }

  return {
    sessionId: bootstrapPayload.sessionId,
    myosDocumentId: readDocumentId(retrievePayload.retrieved),
    retrieved: retrievePayload.retrieved,
  };
}

export async function POST(request: Request) {
  try {
    const body = requestSchema.parse(await request.json());
    const credentials = normalizeCredentials(body.credentials);
    const normalizedDoc = normalizeDocInput(body.doc);
    const normalizedLink = normalizeLinkInput(body.link);

    const created = await bootstrapLiveDocument({
      credentials,
      docJson: buildLiveDocumentJson(normalizedDoc),
    });

    const knownSessionLinks: Record<string, string> = {};
    const linkErrors: string[] = [];
    let parentSessionId: string | null = null;
    const parentDocumentId =
      normalizedLink?.parentDocumentId ??
      readString(created.retrieved?.documentId) ??
      created.myosDocumentId ??
      null;

    if (normalizedLink?.parentDocumentId) {
      parentSessionId = normalizedLink.parentDocumentId.startsWith("doc_live_")
        ? normalizedLink.parentDocumentId.replace(/^doc_live_/u, "")
        : normalizedLink.parentDocumentId;
    }

    if (normalizedLink && created.sessionId && parentSessionId) {
      const linkDoc = buildSessionLinkDocumentJson({
        parentSessionId,
        parentDocumentId: normalizedLink.parentDocumentId,
        childSessionId: created.sessionId,
        anchorKey: normalizedLink.anchorKey,
        childName: normalizedDoc.name,
      });

      try {
        const linkCreated = await bootstrapLiveDocument({
          credentials,
          docJson: linkDoc,
        });
        if (linkCreated.sessionId) {
          knownSessionLinks[created.sessionId] = linkCreated.sessionId;
        }
      } catch (error) {
        linkErrors.push(error instanceof Error ? error.message : "Failed to create link document.");
      }
    }

    const mapped = created.retrieved
      ? mapMyOsRetrievedToDocumentRecord({
          retrieved: created.retrieved,
          ownerAccountId: "account_piotr_blue",
          ownerName: "piotr-blue",
          existingDocument: null,
        })
      : { document: null, anchors: [], linkedSessionIds: [] };

    const linksFromContracts = buildLinkRecords({
      mappedLinks: mapped.linkedSessionIds,
      knownSessionLinks,
    });
    if (normalizedLink && created.sessionId) {
      const normalizedAnchorKey = normalizedLink.anchorKey;
      if (!linksFromContracts.some((entry) => entry.childSessionId === created.sessionId)) {
        linksFromContracts.unshift({
          anchorKey: normalizedAnchorKey,
          childSessionId: created.sessionId,
          childDocumentId: createLiveDocumentIdFromSessionId(created.sessionId),
          linkSessionId: knownSessionLinks[created.sessionId] ?? null,
        });
      }
    }

    return NextResponse.json({
      ok: true,
      sessionId: created.sessionId,
      myosDocumentId: created.myosDocumentId,
      created: {
        kind: normalizedDoc.kind,
        name: normalizedDoc.name,
        description: normalizedDoc.description,
        fields: normalizedDoc.fields,
        anchors: normalizedDoc.anchors,
      },
      link: normalizedLink
        ? {
            parentDocumentId: normalizedLink.parentDocumentId,
            anchorKey: normalizedLink.anchorKey,
          }
        : null,
      linked: linksFromContracts,
      mappedDocument: mapped.document,
      mappedAnchors: mapped.anchors,
      parentSessionId,
      parentDocumentId,
      errors: linkErrors,
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
