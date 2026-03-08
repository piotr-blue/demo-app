const MAX_GPT_54_CONTEXT_TOKENS = 1_000_000;
const SOFT_LIMIT_BUFFER = 2_000;

export function assertWithinTokenBudget(inputTokens: number): void {
  const hardLimit = MAX_GPT_54_CONTEXT_TOKENS - SOFT_LIMIT_BUFFER;
  if (inputTokens > hardLimit) {
    throw new Error(
      `Input exceeds model context budget (${inputTokens} > ${hardLimit}). Remove files or split the task.`
    );
  }
}
