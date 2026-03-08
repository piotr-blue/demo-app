import { describe, expect, it } from "vitest";
import { createWorkspace } from "@/lib/workspace/state";
import { applyRetrievedDocumentRefresh } from "@/lib/workspace/polling";
import type { StatusTemplateBundle } from "@/lib/workspace/types";

const bundle: StatusTemplateBundle = {
  viewer: "ownerChannel",
  blueprintHash: "hash-1",
  generatedAt: "2026-03-08T00:00:00.000Z",
  templates: [
    {
      when: "doc('/status') === 'draft'",
      title: "Draft",
      body: "Counter {{ doc('/counter') }}",
    },
    {
      when: "true",
      title: "Active",
      body: "Counter {{ doc('/counter') }}",
    },
  ],
};

describe("applyRetrievedDocumentRefresh", () => {
  it("dedupes unchanged fingerprint snapshots", () => {
    const workspace = createWorkspace("w_poll_1", null);
    const first = applyRetrievedDocumentRefresh({
      workspace,
      retrieved: {
        document: { status: "draft", counter: 1 },
        allowedOperations: ["increment"],
        processingStatus: "running",
      },
      selectedViewer: "ownerChannel",
      templateBundle: bundle,
      currencyCode: "USD",
    });
    expect(first.changed).toBe(true);
    expect(first.workspace.documentSnapshots).toHaveLength(1);

    const second = applyRetrievedDocumentRefresh({
      workspace: first.workspace,
      retrieved: {
        document: { status: "draft", counter: 1 },
        allowedOperations: ["increment"],
        processingStatus: "running",
      },
      selectedViewer: "ownerChannel",
      templateBundle: bundle,
      currencyCode: "USD",
    });
    expect(second.changed).toBe(false);
    expect(second.workspace.documentSnapshots).toHaveLength(1);
  });

  it("appends changed snapshots and resolves status updates", () => {
    const workspace = createWorkspace("w_poll_2", null);
    const first = applyRetrievedDocumentRefresh({
      workspace,
      retrieved: {
        document: { status: "draft", counter: 1 },
        allowedOperations: ["increment"],
        processingStatus: "running",
      },
      selectedViewer: "ownerChannel",
      templateBundle: bundle,
      currencyCode: "USD",
    });

    const second = applyRetrievedDocumentRefresh({
      workspace: first.workspace,
      retrieved: {
        document: { status: "active", counter: 2 },
        allowedOperations: ["increment"],
        processingStatus: "running",
      },
      selectedViewer: "ownerChannel",
      templateBundle: bundle,
      currencyCode: "USD",
    });

    expect(second.changed).toBe(true);
    expect(second.workspace.documentSnapshots).toHaveLength(2);
    expect(second.workspace.documentSnapshots[1]?.diffs.length).toBeGreaterThan(0);
    expect(second.workspace.resolvedStatus?.title).toBe("Active");
    expect(second.workspace.statusHistory).toHaveLength(2);
  });
});

