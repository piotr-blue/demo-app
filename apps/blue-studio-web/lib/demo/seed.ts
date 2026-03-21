import {
  createActivityId,
  createAttentionId,
  createDocumentId,
  createMessageId,
  createThreadId,
} from "@/lib/demo/ids";
import type {
  ActivityRecord,
  AttentionItem,
  DemoSnapshot,
  DocumentRecord,
  ScopeRecord,
  ThreadRecord,
} from "@/lib/demo/types";

export const BLINK_SCOPE_ID = "scope_blink";

function nowIso(): string {
  return new Date().toISOString();
}

function createActivity(params: {
  scopeId: string;
  scopeType: "blink" | "workspace";
  title: string;
  kind: ActivityRecord["kind"];
  detail?: string;
  createdAt: string;
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
    createdAt: params.createdAt,
    threadId: params.threadId ?? null,
    documentId: params.documentId ?? null,
  };
}

export function createSeedSnapshot(): DemoSnapshot {
  const createdAt = nowIso();
  const blinkThreadId = createThreadId();
  const rootDocumentIdA = createDocumentId();
  const rootDocumentIdB = createDocumentId();
  const attentionId = createAttentionId();

  const thread: ThreadRecord = {
    id: blinkThreadId,
    scopeId: BLINK_SCOPE_ID,
    title: "Daily operations triage",
    summary: "Track recurring asks and route them into focused threads.",
    status: "active",
    createdAt,
    updatedAt: createdAt,
    messages: [
      {
        id: createMessageId(),
        role: "assistant",
        text: "I can help triage account-level work. Create a dedicated thread for anything long-running.",
        createdAt,
      },
    ],
    activity: [],
  };

  const rootDocumentA: DocumentRecord = {
    id: rootDocumentIdA,
    scopeId: null,
    kind: "proposal",
    title: "Partnership proposal draft",
    summary: "Root-level proposal not yet attached to a workspace.",
    status: "draft",
    createdAt,
    updatedAt: createdAt,
    details: {
      owner: "Blink scope",
      nextStep: "Review terms",
    },
    uiCards: [
      {
        id: createActivityId(),
        title: "Review proposal details",
        body: "Confirm scope and goals before sharing.",
        ctaLabel: "Open details",
      },
    ],
    activity: [],
  };

  const rootDocumentB: DocumentRecord = {
    id: rootDocumentIdB,
    scopeId: null,
    kind: "generic",
    title: "Ops checklist",
    summary: "A standalone operations checklist in root Documents.",
    status: "active",
    createdAt,
    updatedAt: createdAt,
    details: {
      owner: "Blink scope",
      checklistItems: 5,
    },
    uiCards: [
      {
        id: createActivityId(),
        title: "Run weekly review",
        body: "Check unresolved items and assign follow-ups.",
        ctaLabel: "Mark complete",
      },
    ],
    activity: [],
  };

  const attentionItem: AttentionItem = {
    id: attentionId,
    scopeId: BLINK_SCOPE_ID,
    scopeType: "blink",
    status: "pending",
    title: "Need decision on proposal priorities",
    body: "Choose whether partnership outreach or pricing updates should run first.",
    priority: "medium",
    relatedThreadId: blinkThreadId,
    relatedDocumentId: rootDocumentIdA,
    createdAt,
    resolvedAt: null,
    delivery: {
      inApp: true,
      external: "not-sent",
    },
  };

  const activity: ActivityRecord[] = [
    createActivity({
      scopeId: BLINK_SCOPE_ID,
      scopeType: "blink",
      kind: "assistant-message",
      title: "Blink initialized",
      detail: "Root scope is ready.",
      createdAt,
    }),
    createActivity({
      scopeId: BLINK_SCOPE_ID,
      scopeType: "blink",
      kind: "thread-created",
      title: "Seed thread created",
      detail: thread.title,
      threadId: blinkThreadId,
      createdAt,
    }),
    createActivity({
      scopeId: BLINK_SCOPE_ID,
      scopeType: "blink",
      kind: "document-created",
      title: "Seed root document created",
      detail: rootDocumentA.title,
      documentId: rootDocumentIdA,
      createdAt,
    }),
  ];

  const scope: ScopeRecord = {
    id: BLINK_SCOPE_ID,
    type: "blink",
    name: "Blink",
    icon: "home",
    templateKey: null,
    description: "Root assistant scope for account-level work.",
    createdAt,
    updatedAt: createdAt,
    coreDocumentId: null,
    coreSessionId: null,
    bootstrapStatus: "not-required",
    bootstrapError: null,
    anchors: ["#threads", "#documents", "#workspaces"],
    assistant: {
      name: "Blink",
      tone: "Helpful, concise, and action-oriented.",
      avatar: null,
    },
    threadIds: [blinkThreadId],
    documentIds: [],
    activityIds: activity.map((entry) => entry.id),
    attentionItemIds: [attentionId],
    messages: [
      {
        id: createMessageId(),
        role: "assistant",
        text: "Hi — I'm Blink. I can help with root threads, workspaces, and root documents.",
        createdAt,
      },
    ],
  };

  return {
    scopes: [scope],
    threads: [thread],
    documents: [rootDocumentA, rootDocumentB],
    attentionItems: [attentionItem],
    activity,
  };
}
