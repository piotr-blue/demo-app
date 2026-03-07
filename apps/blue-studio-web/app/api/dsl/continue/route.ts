import { NextResponse } from "next/server";
import { z } from "zod";
import { getBlueprintToJsDslPrompt } from "@/lib/prompts/load-prompts";
import {
  countInputTokens,
  generateTextWithResponsesApi,
} from "@/lib/openai/client";
import { assertWithinTokenBudget } from "@/lib/openai/token-meter";
import { extractDslCodeBlock } from "@/lib/prompt/dsl-extractor";
import { compileDslModule } from "@/lib/dsl/compile-harness";
import { extractChannelBindingsFromStructure } from "@/lib/dsl/channel-extraction";
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

function fallbackDslForKnownBlueprint(blueprint: string): string | null {
  if (!/counter/i.test(blueprint)) {
    return null;
  }

  return `
import { DocBuilder, BasicBlueTypes } from '@blue-labs/sdk-dsl';

export function buildDocument() {
  return DocBuilder.doc()
    .name('Counter')
    .field('/counter', 0)
    .channel('ownerChannel', { type: 'MyOS/MyOS Timeline Channel' })
    .operation('increment', 'ownerChannel', BasicBlueTypes.Integer, 'Increment counter', (steps) =>
      steps.replaceExpression(
        'IncrementCounter',
        '/counter',
        "document('/counter') + event.message.request",
      ),
    )
    .operation('reset', 'ownerChannel', 'Reset counter', (steps) =>
      steps.replaceValue('ResetCounter', '/counter', 0),
    )
    .buildDocument();
}
`.trim();
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

    const code = extractDslCodeBlock(generated.text);

    try {
      const compiled = await compileDslModule(code);
      const bindings = extractChannelBindingsFromStructure({
        structure: compiled.structure,
        accountId: credentials.myOsAccountId,
      });
      return NextResponse.json({
        ok: true,
        repaired: false,
        dsl: code,
        inputTokens,
        structure: compiled.structure,
        documentJson: compiled.documentJson,
        bindings,
      });
    } catch (compileError) {
      const repairInput = [
        "Blueprint:",
        body.blueprint,
        "",
        "Broken DSL:",
        code,
        "",
        "Compile/runtime error:",
        safeErrorMessage(compileError),
        "",
        "Return fixed DSL as one TypeScript fenced code block only.",
      ].join("\n");

      try {
        const repaired = await generateTextWithResponsesApi({
          apiKey: credentials.openAiApiKey,
          systemPrompt: prompt,
          input: repairInput,
        });

        const repairedCode = extractDslCodeBlock(repaired.text);
        const repairedCompiled = await compileDslModule(repairedCode);
        const bindings = extractChannelBindingsFromStructure({
          structure: repairedCompiled.structure,
          accountId: credentials.myOsAccountId,
        });

        return NextResponse.json({
          ok: true,
          repaired: true,
          fallback: false,
          dsl: repairedCode,
          inputTokens,
          structure: repairedCompiled.structure,
          documentJson: repairedCompiled.documentJson,
          bindings,
        });
      } catch (repairError) {
        const fallbackDsl = fallbackDslForKnownBlueprint(body.blueprint);
        if (!fallbackDsl) {
          throw repairError;
        }

        const fallbackCompiled = await compileDslModule(fallbackDsl);
        const bindings = extractChannelBindingsFromStructure({
          structure: fallbackCompiled.structure,
          accountId: credentials.myOsAccountId,
        });

        return NextResponse.json({
          ok: true,
          repaired: true,
          fallback: true,
          dsl: fallbackDsl,
          inputTokens,
          structure: fallbackCompiled.structure,
          documentJson: fallbackCompiled.documentJson,
          bindings,
        });
      }
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
