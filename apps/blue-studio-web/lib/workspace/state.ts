import type { UIMessage } from "ai";
import type {
  ActivityItem,
  BootstrapProgressEvent,
  ChannelBindingDraft,
  CompileStatus,
  DocumentSnapshot,
  InspectorTab,
  StoredAttachment,
  UserCredentials,
  WorkspacePhase,
  WorkspaceState,
} from "./types";
import { deriveThreadMeta } from "./thread-meta";

function id(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export function createSeedAssistantMessage(): UIMessage {
  return {
    id: id("msg"),
    role: "assistant",
    parts: [{ type: "text", text: "What do you want to create today?" }],
  };
}

export function createWorkspace(
  workspaceId: string,
  credentials: UserCredentials | null
): WorkspaceState {
  const now = new Date().toISOString();
  const initialMessage = createSeedAssistantMessage();
  const seededBase: WorkspaceState = {
    id: workspaceId,
    createdAt: now,
    updatedAt: now,
    phase: credentials ? "blueprint-chat" : "needs-credentials",
    threadTitle: "Untitled thread",
    threadSummary: "No summary yet.",
    credentials,
    messages: [initialMessage],
    attachments: [],
    blueprintVersions: [],
    currentBlueprint: null,
    blueprintMetadata: null,
    viewerChannel: null,
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
    statusTemplatesByViewer: {},
    resolvedStatus: null,
    statusHistory: [],
    documentQaHistory: [],
    lastDocumentFingerprint: null,
    autoRefreshEnabled: true,
    activityFeed: [
      createActivity("assistant-message", "Assistant initialized", initialMessage.id),
    ],
    selectedInspectorTab: "overview",
    errorMessage: null,
    qaPairs: [],
  };
  const meta = deriveThreadMeta(seededBase);

  return {
    ...seededBase,
    threadTitle: meta.threadTitle,
    threadSummary: meta.threadSummary,
  };
}

export function createActivity(
  kind: ActivityItem["kind"],
  title: string,
  detail?: string
): ActivityItem {
  return {
    id: id("act"),
    createdAt: new Date().toISOString(),
    kind,
    title,
    detail,
  };
}

export function createBootstrapEvent(
  phase: BootstrapProgressEvent["phase"],
  message: string
): BootstrapProgressEvent {
  return {
    id: id("boot"),
    createdAt: new Date().toISOString(),
    phase,
    message,
  };
}

export function withPhase(
  workspace: WorkspaceState,
  phase: WorkspacePhase
): WorkspaceState {
  return { ...workspace, phase, updatedAt: new Date().toISOString() };
}

export function withCredentials(
  workspace: WorkspaceState,
  credentials: UserCredentials | null
): WorkspaceState {
  return {
    ...workspace,
    credentials,
    phase: credentials ? "blueprint-chat" : "needs-credentials",
    updatedAt: new Date().toISOString(),
  };
}

export function withInspectorTab(
  workspace: WorkspaceState,
  tab: InspectorTab
): WorkspaceState {
  return {
    ...workspace,
    selectedInspectorTab: tab,
    updatedAt: new Date().toISOString(),
  };
}

export function withAttachments(
  workspace: WorkspaceState,
  attachments: StoredAttachment[]
): WorkspaceState {
  return { ...workspace, attachments, updatedAt: new Date().toISOString() };
}

export function withCompileStatus(
  workspace: WorkspaceState,
  compileStatus: CompileStatus
): WorkspaceState {
  return { ...workspace, compileStatus, updatedAt: new Date().toISOString() };
}

export function withBindingDraft(
  workspace: WorkspaceState,
  channelBindings: ChannelBindingDraft[]
): WorkspaceState {
  return { ...workspace, channelBindings, updatedAt: new Date().toISOString() };
}

export function withSnapshot(
  workspace: WorkspaceState,
  snapshot: DocumentSnapshot
): WorkspaceState {
  return {
    ...workspace,
    documentSnapshots: [...workspace.documentSnapshots, snapshot],
    updatedAt: new Date().toISOString(),
  };
}

const VALID_INSPECTOR_TABS: InspectorTab[] = [
  "overview",
  "blueprint",
  "dsl",
  "bindings",
  "bootstrap",
  "document",
  "changes",
  "activity",
];

function normalizeInspectorTab(tab: unknown): InspectorTab {
  if (typeof tab === "string" && VALID_INSPECTOR_TABS.includes(tab as InspectorTab)) {
    return tab as InspectorTab;
  }
  return "overview";
}

export function normalizeWorkspaceState(workspace: WorkspaceState): WorkspaceState {
  const now = new Date().toISOString();
  const fallback = createWorkspace(workspace.id, workspace.credentials ?? null);
  const normalizedBase: WorkspaceState = {
    ...fallback,
    ...workspace,
    createdAt:
      typeof workspace.createdAt === "string" && workspace.createdAt.length > 0
        ? workspace.createdAt
        : fallback.createdAt ?? now,
    updatedAt:
      typeof workspace.updatedAt === "string" && workspace.updatedAt.length > 0
        ? workspace.updatedAt
        : fallback.updatedAt ?? now,
    blueprintMetadata: workspace.blueprintMetadata ?? null,
    viewerChannel:
      typeof workspace.viewerChannel === "string" && workspace.viewerChannel.length > 0
        ? workspace.viewerChannel
        : null,
    statusTemplatesByViewer:
      workspace.statusTemplatesByViewer && typeof workspace.statusTemplatesByViewer === "object"
        ? workspace.statusTemplatesByViewer
        : {},
    resolvedStatus: workspace.resolvedStatus ?? null,
    statusHistory: Array.isArray(workspace.statusHistory) ? workspace.statusHistory : [],
    documentQaHistory: Array.isArray(workspace.documentQaHistory)
      ? workspace.documentQaHistory
      : [],
    lastDocumentFingerprint:
      typeof workspace.lastDocumentFingerprint === "string" &&
      workspace.lastDocumentFingerprint.length > 0
        ? workspace.lastDocumentFingerprint
        : null,
    autoRefreshEnabled:
      typeof workspace.autoRefreshEnabled === "boolean"
        ? workspace.autoRefreshEnabled
        : true,
    selectedInspectorTab: normalizeInspectorTab(workspace.selectedInspectorTab),
  };
  const meta = deriveThreadMeta(normalizedBase);
  return {
    ...normalizedBase,
    threadTitle:
      typeof workspace.threadTitle === "string" && workspace.threadTitle.trim().length > 0
        ? workspace.threadTitle
        : meta.threadTitle,
    threadSummary:
      typeof workspace.threadSummary === "string" && workspace.threadSummary.trim().length > 0
        ? workspace.threadSummary
        : meta.threadSummary,
  };
}
