import { readFile } from "node:fs/promises";
import path from "node:path";

let architectPromptCache: string | null = null;
let dslPromptCache: string | null = null;

function promptPath(fileName: string): string {
  return path.join(process.cwd(), "lib", "prompts", fileName);
}

export async function getBlueprintArchitectPrompt(): Promise<string> {
  if (architectPromptCache) {
    return architectPromptCache;
  }
  architectPromptCache = await readFile(
    promptPath("blueprint-architect-prompt.md"),
    "utf8"
  );
  return architectPromptCache;
}

export async function getBlueprintToJsDslPrompt(): Promise<string> {
  if (dslPromptCache) {
    return dslPromptCache;
  }
  dslPromptCache = await readFile(promptPath("blueprint-to-js-dsl-prompt.md"), "utf8");
  return dslPromptCache;
}
