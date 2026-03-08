import { NextResponse } from "next/server";
import { z } from "zod";
import { parseRouteCredentials } from "@/lib/api/credentials";
import {
  countInputTokens,
  generateTextWithResponsesApi,
} from "@/lib/openai/client";
import { assertWithinTokenBudget } from "@/lib/openai/token-meter";
import { getDocumentQaPrompt } from "@/lib/prompts/load-prompts";
import { buildDocumentQaInput } from "@/lib/document/qa/build-input";
import type { DocumentQaMode } from "@/lib/workspace/types";
import { safeErrorMessage } from "@/lib/security/redact";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const requestSchema = z.object({
  credentials: z.unknown(),
  blueprint: z.string().min(1),
  viewer: z.string().min(1),
  question: z.string().min(1),
  state: z.unknown().nullable(),
  allowedOperations: z.array(z.string()).optional(),
});

export async function POST(request: Request) {
  try {
    const body = requestSchema.parse(await request.json());
    const credentials = parseRouteCredentials(body.credentials);
    const systemPrompt = await getDocumentQaPrompt();
    const input = buildDocumentQaInput({
      blueprint: body.blueprint,
      viewer: body.viewer,
      question: body.question,
      state: body.state,
      allowedOperations: body.allowedOperations,
    });
    const mode: DocumentQaMode = body.state === null ? "blueprint-only" : "live-state";

    const inputTokens = await countInputTokens({
      apiKey: credentials.openAiApiKey,
      systemPrompt,
      input,
    });
    assertWithinTokenBudget(inputTokens);

    const generated = await generateTextWithResponsesApi({
      apiKey: credentials.openAiApiKey,
      systemPrompt,
      input,
    });

    return NextResponse.json({
      ok: true,
      answer: generated.text.trim(),
      mode,
    });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: safeErrorMessage(error) },
      { status: 400 }
    );
  }
}

