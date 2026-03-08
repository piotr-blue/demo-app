import type { UIMessage } from "ai";

export type WorkspacePhase =
  | "needs-credentials"
  | "blueprint-chat"
  | "blueprint-ready"
  | "dsl-generating"
  | "dsl-ready"
  | "binding-review"
  | "bootstrapping"
  | "document-running"
  | "error";

export interface UserCredentials {
  openAiApiKey: string;
  myOsApiKey: string;
  myOsAccountId: string;
  myOsBaseUrl: string;
}

export interface StoredAttachment {
  id: string;
  name: string;
  mimeType: string;
  size: number;
  contextLabel: string;
  extractedText: string;
  createdAt: string;
}

export interface BlueprintVersion {
  id: string;
  createdAt: string;
  source: "model" | "user-modification";
  content: string;
}

export interface DslVersion {
  id: string;
  createdAt: string;
  source: "model" | "repair";
  content: string;
}

export interface CompileDiagnostic {
  id: string;
  createdAt: string;
  level: "info" | "warning" | "error";
  message: string;
  detail?: string;
}

export interface CompileStatus {
  ok: boolean;
  checkedAt: string;
  diagnostics: CompileDiagnostic[];
}

export interface ChannelBindingDraft {
  channelName: string;
  mode: "email" | "accountId";
  value: string;
  timelineId?: string;
}

export interface BootstrapProgressEvent {
  id: string;
  phase:
    | "bootstrap-submitted"
    | "session-created"
    | "waiting-for-document"
    | "document-running"
    | "document-fetched"
    | "error";
  message: string;
  createdAt: string;
}

export interface SnapshotDiff {
  path: string;
  before: unknown;
  after: unknown;
}

export interface DocumentSnapshot {
  id: string;
  createdAt: string;
  document: unknown;
  allowedOperations: string[];
  diffs: SnapshotDiff[];
}

export interface ActivityItem {
  id: string;
  createdAt: string;
  kind:
    | "user-message"
    | "assistant-message"
    | "blueprint"
    | "dsl"
    | "compile"
    | "bindings"
    | "bootstrap"
    | "document"
    | "error";
  title: string;
  detail?: string;
}

export interface WorkspaceState {
  id: string;
  phase: WorkspacePhase;
  credentials: UserCredentials | null;
  messages: UIMessage[];
  attachments: StoredAttachment[];
  blueprintVersions: BlueprintVersion[];
  currentBlueprint: string | null;
  dslVersions: DslVersion[];
  currentDsl: string | null;
  currentDocumentJson: unknown | null;
  compileStatus: CompileStatus | null;
  channelBindings: ChannelBindingDraft[];
  finalBindings: ChannelBindingDraft[] | null;
  bootstrapStatus: BootstrapProgressEvent[];
  sessionId: string | null;
  documentId: string | null;
  documentSnapshots: DocumentSnapshot[];
  activityFeed: ActivityItem[];
  selectedInspectorTab: InspectorTab;
  errorMessage: string | null;
  qaPairs: QaPair[];
}

export type InspectorTab =
  | "overview"
  | "blueprint"
  | "dsl"
  | "bindings"
  | "bootstrap"
  | "document"
  | "changes"
  | "activity";

export interface QaPair {
  question: string;
  answer: string;
}

export interface ChatRoutePayload {
  credentials: UserCredentials;
  attachments: StoredAttachment[];
  currentBlueprint: string | null;
  qaPairs: QaPair[];
}
