import type { SnapshotDiff } from "@/lib/workspace/types";

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function buildSnapshotDiffs(
  beforeValue: unknown,
  afterValue: unknown,
  path = ""
): SnapshotDiff[] {
  if (Object.is(beforeValue, afterValue)) {
    return [];
  }

  if (Array.isArray(beforeValue) && Array.isArray(afterValue)) {
    const max = Math.max(beforeValue.length, afterValue.length);
    const diffs: SnapshotDiff[] = [];
    for (let i = 0; i < max; i += 1) {
      diffs.push(...buildSnapshotDiffs(beforeValue[i], afterValue[i], `${path}/${i}`));
    }
    return diffs;
  }

  if (isObject(beforeValue) && isObject(afterValue)) {
    const allKeys = new Set([...Object.keys(beforeValue), ...Object.keys(afterValue)]);
    const diffs: SnapshotDiff[] = [];
    for (const key of allKeys) {
      const nextPath = `${path}/${key}`;
      diffs.push(...buildSnapshotDiffs(beforeValue[key], afterValue[key], nextPath));
    }
    return diffs;
  }

  return [
    {
      path: path || "/",
      before: beforeValue,
      after: afterValue,
    },
  ];
}
