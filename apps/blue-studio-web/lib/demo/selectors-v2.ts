import type {
  AssistantConversationRecord,
  AssistantExchangeMessageKind,
  AssistantExchangeRecord,
  AssistantPlaybookRecord,
  DemoEmbeddedDocumentRecord,
  DemoAccountRecord,
  DemoOperationRecord,
  DemoParticipantRecord,
  DemoSnapshot,
  DemoShareSettings,
  DemoServiceConnectionRecord,
  DemoViewerAccessMode,
  DocumentAnchorRecord,
  DocumentRecord,
  ActivityRecord,
  ThreadRecord,
} from "@/lib/demo/types";

export type HomeSectionKey = "chat" | "needs-action" | "tasks" | "documents" | "services";
export type ProfileSectionKey = "public-info" | "public-documents" | "settings";

function normalize(text: string): string {
  return text.trim().toLowerCase();
}

function uniqueById<T extends { id: string }>(items: T[]): T[] {
  const seen = new Set<string>();
  return items.filter((item) => {
    if (seen.has(item.id)) {
      return false;
    }
    seen.add(item.id);
    return true;
  });
}

function accountToParticipant(account: DemoAccountRecord): DemoParticipantRecord {
  return {
    id: account.id,
    accountId: account.id,
    name: account.name,
    email: account.email,
    subtitle: account.subtitle,
    avatar: account.avatar ?? null,
    roles: [],
  };
}

export function getAccountById(snapshot: DemoSnapshot, accountId: string): DemoAccountRecord | null {
  return snapshot.accounts.find((account) => account.id === accountId) ?? null;
}

export function getPrimaryAccount(snapshot: DemoSnapshot): DemoAccountRecord | null {
  return snapshot.accounts.find((account) => account.isPrimary) ?? snapshot.accounts[0] ?? null;
}

export function getActiveAccount(
  snapshot: DemoSnapshot,
  activeAccountId?: string | null
): DemoAccountRecord | null {
  if (activeAccountId) {
    return getAccountById(snapshot, activeAccountId) ?? getPrimaryAccount(snapshot);
  }
  return getPrimaryAccount(snapshot);
}

export function getDocumentById(snapshot: DemoSnapshot, documentId: string): DocumentRecord | null {
  return snapshot.documents.find((document) => document.id === documentId) ?? null;
}

export function getThreadById(snapshot: DemoSnapshot, threadId: string): ThreadRecord | null {
  return snapshot.threads.find((thread) => thread.id === threadId) ?? null;
}

export function getDocumentAnchorById(
  snapshot: DemoSnapshot,
  anchorId: string
): DocumentAnchorRecord | null {
  return snapshot.documentAnchors.find((anchor) => anchor.id === anchorId) ?? null;
}

export function getDocumentViewerAccess(
  snapshot: DemoSnapshot,
  documentId: string,
  viewerAccountId: string
): DemoViewerAccessMode {
  const document = getDocumentById(snapshot, documentId);
  if (!document) {
    return "none";
  }
  if (document.ownerAccountId === viewerAccountId) {
    return "owner";
  }
  if (document.participantAccountIds.includes(viewerAccountId)) {
    return "participant";
  }
  if (document.isPublic || document.visibleToAccountIds.includes(viewerAccountId)) {
    return "public";
  }
  return "none";
}

export function canViewerAccessDocument(
  snapshot: DemoSnapshot,
  documentId: string,
  viewerAccountId: string
): boolean {
  return getDocumentViewerAccess(snapshot, documentId, viewerAccountId) !== "none";
}

export function getAccessibleDocumentsForAccount(
  snapshot: DemoSnapshot,
  accountId: string
): DocumentRecord[] {
  return snapshot.documents
    .filter((document) => canViewerAccessDocument(snapshot, document.id, accountId))
    .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));
}

export function getFavoriteDocumentsForAccount(
  snapshot: DemoSnapshot,
  accountId: string
): DocumentRecord[] {
  const account = getAccountById(snapshot, accountId);
  if (!account) {
    return [];
  }
  return account.favoriteDocumentIds
    .map((documentId) => getDocumentById(snapshot, documentId))
    .filter((document): document is DocumentRecord => !!document)
    .filter((document) => canViewerAccessDocument(snapshot, document.id, accountId))
    .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));
}

