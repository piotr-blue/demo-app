import { openDB } from "idb";
import { createSeedSnapshot } from "@/lib/demo/seed";
import type {
  ActivityRecord,
  AssistantConversationRecord,
  AssistantExchangeMessageRecord,
  AssistantExchangeRecord,
  AssistantPlaybookRecord,
  AttentionItem,
  DemoSnapshot,
  DocumentRecord,
  ScopeRecord,
  ThreadRecord,
} from "@/lib/demo/types";

const DB_NAME = "myos-demo-v1";
const DB_VERSION = 2;
const DEMO_SEED_VERSION = "seed-assistant-exchanges-v1";

const SCOPE_STORE = "scopes";
const THREAD_STORE = "threads";
const DOCUMENT_STORE = "documents";
const ATTENTION_STORE = "attentionItems";
const ACTIVITY_STORE = "activity";
const ASSISTANT_CONVERSATION_STORE = "assistantConversations";
const ASSISTANT_EXCHANGE_STORE = "assistantExchanges";
const ASSISTANT_EXCHANGE_MESSAGE_STORE = "assistantExchangeMessages";
const ASSISTANT_PLAYBOOK_STORE = "assistantPlaybooks";
const META_STORE = "meta";

interface MetaRecord {
  key: string;
  value: string;
}

async function getDemoDb() {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(SCOPE_STORE)) {
        db.createObjectStore(SCOPE_STORE, { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains(THREAD_STORE)) {
        const store = db.createObjectStore(THREAD_STORE, { keyPath: "id" });
        store.createIndex("scopeId", "scopeId");
      }
      if (!db.objectStoreNames.contains(DOCUMENT_STORE)) {
        const store = db.createObjectStore(DOCUMENT_STORE, { keyPath: "id" });
        store.createIndex("scopeId", "scopeId");
      }
      if (!db.objectStoreNames.contains(ATTENTION_STORE)) {
        const store = db.createObjectStore(ATTENTION_STORE, { keyPath: "id" });
        store.createIndex("scopeId", "scopeId");
      }
      if (!db.objectStoreNames.contains(ACTIVITY_STORE)) {
        const store = db.createObjectStore(ACTIVITY_STORE, { keyPath: "id" });
        store.createIndex("scopeId", "scopeId");
      }
      if (!db.objectStoreNames.contains(ASSISTANT_CONVERSATION_STORE)) {
        const store = db.createObjectStore(ASSISTANT_CONVERSATION_STORE, { keyPath: "id" });
        store.createIndex("scopeId", "scopeId");
      }
      if (!db.objectStoreNames.contains(ASSISTANT_EXCHANGE_STORE)) {
        const store = db.createObjectStore(ASSISTANT_EXCHANGE_STORE, { keyPath: "id" });
        store.createIndex("conversationId", "conversationId");
        store.createIndex("scopeId", "scopeId");
        store.createIndex("status", "status");
        store.createIndex("updatedAt", "updatedAt");
      }
      if (!db.objectStoreNames.contains(ASSISTANT_EXCHANGE_MESSAGE_STORE)) {
        const store = db.createObjectStore(ASSISTANT_EXCHANGE_MESSAGE_STORE, { keyPath: "id" });
        store.createIndex("conversationId", "conversationId");
        store.createIndex("exchangeId", "exchangeId");
        store.createIndex("scopeId", "scopeId");
        store.createIndex("createdAt", "createdAt");
      }
      if (!db.objectStoreNames.contains(ASSISTANT_PLAYBOOK_STORE)) {
        const store = db.createObjectStore(ASSISTANT_PLAYBOOK_STORE, { keyPath: "id" });
        store.createIndex("scopeId", "scopeId");
      }
      if (!db.objectStoreNames.contains(META_STORE)) {
        db.createObjectStore(META_STORE, { keyPath: "key" });
      }
    },
  });
}

function sortByUpdatedAt<T extends { updatedAt: string }>(records: T[]): T[] {
  return [...records].sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));
}

function sortByCreatedAt<T extends { createdAt: string }>(records: T[]): T[] {
  return [...records].sort((left, right) => right.createdAt.localeCompare(left.createdAt));
}

function sortByCreatedAtAscending<T extends { createdAt: string }>(records: T[]): T[] {
  return [...records].sort((left, right) => left.createdAt.localeCompare(right.createdAt));
}

