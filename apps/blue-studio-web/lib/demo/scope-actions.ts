import { clearDemoPersistence, getDemoSnapshot, saveDemoSnapshot } from "@/lib/demo/storage";
import type {
  AssistantConversationRecord,
  AssistantExchangeMessageRecord,
  AssistantExchangeRecord,
  AssistantPlaybookRecord,
  DemoShareRecord,
  DemoSnapshot,
} from "@/lib/demo/types";
import { getDocumentConversation, getHomeConversation } from "@/lib/demo/selectors";
import type { DemoActionDefinition } from "@/lib/demo/types";

export async function loadDemoSnapshot(): Promise<DemoSnapshot> {
  return getDemoSnapshot();
}

export async function resetDemoSnapshot(): Promise<DemoSnapshot> {
  await clearDemoPersistence();
  return getDemoSnapshot();
}

function nowIso(): string {
  return new Date().toISOString();
}

function cloneSnapshot(snapshot: DemoSnapshot): DemoSnapshot {
  return JSON.parse(JSON.stringify(snapshot)) as DemoSnapshot;
}

function getConversationById(
  snapshot: DemoSnapshot,
  conversationId: string
): AssistantConversationRecord | null {
  return snapshot.assistantConversations.find((conversation) => conversation.id === conversationId) ?? null;
}

function getExchangeById(snapshot: DemoSnapshot, exchangeId: string): AssistantExchangeRecord | null {
  return snapshot.assistantExchanges.find((exchange) => exchange.id === exchangeId) ?? null;
}

function nextId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function appendActivity(
  snapshot: DemoSnapshot,
  params: { kind: string; title: string; detail: string; documentId?: string | null; threadId?: string | null }
) {
  snapshot.activity.unshift({
    id: nextId("act"),
    kind: params.kind,
    title: params.title,
    detail: params.detail,
    documentId: params.documentId ?? null,
    threadId: params.threadId ?? null,
    createdAt: nowIso(),
  });
}

function updateConversationUpdatedAt(
  snapshot: DemoSnapshot,
  conversationId: string,
  updatedAt: string
) {
  const conversation = getConversationById(snapshot, conversationId);
  if (conversation) {
    conversation.updatedAt = updatedAt;
  }
}

function refreshDocumentVisibilityLabels(document: DemoSnapshot["documents"][number]) {
  document.visibilityLabel = document.isPublic
    ? "Public"
    : document.visibleToAccountIds.length > 1 || (document.shareSettings?.entries.length ?? 0) > 0
      ? "Shared"
      : "Private";

  if (document.isPublic) {
    document.searchVisibility = "public";
    if (document.shareSettings) {
      document.shareSettings.makePublic = true;
    }
    return;
  }

  document.searchVisibility =
    document.visibleToAccountIds.length > 1 || (document.shareSettings?.entries.length ?? 0) > 0
      ? "participants"
      : "private";

  if (document.shareSettings) {
    document.shareSettings.makePublic = false;
  }
}

function ensureDocumentShareSettings(document: DemoSnapshot["documents"][number]) {
  if (!document.shareSettings) {
    document.shareSettings = {
      shareWithOthers: document.visibleToAccountIds.length > 1 || document.isPublic,
      makePublic: document.isPublic,
      entries: [],
    };
  }
  return document.shareSettings;
}

export async function toggleDocumentFavorite(
  accountId: string,
  documentId: string
): Promise<DemoSnapshot> {
  const base = await getDemoSnapshot();
  const snapshot = cloneSnapshot(base);
  const account = snapshot.accounts.find((entry) => entry.id === accountId);
  const document = snapshot.documents.find((entry) => entry.id === documentId);
  if (!account || !document) {
    return base;
  }

  const currentlyFavorite = account.favoriteDocumentIds.includes(documentId);
  account.favoriteDocumentIds = currentlyFavorite
    ? account.favoriteDocumentIds.filter((id) => id !== documentId)
    : [...account.favoriteDocumentIds, documentId];
  document.starredByAccountIds = currentlyFavorite
    ? document.starredByAccountIds.filter((id) => id !== accountId)
    : [...new Set([...document.starredByAccountIds, accountId])];
  document.updatedAt = nowIso();

  await saveDemoSnapshot(snapshot);
  return snapshot;
}

