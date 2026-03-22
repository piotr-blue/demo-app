import { BLINK_SCOPE_ID } from "@/lib/demo/seed";
import type {
  AssistantConversationRecord,
  AssistantExchangeMessageKind,
  AssistantExchangeRecord,
  AssistantPlaybookRecord,
  DemoSnapshot,
  DocumentRecord,
  ScopeRecord,
  ThreadRecord,
} from "@/lib/demo/types";

export function getBlinkScope(snapshot: DemoSnapshot): ScopeRecord | null {
  return snapshot.scopes.find((scope) => scope.id === BLINK_SCOPE_ID || scope.type === "blink") ?? null;
}

export function getScopeById(snapshot: DemoSnapshot, scopeId: string): ScopeRecord | null {
  return snapshot.scopes.find((scope) => scope.id === scopeId) ?? null;
}

export function getThreadById(snapshot: DemoSnapshot, threadId: string): ThreadRecord | null {
  return snapshot.threads.find((thread) => thread.id === threadId) ?? null;
}

export function getDocumentById(snapshot: DemoSnapshot, documentId: string): DocumentRecord | null {
  return snapshot.documents.find((document) => document.id === documentId) ?? null;
}

export function getWorkspaceScopes(snapshot: DemoSnapshot): ScopeRecord[] {
  return snapshot.scopes
    .filter((scope) => scope.type === "workspace")
    .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));
}

export function getScopeThreads(snapshot: DemoSnapshot, scopeId: string): ThreadRecord[] {
  return snapshot.threads
    .filter((thread) => thread.scopeId === scopeId)
    .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));
}

export function getScopeDocuments(snapshot: DemoSnapshot, scopeId: string): DocumentRecord[] {
  return snapshot.documents
    .filter((document) => document.scopeId === scopeId)
    .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));
}

export function getRootDocuments(snapshot: DemoSnapshot): DocumentRecord[] {
  return snapshot.documents
    .filter((document) => document.scopeId === null)
    .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));
}

export function getScopeServices(snapshot: DemoSnapshot, scopeId: string): DocumentRecord[] {
  if (scopeId === BLINK_SCOPE_ID) {
    return snapshot.documents
      .filter((document) => document.scopeId === null && document.isService)
      .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));
  }
  return snapshot.documents
    .filter((document) => document.scopeId === scopeId && document.isService)
    .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));
}

export function getScopeDocumentsBySection(
  snapshot: DemoSnapshot,
  scopeId: string,
  sectionKey: string
): DocumentRecord[] {
  if (scopeId === BLINK_SCOPE_ID) {
    return snapshot.documents
      .filter((document) => document.scopeId === null && document.sectionKey === sectionKey)
      .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));
  }
  return snapshot.documents
    .filter((document) => document.scopeId === scopeId && document.sectionKey === sectionKey)
    .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));
}

export function getScopeThreadsBySection(
  snapshot: DemoSnapshot,
  scopeId: string,
  sectionKey: string
): ThreadRecord[] {
  return snapshot.threads
    .filter((thread) => thread.scopeId === scopeId && thread.sectionKey === sectionKey)
    .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));
}

export function getScopeAttention(snapshot: DemoSnapshot, scopeId: string) {
  return snapshot.attentionItems
    .filter((item) => item.scopeId === scopeId && item.status === "pending")
    .sort((left, right) => right.createdAt.localeCompare(left.createdAt));
}

export function getScopeActivity(snapshot: DemoSnapshot, scopeId: string) {
  return snapshot.activity
    .filter((entry) => entry.scopeId === scopeId)
    .sort((left, right) => right.createdAt.localeCompare(left.createdAt));
}

export function getScopeAssistantConversation(
  snapshot: DemoSnapshot,
  scopeId: string
): AssistantConversationRecord | null {
  const scope = getScopeById(snapshot, scopeId);
  if (scope?.assistantConversationId) {
    return (
      snapshot.assistantConversations.find(
        (conversation) => conversation.id === scope.assistantConversationId
      ) ?? null
    );
  }
  return (
    snapshot.assistantConversations.find((conversation) => conversation.scopeId === scopeId) ?? null
  );
}

export function getScopeAssistantPlaybook(
  snapshot: DemoSnapshot,
  scopeId: string
): AssistantPlaybookRecord | null {
  const scope = getScopeById(snapshot, scopeId);
  if (scope?.assistantPlaybookId) {
    return snapshot.assistantPlaybooks.find((playbook) => playbook.id === scope.assistantPlaybookId) ?? null;
  }
  return snapshot.assistantPlaybooks.find((playbook) => playbook.scopeId === scopeId) ?? null;
}

export function getScopeAssistantExchanges(
  snapshot: DemoSnapshot,
  scopeId: string
): AssistantExchangeRecord[] {
  return snapshot.assistantExchanges
    .filter((exchange) => exchange.scopeId === scopeId)
    .sort((left, right) => left.openedAt.localeCompare(right.openedAt));
}

export function getOpenAssistantExchanges(
  snapshot: DemoSnapshot,
  scopeId: string
): AssistantExchangeRecord[] {
  return getScopeAssistantExchanges(snapshot, scopeId).filter(
    (exchange) => exchange.status === "open" || exchange.status === "in-progress"
  );
}

export function getExchangeMessages(snapshot: DemoSnapshot, exchangeId: string) {
  return snapshot.assistantExchangeMessages
    .filter((message) => message.exchangeId === exchangeId)
    .sort((left, right) => left.createdAt.localeCompare(right.createdAt));
}

export interface AssistantTimelineItem {
  id: string;
  exchangeId: string;
  messageId: string;
  kind: Extract<AssistantExchangeMessageKind, "opener" | "resolution">;
  body: string;
  createdAt: string;
  exchangeStatus: AssistantExchangeRecord["status"];
  exchangeType: AssistantExchangeRecord["type"];
  exchangeTitle: string;
  replyCount: number;
  requiresUserAction: boolean;
}

export function getAssistantTimelineItems(
  snapshot: DemoSnapshot,
  scopeId: string
): AssistantTimelineItem[] {
  const exchanges = getScopeAssistantExchanges(snapshot, scopeId);
  const messageById = new Map(
    snapshot.assistantExchangeMessages.map((message) => [message.id, message])
  );
  const timelineItems: AssistantTimelineItem[] = [];

  for (const exchange of exchanges) {
    const opener = messageById.get(exchange.openerMessageId);
    if (opener) {
      timelineItems.push({
        id: `${exchange.id}_opener`,
        exchangeId: exchange.id,
        messageId: opener.id,
        kind: "opener",
        body: opener.body,
        createdAt: opener.createdAt,
        exchangeStatus: exchange.status,
        exchangeType: exchange.type,
        exchangeTitle: exchange.title,
        replyCount: exchange.replyCount,
        requiresUserAction: exchange.requiresUserAction,
      });
    }
    if (exchange.resolutionMessageId) {
      const resolution = messageById.get(exchange.resolutionMessageId);
      if (resolution) {
        timelineItems.push({
          id: `${exchange.id}_resolution`,
          exchangeId: exchange.id,
          messageId: resolution.id,
          kind: "resolution",
          body: resolution.body,
          createdAt: resolution.createdAt,
          exchangeStatus: exchange.status,
          exchangeType: exchange.type,
          exchangeTitle: exchange.title,
          replyCount: exchange.replyCount,
          requiresUserAction: exchange.requiresUserAction,
        });
      }
    }
  }

  return timelineItems.sort((left, right) => left.createdAt.localeCompare(right.createdAt));
}
