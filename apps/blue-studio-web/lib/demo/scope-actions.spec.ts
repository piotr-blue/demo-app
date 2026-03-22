import "fake-indexeddb/auto";
import { beforeEach, describe, expect, it } from "vitest";
import {
  appendThreadMessage,
  applyDocumentAction,
  applyThreadAction,
  createRootDocument,
  createThreadInScope,
  createWorkspaceFromTemplate,
  loadDemoSnapshot,
  markWorkspaceBootstrapFailed,
  markWorkspaceBootstrapSuccess,
  resetDemoSnapshot,
  syncThreadDocumentSnapshot,
} from "@/lib/demo/scope-actions";
import { getBlinkScope, getDocumentById, getScopeById, getThreadById } from "@/lib/demo/selectors";
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
    expect(workspace?.bootstrapStatus).toBe("ready");

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

  it("applies document and thread actions and appends thread chat", async () => {
    const snapshot = await loadDemoSnapshot();
    const document = snapshot.documents.find((entry) => entry.id === "doc_home_sms_provider");
    const thread = snapshot.threads.find((entry) => entry.id === "thread_home_daily_ops");
    expect(document).toBeTruthy();
    expect(thread).toBeTruthy();
    if (!document || !thread) {
      return;
    }

    const documentActionId = document.uiCards[0]?.actions?.[0]?.id;
    expect(documentActionId).toBeTruthy();
    if (!documentActionId) {
      return;
    }

    const afterDocumentAction = await applyDocumentAction(document.id, documentActionId);
    const updatedDocument = getDocumentById(afterDocumentAction, document.id);
    expect(updatedDocument?.activity.length).toBeGreaterThan(document.activity.length);

    const threadActionId = thread.uiCards[0]?.actions?.[0]?.id;
    expect(threadActionId).toBeTruthy();
    if (!threadActionId) {
      return;
    }

    const afterThreadAction = await applyThreadAction(thread.id, threadActionId);
    const updatedThread = getThreadById(afterThreadAction, thread.id);
    expect((updatedThread?.progress ?? 0) >= thread.progress).toBe(true);

    const afterThreadMessage = await appendThreadMessage(thread.id, "user", "Need a supplier follow-up.");
    const threadAfterMessage = getThreadById(afterThreadMessage, thread.id);
    expect(threadAfterMessage?.messages.at(-1)?.text).toContain("supplier follow-up");
  });

  it("resets snapshot to deterministic seed", async () => {
    const created = await createRootDocument({ title: "Temporary doc" });
    expect(created.snapshot.documents.some((entry) => entry.title === "Temporary doc")).toBe(true);

    const reset = await resetDemoSnapshot();
    expect(reset.documents.some((entry) => entry.title === "Temporary doc")).toBe(false);
    expect(reset.scopes.some((entry) => entry.name === "Home")).toBe(true);
  });
});
