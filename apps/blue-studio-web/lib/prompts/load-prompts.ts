import { readFile } from "node:fs/promises";
import path from "node:path";

let architectPromptCache: string | null = null;
let dslPromptCache: string | null = null;

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
  if (architectPromptCache) {
    return architectPromptCache;
  }
  architectPromptCache = await readPrompt("blueprint-architect-prompt.md");
  return architectPromptCache;
}

export async function getBlueprintToJsDslPrompt(): Promise<string> {
  if (dslPromptCache) {
    return dslPromptCache;
  }
  dslPromptCache = await readPrompt("blueprint-to-js-dsl-prompt.md");
  return dslPromptCache;
}
