import type { WorkspaceState } from "@/lib/workspace/types";

export interface AttachableWorkspaceCandidate {
  id: string;
  threadTitle: string;
  threadSummary: string;
  sessionId: string;
  blueprint: string;
  updatedAt: string;
}

export function getAttachableWorkspaceCandidates(params: {
  workspaces: WorkspaceState[];
  currentWorkspaceId: string;
}): AttachableWorkspaceCandidate[] {
  return params.workspaces
    .filter((workspace) => workspace.id !== params.currentWorkspaceId)
    .filter(
      (workspace) =>
        typeof workspace.sessionId === "string" &&
        workspace.sessionId.trim().length > 0 &&
        typeof workspace.currentBlueprint === "string" &&
        workspace.currentBlueprint.trim().length > 0
    )
    .map((workspace) => ({
      id: workspace.id,
      threadTitle: workspace.threadTitle,
      threadSummary: workspace.threadSummary,
      sessionId: workspace.sessionId as string,
      blueprint: workspace.currentBlueprint as string,
      updatedAt: workspace.updatedAt,
    }))
    .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));
}