async function ensureSeeded(): Promise<void> {
  const db = await getDemoDb();
  const seededVersion = (await db.get(META_STORE, "seedVersion")) as MetaRecord | undefined;
  const needsReseed = seededVersion?.value !== DEMO_SEED_VERSION;

  if (needsReseed) {
    const resetTx = db.transaction(
      [
        SCOPE_STORE,
        THREAD_STORE,
        DOCUMENT_STORE,
        ATTENTION_STORE,
        ACTIVITY_STORE,
        ASSISTANT_CONVERSATION_STORE,
        ASSISTANT_EXCHANGE_STORE,
        ASSISTANT_EXCHANGE_MESSAGE_STORE,
        ASSISTANT_PLAYBOOK_STORE,
        META_STORE,
      ],
      "readwrite"
    );
    await resetTx.objectStore(SCOPE_STORE).clear();
    await resetTx.objectStore(THREAD_STORE).clear();
    await resetTx.objectStore(DOCUMENT_STORE).clear();
    await resetTx.objectStore(ATTENTION_STORE).clear();
    await resetTx.objectStore(ACTIVITY_STORE).clear();
    await resetTx.objectStore(ASSISTANT_CONVERSATION_STORE).clear();
    await resetTx.objectStore(ASSISTANT_EXCHANGE_STORE).clear();
    await resetTx.objectStore(ASSISTANT_EXCHANGE_MESSAGE_STORE).clear();
    await resetTx.objectStore(ASSISTANT_PLAYBOOK_STORE).clear();
    await resetTx.objectStore(META_STORE).clear();
    await resetTx.done;
  }

  const scopeCount = await db.count(SCOPE_STORE);
  if (scopeCount > 0 && !needsReseed) {
    return;
  }

  const seed = createSeedSnapshot();
  const tx = db.transaction(
    [
      SCOPE_STORE,
      THREAD_STORE,
      DOCUMENT_STORE,
      ATTENTION_STORE,
      ACTIVITY_STORE,
      ASSISTANT_CONVERSATION_STORE,
      ASSISTANT_EXCHANGE_STORE,
      ASSISTANT_EXCHANGE_MESSAGE_STORE,
      ASSISTANT_PLAYBOOK_STORE,
      META_STORE,
    ],
    "readwrite"
  );

  for (const scope of seed.scopes) {
    await tx.objectStore(SCOPE_STORE).put(scope);
  }
  for (const thread of seed.threads) {
    await tx.objectStore(THREAD_STORE).put(thread);
  }
  for (const document of seed.documents) {
    await tx.objectStore(DOCUMENT_STORE).put(document);
  }
  for (const attentionItem of seed.attentionItems) {
    await tx.objectStore(ATTENTION_STORE).put(attentionItem);
  }
  for (const activity of seed.activity) {
    await tx.objectStore(ACTIVITY_STORE).put(activity);
  }
  for (const conversation of seed.assistantConversations) {
    await tx.objectStore(ASSISTANT_CONVERSATION_STORE).put(conversation);
  }
  for (const exchange of seed.assistantExchanges) {
    await tx.objectStore(ASSISTANT_EXCHANGE_STORE).put(exchange);
  }
  for (const message of seed.assistantExchangeMessages) {
    await tx.objectStore(ASSISTANT_EXCHANGE_MESSAGE_STORE).put(message);
  }
  for (const playbook of seed.assistantPlaybooks) {
    await tx.objectStore(ASSISTANT_PLAYBOOK_STORE).put(playbook);
  }
  await tx.objectStore(META_STORE).put({
    key: "seededAt",
    value: new Date().toISOString(),
  } satisfies MetaRecord);
  await tx.objectStore(META_STORE).put({
    key: "seedVersion",
    value: DEMO_SEED_VERSION,
  } satisfies MetaRecord);
  await tx.done;
}

