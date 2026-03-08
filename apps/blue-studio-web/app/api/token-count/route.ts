import { NextResponse } from "next/server";
import { z } from "zod";
import { countInputTokens } from "@/lib/openai/client";
import { safeErrorMessage } from "@/lib/security/redact";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const requestSchema = z.object({
  apiKey: z.string().min(1),
  systemPrompt: z.string().min(1),
  input: z.string().min(1),
});

export async function POST(request: Request) {
  try {
    const body = requestSchema.parse(await request.json());
    const inputTokens = await countInputTokens(body);
    return NextResponse.json({ inputTokens });
  } catch (error) {
    return NextResponse.json(
      { error: safeErrorMessage(error) },
      { status: 400 }
    );
  }
}