export function getPublicDocuments(snapshot: DemoSnapshot): DocumentRecord[] {
  return snapshot.documents
    .filter((document) => document.isPublic || document.searchVisibility === "public")
    .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));
}

export function getPublicDocumentsForAccount(
  snapshot: DemoSnapshot,
  accountId: string
): DocumentRecord[] {
  const account = getAccountById(snapshot, accountId);
  if (!account) {
    return [];
  }
  return account.publicDocumentIds
    .map((documentId) => getDocumentById(snapshot, documentId))
    .filter((document): document is DocumentRecord => !!document)
    .filter((document) => canViewerAccessDocument(snapshot, document.id, accountId))
    .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));
}

export function getPublicAccounts(snapshot: DemoSnapshot): DemoAccountRecord[] {
  return snapshot.accounts.filter((account) => account.publicDocumentIds.length > 0);
}

export function getHomeNeedsActionForAccount(snapshot: DemoSnapshot, accountId: string) {
  return snapshot.attentionItems
    .filter(
      (item) =>
        item.accountId === accountId &&
        item.status === "pending" &&
        (!item.visibleToAccountIds || item.visibleToAccountIds.includes(accountId))
    )
    .sort((left, right) => right.createdAt.localeCompare(left.createdAt));
}

export function getHomeTasksForAccount(snapshot: DemoSnapshot, accountId: string): ThreadRecord[] {
  return snapshot.threads
    .filter((thread) => thread.visibleToAccountIds.includes(accountId))
    .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));
}

export function getHomeDocumentsForAccount(snapshot: DemoSnapshot, accountId: string): DocumentRecord[] {
  return getAccessibleDocumentsForAccount(snapshot, accountId).filter((document) => !document.isService);
}

export function getHomeServicesForAccount(snapshot: DemoSnapshot, accountId: string): DocumentRecord[] {
  return getAccessibleDocumentsForAccount(snapshot, accountId).filter((document) => document.isService);
}

export function getTasksForDocument(
  snapshot: DemoSnapshot,
  documentId: string,
  accountId: string
): ThreadRecord[] {
  return snapshot.threads
    .filter(
      (thread) =>
        thread.parentDocumentId === documentId && thread.visibleToAccountIds.includes(accountId)
    )
    .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));
}

export function getNeedsActionForDocument(
  snapshot: DemoSnapshot,
  documentId: string,
  accountId: string
) {
  return snapshot.attentionItems
    .filter(
      (item) =>
        item.relatedDocumentId === documentId &&
        item.accountId === accountId &&
        item.status === "pending" &&
        (!item.visibleToAccountIds || item.visibleToAccountIds.includes(accountId))
    )
    .sort((left, right) => right.createdAt.localeCompare(left.createdAt));
}

export function getDocumentAnchorsForViewer(
  snapshot: DemoSnapshot,
  documentId: string,
  accountId: string
): DocumentAnchorRecord[] {
  const document = getDocumentById(snapshot, documentId);
  if (!document) {
    return [];
  }
  return document.anchorIds
    .map((anchorId) => getDocumentAnchorById(snapshot, anchorId))
    .filter((anchor): anchor is DocumentAnchorRecord => !!anchor)
    .filter(
      (anchor) =>
        !anchor.visibleToAccountIds || anchor.visibleToAccountIds.includes(accountId)
    );
}

export function getVisibleDocumentsForAnchor(
  snapshot: DemoSnapshot,
  documentId: string,
  anchorId: string,
  accountId: string
): DocumentRecord[] {
  const anchor = getDocumentAnchorById(snapshot, anchorId);
  if (!anchor || anchor.documentId !== documentId) {
    return [];
  }
  const parentDocument = getDocumentById(snapshot, documentId);
  const anchorKey = normalize(anchor.key);
  const isFreshBitesOrders = parentDocument?.id === "doc_fresh_bites" && anchorKey === "orders";

  const linkedDocs = anchor.linkedDocumentIds
    .map((linkedId) => getDocumentById(snapshot, linkedId))
    .filter((document): document is DocumentRecord => !!document)
    .filter((document) => canViewerAccessDocument(snapshot, document.id, accountId));

  if (isFreshBitesOrders && accountId !== parentDocument?.ownerAccountId) {
    return linkedDocs
      .filter(
        (document) =>
          document.ownerAccountId === accountId ||
          document.participantAccountIds.includes(accountId) ||
          document.id === "doc_order_fresh_bites_bob"
      )
      .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));
  }

  return linkedDocs.sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));
}

