export type DemoScopeType = "blink" | "workspace";
export type WorkspaceTemplateKey = "shop" | "restaurant" | "generic-business";

export interface DemoSectionDefinition {
  key: string;
  label: string;
  kind: "overview" | "tasks" | "documents" | "services" | "domain" | "activity" | "settings";
  description?: string;
}

export interface ScopeRecap {
  headline: string;
  updates: string[];
  asks: string[];
}

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

export interface AssistantConversationRecord {
  id: string;
  scopeId: string;
  assistantName: string;
  createdAt: string;
  updatedAt: string;
  lastSeenAt?: string | null;
  lastRecapAt?: string | null;
}

export type AssistantExchangeType =
  | "ask"
  | "alert"
  | "question"
  | "instruction"
  | "notification";

export type AssistantExchangeStatus =
  | "open"
  | "in-progress"
  | "resolved"
  | "dismissed";

export interface AssistantExchangeRecord {
  id: string;
  conversationId: string;
  scopeId: string;

  type: AssistantExchangeType;
  status: AssistantExchangeStatus;

  title: string;
  openerMessageId: string;
  resolutionMessageId?: string | null;
  latestMessageId: string;

  replyCount: number;
  requiresUserAction: boolean;
  stickyUntilResolved: boolean;

  linkedAttentionItemId?: string | null;

  sourceType:
    | "assistant-demo"
    | "user-demo"
    | "document"
    | "thread"
    | "task"
    | "system";

  sourceId?: string | null;

  canDeliverExternally: boolean;
  externalThreadKey?: string | null;

  openedAt: string;
  resolvedAt?: string | null;
  updatedAt: string;
}

export type AssistantExchangeMessageKind =
  | "opener"
  | "reply"
  | "resolution"
  | "system";

export type AssistantMessageSurface =
  | "app"
  | "slack"
  | "telegram"
  | "system";

export interface AssistantExchangeMessageRecord {
  id: string;
  conversationId: string;
  exchangeId: string;
  scopeId: string;

  role: "assistant" | "user" | "system";
  kind: AssistantExchangeMessageKind;
  body: string;

  createdAt: string;

  surface: AssistantMessageSurface;
  externalMessageId?: string | null;
  externalThreadMessageId?: string | null;
}

export interface AssistantPlaybookRecord {
  id: string;
  scopeId: string;
  inheritsFromScopeId?: string | null;

  identityMarkdown: string;
  defaultsMarkdown: string;
  contextMarkdown: string;
  overridesMarkdown: string;

  updatedAt: string;
}

export type ScopeBootstrapStatus =
  | "not-required"
  | "pending"
  | "running"
  | "ready"
  | "failed";

export interface DemoSettingsItem {
  label: string;
  value: string;
}

export interface DemoSettingsBlock {
  id: string;
  title: string;
  description?: string;
  items: DemoSettingsItem[];
}

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
  recap: ScopeRecap;
  sectionDefinitions: DemoSectionDefinition[];
  settingsBlocks: DemoSettingsBlock[];
  searchKeywords: string[];
  threadIds: string[];
  documentIds: string[];
  activityIds: string[];
  attentionItemIds: string[];
  assistantConversationId?: string | null;
  assistantPlaybookId?: string | null;
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
    | "assistant-discussion-opened"
    | "assistant-reply-appended"
    | "assistant-discussion-resolved"
    | "assistant-ask-created"
    | "assistant-user-instruction"
    | "assistant-playbook-updated"
    | "thread-message"
    | "thread-created"
    | "document-created"
    | "workspace-created"
    | "bootstrap"
    | "document-action"
    | "thread-action"
    | "status"
    | "error"
    | "operation";
  title: string;
  detail?: string;
  createdAt: string;
  metadata?: Record<string, unknown>;
}

export interface DemoActionDefinition {
  id: string;
  label: string;
  description?: string;
  activityTitle: string;
  activityDetail: string;
  nextStatus?: string;
  assistantNote?: string;
  metadataPatch?: Record<string, unknown>;
}

export interface ThreadRecord {
  id: string;
  scopeId: string;
  title: string;
  summary: string;
  status: "active" | "paused" | "blocked" | "completed";
  owner: string;
  progress: number;
  tags: string[];
  sectionKey: string | null;
  createdAt: string;
  updatedAt: string;
  coreDocumentId?: string | null;
  sessionId?: string | null;
  settingsBlocks: DemoSettingsBlock[];
  uiCards: DocumentUiCard[];
  messages: BaseChatMessage[];
  activity: ActivityRecord[];
}

export interface DocumentUiCard {
  id: string;
  title: string;
  body: string;
  metric?: string;
  ctaLabel?: string;
  actions?: DemoActionDefinition[];
}

export interface DocumentRecord {
  id: string;
  scopeId: string | null;
  kind:
    | "workspace-core"
    | "thread"
    | "agreement"
    | "proposal"
    | "payment"
    | "generic"
    | "service"
    | "shared-document"
    | "draft-document"
    | "access"
    | "order"
    | "product"
    | "partnership"
    | "manuscript"
    | "review"
    | "outreach"
    | "reservation"
    | "supplier"
    | "hiring";
  category: "service" | "task-artifact" | "relationship" | "operational" | "content";
  sectionKey: string | null;
  title: string;
  summary: string;
  status: string;
  owner: string;
  participants: string[];
  tags: string[];
  isService: boolean;
  createdAt: string;
  updatedAt: string;
  sessionId?: string | null;
  myosDocumentId?: string | null;
  settingsBlocks: DemoSettingsBlock[];
  details: Record<string, unknown>;
  uiCards: DocumentUiCard[];
  activity: ActivityRecord[];
  searchKeywords: string[];
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
  relatedExchangeId?: string | null;
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
  assistantConversations: AssistantConversationRecord[];
  assistantExchanges: AssistantExchangeRecord[];
  assistantExchangeMessages: AssistantExchangeMessageRecord[];
  assistantPlaybooks: AssistantPlaybookRecord[];
}

export interface DemoCredentials {
  openAiApiKey: string;
  myOsApiKey: string;
  myOsAccountId: string;
  myOsBaseUrl: string;
}
