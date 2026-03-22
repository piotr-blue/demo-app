import {
  createAssistantConversationId,
  createAssistantExchangeId,
  createAssistantExchangeMessageId,
  createAssistantPlaybookId,
  createDocumentId,
  createMessageId,
  createScopeId,
  createThreadId,
  createAttentionId,
} from "@/lib/demo/ids";
import {
  clearDemoPersistence,
  getAssistantConversation,
  getAssistantConversationById,
  getAssistantExchangeById,
  getAssistantMessagesForExchange,
  getAssistantPlaybook,
  getDemoSnapshot,
  getDocument,
  getScope,
  getThread,
  saveActivity,
  saveActivities,
  saveAssistantConversation,
  saveAssistantExchange,
  saveAssistantExchangeMessages,
  saveAssistantPlaybook,
  saveAttentionItem,
  saveDocument,
  saveScope,
  saveThread,
} from "@/lib/demo/storage";
import { getWorkspaceTemplate } from "@/lib/demo/workspace-templates";
import { buildGenericDocumentCards, buildThreadUiCards } from "@/lib/demo/document-ui";
import { BLINK_SCOPE_ID } from "@/lib/demo/seed";
import type {
  ActivityRecord,
  AssistantConversationRecord,
  AssistantExchangeMessageRecord,
  AssistantExchangeRecord,
  AssistantPlaybookRecord,
  AttentionItem,
  BaseChatMessage,
  DemoActionDefinition,
  DemoSectionDefinition,
  DemoSettingsBlock,
  DemoSnapshot,
  DocumentRecord,
  ScopeRecord,
  ThreadRecord,
  WorkspaceTemplateKey,
} from "@/lib/demo/types";

function nowIso(): string {
  return new Date().toISOString();
}

function appendUnique(items: string[], value: string): string[] {
  if (items.includes(value)) {
    return items;
  }
  return [...items, value];
}

