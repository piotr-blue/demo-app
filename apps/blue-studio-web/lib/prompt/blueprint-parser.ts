export type BlueprintModelState = "questions" | "ready" | "unknown";

export interface BlueprintParseResult {
  state: BlueprintModelState;
  raw: string;
  question: string | null;
  blueprint: string | null;
}

export function parseBlueprintResponse(raw: string): BlueprintParseResult {
  const lines = raw.split(/\r?\n/);
  const stateLine = lines.find((line) => line.trim().toUpperCase().startsWith("STATE:"));
  const stateValue = stateLine?.split(":").slice(1).join(":").trim().toLowerCase();

  const state: BlueprintModelState =
    stateValue === "questions" || stateValue === "ready" ? stateValue : "unknown";

  if (state === "questions") {
    const questionLine = lines.find((line) => line.trim().toUpperCase().startsWith("QUESTION:"));
    if (questionLine) {
      const question = questionLine.split(":").slice(1).join(":").trim();
      return { state, raw, question: question || null, blueprint: null };
    }
    const fallbackQuestion = lines.find((line) => line.trim() && !line.trim().toUpperCase().startsWith("STATE:"));
    return { state, raw, question: fallbackQuestion?.trim() ?? null, blueprint: null };
  }

  if (state === "ready") {
    return {
      state,
      raw,
      question: null,
      blueprint: raw.trim(),
    };
  }

  return {
    state: "unknown",
    raw,
    question: null,
    blueprint: null,
  };
}
