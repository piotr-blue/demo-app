import { compactJson } from './live-debug.js';

export interface PollOptions {
  readonly timeoutMs?: number;
  readonly intervalMs?: number;
  readonly label?: string;
}

const DEFAULT_TIMEOUT_MS = 45_000;
const DEFAULT_INTERVAL_MS = 1_000;

export async function pollUntil<T>(
  probe: () => Promise<T | undefined>,
  options: PollOptions = {},
): Promise<T> {
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const intervalMs = options.intervalMs ?? DEFAULT_INTERVAL_MS;
  const label = options.label ?? 'pollUntil';
  const startedAt = Date.now();
  const deadline = startedAt + timeoutMs;

  let attempt = 0;
  let lastError: unknown;

  while (Date.now() < deadline) {
    attempt += 1;
    try {
      const result = await probe();
      if (result !== undefined) {
        return result;
      }
      lastError = undefined;
    } catch (error) {
      lastError = error;
    }
    await sleep(intervalMs);
  }

  const elapsed = Date.now() - startedAt;
  const lastErrorMessage = lastError
    ? ` lastError=${compactJson(
        lastError instanceof Error
          ? { message: lastError.message, stack: lastError.stack }
          : lastError,
      )}`
    : '';
  throw new Error(
    `${label} timed out after ${elapsed}ms (${attempt} attempts).${lastErrorMessage}`,
  );
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}
