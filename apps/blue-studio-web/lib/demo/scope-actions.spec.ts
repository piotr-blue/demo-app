import "fake-indexeddb/auto";
import { beforeEach, describe, expect, it } from "vitest";
import {
  createRootDocument,
  createThreadInScope,
  createWorkspaceFromTemplate,
  loadDemoSnapshot,
  markWorkspaceBootstrapFailed,
  markWorkspaceBootstrapSuccess,
  syncThreadDocumentSnapshot,
} from "@/lib/demo/scope-actions";
import { getBlinkScope, getScopeById } from "@/lib/demo/selectors";
import { clearDemoPersistence } from "@/lib/demo/storage";

describe("demo scope actions", () => {
  beforeEach(async () => {
    await clearDemoPersistence();
  });

  it("creates workspace from template and updates bootstrap state", async () => {
    const created = await createWorkspaceFromTemplate({
      templateKey: "shop",
      workspaceName: "Alice Shop",
    });
    expect(created.workspaceId).toBeTruthy();
    const workspace = getScopeById(created.snapshot, created.workspaceId);
    expect(workspace?.type).toBe("workspace");
    expect(workspace?.bootstrapStatus).toBe("pending");

    const readySnapshot = await markWorkspaceBootstrapSuccess({
      scopeId: created.workspaceId,
      sessionId: "session_1",
      coreDocumentId: "doc_core_1",
      myosDocumentId: "myos_doc_1",
    });
    const readyScope = getScopeById(readySnapshot, created.workspaceId);
    expect(readyScope?.bootstrapStatus).toBe("ready");
    expect(readyScope?.coreSessionId).toBe("session_1");
    expect(readyScope?.coreDocumentId).toBe("doc_core_1");
  });

  it("creates thread and root document in blink scope", async () => {
    const snapshot = await loadDemoSnapshot();
    const blink = getBlinkScope(snapshot);
    expect(blink).toBeTruthy();
    if (!blink) {
      return;
    }

    const threadCreated = await createThreadInScope({ scopeId: blink.id, title: "Ops thread" });
    expect(threadCreated.threadId).toBeTruthy();
    const synced = await syncThreadDocumentSnapshot(threadCreated.threadId);
    expect(synced.documents.some((document) => document.kind === "thread")).toBe(true);

    const rootDocument = await createRootDocument({ title: "Root spec" });
    expect(rootDocument.documentId).toBeTruthy();
    expect(
      rootDocument.snapshot.documents.some(
        (document) => document.id === rootDocument.documentId && document.scopeId === null
      )
    ).toBe(true);
  });

  it("marks workspace bootstrap failure without deleting workspace", async () => {
    const created = await createWorkspaceFromTemplate({
      templateKey: "restaurant",
      workspaceName: "Bistro",
    });

    const failed = await markWorkspaceBootstrapFailed(created.workspaceId, "bootstrap error");
    const workspace = getScopeById(failed, created.workspaceId);
    expect(workspace?.bootstrapStatus).toBe("failed");
    expect(workspace?.bootstrapError).toContain("bootstrap error");
    expect(workspace?.type).toBe("workspace");
  });
});