export async function getDemoSnapshot(): Promise<DemoSnapshot> {
  await ensureSeeded();
  const db = await getDemoDb();
  const [
    scopes,
    threads,
    documents,
    attentionItems,
    activity,
    assistantConversations,
    assistantExchanges,
    assistantExchangeMessages,
    assistantPlaybooks,
  ] = await Promise.all([
    db.getAll(SCOPE_STORE) as Promise<ScopeRecord[]>,
    db.getAll(THREAD_STORE) as Promise<ThreadRecord[]>,
    db.getAll(DOCUMENT_STORE) as Promise<DocumentRecord[]>,
    db.getAll(ATTENTION_STORE) as Promise<AttentionItem[]>,
    db.getAll(ACTIVITY_STORE) as Promise<ActivityRecord[]>,
    db.getAll(ASSISTANT_CONVERSATION_STORE) as Promise<AssistantConversationRecord[]>,
    db.getAll(ASSISTANT_EXCHANGE_STORE) as Promise<AssistantExchangeRecord[]>,
    db.getAll(ASSISTANT_EXCHANGE_MESSAGE_STORE) as Promise<AssistantExchangeMessageRecord[]>,
    db.getAll(ASSISTANT_PLAYBOOK_STORE) as Promise<AssistantPlaybookRecord[]>,
  ]);

  return {
    scopes: sortByUpdatedAt(scopes),
    threads: sortByUpdatedAt(threads),
    documents: sortByUpdatedAt(documents),
    attentionItems: sortByCreatedAt(attentionItems),
    activity: sortByCreatedAt(activity),
    assistantConversations: sortByUpdatedAt(assistantConversations),
    assistantExchanges: sortByUpdatedAt(assistantExchanges),
    assistantExchangeMessages: sortByCreatedAtAscending(assistantExchangeMessages),
    assistantPlaybooks: sortByUpdatedAt(assistantPlaybooks),
  };
}

export async function getScope(scopeId: string): Promise<ScopeRecord | null> {
  await ensureSeeded();
  const db = await getDemoDb();
  return ((await db.get(SCOPE_STORE, scopeId)) as ScopeRecord | undefined) ?? null;
}

export async function getThread(threadId: string): Promise<ThreadRecord | null> {
  await ensureSeeded();
  const db = await getDemoDb();
  return ((await db.get(THREAD_STORE, threadId)) as ThreadRecord | undefined) ?? null;
}

export async function getDocument(documentId: string): Promise<DocumentRecord | null> {
  await ensureSeeded();
  const db = await getDemoDb();
  return ((await db.get(DOCUMENT_STORE, documentId)) as DocumentRecord | undefined) ?? null;
}

export async function getAssistantConversation(scopeId: string): Promise<AssistantConversationRecord | null> {
  await ensureSeeded();
  const db = await getDemoDb();
  const byScope = (await db.getAllFromIndex(
    ASSISTANT_CONVERSATION_STORE,
    "scopeId",
    scopeId
  )) as AssistantConversationRecord[];
  return byScope[0] ?? null;
}

export async function getAssistantConversationById(
  conversationId: string
): Promise<AssistantConversationRecord | null> {
  await ensureSeeded();
  const db = await getDemoDb();
  return (
    ((await db.get(
      ASSISTANT_CONVERSATION_STORE,
      conversationId
    )) as AssistantConversationRecord | undefined) ?? null
  );
}

export async function getAssistantExchangesForScope(scopeId: string): Promise<AssistantExchangeRecord[]> {
  await ensureSeeded();
  const db = await getDemoDb();
  const exchanges = (await db.getAllFromIndex(
    ASSISTANT_EXCHANGE_STORE,
    "scopeId",
    scopeId
  )) as AssistantExchangeRecord[];
  return sortByUpdatedAt(exchanges);
}

export async function getAssistantExchangeById(
  exchangeId: string
): Promise<AssistantExchangeRecord | null> {
  await ensureSeeded();
  const db = await getDemoDb();
  return (
    ((await db.get(ASSISTANT_EXCHANGE_STORE, exchangeId)) as AssistantExchangeRecord | undefined) ??
    null
  );
}

export async function getAssistantMessagesForExchange(
  exchangeId: string
): Promise<AssistantExchangeMessageRecord[]> {
  await ensureSeeded();
  const db = await getDemoDb();
  const messages = (await db.getAllFromIndex(
    ASSISTANT_EXCHANGE_MESSAGE_STORE,
    "exchangeId",
    exchangeId
  )) as AssistantExchangeMessageRecord[];
  return sortByCreatedAtAscending(messages);
}

export async function getAssistantPlaybook(scopeId: string): Promise<AssistantPlaybookRecord | null> {
  await ensureSeeded();
  const db = await getDemoDb();
  const playbooks = (await db.getAllFromIndex(
    ASSISTANT_PLAYBOOK_STORE,
    "scopeId",
    scopeId
  )) as AssistantPlaybookRecord[];
  return playbooks[0] ?? null;
}

