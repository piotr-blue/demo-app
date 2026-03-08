import { z } from "zod";
import type { UIMessage } from "ai";
import { buildBlueprintEnvelope } from "@/lib/prompt/envelope";
import { parseBlueprintResponse } from "@/lib/prompt/blueprint-parser";
import { getBlueprintArchitectPrompt } from "@/lib/prompts/load-prompts";
import {
  countInputTokens,
  generateTextWithResponsesApi,
} from "@/lib/openai/client";
import { assertWithinTokenBudget } from "@/lib/openai/token-meter";
import { parseRouteCredentials } from "@/lib/api/credentials";
import { respondWithAssistantTextAndData } from "@/lib/chat/stream";
import { safeErrorMessage } from "@/lib/security/redact";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const attachmentSchema = z.object({
  id: z.string(),
  name: z.string(),
  mimeType: z.string(),
  size: z.number(),
  contextLabel: z.string(),
  extractedText: z.string(),
  createdAt: z.string(),
});

const qaSchema = z.object({
  question: z.string(),
  answer: z.string(),
});

const requestSchema = z.object({
  messages: z.array(z.unknown()),
  credentials: z.unknown(),
  attachments: z.array(attachmentSchema).default([]),
  qaPairs: z.array(qaSchema).default([]),
  currentBlueprint: z.string().nullable().optional(),
});

export async function POST(request: Request): Promise<Response> {
  try {
    const body = requestSchema.parse(await request.json());
    const credentials = parseRouteCredentials(body.credentials);
    const messages = body.messages as UIMessage[];

    const systemPrompt = await getBlueprintArchitectPrompt();
    const envelope = buildBlueprintEnvelope({
      messages,
      attachments: body.attachments,
      qaPairs: body.qaPairs,
      currentBlueprint: body.currentBlueprint,
    });

    const inputTokens = await countInputTokens({
      apiKey: credentials.openAiApiKey,
      systemPrompt,
      input: envelope,
    });
    assertWithinTokenBudget(inputTokens);

    const generated = await generateTextWithResponsesApi({
      apiKey: credentials.openAiApiKey,
      systemPrompt,
      input: envelope,
    });

    const parsed = parseBlueprintResponse(generated.text);

    if (parsed.state === "questions") {
      return respondWithAssistantTextAndData({
        text: parsed.question ?? "Could you clarify your request?",
        dataChunks: [
          {
            type: "data-blueprint-question",
            data: {
              question: parsed.question ?? "Could you clarify your request?",
              tokenCount: inputTokens,
            },
          },
        ],
      });
    }

    if (parsed.state === "ready") {
      return respondWithAssistantTextAndData({
        text: parsed.raw,
        dataChunks: [
          {
            type: "data-blueprint-ready",
            data: {
              blueprint: parsed.blueprint ?? parsed.raw,
              tokenCount: inputTokens,
            },
          },
        ],
      });
    }

    return respondWithAssistantTextAndData({
      text: parsed.raw,
      dataChunks: [
        {
          type: "data-blueprint-unknown",
          data: {
            tokenCount: inputTokens,
          },
        },
      ],
    });
  } catch (error) {
    return respondWithAssistantTextAndData({
      text: `I hit an error while generating the blueprint: ${safeErrorMessage(error)}`,
      dataChunks: [
        {
          type: "data-blueprint-error",
          data: {
            message: safeErrorMessage(error),
          },
        },
      ],
      status: 200,
    });
  }
}