export async function toggleDocumentShareEnabled(
  documentId: string,
  enabled: boolean
): Promise<DemoSnapshot> {
  const base = await getDemoSnapshot();
  const snapshot = cloneSnapshot(base);
  const document = snapshot.documents.find((entry) => entry.id === documentId);
  if (!document) {
    return base;
  }

  const shareSettings = ensureDocumentShareSettings(document);
  shareSettings.shareWithOthers = enabled;
  if (!enabled) {
    shareSettings.entries = shareSettings.entries.filter((entry) => entry.status === "owner");
  }
  document.updatedAt = nowIso();
  refreshDocumentVisibilityLabels(document);
  appendActivity(snapshot, {
    kind: "document-share",
    title: enabled ? "Sharing enabled" : "Sharing paused",
    detail: enabled
      ? `Sharing controls were enabled for ${document.title}.`
      : `Sharing controls were disabled for ${document.title}.`,
    documentId,
  });
  await saveDemoSnapshot(snapshot);
  return snapshot;
}

export async function toggleDocumentPublicVisibility(
  documentId: string,
  enabled: boolean
): Promise<DemoSnapshot> {
  const base = await getDemoSnapshot();
  const snapshot = cloneSnapshot(base);
  const document = snapshot.documents.find((entry) => entry.id === documentId);
  if (!document) {
    return base;
  }

  const shareSettings = ensureDocumentShareSettings(document);
  document.isPublic = enabled;
  shareSettings.makePublic = enabled;
  document.updatedAt = nowIso();
  refreshDocumentVisibilityLabels(document);
  appendActivity(snapshot, {
    kind: "document-visibility",
    title: enabled ? "Document made public" : "Document made private",
    detail: enabled
      ? `${document.title} now allows read-only public access.`
      : `${document.title} no longer allows public read-only access.`,
    documentId,
  });
  await saveDemoSnapshot(snapshot);
  return snapshot;
}

export async function addDocumentShareEntry(
  documentId: string,
  type: DemoShareRecord["type"],
  name: string
): Promise<DemoSnapshot> {
  const trimmed = name.trim();
  const base = await getDemoSnapshot();
  if (!trimmed) {
    return base;
  }
  const snapshot = cloneSnapshot(base);
  const document = snapshot.documents.find((entry) => entry.id === documentId);
  if (!document) {
    return base;
  }

  const shareSettings = ensureDocumentShareSettings(document);
  shareSettings.shareWithOthers = true;

  const existing = shareSettings.entries.find(
    (entry) => entry.type === type && entry.name.toLowerCase() === trimmed.toLowerCase()
  );
  if (existing) {
    return snapshot;
  }

  const newEntry: DemoShareRecord = {
    id: nextId("share"),
    type,
    name: trimmed,
    subtitle: type === "account" ? "Demo account access" : "Linked document access",
    agreement: document.title,
    status: "read-only",
  };

  if (type === "account") {
    const matchingAccount = snapshot.accounts.find(
      (account) =>
        account.name.toLowerCase() === trimmed.toLowerCase() ||
        account.email.toLowerCase() === trimmed.toLowerCase() ||
        account.accountId.toLowerCase() === trimmed.toLowerCase()
    );
    if (matchingAccount) {
      newEntry.name = matchingAccount.name;
      newEntry.subtitle = matchingAccount.email;
      if (!document.visibleToAccountIds.includes(matchingAccount.id)) {
        document.visibleToAccountIds.push(matchingAccount.id);
      }
      if (
        matchingAccount.id !== document.ownerAccountId &&
        !document.participantAccountIds.includes(matchingAccount.id)
      ) {
        document.participantAccountIds.push(matchingAccount.id);
      }
      if (!document.participants.includes(matchingAccount.name)) {
        document.participants.push(matchingAccount.name);
      }
    }
  }

  shareSettings.entries.unshift(newEntry);
  document.updatedAt = nowIso();
  refreshDocumentVisibilityLabels(document);
  appendActivity(snapshot, {
    kind: "document-share",
    title: "Shared document access",
    detail: `${document.title} was shared with ${newEntry.name}.`,
    documentId,
  });
  await saveDemoSnapshot(snapshot);
  return snapshot;
}

export async function toggleDocumentServiceConnection(
  documentId: string,
  serviceId: string
): Promise<DemoSnapshot> {
  const base = await getDemoSnapshot();
  const snapshot = cloneSnapshot(base);
  const document = snapshot.documents.find((entry) => entry.id === documentId);
  if (!document) {
    return base;
  }

  const service = document.services?.find((entry) => entry.id === serviceId);
  if (!service) {
    return base;
  }

  service.status =
    service.status === "connected"
      ? "disconnected"
      : service.status === "disconnected"
        ? "connected"
        : "connected";

  document.updatedAt = nowIso();
  appendActivity(snapshot, {
    kind: "service-connection",
    title: service.status === "connected" ? "Service connected" : "Service disconnected",
    detail:
      service.status === "connected"
        ? `${service.name} is now connected to ${document.title}.`
        : `${service.name} was disconnected from ${document.title}.`,
    documentId,
  });
  await saveDemoSnapshot(snapshot);
  return snapshot;
}