export function getViewerVisibleLinkedDocuments(
  snapshot: DemoSnapshot,
  documentId: string,
  accountId: string
): DocumentRecord[] {
  const document = getDocumentById(snapshot, documentId);
  if (!document) {
    return [];
  }
  return document.linkedDocumentIds
    .map((linkedId) => getDocumentById(snapshot, linkedId))
    .filter((item): item is DocumentRecord => !!item)
    .filter((item) => canViewerAccessDocument(snapshot, item.id, accountId))
    .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));
}

export function getDocumentParticipants(
  snapshot: DemoSnapshot,
  documentId: string
): DemoParticipantRecord[] {
  const document = getDocumentById(snapshot, documentId);
  if (!document) {
    return [];
  }
  if (document.participantsDetailed?.length) {
    return document.participantsDetailed;
  }

  const accountParticipants = [
    document.ownerAccountId,
    ...document.participantAccountIds,
  ]
    .map((accountId) => getAccountById(snapshot, accountId))
    .filter((account): account is DemoAccountRecord => !!account)
    .map((account) => {
      const participant = accountToParticipant(account);
      participant.roles = [
        account.id === document.ownerAccountId ? "Owner" : "Participant",
      ];
      return participant;
    });

  if (accountParticipants.length > 0) {
    return uniqueById(accountParticipants);
  }

  return document.participants.map((name, index) => ({
    id: `${document.id}_participant_${index}`,
    name,
    subtitle: index === 0 ? "Owner" : "Participant",
    roles: [index === 0 ? "Owner" : "Participant"],
  }));
}

export function getDocumentAllOperations(
  snapshot: DemoSnapshot,
  documentId: string
): DemoOperationRecord[] {
  const document = getDocumentById(snapshot, documentId);
  if (!document) {
    return [];
  }
  if (document.allOperations?.length) {
    return document.allOperations;
  }

  return document.uiCards.flatMap((card, cardIndex) =>
    (card.actions ?? []).map((action, actionIndex) => ({
      id: action.id,
      title: action.label,
      summary: action.description ?? action.activityDetail ?? card.body,
      status: "available" as const,
      kind: document.isService ? "service" : actionIndex === 0 && cardIndex === 0 ? "user" : "system",
      actionLabel: action.label,
    }))
  );
}

export function getDocumentPendingOperations(
  snapshot: DemoSnapshot,
  documentId: string,
  accountId: string
): DemoOperationRecord[] {
  const document = getDocumentById(snapshot, documentId);
  if (!document) {
    return [];
  }
  if (document.pendingOperations?.length) {
    return document.pendingOperations;
  }

  const fromAttention = getNeedsActionForDocument(snapshot, documentId, accountId).flatMap((item) =>
    (item.availableActionLabels ?? []).map((label, index) => ({
      id: `${item.id}_${index}`,
      title: label,
      summary: item.body,
      status: "pending" as const,
      kind: "user" as const,
      actionLabel: label,
    }))
  );

  if (fromAttention.length > 0) {
    return uniqueById(fromAttention);
  }

  return getDocumentAllOperations(snapshot, documentId).slice(0, 2);
}

export function getDocumentEmbeddedDocuments(
  snapshot: DemoSnapshot,
  documentId: string,
  accountId: string
): DemoEmbeddedDocumentRecord[] {
  const document = getDocumentById(snapshot, documentId);
  if (!document) {
    return [];
  }

  if (document.embeddedDocuments?.length) {
    return document.embeddedDocuments.filter((entry) =>
      canViewerAccessDocument(snapshot, entry.documentId, accountId)
    );
  }

  return getViewerVisibleLinkedDocuments(snapshot, documentId, accountId)
    .slice(0, 6)
    .map((entry) => ({
      documentId: entry.id,
      title: entry.title,
      subtitle: entry.typeLabel ?? entry.kind,
      summary: entry.summary,
      status: entry.status,
    }));
}

