import { NextResponse } from "next/server";
import { extractFileText } from "@/lib/files/extract";
import { safeErrorMessage } from "@/lib/security/redact";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Missing file." }, { status: 400 });
    }

    const bytes = Buffer.from(await file.arrayBuffer());
    const extracted = await extractFileText({
      fileName: file.name,
      mimeType: file.type,
      bytes,
    });

    return NextResponse.json({
      fileName: file.name,
      mimeType: file.type,
      size: file.size,
      ...extracted,
    });
  } catch (error) {
    return NextResponse.json(
      { error: safeErrorMessage(error) },
      { status: 500 }
    );
  }
}