export async function getOrCreateHomeConversation(
  accountId: string
): Promise<{ snapshot: DemoSnapshot; conversationId: string }> {
  const base = await getDemoSnapshot();
  const snapshot = cloneSnapshot(base);
  const existing = getHomeConversation(snapshot, accountId);
  if (existing) {
    return { snapshot, conversationId: existing.id };
  }
  return { snapshot, conversationId: "" };
}

export async function getOrCreateDocumentConversation(
  documentId: string,
  viewerAccountId: string
): Promise<{ snapshot: DemoSnapshot; conversationId: string }> {
  const base = await getDemoSnapshot();
  const snapshot = cloneSnapshot(base);
  const existing = getDocumentConversation(snapshot, documentId, viewerAccountId);
  if (existing) {
    return { snapshot, conversationId: existing.id };
  }
  return { snapshot, conversationId: "" };
}

export async function startAssistantDemoDiscussion(
  conversationId: string
): Promise<{ snapshot: DemoSnapshot; exchangeId: string }> {
  const base = await getDemoSnapshot();
  const snapshot = cloneSnapshot(base);
  const conversation = getConversationById(snapshot, conversationId);
  if (!conversation) {
    return { snapshot: base, exchangeId: "" };
  }

  const timestamp = nowIso();
  const exchangeId = nextId("aex");
  const openerId = nextId("aemsg");
  const exchange: AssistantExchangeRecord = {
    id: exchangeId,
    conversationId,
    targetType: conversation.targetType,
    targetId: conversation.targetId,
    viewerAccountId: conversation.viewerAccountId,
    type: "ask",
    status: "open",
    title: "New demo ask",
    openerMessageId: openerId,
    resolutionMessageId: null,
    latestMessageId: openerId,
    replyCount: 0,
    requiresUserAction: true,
    stickyUntilResolved: true,
    linkedAttentionItemId: null,
    sourceType: "assistant-demo",
    sourceId: null,
    canDeliverExternally: false,
    externalThreadKey: null,
    openedAt: timestamp,
    resolvedAt: null,
    updatedAt: timestamp,
  };
  const opener: AssistantExchangeMessageRecord = {
    id: openerId,
    conversationId,
    exchangeId,
    role: "assistant",
    kind: "opener",
    body: "Can you confirm the next step for this demo surface?",
    createdAt: timestamp,
    surface: "app",
  };

  snapshot.assistantExchanges.push(exchange);
  snapshot.assistantExchangeMessages.push(opener);
  updateConversationUpdatedAt(snapshot, conversationId, timestamp);
  await saveDemoSnapshot(snapshot);
  return { snapshot, exchangeId };
}

export async function startUserDiscussion(
  conversationId: string,
  openerText: string
): Promise<{ snapshot: DemoSnapshot; exchangeId: string }> {
  const trimmed = openerText.trim();
  const base = await getDemoSnapshot();
  if (!trimmed) {
    return { snapshot: base, exchangeId: "" };
  }
  const snapshot = cloneSnapshot(base);
  const conversation = getConversationById(snapshot, conversationId);
  if (!conversation) {
    return { snapshot: base, exchangeId: "" };
  }

  const openerAt = nowIso();
  const replyAt = new Date(Date.now() + 1).toISOString();
  const exchangeId = nextId("aex");
  const openerId = nextId("aemsg");
  const replyId = nextId("aemsg");
  const exchange: AssistantExchangeRecord = {
    id: exchangeId,
    conversationId,
    targetType: conversation.targetType,
    targetId: conversation.targetId,
    viewerAccountId: conversation.viewerAccountId,
    type: trimmed.endsWith("?") ? "question" : "instruction",
    status: "in-progress",
    title: trimmed.length > 72 ? `${trimmed.slice(0, 69)}...` : trimmed,
    openerMessageId: openerId,
    resolutionMessageId: null,
    latestMessageId: replyId,
    replyCount: 1,
    requiresUserAction: false,
    stickyUntilResolved: false,
    linkedAttentionItemId: null,
    sourceType: "user-demo",
    sourceId: null,
    canDeliverExternally: false,
    externalThreadKey: null,
    openedAt: openerAt,
    resolvedAt: null,
    updatedAt: replyAt,
  };

  snapshot.assistantExchanges.push(exchange);
  snapshot.assistantExchangeMessages.push(
    {
      id: openerId,
      conversationId,
      exchangeId,
      role: "user",
      kind: "opener",
      body: trimmed,
      createdAt: openerAt,
      surface: "app",
    },
    {
      id: replyId,
      conversationId,
      exchangeId,
      role: "assistant",
      kind: "reply",
      body: `Reply to: ${trimmed}`,
      createdAt: replyAt,
      surface: "app",
    }
  );
  updateConversationUpdatedAt(snapshot, conversationId, replyAt);
  await saveDemoSnapshot(snapshot);
  return { snapshot, exchangeId };
}

