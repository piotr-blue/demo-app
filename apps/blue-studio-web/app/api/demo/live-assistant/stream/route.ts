import { NextResponse } from "next/server";
import { z } from "zod";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import {
  OPENAI_TEXT_MODEL,
  streamTextWithResponsesApi,
} from "@/lib/openai/client";
import { parseLiveAssistantTurn } from "@/lib/demo/live-assistant-protocol";
import { safeErrorMessage } from "@/lib/security/redact";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const documentSummarySchema = z.object({
  id: z.string(),
  title: z.string(),
  summary: z.string(),
  status: z.string(),
});

const conversationMessageSchema = z.object({
  role: z.enum(["assistant", "user", "system"]),
  body: z.string(),
  createdAt: z.string(),
});

const anchorSummarySchema = z.object({
  key: z.string(),
  label: z.string(),
  purpose: z.string().optional().default(""),
});

const conversationDocSummarySchema = z.object({
  id: z.string(),
  kind: z.string(),
  title: z.string(),
  summary: z.string(),
  fields: z.record(z.string()).optional().default({}),
  anchors: z.array(anchorSummarySchema).optional().default([]),
});

const requestSchema = z.object({
  credentials: z.object({
    openAiApiKey: z.string().min(1),
  }),
  account: z.object({
    id: z.string().min(1),
    name: z.string().min(1),
    mode: z.literal("live"),
  }),
  target: z.object({
    type: z.enum(["home", "document"]),
    id: z.string().min(1),
    title: z.string().min(1),
  }),
  conversation: z.object({
    id: z.string().min(1),
    exchangeId: z.string().min(1),
    messages: z.array(conversationMessageSchema).default([]),
  }),
  liveDocuments: z.array(documentSummarySchema).default([]),
  documentContext: z
    .object({
      currentDocument: conversationDocSummarySchema,
      recentMessages: z.array(conversationMessageSchema).default([]),
    })
    .nullable()
    .optional()
    .default(null),
  userInput: z.string().min(1),
});

let promptCache: string | null = null;

async function loadSystemPrompt(): Promise<string> {
  if (promptCache) {
    return promptCache;
  }
  const promptPath = join(process.cwd(), "lib/prompts/blink-live-doc-creation-prompt.md");
  promptCache = await readFile(promptPath, "utf-8");
  return promptCache;
}

function buildPromptInput(body: z.infer<typeof requestSchema>): string {
  const compactDocs = body.liveDocuments
    .slice(0, 20)
    .map((document) => ({
      id: document.id,
      title: document.title,
      summary: document.summary,
      status: document.status,
    }));
  const recentMessages = body.conversation.messages.slice(-20).map((message) => ({
    role: message.role,
    body: message.body,
    createdAt: message.createdAt,
  }));

  const mode = body.target.type === "document" ? "DOCUMENT" : "ROOT";

  return JSON.stringify(
    {
      operatingMode: mode,
      account: {
        id: body.account.id,
        name: body.account.name,
        mode: body.account.mode,
      },
      target: body.target,
      conversation: {
        id: body.conversation.id,
        exchangeId: body.conversation.exchangeId,
        messages: recentMessages,
      },
      context: {
        rootMode: {
          liveDocuments: compactDocs,
        },
        documentMode: body.documentContext,
      },
      liveDocuments: compactDocs,
      userInput: body.userInput,
    },
    null,
    2
  );
}

function toSseEvent(type: string, data: Record<string, unknown>): string {
  return `event: ${type}\ndata: ${JSON.stringify(data)}\n\n`;
}

export async function POST(request: Request) {
  try {
    const body = requestSchema.parse(await request.json());
    const systemPrompt = await loadSystemPrompt();
    const encoder = new TextEncoder();

    const stream = new ReadableStream<Uint8Array>({
      async start(controller) {
        let finalText = "";
        try {
          controller.enqueue(encoder.encode(toSseEvent("start", { ok: true })));
          await streamTextWithResponsesApi({
            apiKey: body.credentials.openAiApiKey.trim(),
            model: OPENAI_TEXT_MODEL,
            systemPrompt,
            input: buildPromptInput(body),
            onDelta: (delta) => {
              finalText += delta;
              controller.enqueue(encoder.encode(toSseEvent("delta", { delta })));
            },
          });

          const parsed = parseLiveAssistantTurn(finalText);
          controller.enqueue(
            encoder.encode(
              toSseEvent("final", {
                turn: parsed,
                raw: finalText.trim(),
              })
            )
          );
        } catch (error) {
          controller.enqueue(
            encoder.encode(
              toSseEvent("error", {
                error: safeErrorMessage(error),
              })
            )
          );
        } finally {
          controller.enqueue(encoder.encode(toSseEvent("done", { ok: true })));
          controller.close();
        }
      },
    });

    return new Response(stream, {
      status: 200,
      headers: {
        "content-type": "text/event-stream; charset=utf-8",
        "cache-control": "no-cache, no-transform",
        connection: "keep-alive",
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
