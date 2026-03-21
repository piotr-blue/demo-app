export type DemoScopeType = "blink" | "workspace";
export type WorkspaceTemplateKey = "shop" | "restaurant" | "generic-business";

export interface BaseChatMessage {
  id: string;
  role: "user" | "assistant" | "system";
  text: string;
  createdAt: string;
}

export interface ScopeAssistantProfile {
  name: string;
  tone: string;
  avatar?: string | null;
}

export type ScopeBootstrapStatus =
  | "not-required"
  | "pending"
  | "running"
  | "ready"
  | "failed";

export interface ScopeRecord {
  id: string;
  type: DemoScopeType;
  name: string;
  icon?: string | null;
  templateKey?: WorkspaceTemplateKey | null;
  description: string;
  createdAt: string;
  updatedAt: string;
  coreDocumentId?: string | null;
  coreSessionId?: string | null;
  bootstrapStatus: ScopeBootstrapStatus;
  bootstrapError?: string | null;
  anchors: string[];
  assistant: ScopeAssistantProfile;
  threadIds: string[];
  documentIds: string[];
  activityIds: string[];
  attentionItemIds: string[];
  messages: BaseChatMessage[];
}

export interface ActivityRecord {
  id: string;
  scopeId: string;
  scopeType: DemoScopeType;
  threadId?: string | null;
  documentId?: string | null;
  kind:
    | "assistant-message"
    | "user-message"
    | "thread-created"
    | "document-created"
    | "workspace-created"
    | "bootstrap"
    | "status"
    | "error"
    | "operation";
  title: string;
  detail?: string;
  createdAt: string;
}

export interface ThreadRecord {
  id: string;
  scopeId: string;
  title: string;
  summary: string;
  status: "active" | "paused" | "completed";
  createdAt: string;
  updatedAt: string;
  coreDocumentId?: string | null;
  sessionId?: string | null;
  messages: BaseChatMessage[];
  activity: ActivityRecord[];
}

export interface DocumentUiCard {
  id: string;
  title: string;
  body: string;
  ctaLabel?: string;
}

export interface DocumentRecord {
  id: string;
  scopeId: string | null;
  kind: "workspace-core" | "thread" | "agreement" | "proposal" | "payment" | "generic";
  title: string;
  summary: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  sessionId?: string | null;
  myosDocumentId?: string | null;
  details: Record<string, unknown>;
  uiCards: DocumentUiCard[];
  activity: ActivityRecord[];
}

export interface AttentionItem {
  id: string;
  scopeId: string;
  scopeType: DemoScopeType;
  status: "pending" | "resolved" | "dismissed";
  title: string;
  body: string;
  priority: "low" | "medium" | "high";
  relatedThreadId?: string | null;
  relatedDocumentId?: string | null;
  createdAt: string;
  resolvedAt?: string | null;
  delivery: {
    inApp: boolean;
    external: "not-sent" | "queued" | "sent" | "responded";
  };
}

export interface WorkspaceTemplateDefinition {
  key: WorkspaceTemplateKey;
  name: string;
  description: string;
  icon: string;
  defaultAssistantName: string;
  defaultTone: string;
  anchors: string[];
  bootstrap: {
    documentJson: Record<string, unknown>;
    bindings: Array<{
      channelName: string;
      mode: "email" | "accountId";
      value: string;
      timelineId?: string;
    }>;
  };
}

export interface DemoSnapshot {
  scopes: ScopeRecord[];
  threads: ThreadRecord[];
  documents: DocumentRecord[];
  attentionItems: AttentionItem[];
  activity: ActivityRecord[];
}

export interface DemoCredentials {
  openAiApiKey: string;
  myOsApiKey: string;
  myOsAccountId: string;
  myOsBaseUrl: string;
}
