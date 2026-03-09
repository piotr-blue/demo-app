export interface BuildDocumentQaInputParams {
  blueprint: string;
  viewer: string | null;
  question: string;
  state: unknown | null;
  allowedOperations?: string[];
}

function stableJson(value: unknown): string {
  return JSON.stringify(value, null, 2);
}

export function buildDocumentQaInput(params: BuildDocumentQaInputParams): string {
  const resolvedViewer =
    typeof params.viewer === "string" && params.viewer.trim().length > 0
      ? params.viewer.trim()
      : "neutral";

  const modeInstruction =
    params.state === null
      ? "STATE is null because the document has not been bootstrapped yet; answer from the blueprint only and say live state is not available yet."
      : "STATE is available; answer using blueprint semantics and current live state.";

  const operations =
    params.allowedOperations && params.allowedOperations.length > 0
      ? params.allowedOperations.join(", ")
      : "none";

  return [
    "BLUEPRINT:",
    params.blueprint,
    "",
    "VIEWER:",
    resolvedViewer,
    "",
    "QUESTION:",
    params.question,
    "",
    "STATE:",
    params.state === null ? "null" : stableJson(params.state),
    "",
    "OPTIONAL_HINTS:",
    `allowedOperations: ${operations}`,
    modeInstruction,
  ].join("\n");
}

