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
  sessionId: z.string().min(1),
});

function addCanonicalReferenceHeader(params: {
  text: string;
  sessionId?: string;
  threadTitle?: string;
}): string {
  const normalizedSessionId = params.sessionId?.trim();
  const normalizedName = params.threadTitle?.trim();
  const hasSessionId = /^\s*sessionId\s*:/im.test(params.text);
  const hasName = /^\s*name\s*:/im.test(params.text);

  const headerLines: string[] = [];
  if (normalizedSessionId && !hasSessionId) {
    headerLines.push(`sessionId: ${normalizedSessionId}`);
  }
  if (normalizedName && !hasName) {
    headerLines.push(`name: ${normalizedName}`);
  }

  if (headerLines.length === 0) {
    return params.text;
  }

  return `${headerLines.join("\n")}\n${params.text}`;
}

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
    const canonicalText = addCanonicalReferenceHeader({
      text,
      sessionId: body.sessionId,
      threadTitle: body.threadTitle,
    });

    const fileName = inferDocumentReferenceFileName({
      sourceType,
      threadTitle: body.threadTitle,
      sessionId: body.sessionId,
    });
    const contextLabel = contextLabelForSourceType(sourceType);

    return NextResponse.json({
      ok: true,
      fileName,
      text: canonicalText,
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
