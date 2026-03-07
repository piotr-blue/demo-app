const CODE_BLOCK_REGEX = /```(?:ts|typescript)\s*([\s\S]*?)```/i;

export function extractDslCodeBlock(text: string): string {
  const match = text.match(CODE_BLOCK_REGEX);
  if (!match || !match[1]) {
    throw new Error("Model response did not include a TypeScript code block.");
  }
  return match[1].trim();
}
