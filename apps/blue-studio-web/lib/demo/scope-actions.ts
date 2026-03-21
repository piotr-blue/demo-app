import {
  createActivityId,
  createAttentionId,
  createDocumentId,
  createMessageId,
  createScopeId,
  createThreadId,
} from "@/lib/demo/ids";
import { getDemoSnapshot, getScope, saveActivity, saveAttentionItem, saveDocument, saveScope, saveThread } from "@/lib/demo/storage";
import { getWorkspaceTemplate } from "@/lib/demo/workspace-templates";
import { buildGenericDocumentCards, buildThreadUiCards } from "@/lib/demo/document-ui";
import type {
  ActivityRecord,
  AttentionItem,
  BaseChatMessage,
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
  scopeId: string;
  scopeType: "blink" | "workspace";
  kind: ActivityRecord["kind"];
  title: string;
  detail?: string;
  threadId?: string | null;
  documentId?: string | null;
}): ActivityRecord {
  return {
    id: createActivityId(),
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
    title,
    summary,
    status: "draft",
    createdAt,
    updatedAt: createdAt,
    details: {
      source: "documents-app",
      createdVia: "manual-action",
    },
    uiCards: buildGenericDocumentCards(title, "draft"),
    activity: [],
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
    bootstrapStatus: "pending",
    bootstrapError: null,
    anchors: [...template.anchors],
    assistant: {
      name: template.defaultAssistantName,
      tone: template.defaultTone,
      avatar: null,
    },
    threadIds: [],
    documentIds: [],
    activityIds: [],
    attentionItemIds: [],
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
  const attentionItem: AttentionItem = {
    id: createAttentionId(),
    scopeId: workspaceId,
    scopeType: "workspace",
    status: "pending",
    title: "Workspace bootstrap started",
    body: "Core document bootstrap is running in background.",
    priority: "low",
    createdAt,
    resolvedAt: null,
    delivery: {
      inApp: true,
      external: "not-sent",
    },
  };

  const nextWorkspace = touchScope({
    ...workspace,
    activityIds: [activity.id],
    attentionItemIds: [attentionItem.id],
  });

  await Promise.all([saveScope(nextWorkspace), saveActivity(activity), saveAttentionItem(attentionItem)]);
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
    title: `${scope.name} core document`,
    summary: "Underlying workspace core MyOS document.",
    status: "ready",
    createdAt,
    updatedAt: createdAt,
    sessionId: params.sessionId,
    myosDocumentId: params.myosDocumentId ?? null,
    details: {
      workspaceId: scope.id,
      templateKey: scope.templateKey ?? null,
      anchors: scope.anchors,
      bootstrap: "ready",
    },
    uiCards: buildGenericDocumentCards(`${scope.name} core document`, "ready"),
    activity: [],
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

  const attentionItem: AttentionItem = {
    id: createAttentionId(),
    scopeId,
    scopeType: "workspace",
    status: "pending",
    title: "Workspace bootstrap failed",
    body: "Workspace remains available. Retry bootstrap from the scope page.",
    priority: "high",
    createdAt: nowIso(),
    resolvedAt: null,
    delivery: {
      inApp: true,
      external: "not-sent",
    },
  };

  const nextScope = touchScope({
    ...scope,
    bootstrapStatus: "failed",
    bootstrapError: errorMessage,
    activityIds: appendUnique(scope.activityIds, activity.id),
    attentionItemIds: appendUnique(scope.attentionItemIds, attentionItem.id),
  });

  await Promise.all([
    saveScope(nextScope),
    saveActivity(activity),
    saveAttentionItem(attentionItem),
  ]);
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
    title: thread.title,
    summary: thread.summary,
    status: thread.status,
    createdAt: existing?.createdAt ?? createdAt,
    updatedAt: createdAt,
    sessionId: thread.sessionId ?? null,
    myosDocumentId: existing?.myosDocumentId ?? null,
    details: {
      threadId: thread.id,
      scopeId: thread.scopeId,
    },
    uiCards: buildThreadUiCards(thread, scope),
    activity: existing?.activity ?? [],
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
    title: params.title,
    summary: params.summary,
    status: "draft",
    createdAt,
    updatedAt: createdAt,
    details: {
      scopeId: params.scopeId,
    },
    uiCards: buildGenericDocumentCards(params.title, "draft"),
    activity: [],
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
    bootstrapStatus: "pending",
    bootstrapError: null,
    activityIds: appendUnique(scope.activityIds, activity.id),
  });
  await Promise.all([saveScope(nextScope), saveActivity(activity)]);
  return getDemoSnapshot();
}