export function getDocumentDescription(snapshot: DemoSnapshot, documentId: string): string {
  const document = getDocumentById(snapshot, documentId);
  if (!document) {
    return "";
  }
  if (document.descriptionText?.trim()) {
    return document.descriptionText;
  }
  return document.summary;
}

export function getDocumentInitialMessage(snapshot: DemoSnapshot, documentId: string): string {
  const document = getDocumentById(snapshot, documentId);
  if (!document) {
    return "";
  }
  if (document.initialMessage?.trim()) {
    return document.initialMessage;
  }
  return `Open ${document.title} to review the current state, run the available operations, and coordinate the next step with Blink.`;
}

export function getDocumentCurrentStateText(snapshot: DemoSnapshot, documentId: string): string {
  const document = getDocumentById(snapshot, documentId);
  if (!document) {
    return "";
  }
  if (document.currentStateText?.trim()) {
    return document.currentStateText;
  }
  return `${document.title} is currently ${document.status}. ${document.oneLineSummary ?? document.summary}`;
}

export function getDocumentCurrentStateFields(
  snapshot: DemoSnapshot,
  documentId: string
) {
  const document = getDocumentById(snapshot, documentId);
  if (!document) {
    return [];
  }
  if (document.currentStateFields?.length) {
    return document.currentStateFields;
  }
  return document.coreFields.slice(0, 4);
}

export function getDocumentSourceData(
  snapshot: DemoSnapshot,
  documentId: string
): Record<string, unknown> | string {
  const document = getDocumentById(snapshot, documentId);
  if (!document) {
    return {};
  }
  if (document.sourceData) {
    return document.sourceData;
  }
  return document.details;
}

export function getDocumentShareSettings(
  snapshot: DemoSnapshot,
  documentId: string
): DemoShareSettings | null {
  const document = getDocumentById(snapshot, documentId);
  if (!document) {
    return null;
  }

  if (document.shareSettings) {
    return document.shareSettings;
  }

  const participants = getDocumentParticipants(snapshot, documentId)
    .filter((participant) => participant.accountId !== document.ownerAccountId)
    .map((participant, index) => ({
      id: `${document.id}_share_${index}`,
      type: "account" as const,
      name: participant.name,
      subtitle: participant.email ?? participant.subtitle ?? "Account access",
      agreement: document.title,
      status: "read-only",
    }));

  return {
    shareWithOthers: participants.length > 0 || document.isPublic,
    makePublic: document.isPublic,
    entries: participants,
  };
}

export function getDocumentServices(
  snapshot: DemoSnapshot,
  documentId: string
): DemoServiceConnectionRecord[] {
  const document = getDocumentById(snapshot, documentId);
  if (!document) {
    return [];
  }

  if (document.services?.length) {
    return document.services;
  }

  if (document.isService) {
    return [
      {
        id: `${document.id}_service_self`,
        name: document.title,
        provider: document.owner,
        status: "connected",
        description: document.oneLineSummary ?? document.summary,
      },
    ];
  }

  return [];
}

export function getDocumentActivity(
  snapshot: DemoSnapshot,
  documentId: string,
  accountId?: string
): ActivityRecord[] {
  const seeded = getDocumentById(snapshot, documentId)?.activity ?? [];
  const runtime = snapshot.activity.filter(
    (entry) =>
      entry.documentId === documentId &&
      (!accountId || !entry.visibleToAccountIds || entry.visibleToAccountIds.includes(accountId))
  );

  return uniqueById([...runtime, ...seeded]).sort((left, right) =>
    left.createdAt.localeCompare(right.createdAt)
  );
}

export function getThreadActivity(
  snapshot: DemoSnapshot,
  threadId: string,
  accountId?: string
): ActivityRecord[] {
  const seeded = getThreadById(snapshot, threadId)?.activity ?? [];
  const runtime = snapshot.activity.filter(
    (entry) =>
      entry.threadId === threadId &&
      (!accountId || !entry.visibleToAccountIds || entry.visibleToAccountIds.includes(accountId))
  );

  return uniqueById([...runtime, ...seeded]).sort((left, right) =>
    left.createdAt.localeCompare(right.createdAt)
  );
}

