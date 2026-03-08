import { describe, expect, it } from "vitest";
import { createWorkspace } from "@/lib/workspace/state";
import { deriveThreadMeta } from "@/lib/workspace/thread-meta";

describe("deriveThreadMeta", () => {
  it("prioritizes resolved status over blueprint metadata", () => {
    const workspace = createWorkspace("w1", null);
    const meta = deriveThreadMeta({
      ...workspace,
      blueprintMetadata: {
        documentName: "Blueprint title",
        summary: "Blueprint summary",
        currencyCode: null,
        participants: [],
      },
      resolvedStatus: {
        id: "status-1",
        viewer: "ownerChannel",
        title: "Live title",
        body: "Live summary",
        matchedWhen: "true",
        sourceSnapshotId: "snap-1",
        createdAt: "2026-03-08T00:00:00.000Z",
      },
    });
    expect(meta).toEqual({
      threadTitle: "Live title",
      threadSummary: "Live summary",
    });
  });

  it("falls back to first user prompt when blueprint metadata missing", () => {
    const workspace = createWorkspace("w2", null);
    workspace.messages.push({
      id: "m-user",
      role: "user",
      parts: [{ type: "text", text: "Create a counter document" }],
    });

    const meta = deriveThreadMeta({
      ...workspace,
      blueprintMetadata: null,
      resolvedStatus: null,
    });

    expect(meta.threadTitle).toBe("Create a counter document");
    expect(meta.threadSummary).toBe("Create a counter document");
  });
});

