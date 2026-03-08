import { createHash } from "node:crypto";

function stableStringify(value: unknown): string {
  if (value === null || typeof value !== "object") {
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) {
    return `[${value.map((entry) => stableStringify(entry)).join(",")}]`;
  }
  const entries = Object.entries(value as Record<string, unknown>).sort(([left], [right]) =>
    left.localeCompare(right)
  );
  return `{${entries
    .map(([key, nested]) => `${JSON.stringify(key)}:${stableStringify(nested)}`)
    .join(",")}}`;
}

export function buildDocumentFingerprint(input: {
  blueprintHash: string | null;
  viewer: string | null;
  document: unknown;
}): string {
  return createHash("sha256")
    .update(JSON.stringify(input.blueprintHash ?? ""))
    .update("|")
    .update(JSON.stringify(input.viewer ?? ""))
    .update("|")
    .update(stableStringify(input.document))
    .digest("hex");
}

