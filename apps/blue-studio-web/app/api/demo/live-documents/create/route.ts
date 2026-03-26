import { NextResponse } from "next/server";
import { z } from "zod";
import { safeErrorMessage } from "@/lib/security/redact";
import { POST as bootstrapPost } from "@/app/api/myos/bootstrap/route";
import { POST as retrievePost } from "@/app/api/myos/retrieve/route";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const requestSchema = z.object({
  credentials: z.object({
    openAiApiKey: z.string().min(1),
    myOsApiKey: z.string().min(1),
    myOsAccountId: z.string().min(1),
    myOsBaseUrl: z.string().url(),
  }),
  doc: z.object({
    name: z.string().min(1),
    description: z.string().min(1),
  }),
});

function buildLiveDocumentJson(params: {
  name: string;
  description: string;
}): Record<string, unknown> {
  return {
    name: params.name,
    description: params.description,
    status: "active",
    source: "live-assistant",
    contracts: {
      ownerChannel: {
        type: "MyOS/MyOS Timeline Channel",
      },
    },
  };
}

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

export async function POST(request: Request) {
  try {
    const body = requestSchema.parse(await request.json());
    const credentials = {
      openAiApiKey: body.credentials.openAiApiKey.trim(),
      myOsApiKey: body.credentials.myOsApiKey.trim(),
      myOsAccountId: body.credentials.myOsAccountId.trim(),
      myOsBaseUrl: body.credentials.myOsBaseUrl.trim(),
    };

    const bootstrapResponse = await bootstrapPost(
      new Request("http://localhost/api/myos/bootstrap", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          credentials,
          documentJson: buildLiveDocumentJson(body.doc),
          bindings: [
            {
              channelName: "ownerChannel",
              mode: "accountId",
              value: credentials.myOsAccountId,
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
      return NextResponse.json(
        {
          ok: false,
          error:
            "error" in bootstrapPayload
              ? bootstrapPayload.error
              : "Live document bootstrap failed.",
        },
        { status: 400 }
      );
    }

    let myosDocumentId: string | null = null;
    if (bootstrapPayload.sessionId) {
      const retrieveResponse = await retrievePost(
        new Request("http://localhost/api/myos/retrieve", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            credentials,
            sessionId: bootstrapPayload.sessionId,
          }),
        })
      );
      if (retrieveResponse.ok) {
        const retrievePayload = (await retrieveResponse.json()) as
          | { ok: true; retrieved: Record<string, unknown> }
          | { ok: false; error: string };
        if (retrievePayload.ok) {
          myosDocumentId = readDocumentId(retrievePayload.retrieved);
        }
      }
    }

    return NextResponse.json({
      ok: true,
      sessionId: bootstrapPayload.sessionId,
      myosDocumentId,
      created: {
        name: body.doc.name.trim(),
        description: body.doc.description.trim(),
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
