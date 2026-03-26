import { NextResponse } from "next/server";
import { z } from "zod";
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
  userInput: z.string().min(1),
});

function buildSystemPrompt(): string {
  return [
    "You are Blink, the assistant for the user’s live MyOS account.",
    "You must ALWAYS reply with exactly one JSON object and nothing else.",
    "Do not use markdown fences.",
    "Do not write commentary outside JSON.",
    "",
    "Return one of these shapes only:",
    '{"t":"ans","c":"..."}',
    '{"t":"more","q":"..."}',
    '{"t":"doc","summ":"...","doc":{"name":"...","description":"..."}}',
    "",
    "Rules:",
    "1. If the user is asking a normal question, return `ans`.",
    "2. If the user wants to create a document and either the name or description is missing, return `more` with exactly one concise follow-up question.",
    "3. If the user wants to create a document and both name and description are known from the current message and/or prior conversation context, return `doc`.",
    "4. Never invent a missing document name or description.",
    "5. Use prior Q/A context from this exchange when deciding what is already known.",
    "6. Keep the response concise.",
    "7. Prefer the user’s language.",
    "8. Output valid JSON only.",
    "9. Start the JSON with the `t` field.",
  ].join("\n");
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

  return JSON.stringify(
    {
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
    const encoder = new TextEncoder();

    const stream = new ReadableStream<Uint8Array>({
      async start(controller) {
        let finalText = "";
        try {
          controller.enqueue(encoder.encode(toSseEvent("start", { ok: true })));
          await streamTextWithResponsesApi({
            apiKey: body.credentials.openAiApiKey.trim(),
            model: OPENAI_TEXT_MODEL,
            systemPrompt: buildSystemPrompt(),
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
