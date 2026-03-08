import { describe, expect, it } from "vitest";
import { createWorkspace, normalizeWorkspaceState } from "@/lib/workspace/state";
import type { WorkspaceState } from "@/lib/workspace/types";

describe("createWorkspace", () => {
  it("initializes thread and status fields", () => {
    const workspace = createWorkspace("workspace_1", null);
    expect(workspace.createdAt).toBeTruthy();
    expect(workspace.updatedAt).toBeTruthy();
    expect(workspace.threadTitle).toBeTruthy();
    expect(workspace.threadSummary).toBeTruthy();
    expect(workspace.blueprintMetadata).toBeNull();
    expect(workspace.viewerChannel).toBeNull();
    expect(workspace.statusTemplatesByViewer).toEqual({});
    expect(workspace.resolvedStatus).toBeNull();
    expect(workspace.statusHistory).toEqual([]);
    expect(workspace.documentQaHistory).toEqual([]);
    expect(workspace.lastDocumentFingerprint).toBeNull();
    expect(workspace.autoRefreshEnabled).toBe(true);
  });
});

describe("normalizeWorkspaceState", () => {
  it("backfills missing fields for persisted legacy workspace", () => {
    const legacy = {
      id: "legacy_1",
      phase: "blueprint-chat",
      credentials: null,
      messages: [],
      attachments: [],
      blueprintVersions: [],
      currentBlueprint: null,
      dslVersions: [],
      currentDsl: null,
      currentDocumentJson: null,
      compileStatus: null,
      channelBindings: [],
      finalBindings: null,
      bootstrapStatus: [],
      sessionId: null,
      documentId: null,
      documentSnapshots: [],
      activityFeed: [],
      selectedInspectorTab: "overview",
      errorMessage: null,
      qaPairs: [],
    } as unknown as WorkspaceState;

    const normalized = normalizeWorkspaceState(legacy);
    expect(normalized.createdAt).toBeTruthy();
    expect(normalized.updatedAt).toBeTruthy();
    expect(normalized.threadTitle).toBeTruthy();
    expect(normalized.threadSummary).toBeTruthy();
    expect(normalized.blueprintMetadata).toBeNull();
    expect(normalized.viewerChannel).toBeNull();
    expect(normalized.statusTemplatesByViewer).toEqual({});
    expect(normalized.statusHistory).toEqual([]);
    expect(normalized.documentQaHistory).toEqual([]);
    expect(normalized.autoRefreshEnabled).toBe(true);
  });
});

