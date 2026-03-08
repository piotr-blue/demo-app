import { NextResponse } from "next/server";
import { createHash } from "node:crypto";
import { z } from "zod";
import { parseRouteCredentials } from "@/lib/api/credentials";
import {
  countInputTokens,
  generateTextWithResponsesApi,
} from "@/lib/openai/client";
import { assertWithinTokenBudget } from "@/lib/openai/token-meter";
import { getDocumentStatusTemplatesPrompt } from "@/lib/prompts/load-prompts";
import { parseStatusTemplateBundle } from "@/lib/document/status-templates/parser";
import { safeErrorMessage } from "@/lib/security/redact";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const requestSchema = z.object({
  credentials: z.unknown(),
  blueprint: z.string().min(1),
  viewer: z.string().min(1),
});

function buildInput(blueprint: string, viewer: string): string {
  return [`BLUEPRINT:`, blueprint, "", "VIEWER:", viewer].join("\n");
}

function hashBlueprint(blueprint: string): string {
  return createHash("sha256").update(blueprint).digest("hex");
}

export async function POST(request: Request) {
  try {
    const body = requestSchema.parse(await request.json());
    const credentials = parseRouteCredentials(body.credentials);
    const systemPrompt = await getDocumentStatusTemplatesPrompt();
    const input = buildInput(body.blueprint, body.viewer);

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

    const bundle = parseStatusTemplateBundle({
      raw: generated.text,
      blueprintHash: hashBlueprint(body.blueprint),
      generatedAt: new Date().toISOString(),
    });

    return NextResponse.json({
      ok: true,
      bundle: {
        ...bundle,
        viewer: body.viewer,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: safeErrorMessage(error) },
      { status: 400 }
    );
  }
}

