import { describe, expect, it } from "vitest";
import { buildSnapshotDiffs } from "@/lib/dsl/diff";

describe("buildSnapshotDiffs", () => {
  it("returns pointer diffs for object changes", () => {
    const diffs = buildSnapshotDiffs(
      { counter: 0, nested: { ready: false } },
      { counter: 1, nested: { ready: true } }
    );

    expect(diffs).toEqual([
      { path: "/counter", before: 0, after: 1 },
      { path: "/nested/ready", before: false, after: true },
    ]);
  });
});