function createScopeActivity(params: {
  id?: string;
  scopeId: string;
  scopeType: "blink" | "workspace";
  kind: ActivityRecord["kind"];
  title: string;
  detail?: string;
  threadId?: string | null;
  documentId?: string | null;
}): ActivityRecord {
  return {
    id: params.id ?? `act_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    scopeId: params.scopeId,
    scopeType: params.scopeType,
    kind: params.kind,
    title: params.title,
    detail: params.detail,
    createdAt: nowIso(),
    threadId: params.threadId ?? null,
    documentId: params.documentId ?? null,
  };
}

function touchScope(scope: ScopeRecord): ScopeRecord {
  return {
    ...scope,
    updatedAt: nowIso(),
  };
}

function defaultScopeSettings(scopeName: string): DemoSettingsBlock[] {
  return [
    {
      id: "playbook",
      title: "Playbook",
      items: [
        { label: "Primary mode", value: `Operate ${scopeName} via recap + task follow-up` },
        { label: "Assistant behavior", value: "Concise suggestions with explicit next actions" },
      ],
    },
  ];
}

function defaultThreadSettings(scopeName: string): DemoSettingsBlock[] {
  return [
    {
      id: "permissions",
      title: "Permissions summary",
      items: [
        { label: "Visibility", value: `${scopeName} operators` },
        { label: "Escalation mode", value: "Escalate when blocked > 24h" },
      ],
    },
    {
      id: "reporting",
      title: "Reporting preferences",
      items: [
        { label: "Digest inclusion", value: "Include in daily recap" },
        { label: "Status update mode", value: "Manual + assistant notes" },
      ],
    },
  ];
}

function defaultThreadUiCards(threadId: string): ThreadRecord["uiCards"] {
  const makeAction = (
    idSuffix: string,
    label: string,
    activityTitle: string,
    activityDetail: string,
    nextStatus?: string,
    assistantNote?: string
  ): DemoActionDefinition => ({
    id: `${threadId}_${idSuffix}`,
    label,
    activityTitle,
    activityDetail,
    nextStatus,
    assistantNote,
  });

  return [
    {
      id: `${threadId}_controls`,
      title: "Task controls",
      body: "Use these controls to move the task through execution states.",
      actions: [
        makeAction(
          "advance",
          "Advance progress",
          "Progress advanced",
          "Progress advanced with latest task updates.",
          "active",
          "I logged progress and updated your recap queue."
        ),
        makeAction(
          "pause",
          "Pause task",
          "Task paused",
          "Task paused pending external dependency.",
          "paused"
        ),
        makeAction(
          "complete",
          "Mark complete",
          "Task completed",
          "Task marked complete and removed from urgent queue.",
          "completed",
          "Marked complete. I will include this in the digest."
        ),
      ],
    },
  ];
}

const ASSISTANT_DEMO_OPENERS = [
  "Can you confirm whether we should prioritize Alice’s request today?",
  "I need your decision on whether to continue this partnership review.",
  "Should I keep this thread in daily recap or only report exceptions?",
  "Can you confirm whether this item should stay tracked?",
  "Do you want me to escalate this only when exception signals appear?",
];

function buildDefaultPlaybook(scope: ScopeRecord): AssistantPlaybookRecord {
  const now = nowIso();
  return {
    id: createAssistantPlaybookId(),
    scopeId: scope.id,
    inheritsFromScopeId: scope.type === "blink" ? null : BLINK_SCOPE_ID,
    identityMarkdown:
      scope.type === "blink"
        ? "You are Blink, my root operations assistant. Prefer Polish when appropriate."
        : `You are ${scope.assistant.name} for ${scope.name}. Keep responses focused on this workspace.`,
    defaultsMarkdown:
      "- Speak concisely.\n- Prioritize exceptions.\n- Summarize only meaningful changes.",
    contextMarkdown:
      scope.type === "blink"
        ? "- This scope coordinates all workspaces.\n- Highlight important counterparties and risks."
        : `- Workspace context: ${scope.description}\n- Anchors: ${scope.anchors.join(", ")}`,
    overridesMarkdown:
      scope.type === "blink"
        ? "- Keep low-priority chatter in digest.\n- Escalate unresolved asks."
        : "- Use this workspace's local priorities first.\n- Keep non-critical updates as digest.",
    updatedAt: now,
  };
}

async function ensureScopeAssistantState(scope: ScopeRecord): Promise<{
  scope: ScopeRecord;
  conversation: AssistantConversationRecord;
  playbook: AssistantPlaybookRecord;
}> {
  const now = nowIso();
  let conversation = await getAssistantConversation(scope.id);
  let playbook = await getAssistantPlaybook(scope.id);
  let nextScope = scope;
  const writes: Promise<unknown>[] = [];

  if (!conversation) {
    conversation = {
      id: createAssistantConversationId(),
      scopeId: scope.id,
      assistantName: scope.assistant.name,
      createdAt: now,
      updatedAt: now,
      lastSeenAt: null,
      lastRecapAt: null,
    };
    writes.push(saveAssistantConversation(conversation));
    nextScope = { ...nextScope, assistantConversationId: conversation.id, updatedAt: now };
  } else if (scope.assistantConversationId !== conversation.id) {
    nextScope = { ...nextScope, assistantConversationId: conversation.id, updatedAt: now };
  }

  if (!playbook) {
    playbook = buildDefaultPlaybook(scope);
    writes.push(saveAssistantPlaybook(playbook));
    nextScope = { ...nextScope, assistantPlaybookId: playbook.id, updatedAt: now };
  } else if (scope.assistantPlaybookId !== playbook.id) {
    nextScope = { ...nextScope, assistantPlaybookId: playbook.id, updatedAt: now };
  }

  if (nextScope !== scope) {
    writes.push(saveScope(nextScope));
  }

  if (writes.length > 0) {
    await Promise.all(writes);
  }

  return { scope: nextScope, conversation, playbook };
}

function selectAssistantDemoOpener(): string {
  return ASSISTANT_DEMO_OPENERS[Math.floor(Math.random() * ASSISTANT_DEMO_OPENERS.length)] ?? ASSISTANT_DEMO_OPENERS[0];
}

function normalizeExchangeTitle(text: string): string {
  return text.length <= 72 ? text : `${text.slice(0, 69)}...`;
}

export async function loadDemoSnapshot(): Promise<DemoSnapshot> {
  return getDemoSnapshot();
}

export async function appendScopeMessage(
  scopeId: string,
  role: BaseChatMessage["role"],
  text: string
): Promise<DemoSnapshot> {
  const scope = await getScope(scopeId);
  if (!scope) {
    return getDemoSnapshot();
  }
  const message: BaseChatMessage = {
    id: createMessageId(),
    role,
    text,
    createdAt: nowIso(),
  };
  const nextScope = touchScope({
    ...scope,
    messages: [...scope.messages, message],
  });
  const activity = createScopeActivity({
    scopeId: scope.id,
    scopeType: scope.type,
    kind: role === "assistant" ? "assistant-message" : "user-message",
    title: role === "assistant" ? "Assistant replied" : "User message",
    detail: text,
  });

  await Promise.all([
    saveScope({
      ...nextScope,
      activityIds: appendUnique(nextScope.activityIds, activity.id),
    }),
    saveActivity(activity),
  ]);
  return getDemoSnapshot();
}

export async function loadAssistantConversationState(scopeId: string): Promise<DemoSnapshot> {
  const scope = await getScope(scopeId);
  if (!scope) {
    return getDemoSnapshot();
  }
  await ensureScopeAssistantState(scope);
  return getDemoSnapshot();
}

export async function startAssistantDemoDiscussion(scopeId: string): Promise<{
  snapshot: DemoSnapshot;
  exchangeId: string;
}> {
  const scope = await getScope(scopeId);
  if (!scope) {
    return { snapshot: await getDemoSnapshot(), exchangeId: "" };
  }

  const now = nowIso();
  const { scope: ensuredScope, conversation } = await ensureScopeAssistantState(scope);
  const openerText = selectAssistantDemoOpener();
  const exchangeId = createAssistantExchangeId();
  const openerMessageId = createAssistantExchangeMessageId();
  const attentionItemId = createAttentionId();

  const exchange: AssistantExchangeRecord = {
    id: exchangeId,
    conversationId: conversation.id,
    scopeId: ensuredScope.id,
    type: "ask",
    status: "open",
    title: normalizeExchangeTitle(openerText),
    openerMessageId,
    resolutionMessageId: null,
    latestMessageId: openerMessageId,
    replyCount: 0,
    requiresUserAction: true,
    stickyUntilResolved: true,
    linkedAttentionItemId: attentionItemId,
    sourceType: "assistant-demo",
    sourceId: null,
    canDeliverExternally: true,
    externalThreadKey: null,
    openedAt: now,
    resolvedAt: null,
    updatedAt: now,
  };
  const openerMessage: AssistantExchangeMessageRecord = {
    id: openerMessageId,
    conversationId: conversation.id,
    exchangeId,
    scopeId: ensuredScope.id,
    role: "assistant",
    kind: "opener",
    body: openerText,
    createdAt: now,
    surface: "app",
    externalMessageId: null,
    externalThreadMessageId: null,
  };
  const attentionItem: AttentionItem = {
    id: attentionItemId,
    scopeId: ensuredScope.id,
    scopeType: ensuredScope.type,
    status: "pending",
    title: "Assistant needs your decision",
    body: openerText,
    priority: "high",
    relatedThreadId: null,
    relatedDocumentId: null,
    relatedExchangeId: exchangeId,
    createdAt: now,
    resolvedAt: null,
    delivery: {
      inApp: true,
      external: "not-sent",
    },
  };
  const conversationUpdate: AssistantConversationRecord = {
    ...conversation,
    updatedAt: now,
  };
  const nextScope = touchScope({
    ...ensuredScope,
    attentionItemIds: appendUnique(ensuredScope.attentionItemIds, attentionItemId),
  });
  const askActivity = createScopeActivity({
    scopeId: ensuredScope.id,
    scopeType: ensuredScope.type,
    kind: "assistant-ask-created",
    title: "Assistant ask created",
    detail: openerText,
  });
  const discussionOpenedActivity = createScopeActivity({
    scopeId: ensuredScope.id,
    scopeType: ensuredScope.type,
    kind: "assistant-discussion-opened",
    title: "Discussion opened",
    detail: normalizeExchangeTitle(openerText),
  });

  await Promise.all([
    saveAssistantExchange(exchange),
    saveAssistantExchangeMessages([openerMessage]),
    saveAssistantConversation(conversationUpdate),
    saveAttentionItem(attentionItem),
    saveScope({
      ...nextScope,
      activityIds: appendUnique(appendUnique(nextScope.activityIds, askActivity.id), discussionOpenedActivity.id),
    }),
    saveActivities([askActivity, discussionOpenedActivity]),
  ]);

  return { snapshot: await getDemoSnapshot(), exchangeId };
}

export async function startUserDiscussion(scopeId: string, openerText: string): Promise<{
  snapshot: DemoSnapshot;
  exchangeId: string;
}> {
  const scope = await getScope(scopeId);
  if (!scope) {
    return { snapshot: await getDemoSnapshot(), exchangeId: "" };
  }
  const trimmed = openerText.trim();
  if (!trimmed) {
    return { snapshot: await getDemoSnapshot(), exchangeId: "" };
  }

  const now = nowIso();
  const assistantReplyAt = new Date(Date.now() + 1).toISOString();
  const { scope: ensuredScope, conversation } = await ensureScopeAssistantState(scope);
  const exchangeId = createAssistantExchangeId();
  const openerMessageId = createAssistantExchangeMessageId();
  const assistantReplyId = createAssistantExchangeMessageId();
  const assistantReplyBody = `Reply to: ${trimmed}`;
  const exchangeType: AssistantExchangeRecord["type"] = trimmed.endsWith("?")
    ? "question"
    : "instruction";

  const exchange: AssistantExchangeRecord = {
    id: exchangeId,
    conversationId: conversation.id,
    scopeId: ensuredScope.id,
    type: exchangeType,
    status: "in-progress",
    title: normalizeExchangeTitle(trimmed),
    openerMessageId,
    resolutionMessageId: null,
    latestMessageId: assistantReplyId,
    replyCount: 1,
    requiresUserAction: false,
    stickyUntilResolved: false,
    linkedAttentionItemId: null,
    sourceType: "user-demo",
    sourceId: null,
    canDeliverExternally: true,
    externalThreadKey: null,
    openedAt: now,
    resolvedAt: null,
    updatedAt: now,
  };
  const openerMessage: AssistantExchangeMessageRecord = {
    id: openerMessageId,
    conversationId: conversation.id,
    exchangeId,
    scopeId: ensuredScope.id,
    role: "user",
    kind: "opener",
    body: trimmed,
    createdAt: now,
    surface: "app",
    externalMessageId: null,
    externalThreadMessageId: null,
  };
  const assistantReply: AssistantExchangeMessageRecord = {
    id: assistantReplyId,
    conversationId: conversation.id,
    exchangeId,
    scopeId: ensuredScope.id,
    role: "assistant",
    kind: "reply",
    body: assistantReplyBody,
    createdAt: assistantReplyAt,
    surface: "app",
    externalMessageId: null,
    externalThreadMessageId: null,
  };
  const conversationUpdate: AssistantConversationRecord = {
    ...conversation,
    updatedAt: assistantReplyAt,
  };
  const openedActivity = createScopeActivity({
    scopeId: ensuredScope.id,
    scopeType: ensuredScope.type,
    kind: "assistant-discussion-opened",
    title: "Discussion opened",
    detail: trimmed,
  });
  const instructionActivity = createScopeActivity({
    scopeId: ensuredScope.id,
    scopeType: ensuredScope.type,
    kind: "assistant-user-instruction",
    title: "User instruction received",
    detail: trimmed,
  });

  await Promise.all([
    saveAssistantExchange(exchange),
    saveAssistantExchangeMessages([openerMessage, assistantReply]),
    saveAssistantConversation(conversationUpdate),
    saveScope({
      ...touchScope(ensuredScope),
      activityIds: appendUnique(
        appendUnique(ensuredScope.activityIds, openedActivity.id),
        instructionActivity.id
      ),
    }),
    saveActivities([openedActivity, instructionActivity]),
  ]);

  return { snapshot: await getDemoSnapshot(), exchangeId };
}

export async function replyToAssistantExchange(exchangeId: string, text: string): Promise<DemoSnapshot> {
  const exchange = await getAssistantExchangeById(exchangeId);
  if (!exchange) {
    return getDemoSnapshot();
  }
  if (exchange.status === "resolved" || exchange.status === "dismissed") {
    return getDemoSnapshot();
  }

  const scope = await getScope(exchange.scopeId);
  if (!scope) {
    return getDemoSnapshot();
  }
  const conversation = await getAssistantConversationById(exchange.conversationId);
  if (!conversation) {
    return getDemoSnapshot();
  }

  const trimmed = text.trim();
  if (!trimmed) {
    return getDemoSnapshot();
  }

  const existingMessages = await getAssistantMessagesForExchange(exchangeId);
  const now = nowIso();

  if (trimmed === "DONE") {
    const resolutionMessageId = createAssistantExchangeMessageId();
    const latestUserReply = [...existingMessages]
      .reverse()
      .find((message) => message.role === "user" && (message.kind === "reply" || message.kind === "opener"));
    const resolutionBody =
      exchange.sourceType === "user-demo"
        ? "OK, so it's DONE"
        : latestUserReply?.body || "Done.";
    const resolutionRole: AssistantExchangeMessageRecord["role"] =
      exchange.sourceType === "user-demo" ? "assistant" : "user";
    const resolutionMessage: AssistantExchangeMessageRecord = {
      id: resolutionMessageId,
      conversationId: exchange.conversationId,
      exchangeId: exchange.id,
      scopeId: exchange.scopeId,
      role: resolutionRole,
      kind: "resolution",
      body: resolutionBody,
      createdAt: now,
      surface: "app",
      externalMessageId: null,
      externalThreadMessageId: null,
    };
    const resolvedExchange: AssistantExchangeRecord = {
      ...exchange,
      status: "resolved",
      requiresUserAction: false,
      resolutionMessageId,
      latestMessageId: resolutionMessageId,
      resolvedAt: now,
      updatedAt: now,
    };
    const conversationUpdate: AssistantConversationRecord = {
      ...conversation,
      updatedAt: now,
    };
    const resolvedActivity = createScopeActivity({
      scopeId: scope.id,
      scopeType: scope.type,
      kind: "assistant-discussion-resolved",
      title: "Discussion resolved",
      detail: resolutionBody,
    });
    const writes: Promise<unknown>[] = [
      saveAssistantExchange(resolvedExchange),
      saveAssistantExchangeMessages([resolutionMessage]),
      saveAssistantConversation(conversationUpdate),
      saveScope({
        ...touchScope(scope),
        activityIds: appendUnique(scope.activityIds, resolvedActivity.id),
      }),
      saveActivity(resolvedActivity),
    ];

    if (exchange.linkedAttentionItemId) {
      const snapshot = await getDemoSnapshot();
      const linkedAttention = snapshot.attentionItems.find(
        (item) => item.id === exchange.linkedAttentionItemId
      );
      if (linkedAttention && linkedAttention.status === "pending") {
        writes.push(
          saveAttentionItem({
            ...linkedAttention,
            status: "resolved",
            resolvedAt: now,
            delivery: { ...linkedAttention.delivery, external: "responded" },
          })
        );
      }
    }

    await Promise.all(writes);
    return getDemoSnapshot();
  }

  const userReplyId = createAssistantExchangeMessageId();
  const assistantReplyId = createAssistantExchangeMessageId();
  const assistantReplyAt = new Date(Date.now() + 1).toISOString();
  const userReply: AssistantExchangeMessageRecord = {
    id: userReplyId,
    conversationId: exchange.conversationId,
    exchangeId: exchange.id,
    scopeId: exchange.scopeId,
    role: "user",
    kind: "reply",
    body: trimmed,
    createdAt: now,
    surface: "app",
    externalMessageId: null,
    externalThreadMessageId: null,
  };
  const assistantReply: AssistantExchangeMessageRecord = {
    id: assistantReplyId,
    conversationId: exchange.conversationId,
    exchangeId: exchange.id,
    scopeId: exchange.scopeId,
    role: "assistant",
    kind: "reply",
    body: `Reply to: ${trimmed}`,
    createdAt: assistantReplyAt,
    surface: "app",
    externalMessageId: null,
    externalThreadMessageId: null,
  };
  const nextExchange: AssistantExchangeRecord = {
    ...exchange,
    status: "in-progress",
    latestMessageId: assistantReplyId,
    replyCount: exchange.replyCount + 1,
    updatedAt: assistantReplyAt,
  };
  const conversationUpdate: AssistantConversationRecord = {
    ...conversation,
    updatedAt: assistantReplyAt,
  };
  const replyActivity = createScopeActivity({
    scopeId: scope.id,
    scopeType: scope.type,
    kind: "assistant-reply-appended",
    title: "Reply appended",
    detail: trimmed,
  });

  await Promise.all([
    saveAssistantExchange(nextExchange),
    saveAssistantExchangeMessages([userReply, assistantReply]),
    saveAssistantConversation(conversationUpdate),
    saveScope({
      ...touchScope(scope),
      activityIds: appendUnique(scope.activityIds, replyActivity.id),
    }),
    saveActivity(replyActivity),
  ]);

  return getDemoSnapshot();
}

export async function resolveAssistantExchange(exchangeId: string): Promise<DemoSnapshot> {
  return replyToAssistantExchange(exchangeId, "DONE");
}

export async function updateAssistantPlaybook(
  scopeId: string,
  patch: Partial<
    Pick<
      AssistantPlaybookRecord,
      "identityMarkdown" | "defaultsMarkdown" | "contextMarkdown" | "overridesMarkdown"
    >
  >
): Promise<DemoSnapshot> {
  const scope = await getScope(scopeId);
  if (!scope) {
    return getDemoSnapshot();
  }
  const { scope: ensuredScope, playbook } = await ensureScopeAssistantState(scope);
  const updatedPlaybook: AssistantPlaybookRecord = {
    ...playbook,
    ...patch,
    updatedAt: nowIso(),
  };
  const playbookActivity = createScopeActivity({
    scopeId,
    scopeType: ensuredScope.type,
    kind: "assistant-playbook-updated",
    title: "Assistant playbook updated",
    detail: "Assistant playbook sections were updated.",
  });

  await Promise.all([
    saveAssistantPlaybook(updatedPlaybook),
    saveScope({
      ...touchScope(ensuredScope),
      activityIds: appendUnique(ensuredScope.activityIds, playbookActivity.id),
    }),
    saveActivity(playbookActivity),
  ]);

  return getDemoSnapshot();
}

export async function createThreadInScope(params: {
  scopeId: string;
  title?: string;
  summary?: string;
}): Promise<{ snapshot: DemoSnapshot; threadId: string }> {
  const scope = await getScope(params.scopeId);
  if (!scope) {
    return { snapshot: await getDemoSnapshot(), threadId: "" };
  }

  const createdAt = nowIso();
  const threadId = createThreadId();
  const title = params.title?.trim() || "New thread";
  const summary = params.summary?.trim() || "Focused work started from the assistant scope.";
  const thread: ThreadRecord = {
    id: threadId,
    scopeId: scope.id,
    title,
    summary,
    status: "active",
    owner: scope.assistant.name,
    progress: 12,
    tags: ["task"],
    sectionKey: "tasks",
    createdAt,
    updatedAt: createdAt,
    messages: [
      {
        id: createMessageId(),
        role: "assistant",
        text: "Thread created. Continue the detailed execution here.",
        createdAt,
      },
    ],
    settingsBlocks: defaultThreadSettings(scope.name),
    uiCards: defaultThreadUiCards(threadId),
    activity: [],
  };

  const activity = createScopeActivity({
    scopeId: scope.id,
    scopeType: scope.type,
    kind: "thread-created",
    title: "Thread created",
    detail: title,
    threadId,
  });
  const nextScope = touchScope({
    ...scope,
    threadIds: appendUnique(scope.threadIds, threadId),
    activityIds: appendUnique(scope.activityIds, activity.id),
  });

  await Promise.all([saveThread(thread), saveScope(nextScope), saveActivity(activity)]);
  return { snapshot: await getDemoSnapshot(), threadId };
}

export async function createRootDocument(params?: {
  title?: string;
  summary?: string;
  kind?: DocumentRecord["kind"];
}): Promise<{ snapshot: DemoSnapshot; documentId: string }> {
  const snapshot = await getDemoSnapshot();
  const blinkScope = snapshot.scopes.find((scope) => scope.type === "blink");
  if (!blinkScope) {
    return { snapshot, documentId: "" };
  }

  const createdAt = nowIso();
  const title = params?.title?.trim() || "New document";
  const summary = params?.summary?.trim() || "A root-level business artifact.";
  const documentId = createDocumentId();
  const kind = params?.kind ?? "generic";
  const document: DocumentRecord = {
    id: documentId,
    scopeId: null,
    kind,
    category: kind === "service" ? "service" : "task-artifact",
    sectionKey: kind === "service" ? "services" : "documents",
    title,
    summary,
    status: "draft",
    owner: "Blink",
    participants: ["Blink"],
    tags: ["root", "document"],
    isService: kind === "service",
    createdAt,
    updatedAt: createdAt,
    settingsBlocks: [
      {
        id: "document-settings",
        title: "Document settings",
        items: [
          { label: "Linked scope", value: "Home" },
          { label: "Document type", value: kind },
        ],
      },
    ],
    details: {
      source: "documents-app",
      createdVia: "manual-action",
    },
    uiCards: buildGenericDocumentCards(title, "draft"),
    activity: [],
    searchKeywords: ["root", "document", title.toLowerCase()],
  };

  const activity = createScopeActivity({
    scopeId: blinkScope.id,
    scopeType: "blink",
    kind: "document-created",
    title: "Root document created",
    detail: title,
    documentId,
  });
  const nextBlinkScope = touchScope({
    ...blinkScope,
    activityIds: appendUnique(blinkScope.activityIds, activity.id),
  });

  await Promise.all([saveDocument(document), saveScope(nextBlinkScope), saveActivity(activity)]);
  return { snapshot: await getDemoSnapshot(), documentId };
}

export async function createWorkspaceFromTemplate(params: {
  workspaceName: string;
  templateKey: WorkspaceTemplateKey;
}): Promise<{ snapshot: DemoSnapshot; workspaceId: string }> {
  const template = getWorkspaceTemplate(params.templateKey);
  if (!template) {
    return { snapshot: await getDemoSnapshot(), workspaceId: "" };
  }

  const createdAt = nowIso();
  const workspaceId = createScopeId();
  const assistantConversationId = createAssistantConversationId();
  const assistantPlaybookId = createAssistantPlaybookId();
  const sectionDefinitionsByTemplate: Record<WorkspaceTemplateKey, DemoSectionDefinition[]> = {
    shop: [
      { key: "overview", label: "Overview", kind: "overview" },
      { key: "tasks", label: "Tasks", kind: "tasks" },
      { key: "orders", label: "Orders", kind: "domain" },
      { key: "products", label: "Products", kind: "domain" },
      { key: "partnerships", label: "Partnerships", kind: "domain" },
      { key: "activity", label: "Activity", kind: "activity" },
      { key: "settings", label: "Settings", kind: "settings" },
    ],
    restaurant: [
      { key: "overview", label: "Overview", kind: "overview" },
      { key: "tasks", label: "Tasks", kind: "tasks" },
      { key: "reservations", label: "Reservations", kind: "domain" },
      { key: "suppliers", label: "Suppliers", kind: "domain" },
      { key: "hiring", label: "Hiring", kind: "domain" },
      { key: "activity", label: "Activity", kind: "activity" },
      { key: "settings", label: "Settings", kind: "settings" },
    ],
    "generic-business": [
      { key: "overview", label: "Overview", kind: "overview" },
      { key: "tasks", label: "Tasks", kind: "tasks" },
      { key: "manuscript", label: "Manuscript", kind: "domain" },
      { key: "reviews", label: "Reviews", kind: "domain" },
      { key: "outreach", label: "Outreach", kind: "domain" },
      { key: "activity", label: "Activity", kind: "activity" },
      { key: "settings", label: "Settings", kind: "settings" },
    ],
  };

  const workspace: ScopeRecord = {
    id: workspaceId,
    type: "workspace",
    name: params.workspaceName.trim() || `${template.name} Workspace`,
    icon: template.icon,
    templateKey: template.key,
    description: template.description,
    createdAt,
    updatedAt: createdAt,
    coreDocumentId: null,
    coreSessionId: null,
    bootstrapStatus: "ready",
    bootstrapError: null,
    anchors: [...template.anchors],
    assistant: {
      name: template.defaultAssistantName,
      tone: template.defaultTone,
      avatar: null,
    },
    recap: {
      headline: `${params.workspaceName.trim() || template.name} recap`,
      updates: ["Workspace created from template and ready for seeded operations."],
      asks: ["Add tasks and documents to shape this workspace."],
    },
    sectionDefinitions: sectionDefinitionsByTemplate[template.key],
    settingsBlocks: defaultScopeSettings(params.workspaceName.trim() || template.name),
    searchKeywords: [
      template.name.toLowerCase(),
      ...(params.workspaceName.trim() ? [params.workspaceName.trim().toLowerCase()] : []),
    ],
    threadIds: [],
    documentIds: [],
    activityIds: [],
    attentionItemIds: [],
    assistantConversationId,
    assistantPlaybookId,
    messages: [
      {
        id: createMessageId(),
        role: "assistant",
        text: `Welcome to ${params.workspaceName || template.name}. I'm ready to help inside this workspace scope.`,
        createdAt,
      },
    ],
  };

  const activity = createScopeActivity({
    scopeId: workspaceId,
    scopeType: "workspace",
    kind: "workspace-created",
    title: "Workspace created",
    detail: `Template: ${template.name}`,
  });
  const nextWorkspace = touchScope({
    ...workspace,
    activityIds: [activity.id],
    attentionItemIds: [],
  });
  const assistantConversation: AssistantConversationRecord = {
    id: assistantConversationId,
    scopeId: workspaceId,
    assistantName: template.defaultAssistantName,
    createdAt,
    updatedAt: createdAt,
    lastSeenAt: null,
    lastRecapAt: null,
  };
  const assistantPlaybook: AssistantPlaybookRecord = {
    id: assistantPlaybookId,
    scopeId: workspaceId,
    inheritsFromScopeId: BLINK_SCOPE_ID,
    identityMarkdown: `You are ${template.defaultAssistantName} for ${nextWorkspace.name}.`,
    defaultsMarkdown:
      "- Keep updates concise.\n- Prioritize exceptions.\n- Keep recurring low-signal items in digest.",
    contextMarkdown: `- Template: ${template.name}\n- Workspace: ${nextWorkspace.description}`,
    overridesMarkdown:
      "- Emphasize workspace deadlines first.\n- Mention blockers early.\n- Keep a clear next action.",
    updatedAt: createdAt,
  };

  await Promise.all([
    saveScope(nextWorkspace),
    saveActivity(activity),
    saveAssistantConversation(assistantConversation),
    saveAssistantPlaybook(assistantPlaybook),
  ]);
  return { snapshot: await getDemoSnapshot(), workspaceId };
}

