import { NextResponse } from "next/server";
import { z } from "zod";
import { compileDslModule } from "@/lib/dsl/compile-harness";
import { safeErrorMessage } from "@/lib/security/redact";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const requestSchema = z.object({
  code: z.string().min(1),
  accountId: z.string().min(1).optional(),
});

export async function POST(request: Request) {
  try {
    const body = requestSchema.parse(await request.json());
    const compiled = await compileDslModule(body.code);
    return NextResponse.json({
      ok: true,
      code: compiled.code,
      documentJson: compiled.documentJson,
      structure: compiled.structure,
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
