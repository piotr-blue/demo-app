import { NextResponse } from "next/server";
import { z } from "zod";
import { parseRouteCredentials } from "@/lib/api/credentials";
import {
  OPENAI_TEXT_MODEL,
  countInputTokens,
  generateTextWithResponsesApi,
} from "@/lib/openai/client";
import { assertWithinTokenBudget } from "@/lib/openai/token-meter";
import { getDocumentReferenceRendererPrompt } from "@/lib/prompts/load-prompts";
import {
  buildDocumentReferencePromptInput,
  contextLabelForSourceType,
  inferDocumentReferenceFileName,
  type DocumentReferenceSourceType,
} from "@/lib/document/reference/reference";
import { safeErrorMessage } from "@/lib/security/redact";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const requestSchema = z.object({
  credentials: z.unknown(),
  sourceType: z.enum(["blueprint", "yaml", "live-json-fallback"]),
  content: z.string().min(1),
  threadTitle: z.string().optional(),
  sessionId: z.string().optional(),
});

export async function POST(request: Request) {
  try {
    const body = requestSchema.parse(await request.json());
    const credentials = parseRouteCredentials(body.credentials);
    const sourceType = body.sourceType as DocumentReferenceSourceType;
    const systemPrompt = await getDocumentReferenceRendererPrompt();
    const input = buildDocumentReferencePromptInput({
      sourceType,
      content: body.content,
    });

    const inputTokens = await countInputTokens({
      apiKey: credentials.openAiApiKey,
      systemPrompt,
      input,
      model: OPENAI_TEXT_MODEL,
    });
    assertWithinTokenBudget(inputTokens);

    const generated = await generateTextWithResponsesApi({
      apiKey: credentials.openAiApiKey,
      systemPrompt,
      input,
      model: OPENAI_TEXT_MODEL,
    });

    const text = generated.text.trim();
    if (!text) {
      throw new Error("Document reference renderer returned empty text.");
    }

    const fileName = inferDocumentReferenceFileName({
      sourceType,
      threadTitle: body.threadTitle,
      sessionId: body.sessionId,
    });
    const contextLabel = contextLabelForSourceType(sourceType);

    return NextResponse.json({
      ok: true,
      fileName,
      text,
      contextLabel,
      sourceMeta: {
        sourceType,
        renderedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: safeErrorMessage(error) },
      { status: 400 }
    );
  }
}
