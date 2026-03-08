import { describe, it } from 'vitest';
import type { LiveGate } from './live-env.js';

export function describeLive(
  title: string,
  gate: LiveGate,
  suite: () => void,
): void {
  const suiteTitle = gate.enabled
    ? title
    : `${title} [live skipped: ${gate.reason ?? 'gate disabled'}]`;
  if (gate.enabled) {
    describe(suiteTitle, suite);
    return;
  }
  describe.skip(suiteTitle, suite);
}

export function itLive(
  title: string,
  gate: LiveGate,
  testFn: () => Promise<void> | void,
  timeoutMs = 120_000,
): void {
  const testTitle = gate.enabled
    ? title
    : `${title} [live skipped: ${gate.reason ?? 'gate disabled'}]`;
  if (gate.enabled) {
    it(testTitle, testFn, timeoutMs);
    return;
  }
  it.skip(testTitle, testFn, timeoutMs);
}
