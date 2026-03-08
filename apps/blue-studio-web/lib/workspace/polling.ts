import { buildSnapshotDiffs } from "@/lib/dsl/diff";
import { buildDocumentFingerprint } from "@/lib/document/status-templates/fingerprint";
import { resolveStatusMessage } from "@/lib/document/status-templates/evaluate";
import { deriveThreadMeta } from "@/lib/workspace/thread-meta";
import type { StatusTemplateBundle, WorkspaceState } from "@/lib/workspace/types";

function nextId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function readString(value: unknown): string | null {
  return typeof value === "string" && value.length > 0 ? value : null;
}

function readAllowedOperations(value: unknown): string[] {
  return Array.isArray(value) ? value.map((entry) => String(entry)) : [];
}

export interface RetrievedDocumentState {
  document: unknown;
  allowedOperations: string[];
  processingStatus: string;
  running: boolean;
  documentId: string | null;
}

export function parseRetrievedDocumentState(retrieved: Record<string, unknown>): RetrievedDocumentState {
  const document = retrieved.document ?? null;
  const allowedOperations = readAllowedOperations(retrieved.allowedOperations);
  const processingStatus =
    readString(retrieved.processingStatus) ?? readString(retrieved.status) ?? "";
  const running =
    allowedOperations.length > 0 ||
    /running/i.test(processingStatus) ||
    (typeof document === "object" && document !== null);
  return {
    document,
    allowedOperations,
    processingStatus,
    running,
    documentId: readString(retrieved.documentId),
  };
}

export function applyRetrievedDocumentRefresh(params: {
  workspace: WorkspaceState;
  retrieved: Record<string, unknown>;
  selectedViewer: string | null;
  templateBundle: StatusTemplateBundle | null;
  currencyCode: string | null;
}): {
  workspace: WorkspaceState;
  changed: boolean;
  running: boolean;
} {
  const parsed = parseRetrievedDocumentState(params.retrieved);
  const fingerprint = buildDocumentFingerprint({
    blueprintHash: params.templateBundle?.blueprintHash ?? null,
    viewer: params.selectedViewer,
    document: parsed.document,
  });

  if (params.workspace.lastDocumentFingerprint === fingerprint) {
    return {
      workspace: params.workspace,
      changed: false,
      running: parsed.running,
    };
  }

  const previousDocument = params.workspace.documentSnapshots.at(-1)?.document ?? null;
  const snapshot = {
    id: nextId("snap"),
    createdAt: new Date().toISOString(),
    document: parsed.document,
    allowedOperations: parsed.allowedOperations,
    diffs: buildSnapshotDiffs(previousDocument, parsed.document),
  };

  let workspace = {
    ...params.workspace,
    phase: parsed.running ? "document-running" : params.workspace.phase,
    documentId: parsed.documentId ?? params.workspace.documentId,
    documentSnapshots: [...params.workspace.documentSnapshots, snapshot],
    lastDocumentFingerprint: fingerprint,
    updatedAt: new Date().toISOString(),
  };

  if (params.selectedViewer && params.templateBundle) {
    const statusResult = resolveStatusMessage({
      bundle: params.templateBundle,
      viewer: params.selectedViewer,
      document: parsed.document,
      currencyCode: params.currencyCode,
      sourceSnapshotId: snapshot.id,
      previous: workspace.resolvedStatus,
    });
    if (statusResult.changed) {
      workspace = {
        ...workspace,
        resolvedStatus: statusResult.resolved,
        statusHistory: [...workspace.statusHistory, statusResult.resolved],
        activityFeed: [
          ...workspace.activityFeed,
          {
            id: nextId("act"),
            createdAt: new Date().toISOString(),
            kind: "status",
            title: statusResult.resolved.title,
            detail: statusResult.resolved.body,
          },
        ],
      };
      const threadMeta = deriveThreadMeta(workspace);
      workspace = {
        ...workspace,
        threadTitle: threadMeta.threadTitle,
        threadSummary: threadMeta.threadSummary,
      };
    }
  }

  return {
    workspace,
    changed: true,
    running: parsed.running,
  };
}

