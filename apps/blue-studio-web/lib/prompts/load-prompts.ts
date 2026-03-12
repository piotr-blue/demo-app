import { readFile } from "node:fs/promises";
import path from "node:path";

let architectPromptCache: string | null = null;
let dslPromptCache: string | null = null;
let documentStatusTemplatesPromptCache: string | null = null;
let documentQaPromptCache: string | null = null;
let documentReferenceRendererPromptCache: string | null = null;

function shouldBypassPromptCache(): boolean {
  return process.env.NODE_ENV !== "production";
}

function promptCandidates(fileName: string): string[] {
  return [
    path.join(process.cwd(), "lib", "prompts", fileName),
    path.join(process.cwd(), "apps", "blue-studio-web", "lib", "prompts", fileName),
  ];
}

async function readPrompt(fileName: string): Promise<string> {
  for (const candidate of promptCandidates(fileName)) {
    try {
      return await readFile(candidate, "utf8");
    } catch {
      // try next candidate
    }
  }

  throw new Error(
    `Prompt file '${fileName}' was not found in runtime bundle. Ensure lib/prompts/*.md is included in output tracing.`
  );
}

export async function getBlueprintArchitectPrompt(): Promise<string> {
  if (shouldBypassPromptCache()) {
    return readPrompt("blueprint-architect-prompt.md");
  }
  if (architectPromptCache) {
    return architectPromptCache;
  }
  architectPromptCache = await readPrompt("blueprint-architect-prompt.md");
  return architectPromptCache;
}

export async function getBlueprintToJsDslPrompt(): Promise<string> {
  if (shouldBypassPromptCache()) {
    return readPrompt("blueprint-to-js-dsl-prompt.md");
  }
  if (dslPromptCache) {
    return dslPromptCache;
  }
  dslPromptCache = await readPrompt("blueprint-to-js-dsl-prompt.md");
  return dslPromptCache;
}

export async function getDocumentStatusTemplatesPrompt(): Promise<string> {
  if (shouldBypassPromptCache()) {
    return readPrompt("document-status-templates-prompt.md");
  }
  if (documentStatusTemplatesPromptCache) {
    return documentStatusTemplatesPromptCache;
  }
  documentStatusTemplatesPromptCache = await readPrompt(
    "document-status-templates-prompt.md"
  );
  return documentStatusTemplatesPromptCache;
}

export async function getDocumentQaPrompt(): Promise<string> {
  if (shouldBypassPromptCache()) {
    return readPrompt("document-qa-prompt.md");
  }
  if (documentQaPromptCache) {
    return documentQaPromptCache;
  }
  documentQaPromptCache = await readPrompt("document-qa-prompt.md");
  return documentQaPromptCache;
}

export async function getDocumentReferenceRendererPrompt(): Promise<string> {
  if (shouldBypassPromptCache()) {
    return readPrompt("document-reference-renderer-prompt.md");
  }
  if (documentReferenceRendererPromptCache) {
    return documentReferenceRendererPromptCache;
  }
  documentReferenceRendererPromptCache = await readPrompt(
    "document-reference-renderer-prompt.md"
  );
  return documentReferenceRendererPromptCache;
}