export async function markWorkspaceBootstrapRunning(scopeId: string): Promise<DemoSnapshot> {
  const scope = await getScope(scopeId);
  if (!scope || scope.type !== "workspace") {
    return getDemoSnapshot();
  }
  const activity = createScopeActivity({
    scopeId,
    scopeType: "workspace",
    kind: "bootstrap",
    title: "Bootstrap running",
    detail: "Workspace core document bootstrap is in progress.",
  });
  const nextScope = touchScope({
    ...scope,
    bootstrapStatus: "running",
    bootstrapError: null,
    activityIds: appendUnique(scope.activityIds, activity.id),
  });

  await Promise.all([saveScope(nextScope), saveActivity(activity)]);
  return getDemoSnapshot();
}

export async function markWorkspaceBootstrapSuccess(params: {
  scopeId: string;
  sessionId: string | null;
  coreDocumentId: string | null;
  myosDocumentId?: string | null;
}): Promise<DemoSnapshot> {
  const scope = await getScope(params.scopeId);
  if (!scope || scope.type !== "workspace") {
    return getDemoSnapshot();
  }

  const createdAt = nowIso();
  const workspaceCoreDocumentId = params.coreDocumentId || createDocumentId();
  const coreDocument: DocumentRecord = {
    id: workspaceCoreDocumentId,
    scopeId: scope.id,
    kind: "workspace-core",
    category: "task-artifact",
    sectionKey: "documents",
    title: `${scope.name} core document`,
    summary: "Underlying workspace core MyOS document.",
    status: "ready",
    owner: "Blink",
    participants: [scope.name],
    tags: [scope.name.toLowerCase(), "core"],
    isService: false,
    createdAt,
    updatedAt: createdAt,
    sessionId: params.sessionId,
    myosDocumentId: params.myosDocumentId ?? null,
    settingsBlocks: [
      {
        id: "workspace-core-settings",
        title: "Workspace core settings",
        items: [
          { label: "Linked scope", value: scope.name },
          { label: "Template", value: scope.templateKey ?? "none" },
        ],
      },
    ],
    details: {
      workspaceId: scope.id,
      templateKey: scope.templateKey ?? null,
      anchors: scope.anchors,
      bootstrap: "ready",
    },
    uiCards: buildGenericDocumentCards(`${scope.name} core document`, "ready"),
    activity: [],
    searchKeywords: [scope.name.toLowerCase(), "core", "workspace"],
  };

  const activity = createScopeActivity({
    scopeId: scope.id,
    scopeType: "workspace",
    kind: "bootstrap",
    title: "Bootstrap succeeded",
    detail: `Core document ready (${workspaceCoreDocumentId}).`,
    documentId: workspaceCoreDocumentId,
  });

  const nextScope = touchScope({
    ...scope,
    bootstrapStatus: "ready",
    bootstrapError: null,
    coreSessionId: params.sessionId,
    coreDocumentId: workspaceCoreDocumentId,
    documentIds: appendUnique(scope.documentIds, workspaceCoreDocumentId),
    activityIds: appendUnique(scope.activityIds, activity.id),
  });

  await Promise.all([saveDocument(coreDocument), saveScope(nextScope), saveActivity(activity)]);
  return getDemoSnapshot();
}