export async function saveScope(scope: ScopeRecord): Promise<void> {
  await ensureSeeded();
  const db = await getDemoDb();
  await db.put(SCOPE_STORE, scope);
}

export async function saveThread(thread: ThreadRecord): Promise<void> {
  await ensureSeeded();
  const db = await getDemoDb();
  await db.put(THREAD_STORE, thread);
}

export async function saveDocument(document: DocumentRecord): Promise<void> {
  await ensureSeeded();
  const db = await getDemoDb();
  await db.put(DOCUMENT_STORE, document);
}

export async function saveAttentionItem(attentionItem: AttentionItem): Promise<void> {
  await ensureSeeded();
  const db = await getDemoDb();
  await db.put(ATTENTION_STORE, attentionItem);
}

export async function saveActivity(activity: ActivityRecord): Promise<void> {
  await ensureSeeded();
  const db = await getDemoDb();
  await db.put(ACTIVITY_STORE, activity);
}

export async function saveAssistantConversation(
  conversation: AssistantConversationRecord
): Promise<void> {
  await ensureSeeded();
  const db = await getDemoDb();
  await db.put(ASSISTANT_CONVERSATION_STORE, conversation);
}

export async function saveAssistantExchange(exchange: AssistantExchangeRecord): Promise<void> {
  await ensureSeeded();
  const db = await getDemoDb();
  await db.put(ASSISTANT_EXCHANGE_STORE, exchange);
}

export async function saveAssistantExchangeMessages(
  messages: AssistantExchangeMessageRecord[]
): Promise<void> {
  if (messages.length === 0) {
    return;
  }
  await ensureSeeded();
  const db = await getDemoDb();
  const tx = db.transaction(ASSISTANT_EXCHANGE_MESSAGE_STORE, "readwrite");
  for (const message of messages) {
    await tx.store.put(message);
  }
  await tx.done;
}

export async function saveAssistantPlaybook(playbook: AssistantPlaybookRecord): Promise<void> {
  await ensureSeeded();
  const db = await getDemoDb();
  await db.put(ASSISTANT_PLAYBOOK_STORE, playbook);
}

export async function saveActivities(activities: ActivityRecord[]): Promise<void> {
  if (activities.length === 0) {
    return;
  }
  await ensureSeeded();
  const db = await getDemoDb();
  const tx = db.transaction(ACTIVITY_STORE, "readwrite");
  for (const entry of activities) {
    await tx.store.put(entry);
  }
  await tx.done;
}

export async function saveScopes(scopes: ScopeRecord[]): Promise<void> {
  if (scopes.length === 0) {
    return;
  }
  await ensureSeeded();
  const db = await getDemoDb();
  const tx = db.transaction(SCOPE_STORE, "readwrite");
  for (const entry of scopes) {
    await tx.store.put(entry);
  }
  await tx.done;
}

export async function clearDemoPersistence(): Promise<void> {
  const db = await getDemoDb();
  const tx = db.transaction(
    [
      SCOPE_STORE,
      THREAD_STORE,
      DOCUMENT_STORE,
      ATTENTION_STORE,
      ACTIVITY_STORE,
      ASSISTANT_CONVERSATION_STORE,
      ASSISTANT_EXCHANGE_STORE,
      ASSISTANT_EXCHANGE_MESSAGE_STORE,
      ASSISTANT_PLAYBOOK_STORE,
      META_STORE,
    ],
    "readwrite"
  );
  await tx.objectStore(SCOPE_STORE).clear();
  await tx.objectStore(THREAD_STORE).clear();
  await tx.objectStore(DOCUMENT_STORE).clear();
  await tx.objectStore(ATTENTION_STORE).clear();
  await tx.objectStore(ACTIVITY_STORE).clear();
  await tx.objectStore(ASSISTANT_CONVERSATION_STORE).clear();
  await tx.objectStore(ASSISTANT_EXCHANGE_STORE).clear();
  await tx.objectStore(ASSISTANT_EXCHANGE_MESSAGE_STORE).clear();
  await tx.objectStore(ASSISTANT_PLAYBOOK_STORE).clear();
  await tx.objectStore(META_STORE).clear();
  await tx.done;
}
