import { NextResponse } from "next/server";
import { z } from "zod";
import { getBlueprintToJsDslPrompt } from "@/lib/prompts/load-prompts";
import {
  countInputTokens,
  generateTextWithResponsesApi,
} from "@/lib/openai/client";
import { assertWithinTokenBudget } from "@/lib/openai/token-meter";
import { extractDslCodeBlock } from "@/lib/prompt/dsl-extractor";
import { parseRouteCredentials } from "@/lib/api/credentials";
import { safeErrorMessage } from "@/lib/security/redact";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const attachmentSchema = z.object({
  id: z.string(),
  name: z.string(),
  contextLabel: z.string(),
  extractedText: z.string(),
});

const requestSchema = z.object({
  credentials: z.unknown(),
  blueprint: z.string().min(1),
  attachments: z.array(attachmentSchema).default([]),
});

function buildDslInput(blueprint: string, attachments: z.infer<typeof attachmentSchema>[]): string {
  const context =
    attachments.length === 0
      ? "No file context supplied."
      : attachments
          .map(
            (attachment) =>
              `=== FILE: ${attachment.name} (${attachment.contextLabel}) ===\n${attachment.extractedText}`
          )
          .join("\n\n");

  return `BLUEPRINT:\n${blueprint}\n\nCONTEXT:\n${context}`;
}

export async function POST(request: Request) {
  try {
    const body = requestSchema.parse(await request.json());
    const credentials = parseRouteCredentials(body.credentials);
    const prompt = await getBlueprintToJsDslPrompt();
    const dslInput = buildDslInput(body.blueprint, body.attachments);

    const inputTokens = await countInputTokens({
      apiKey: credentials.openAiApiKey,
      systemPrompt: prompt,
      input: dslInput,
    });
    assertWithinTokenBudget(inputTokens);

    const generated = await generateTextWithResponsesApi({
      apiKey: credentials.openAiApiKey,
      systemPrompt: prompt,
      input: dslInput,
    });

    const dsl = extractDslCodeBlock(generated.text);
    return NextResponse.json({
      ok: true,
      dsl,
      inputTokens,
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