export async function markWorkspaceBootstrapFailed(scopeId: string, errorMessage: string): Promise<DemoSnapshot> {
  const scope = await getScope(scopeId);
  if (!scope || scope.type !== "workspace") {
    return getDemoSnapshot();
  }

  const activity = createScopeActivity({
    scopeId,
    scopeType: "workspace",
    kind: "error",
    title: "Bootstrap failed",
    detail: errorMessage,
  });

  const nextScope = touchScope({
    ...scope,
    bootstrapStatus: "failed",
    bootstrapError: errorMessage,
    activityIds: appendUnique(scope.activityIds, activity.id),
    attentionItemIds: scope.attentionItemIds,
  });

  await Promise.all([saveScope(nextScope), saveActivity(activity)]);
  return getDemoSnapshot();
}

export async function syncThreadDocumentSnapshot(threadId: string): Promise<DemoSnapshot> {
  const snapshot = await getDemoSnapshot();
  const thread = snapshot.threads.find((entry) => entry.id === threadId);
  if (!thread) {
    return snapshot;
  }
  const scope = snapshot.scopes.find((entry) => entry.id === thread.scopeId) ?? null;
  const documentId = thread.coreDocumentId ?? createDocumentId();
  const createdAt = nowIso();
  const existing = snapshot.documents.find((entry) => entry.id === documentId);

  const nextDocument: DocumentRecord = {
    id: documentId,
    scopeId: thread.scopeId,
    kind: "thread",
    category: "task-artifact",
    sectionKey: "tasks",
    title: thread.title,
    summary: thread.summary,
    status: thread.status,
    owner: thread.owner,
    participants: [thread.owner],
    tags: [...thread.tags],
    isService: false,
    createdAt: existing?.createdAt ?? createdAt,
    updatedAt: createdAt,
    sessionId: thread.sessionId ?? null,
    myosDocumentId: existing?.myosDocumentId ?? null,
    settingsBlocks:
      existing?.settingsBlocks ??
      [
        {
          id: "thread-mirror-settings",
          title: "Thread mirror settings",
          items: [
            { label: "Linked thread", value: thread.id },
            { label: "Scope", value: scope?.name ?? "Unknown scope" },
          ],
        },
      ],
    details: {
      threadId: thread.id,
      scopeId: thread.scopeId,
    },
    uiCards: existing?.uiCards ?? buildThreadUiCards(thread, scope),
    activity: existing?.activity ?? [],
    searchKeywords: [...thread.tags, thread.title.toLowerCase()],
  };

  const nextThread: ThreadRecord = {
    ...thread,
    coreDocumentId: documentId,
    updatedAt: createdAt,
  };

  await Promise.all([saveThread(nextThread), saveDocument(nextDocument)]);
  return getDemoSnapshot();
}

