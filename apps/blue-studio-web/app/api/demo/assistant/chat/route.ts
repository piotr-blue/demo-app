import { NextResponse } from "next/server";
import { z } from "zod";
import { OPENAI_TEXT_MODEL, generateTextWithResponsesApi } from "@/lib/openai/client";
import { safeErrorMessage } from "@/lib/security/redact";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const requestSchema = z.object({
  credentials: z
    .object({
      openAiApiKey: z.string().optional().default(""),
    })
    .optional()
    .default({ openAiApiKey: "" }),
  scope: z.object({
    id: z.string().min(1),
    type: z.enum(["blink", "workspace"]),
    name: z.string().min(1),
    templateKey: z.string().nullable().optional(),
    anchors: z.array(z.string()).optional().default([]),
    threadSummaries: z
      .array(
        z.object({
          id: z.string(),
          title: z.string(),
          summary: z.string(),
          status: z.string(),
        })
      )
      .default([]),
    documentSummaries: z
      .array(
        z.object({
          id: z.string(),
          title: z.string(),
          kind: z.string(),
          status: z.string(),
        })
      )
      .default([]),
    workspaceSummaries: z
      .array(
        z.object({
          id: z.string(),
          name: z.string(),
          bootstrapStatus: z.string(),
        })
      )
      .optional()
      .default([]),
    rootDocuments: z
      .array(
        z.object({
          id: z.string(),
          title: z.string(),
          kind: z.string(),
          status: z.string(),
        })
      )
      .optional()
      .default([]),
  }),
  messages: z.array(
    z.object({
      role: z.enum(["user", "assistant", "system"]),
      text: z.string(),
    })
  ),
});

function suggestsThread(userText: string): boolean {
  return /(every|daily|weekly|monitor|track|ongoing|long[- ]running|repeat|always|pipeline|workflow)/iu.test(
    userText
  );
}

function suggestsDocument(userText: string): boolean {
  return /(create|draft|write|agreement|contract|proposal|invoice|document|artifact|payment|report)/iu.test(
    userText
  );
}

function scopeGuardMessage(scopeType: "blink" | "workspace"): string {
  if (scopeType === "workspace") {
    return "I can only help inside this workspace's scope (its threads, documents, and anchors).";
  }
  return "I can help across root threads, workspaces, and root documents.";
}

function buildFallbackResponse(params: {
  scopeType: "blink" | "workspace";
  scopeName: string;
  userText: string;
}): string {
  const suggestions: string[] = [];
  if (suggestsThread(params.userText)) {
    suggestions.push("This sounds like ongoing work — create a thread so we can track it continuously.");
  }
  if (suggestsDocument(params.userText)) {
    suggestions.push("If you want a concrete artifact, create a document and I can help shape it.");
  }
  if (suggestions.length === 0) {
    suggestions.push(
      "I can answer questions now, and if this grows in scope we should convert it into a thread."
    );
  }

  return [
    `I'm ${params.scopeName}'s assistant.`,
    scopeGuardMessage(params.scopeType),
    ...suggestions,
    "I won't claim to change state unless you trigger a UI action.",
  ].join(" ");
}

function buildSystemPrompt(params: {
  scopeType: "blink" | "workspace";
  scopeName: string;
}): string {
  if (params.scopeType === "blink") {
    return [
      "You are Blink, the root assistant for the account scope.",
      "You can discuss root threads, workspaces, and root documents.",
      "Do not pretend you changed system state unless the user explicitly used a UI action.",
      "If the request implies long-running/repeated work, suggest creating a thread.",
      "If the request implies creating a concrete artifact, suggest creating a document.",
      "Keep answers concise and pragmatic.",
    ].join(" ");
  }

  return [
    `You are the assistant for workspace '${params.scopeName}'.`,
    "You only know this workspace's anchors, threads, and documents.",
    "Never claim to browse or modify other workspaces or root documents.",
    "Do not pretend you changed state unless the user triggered a UI action.",
    "If the request implies long-running/repeated work, suggest creating a workspace thread.",
    "If the request implies creating a concrete artifact, suggest creating a workspace document.",
    "Keep answers concise and pragmatic.",
  ].join(" ");
}

function buildPromptInput(body: z.infer<typeof requestSchema>): string {
  const latestMessages = body.messages.slice(-12);
  return [
    `scope.id: ${body.scope.id}`,
    `scope.type: ${body.scope.type}`,
    `scope.name: ${body.scope.name}`,
    `scope.templateKey: ${body.scope.templateKey ?? "none"}`,
    `scope.anchors: ${body.scope.anchors.join(", ") || "none"}`,
    `threads: ${JSON.stringify(body.scope.threadSummaries)}`,
    `documents: ${JSON.stringify(body.scope.documentSummaries)}`,
    `workspaces: ${JSON.stringify(body.scope.workspaceSummaries ?? [])}`,
    `rootDocuments: ${JSON.stringify(body.scope.rootDocuments ?? [])}`,
    `conversation: ${JSON.stringify(latestMessages)}`,
  ].join("\n");
}

export async function POST(request: Request) {
  try {
    const body = requestSchema.parse(await request.json());
    const userText = [...body.messages]
      .reverse()
      .find((message) => message.role === "user")
      ?.text.trim();

    if (!userText) {
      return NextResponse.json({
        ok: true,
        message: buildFallbackResponse({
          scopeType: body.scope.type,
          scopeName: body.scope.name,
          userText: "",
        }),
      });
    }

    const openAiApiKey = body.credentials.openAiApiKey.trim();
    if (!openAiApiKey) {
      return NextResponse.json({
        ok: true,
        message: buildFallbackResponse({
          scopeType: body.scope.type,
          scopeName: body.scope.name,
          userText,
        }),
      });
    }

    try {
      const generated = await generateTextWithResponsesApi({
        apiKey: openAiApiKey,
        model: OPENAI_TEXT_MODEL,
        systemPrompt: buildSystemPrompt({
          scopeType: body.scope.type,
          scopeName: body.scope.name,
        }),
        input: buildPromptInput(body),
      });

      const responseText = generated.text.trim();
      return NextResponse.json({
        ok: true,
        message:
          responseText.length > 0
            ? responseText
            : buildFallbackResponse({
                scopeType: body.scope.type,
                scopeName: body.scope.name,
                userText,
              }),
      });
    } catch {
      return NextResponse.json({
        ok: true,
        message: buildFallbackResponse({
          scopeType: body.scope.type,
          scopeName: body.scope.name,
          userText,
        }),
      });
    }
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
