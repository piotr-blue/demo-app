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
  const initialMessage = createSeedAssistantMessage();

  return {
    id: workspaceId,
    phase: credentials ? "blueprint-chat" : "needs-credentials",
    credentials,
    messages: [initialMessage],
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
    activityFeed: [
      createActivity("assistant-message", "Assistant initialized", initialMessage.id),
    ],
    selectedInspectorTab: "overview",
    errorMessage: null,
    qaPairs: [],
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
  return { ...workspace, phase };
}

export function withCredentials(
  workspace: WorkspaceState,
  credentials: UserCredentials | null
): WorkspaceState {
  return {
    ...workspace,
    credentials,
    phase: credentials ? "blueprint-chat" : "needs-credentials",
  };
}

export function withInspectorTab(
  workspace: WorkspaceState,
  tab: InspectorTab
): WorkspaceState {
  return {
    ...workspace,
    selectedInspectorTab: tab,
  };
}

export function withAttachments(
  workspace: WorkspaceState,
  attachments: StoredAttachment[]
): WorkspaceState {
  return { ...workspace, attachments };
}

export function withCompileStatus(
  workspace: WorkspaceState,
  compileStatus: CompileStatus
): WorkspaceState {
  return { ...workspace, compileStatus };
}

export function withBindingDraft(
  workspace: WorkspaceState,
  channelBindings: ChannelBindingDraft[]
): WorkspaceState {
  return { ...workspace, channelBindings };
}

export function withSnapshot(
  workspace: WorkspaceState,
  snapshot: DocumentSnapshot
): WorkspaceState {
  return {
    ...workspace,
    documentSnapshots: [...workspace.documentSnapshots, snapshot],
  };
}