export async function addScopeDocument(params: {
  scopeId: string;
  title: string;
  summary: string;
  kind?: DocumentRecord["kind"];
}): Promise<{ snapshot: DemoSnapshot; documentId: string }> {
  const scope = await getScope(params.scopeId);
  if (!scope) {
    return { snapshot: await getDemoSnapshot(), documentId: "" };
  }

  const createdAt = nowIso();
  const documentId = createDocumentId();
  const document: DocumentRecord = {
    id: documentId,
    scopeId: params.scopeId,
    kind: params.kind ?? "generic",
    category: "task-artifact",
    sectionKey: "documents",
    title: params.title,
    summary: params.summary,
    status: "draft",
    owner: scope.assistant.name,
    participants: [scope.assistant.name],
    tags: [scope.name.toLowerCase(), "document"],
    isService: false,
    createdAt,
    updatedAt: createdAt,
    settingsBlocks: [
      {
        id: "scope-document-settings",
        title: "Scope document settings",
        items: [
          { label: "Linked scope", value: scope.name },
          { label: "Document type", value: params.kind ?? "generic" },
        ],
      },
    ],
    details: {
      scopeId: params.scopeId,
    },
    uiCards: buildGenericDocumentCards(params.title, "draft"),
    activity: [],
    searchKeywords: [scope.name.toLowerCase(), params.title.toLowerCase()],
  };
  const activity = createScopeActivity({
    scopeId: params.scopeId,
    scopeType: scope.type,
    kind: "document-created",
    title: "Scope document created",
    detail: params.title,
    documentId,
  });
  const nextScope = touchScope({
    ...scope,
    documentIds: appendUnique(scope.documentIds, documentId),
    activityIds: appendUnique(scope.activityIds, activity.id),
  });

  await Promise.all([saveDocument(document), saveActivity(activity), saveScope(nextScope)]);
  return { snapshot: await getDemoSnapshot(), documentId };
}

