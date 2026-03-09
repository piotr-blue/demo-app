function readRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }
  return value as Record<string, unknown>;
}

function readString(value: unknown): string | null {
  return typeof value === "string" && value.trim().length > 0 ? value : null;
}

function readNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function collectFirstString(value: unknown, keys: string[]): string | null {
  const queue: unknown[] = [value];
  while (queue.length > 0) {
    const current = queue.shift();
    const record = readRecord(current);
    if (!record) {
      continue;
    }
    for (const key of keys) {
      const found = readString(record[key]);
      if (found) {
        return found;
      }
    }
    queue.push(...Object.values(record));
  }
  return null;
}

function collectFirstNumber(value: unknown, keys: string[]): number | null {
  const queue: unknown[] = [value];
  while (queue.length > 0) {
    const current = queue.shift();
    const record = readRecord(current);
    if (!record) {
      continue;
    }
    for (const key of keys) {
      const found = readNumber(record[key]);
      if (found !== null) {
        return found;
      }
    }
    queue.push(...Object.values(record));
  }
  return null;
}

export function extractWebhookInvalidation(payload: unknown): {
  sessionId: string | null;
  eventId: string | null;
  epoch: number | null;
} {
  return {
    sessionId: collectFirstString(payload, [
      "sessionId",
      "targetSessionId",
      "documentSessionId",
      "ref",
    ]),
    eventId: collectFirstString(payload, ["eventId", "id", "uid"]),
    epoch: collectFirstNumber(payload, ["epoch", "documentEpoch"]),
  };
}
