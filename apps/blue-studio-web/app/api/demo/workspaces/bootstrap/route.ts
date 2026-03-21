import { NextResponse } from "next/server";
import { z } from "zod";
import { safeErrorMessage } from "@/lib/security/redact";
import { getWorkspaceTemplate, WORKSPACE_BINDING_ACCOUNT_PLACEHOLDER } from "@/lib/demo/workspace-templates";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const requestSchema = z.object({
  credentials: z.object({
    openAiApiKey: z.string().optional().default(""),
    myOsApiKey: z.string().min(1),
    myOsAccountId: z.string().min(1),
    myOsBaseUrl: z.string().url(),
  }),
  templateKey: z.enum(["shop", "restaurant", "generic-business"]),
  workspaceName: z.string().min(1),
});

function replaceWorkspaceName(documentJson: Record<string, unknown>, workspaceName: string) {
  return {
    ...documentJson,
    workspaceName,
    name: `${workspaceName} Core`,
  };
}

function normalizeBindings(
  bindings: Array<{
    channelName: string;
    mode: "email" | "accountId";
    value: string;
    timelineId?: string;
  }>,
  accountId: string
) {
  return bindings.map((binding) => ({
    ...binding,
    value:
      binding.value === WORKSPACE_BINDING_ACCOUNT_PLACEHOLDER
        ? accountId
        : binding.value,
  }));
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
    const template = getWorkspaceTemplate(body.templateKey);
    if (!template) {
      return NextResponse.json(
        {
          ok: false,
          error: `Unknown workspace template '${body.templateKey}'.`,
        },
        { status: 400 }
      );
    }

    const credentials = {
      openAiApiKey: body.credentials.openAiApiKey.trim() || "__demo-openai-key-not-used__",
      myOsApiKey: body.credentials.myOsApiKey.trim(),
      myOsAccountId: body.credentials.myOsAccountId.trim(),
      myOsBaseUrl: body.credentials.myOsBaseUrl.trim(),
    };
    const documentJson = replaceWorkspaceName(template.bootstrap.documentJson, body.workspaceName);
    const bindings = normalizeBindings(template.bootstrap.bindings, credentials.myOsAccountId);
    const origin = new URL(request.url).origin;

    const bootstrapResponse = await fetch(`${origin}/api/myos/bootstrap`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        credentials,
        documentJson,
        bindings,
      }),
    });
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
              : "Workspace bootstrap request failed.",
        },
        { status: 400 }
      );
    }

    let myosDocumentId: string | null = null;
    if (bootstrapPayload.sessionId) {
      const retrieveResponse = await fetch(`${origin}/api/myos/retrieve`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          credentials,
          sessionId: bootstrapPayload.sessionId,
        }),
      });
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
      coreDocumentId: null,
      myosDocumentId,
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