export async function retryWorkspaceBootstrap(scopeId: string): Promise<DemoSnapshot> {
  const scope = await getScope(scopeId);
  if (!scope || scope.type !== "workspace") {
    return getDemoSnapshot();
  }
  const activity = createScopeActivity({
    scopeId,
    scopeType: "workspace",
    kind: "bootstrap",
    title: "Bootstrap retry requested",
  });
  const nextScope = touchScope({
    ...scope,
    bootstrapStatus: "ready",
    bootstrapError: null,
    activityIds: appendUnique(scope.activityIds, activity.id),
  });
  await Promise.all([saveScope(nextScope), saveActivity(activity)]);
  return getDemoSnapshot();
}

export async function appendThreadMessage(
  threadId: string,
  role: BaseChatMessage["role"],
  text: string
): Promise<DemoSnapshot> {
  const thread = await getThread(threadId);
  if (!thread) {
    return getDemoSnapshot();
  }

  const scope = await getScope(thread.scopeId);
  if (!scope) {
    return getDemoSnapshot();
  }

  const message: BaseChatMessage = {
    id: createMessageId(),
    role,
    text,
    createdAt: nowIso(),
  };

  const threadActivity = createScopeActivity({
    scopeId: scope.id,
    scopeType: scope.type,
    kind: "thread-message",
    title: role === "assistant" ? "Assistant message added" : "Message sent",
    detail: text,
    threadId: thread.id,
  });

  const updatedThread: ThreadRecord = {
    ...thread,
    messages: [...thread.messages, message],
    updatedAt: nowIso(),
    activity: [threadActivity, ...thread.activity],
  };

  const updatedScope = touchScope({
    ...scope,
    activityIds: appendUnique(scope.activityIds, threadActivity.id),
  });

  await Promise.all([saveThread(updatedThread), saveScope(updatedScope), saveActivity(threadActivity)]);
  return getDemoSnapshot();
}

