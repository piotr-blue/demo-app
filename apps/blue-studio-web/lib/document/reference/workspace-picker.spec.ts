import { describe, expect, it } from "vitest";
import { createWorkspace } from "@/lib/workspace/state";
import { getAttachableWorkspaceCandidates } from "@/lib/document/reference/workspace-picker";

describe("getAttachableWorkspaceCandidates", () => {
  it("filters to other threads with sessionId and blueprint", () => {
    const current = createWorkspace("w_current", null);
    const attachable = createWorkspace("w_attach", null);
    attachable.sessionId = "session-1";
    attachable.currentBlueprint = "STATE: ready\nTYPE: Document";
    attachable.updatedAt = "2026-03-08T10:00:00.000Z";
    const missingSession = createWorkspace("w_missing_session", null);
    missingSession.currentBlueprint = "STATE: ready\nTYPE: Document";

    const candidates = getAttachableWorkspaceCandidates({
      workspaces: [current, attachable, missingSession],
      currentWorkspaceId: "w_current",
    });

    expect(candidates).toHaveLength(1);
    expect(candidates[0]?.id).toBe("w_attach");
    expect(candidates[0]?.sessionId).toBe("session-1");
  });
});