export function getHomeConversation(
  snapshot: DemoSnapshot,
  accountId: string
): AssistantConversationRecord | null {
  return (
    snapshot.assistantConversations.find(
      (conversation) =>
        conversation.targetType === "home" &&
        conversation.targetId === accountId &&
        conversation.viewerAccountId === accountId
    ) ?? null
  );
}

export function getDocumentConversation(
  snapshot: DemoSnapshot,
  documentId: string,
  viewerAccountId: string
): AssistantConversationRecord | null {
  return (
    snapshot.assistantConversations.find(
      (conversation) =>
        conversation.targetType === "document" &&
        conversation.targetId === documentId &&
        conversation.viewerAccountId === viewerAccountId
    ) ?? null
  );
}

export function getConversationExchanges(
  snapshot: DemoSnapshot,
  conversationId: string
): AssistantExchangeRecord[] {
  return snapshot.assistantExchanges
    .filter((exchange) => exchange.conversationId === conversationId)
    .sort((left, right) => left.openedAt.localeCompare(right.openedAt));
}

export function getExchangeMessages(snapshot: DemoSnapshot, exchangeId: string) {
  return snapshot.assistantExchangeMessages
    .filter((message) => message.exchangeId === exchangeId)
    .sort((left, right) => left.createdAt.localeCompare(right.createdAt));
}

export function getConversationPlaybook(
  snapshot: DemoSnapshot,
  targetType: "home" | "document",
  targetId: string,
  viewerAccountId: string
): AssistantPlaybookRecord | null {
  return (
    snapshot.assistantPlaybooks.find(
      (playbook) =>
        playbook.targetType === targetType &&
        playbook.targetId === targetId &&
        playbook.viewerAccountId === viewerAccountId
    ) ?? null
  );
}

export interface AssistantTimelineItem {
  id: string;
  exchangeId: string;
  messageId: string;
  kind: Extract<AssistantExchangeMessageKind, "opener" | "resolution">;
  role: "assistant" | "user" | "system";
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
  conversationId: string
): AssistantTimelineItem[] {
  const exchanges = getConversationExchanges(snapshot, conversationId);
  const messageById = new Map(
    snapshot.assistantExchangeMessages.map((message) => [message.id, message])
  );
  const items: AssistantTimelineItem[] = [];

  for (const exchange of exchanges) {
    const opener = messageById.get(exchange.openerMessageId);
    if (opener) {
      items.push({
        id: `${exchange.id}_opener`,
        exchangeId: exchange.id,
        messageId: opener.id,
        kind: "opener",
        role: opener.role,
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
        items.push({
          id: `${exchange.id}_resolution`,
          exchangeId: exchange.id,
          messageId: resolution.id,
          kind: "resolution",
          role: resolution.role,
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

  return items.sort((left, right) => left.createdAt.localeCompare(right.createdAt));
}

export function getConversationOpenExchanges(
  snapshot: DemoSnapshot,
  conversationId: string
): AssistantExchangeRecord[] {
  return getConversationExchanges(snapshot, conversationId).filter(
    (exchange) => exchange.status === "open" || exchange.status === "in-progress"
  );
}

export function getViewerSpecificCommentDocuments(
  snapshot: DemoSnapshot,
  noteDocumentId: string,
  accountId: string
): DocumentRecord[] {
  const anchors = getDocumentAnchorsForViewer(snapshot, noteDocumentId, accountId);
  const commentAnchor = anchors.find((anchor) => normalize(anchor.key) === "comments");
  if (!commentAnchor) {
    return [];
  }
  return getVisibleDocumentsForAnchor(snapshot, noteDocumentId, commentAnchor.id, accountId);
}

export function getRelatedDocumentsForViewer(
  snapshot: DemoSnapshot,
  documentId: string,
  accountId: string
): DocumentRecord[] {
  return snapshot.documents
    .filter(
      (document) =>
        document.parentDocumentId === documentId &&
        canViewerAccessDocument(snapshot, document.id, accountId)
    )
    .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));
}