export async function replyToAssistantExchange(exchangeId: string, text: string): Promise<DemoSnapshot> {
  const trimmed = text.trim();
  const base = await getDemoSnapshot();
  if (!trimmed) {
    return base;
  }
  const snapshot = cloneSnapshot(base);
  const exchange = getExchangeById(snapshot, exchangeId);
  if (!exchange || exchange.status === "resolved" || exchange.status === "dismissed") {
    return base;
  }

  const timestamp = nowIso();
  if (trimmed === "DONE") {
    const resolutionId = nextId("aemsg");
    const finalBody = exchange.sourceType === "user-demo" ? "OK, so it's DONE" : "Done.";
    exchange.status = "resolved";
    exchange.resolutionMessageId = resolutionId;
    exchange.latestMessageId = resolutionId;
    exchange.requiresUserAction = false;
    exchange.resolvedAt = timestamp;
    exchange.updatedAt = timestamp;
    snapshot.assistantExchangeMessages.push({
      id: resolutionId,
      conversationId: exchange.conversationId,
      exchangeId: exchange.id,
      role: exchange.sourceType === "user-demo" ? "assistant" : "user",
      kind: "resolution",
      body: finalBody,
      createdAt: timestamp,
      surface: "app",
    });
    if (exchange.linkedAttentionItemId) {
      const item = snapshot.attentionItems.find((entry) => entry.id === exchange.linkedAttentionItemId);
      if (item) {
        item.status = "resolved";
        item.resolvedAt = timestamp;
      }
    }
    updateConversationUpdatedAt(snapshot, exchange.conversationId, timestamp);
    await saveDemoSnapshot(snapshot);
    return snapshot;
  }

  const userReplyId = nextId("aemsg");
  const assistantReplyId = nextId("aemsg");
  const assistantReplyAt = new Date(Date.now() + 1).toISOString();
  exchange.status = "in-progress";
  exchange.latestMessageId = assistantReplyId;
  exchange.replyCount += 1;
  exchange.updatedAt = assistantReplyAt;
  snapshot.assistantExchangeMessages.push(
    {
      id: userReplyId,
      conversationId: exchange.conversationId,
      exchangeId: exchange.id,
      role: "user",
      kind: "reply",
      body: trimmed,
      createdAt: timestamp,
      surface: "app",
    },
    {
      id: assistantReplyId,
      conversationId: exchange.conversationId,
      exchangeId: exchange.id,
      role: "assistant",
      kind: "reply",
      body: `Reply to: ${trimmed}`,
      createdAt: assistantReplyAt,
      surface: "app",
    }
  );
  updateConversationUpdatedAt(snapshot, exchange.conversationId, assistantReplyAt);
  await saveDemoSnapshot(snapshot);
  return snapshot;
}

export async function resolveAssistantExchange(exchangeId: string): Promise<DemoSnapshot> {
  return replyToAssistantExchange(exchangeId, "DONE");
}

export async function updateAssistantPlaybook(
  playbookId: string,
  patch: Partial<
    Pick<
      AssistantPlaybookRecord,
      "identityMarkdown" | "defaultsMarkdown" | "contextMarkdown" | "overridesMarkdown"
    >
  >
): Promise<DemoSnapshot> {
  const base = await getDemoSnapshot();
  const snapshot = cloneSnapshot(base);
  const playbook = snapshot.assistantPlaybooks.find((entry) => entry.id === playbookId);
  if (!playbook) {
    return base;
  }
  Object.assign(playbook, patch, { updatedAt: nowIso() });
  await saveDemoSnapshot(snapshot);
  return snapshot;
}