function findActionFromCards(cards: DocumentRecord["uiCards"], actionId: string): DemoActionDefinition | null {
  for (const card of cards) {
    const found = card.actions?.find((entry) => entry.id === actionId);
    if (found) {
      return found;
    }
  }
  return null;
}

export async function applyDocumentAction(documentId: string, actionId: string): Promise<DemoSnapshot> {
  const document = await getDocument(documentId);
  if (!document) {
    return getDemoSnapshot();
  }
  const scopeId = document.scopeId ?? BLINK_SCOPE_ID;
  const scope = await getScope(scopeId);
  if (!scope) {
    return getDemoSnapshot();
  }

  const selectedAction = findActionFromCards(document.uiCards, actionId);
  if (!selectedAction) {
    return getDemoSnapshot();
  }

  const entry = createScopeActivity({
    scopeId: scope.id,
    scopeType: scope.type,
    kind: "document-action",
    title: selectedAction.activityTitle,
    detail: selectedAction.activityDetail,
    documentId: document.id,
  });

  const updatedDocument: DocumentRecord = {
    ...document,
    status: selectedAction.nextStatus ?? document.status,
    details: {
      ...document.details,
      ...(selectedAction.metadataPatch ?? {}),
      lastAction: selectedAction.label,
      lastActionAt: entry.createdAt,
    },
    updatedAt: nowIso(),
    activity: [entry, ...document.activity],
  };

  let updatedScope: ScopeRecord = touchScope({
    ...scope,
    activityIds: appendUnique(scope.activityIds, entry.id),
  });

  if (selectedAction.assistantNote) {
    const assistantMessage: BaseChatMessage = {
      id: createMessageId(),
      role: "assistant",
      text: selectedAction.assistantNote,
      createdAt: nowIso(),
    };
    updatedScope = {
      ...updatedScope,
      messages: [...updatedScope.messages, assistantMessage],
    };
  }

  await Promise.all([saveDocument(updatedDocument), saveScope(updatedScope), saveActivity(entry)]);
  return getDemoSnapshot();
}

