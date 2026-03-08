import pdfParse from "pdf-parse";
import mammoth from "mammoth";

function decodeText(buffer: Buffer): string {
  const utf8 = buffer.toString("utf8");
  if (utf8.includes("\u0000")) {
    return "";
  }
  return utf8;
}

export interface ExtractedFileResult {
  extractedText: string;
  contextLabel: string;
}

export async function extractFileText(input: {
  fileName: string;
  mimeType: string;
  bytes: Buffer;
}): Promise<ExtractedFileResult> {
  const lowerName = input.fileName.toLowerCase();
  const type = input.mimeType.toLowerCase();

  if (type.includes("pdf") || lowerName.endsWith(".pdf")) {
    const parsed = await pdfParse(input.bytes);
    return {
      extractedText: parsed.text.trim(),
      contextLabel: "extracted text",
    };
  }

  if (
    type.includes("wordprocessingml") ||
    lowerName.endsWith(".docx") ||
    lowerName.endsWith(".doc")
  ) {
    const parsed = await mammoth.extractRawText({ buffer: input.bytes });
    return {
      extractedText: parsed.value.trim(),
      contextLabel: "extracted text",
    };
  }

  return {
    extractedText: decodeText(input.bytes).trim(),
    contextLabel: "exact text",
  };
}