export async function appendThreadMessage(
  threadId: string,
  role: "user" | "assistant" | "system",
  text: string
): Promise<DemoSnapshot> {
  const base = await getDemoSnapshot();
  const snapshot = cloneSnapshot(base);
  const thread = snapshot.threads.find((entry) => entry.id === threadId);
  if (!thread) {
    return base;
  }
  thread.messages.push({
    id: nextId("msg"),
    role,
    text,
    createdAt: nowIso(),
  });
  thread.updatedAt = nowIso();
  appendActivity(snapshot, {
    kind: "thread-message",
    title: role === "assistant" ? "Assistant message added" : "Thread message added",
    detail: text,
    threadId,
    documentId: thread.parentDocumentId ?? null,
  });
  await saveDemoSnapshot(snapshot);
  return snapshot;
}

function findActionLabel<T extends { uiCards: Array<{ actions?: DemoActionDefinition[] }> }>(
  entry: T,
  actionId: string
): DemoActionDefinition | null {
  for (const card of entry.uiCards) {
    const action = card.actions?.find((candidate) => candidate.id === actionId);
    if (action) {
      return action;
    }
  }
  return null;
}

export async function applyDocumentAction(documentId: string, actionId: string): Promise<DemoSnapshot> {
  const base = await getDemoSnapshot();
  const snapshot = cloneSnapshot(base);
  const document = snapshot.documents.find((entry) => entry.id === documentId);
  if (!document) {
    return base;
  }
  const action = findActionLabel(document, actionId);
  if (!action) {
    return base;
  }
  if (action.nextStatus) {
    document.status = action.nextStatus;
  }
  document.details = {
    ...document.details,
    ...(action.metadataPatch ?? {}),
    lastAction: action.label,
    lastActionAt: nowIso(),
  };
  document.updatedAt = nowIso();
  appendActivity(snapshot, {
    kind: "document-action",
    title: action.activityTitle,
    detail: action.activityDetail,
    documentId,
  });
  await saveDemoSnapshot(snapshot);
  return snapshot;
}

export async function applyThreadAction(threadId: string, actionId: string): Promise<DemoSnapshot> {
  const base = await getDemoSnapshot();
  const snapshot = cloneSnapshot(base);
  const thread = snapshot.threads.find((entry) => entry.id === threadId);
  if (!thread) {
    return base;
  }
  const action = findActionLabel(thread, actionId);
  if (!action) {
    return base;
  }
  if (action.nextStatus && ["active", "paused", "blocked", "completed"].includes(action.nextStatus)) {
    thread.status = action.nextStatus as typeof thread.status;
  }
  if (actionId.includes("complete")) {
    thread.progress = 100;
  } else if (actionId.includes("pause")) {
    thread.progress = Math.max(thread.progress, 20);
  } else {
    thread.progress = Math.min(100, thread.progress + 12);
  }
  thread.updatedAt = nowIso();
  appendActivity(snapshot, {
    kind: "thread-action",
    title: action.activityTitle,
    detail: action.activityDetail,
    threadId,
    documentId: thread.parentDocumentId ?? null,
  });
  await saveDemoSnapshot(snapshot);
  return snapshot;
}

export async function createWorkspaceFromTemplate(): Promise<{ snapshot: DemoSnapshot; workspaceId: string }> {
  return { snapshot: await getDemoSnapshot(), workspaceId: "" };
}

export async function createThreadInScope(): Promise<{ snapshot: DemoSnapshot; threadId: string }> {
  return { snapshot: await getDemoSnapshot(), threadId: "" };
}

export async function createRootDocument(): Promise<{ snapshot: DemoSnapshot; documentId: string }> {
  return { snapshot: await getDemoSnapshot(), documentId: "" };
}

export async function addScopeDocument(): Promise<{ snapshot: DemoSnapshot; documentId: string }> {
  return { snapshot: await getDemoSnapshot(), documentId: "" };
}

export async function retryWorkspaceBootstrap(): Promise<DemoSnapshot> {
  return getDemoSnapshot();
}

export async function markWorkspaceBootstrapFailed(): Promise<DemoSnapshot> {
  return getDemoSnapshot();
}

export async function markWorkspaceBootstrapRunning(): Promise<DemoSnapshot> {
  return getDemoSnapshot();
}

export async function markWorkspaceBootstrapSuccess(): Promise<DemoSnapshot> {
  return getDemoSnapshot();
}

export async function syncThreadDocumentSnapshot(): Promise<DemoSnapshot> {
  return getDemoSnapshot();
}