export async function applyThreadAction(threadId: string, actionId: string): Promise<DemoSnapshot> {
  const thread = await getThread(threadId);
  if (!thread) {
    return getDemoSnapshot();
  }
  const scope = await getScope(thread.scopeId);
  if (!scope) {
    return getDemoSnapshot();
  }

  const selectedAction = findActionFromCards(thread.uiCards, actionId);
  if (!selectedAction) {
    return getDemoSnapshot();
  }

  const entry = createScopeActivity({
    scopeId: scope.id,
    scopeType: scope.type,
    kind: "thread-action",
    title: selectedAction.activityTitle,
    detail: selectedAction.activityDetail,
    threadId: thread.id,
  });

  const progressDelta = actionId.includes("advance") ? 12 : actionId.includes("complete") ? 100 : 0;
  const nextProgress = actionId.includes("complete")
    ? 100
    : Math.min(100, Math.max(0, thread.progress + progressDelta));

  const updatedThread: ThreadRecord = {
    ...thread,
    status: (selectedAction.nextStatus as ThreadRecord["status"] | undefined) ?? thread.status,
    progress: nextProgress,
    updatedAt: nowIso(),
    activity: [entry, ...thread.activity],
  };

  let updatedScope: ScopeRecord = touchScope({
    ...scope,
    activityIds: appendUnique(scope.activityIds, entry.id),
  });

  if (selectedAction.assistantNote) {
    updatedScope = {
      ...updatedScope,
      messages: [
        ...updatedScope.messages,
        {
          id: createMessageId(),
          role: "assistant",
          text: selectedAction.assistantNote,
          createdAt: nowIso(),
        },
      ],
    };
  }

  await Promise.all([saveThread(updatedThread), saveScope(updatedScope), saveActivity(entry)]);
  return getDemoSnapshot();
}

export async function resetDemoSnapshot(): Promise<DemoSnapshot> {
  await clearDemoPersistence();
  return getDemoSnapshot();
}
