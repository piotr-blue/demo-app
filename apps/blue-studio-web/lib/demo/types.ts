export type DemoScopeType = "blink" | "workspace";
export type WorkspaceTemplateKey = "shop" | "restaurant" | "generic-business";
export type DemoConversationTargetType = "home" | "document";
export type DemoSearchVisibility = "private" | "participants" | "public";
export type DemoViewerAccessMode = "owner" | "participant" | "public" | "none";

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

export interface DemoAccountRecord {
  id: string;
  accountId: string;
  name: string;
  email: string;
  subtitle: string;
  avatar?: string | null;
  description: string;
  isPrimary: boolean;
  homeScopeId?: string | null;
  profileDocumentId: string;
  favoriteDocumentIds: string[];
  publicDocumentIds: string[];
  searchKeywords: string[];
  website?: string | null;
  location?: string | null;
  phone?: string | null;
}

export interface DemoFieldRecord {
  label: string;
  value: string;
  tone?: "default" | "muted" | "success" | "warning";
}

export interface DocumentAnchorRecord {
  id: string;
  documentId: string;
  key: string;
  label: string;
  linkedDocumentIds: string[];
  visibleToAccountIds?: string[];
  searchKeywords?: string[];
}

export interface AssistantConversationRecord {
  id: string;
  scopeId?: string | null;
  targetType: DemoConversationTargetType;
  targetId: string;
  viewerAccountId: string;
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
  scopeId?: string | null;
  targetType?: DemoConversationTargetType;
  targetId?: string;
  viewerAccountId?: string;

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
  scopeId?: string | null;

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
  scopeId?: string | null;
  targetType: DemoConversationTargetType;
  targetId: string;
  viewerAccountId: string;
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
  scopeId?: string | null;
  scopeType?: DemoScopeType;
  accountId?: string | null;
  threadId?: string | null;
  documentId?: string | null;
  targetType?: DemoConversationTargetType;
  targetId?: string | null;
  visibleToAccountIds?: string[];
  kind: string;
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
  scopeId?: string;
  title: string;
  summary: string;
  status: "active" | "paused" | "blocked" | "completed";
  owner: string;
  ownerAccountId: string;
  participantAccountIds: string[];
  visibleToAccountIds: string[];
  progress: number;
  tags: string[];
  sectionKey: string | null;
  createdAt: string;
  updatedAt: string;
  parentDocumentId?: string | null;
  coreDocumentId?: string | null;
  sessionId?: string | null;
  responsibleSummary?: string;
  activityLabel?: string;
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
  kind: string;
  category: string;
  sectionKey: string | null;
  title: string;
  summary: string;
  status: string;
  owner: string;
  participants: string[];
  tags: string[];
  isService: boolean;
  ownerAccountId: string;
  participantAccountIds: string[];
  isPublic: boolean;
  visibleToAccountIds: string[];
  searchVisibility: DemoSearchVisibility;
  starredByAccountIds: string[];
  linkedDocumentIds: string[];
  anchorIds: string[];
  taskIds: string[];
  parentDocumentId?: string | null;
  typeLabel?: string;
  oneLineSummary?: string;
  visibilityLabel?: string;
  coreFields: DemoFieldRecord[];
  detailBlocks: DemoSettingsBlock[];
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
  scopeId?: string | null;
  scopeType?: DemoScopeType;
  accountId: string;
  status: "pending" | "resolved" | "dismissed";
  title: string;
  body: string;
  priority: "low" | "medium" | "high";
  relatedThreadId?: string | null;
  relatedDocumentId?: string | null;
  relatedExchangeId?: string | null;
  availableActionLabels?: string[];
  sourceLabel?: string | null;
  sourceHref?: string | null;
  visibleToAccountIds?: string[];
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
  accounts: DemoAccountRecord[];
  documentAnchors: DocumentAnchorRecord[];
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
