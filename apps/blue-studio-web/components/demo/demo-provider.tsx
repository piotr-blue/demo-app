"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  appendThreadMessage,
  applyDocumentAction,
  applyThreadAction,
  addDocumentShareEntry,
  continueLiveDiscussion as continueLiveDiscussionAction,
  finalizeLiveDiscussion as finalizeLiveDiscussionAction,
  getOrCreateDocumentConversation,
  getOrCreateHomeConversation,
  loadDemoSnapshot,
  markLiveDocumentVisibilityUnsupported,
  replyToAssistantExchange as replyToAssistantExchangeAction,
  resolveAssistantExchange as resolveAssistantExchangeAction,
  resetDemoSnapshot,
  syncLiveDocuments as syncLiveDocumentsAction,
  syncLiveRetrievedDocument as syncLiveRetrievedDocumentAction,
  startLiveDiscussion as startLiveDiscussionAction,
  startAssistantDemoDiscussion as startAssistantDemoDiscussionAction,
  startUserDiscussion as startUserDiscussionAction,
  toggleDocumentPublicVisibility,
  toggleDocumentServiceConnection,
  toggleDocumentShareEnabled,
  toggleDocumentFavorite,
  updateAssistantPlaybook as updateAssistantPlaybookAction,
} from "@/lib/demo/scope-actions";
import {
  emptyDemoCredentials,
  readActiveDemoAccountId,
  readDemoCredentials,
  writeActiveDemoAccountId,
  writeDemoCredentials,
} from "@/lib/demo/credentials";
import {
  getAccountById,
  getActiveAccount,
} from "@/lib/demo/selectors";
import type {
  DemoAccountRecord,
  AssistantPlaybookRecord,
  DemoCredentials,
  LiveAssistantTurn,
  DemoShareRecord,
  DemoSnapshot,
} from "@/lib/demo/types";

interface DemoContextValue {
  snapshot: DemoSnapshot | null;
  loading: boolean;
  activeAccountId: string | null;
  activeAccount: DemoAccountRecord | null;
  setActiveAccountId: (accountId: string) => void;
  credentials: DemoCredentials;
  setCredentials: (credentials: DemoCredentials) => void;
  refresh: () => Promise<void>;
  getAccount: (accountId: string) => DemoAccountRecord | null;
  getHomeConversationId: (accountId?: string) => Promise<string | null>;
  getDocumentConversationId: (documentId: string, viewerAccountId?: string) => Promise<string | null>;
  syncLiveDocumentsFromApi: () => Promise<void>;
  syncLiveDocumentById: (documentId: string) => Promise<void>;
  startAssistantDemoDiscussion: (conversationId: string) => Promise<string | null>;
  startScopeDiscussion: (conversationId: string, text: string) => Promise<string | null>;
  startLiveDiscussion: (conversationId: string, text: string) => Promise<string | null>;
  continueLiveDiscussion: (exchangeId: string, text: string) => Promise<void>;
  finalizeLiveDiscussion: (params: {
    exchangeId: string;
    turn: LiveAssistantTurn;
    createdDocument?: {
      kind: string;
      name: string;
      description: string;
      fields: Record<string, string>;
      anchors: Array<{ key: string; label: string; purpose: string }>;
      sessionId: string | null;
      myosDocumentId: string | null;
      mappedDocument?: DemoSnapshot["documents"][number] | null;
      mappedAnchors?: DemoSnapshot["documentAnchors"];
      linked?: Array<{
        anchorKey: string;
        childSessionId: string;
        childDocumentId: string;
        linkSessionId: string | null;
      }>;
      link?: {
        parentDocumentId: string;
        anchorKey: string;
      } | null;
    } | null;
    docCreationError?: string | null;
  }) => Promise<void>;
  replyToAssistantExchange: (exchangeId: string, text: string) => Promise<void>;
  resolveAssistantExchange: (exchangeId: string) => Promise<void>;
  updateAssistantPlaybook: (
    playbookId: string,
    patch: Partial<
      Pick<
        AssistantPlaybookRecord,
        "identityMarkdown" | "defaultsMarkdown" | "contextMarkdown" | "overridesMarkdown"
      >
    >
  ) => Promise<void>;
  sendThreadMessage: (threadId: string, text: string) => Promise<void>;
  runDocumentAction: (documentId: string, actionId: string) => Promise<void>;
  runThreadAction: (threadId: string, actionId: string) => Promise<void>;
  setDocumentShareEnabled: (documentId: string, enabled: boolean) => Promise<void>;
  setDocumentPublicVisibility: (documentId: string, enabled: boolean) => Promise<void>;
  addDocumentShareEntry: (
    documentId: string,
    type: DemoShareRecord["type"],
    name: string
  ) => Promise<void>;
  toggleDocumentService: (documentId: string, serviceId: string) => Promise<void>;
  toggleFavorite: (documentId: string) => Promise<void>;
  resetDemoData: () => Promise<void>;
}

const DemoContext = createContext<DemoContextValue | null>(null);

export function DemoProvider({ children }: { children: ReactNode }) {
  const [snapshot, setSnapshot] = useState<DemoSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [credentials, setCredentialsState] = useState<DemoCredentials>(emptyDemoCredentials());
  const [activeAccountId, setActiveAccountIdState] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    const next = await loadDemoSnapshot();
    setSnapshot(next);
  }, []);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const [seededSnapshot, storedCredentials, storedActiveAccountId] = await Promise.all([
        loadDemoSnapshot(),
        Promise.resolve(readDemoCredentials()),
        Promise.resolve(readActiveDemoAccountId()),
      ]);
      if (cancelled) {
        return;
      }
      setSnapshot(seededSnapshot);
      setCredentialsState(storedCredentials ?? emptyDemoCredentials());
      setActiveAccountIdState(
        storedActiveAccountId ?? getActiveAccount(seededSnapshot)?.id ?? null
      );
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const setCredentials = useCallback((nextCredentials: DemoCredentials) => {
    setCredentialsState(nextCredentials);
    writeDemoCredentials(nextCredentials);
  }, []);

  const setActiveAccountId = useCallback((accountId: string) => {
    setActiveAccountIdState(accountId);
    writeActiveDemoAccountId(accountId);
  }, []);

  const activeAccount = useMemo(
    () => (snapshot ? getActiveAccount(snapshot, activeAccountId) : null),
    [activeAccountId, snapshot]
  );

  const getHomeConversationId = useCallback(
    async (accountId?: string): Promise<string | null> => {
      const resolvedAccountId = accountId ?? activeAccountId;
      if (!resolvedAccountId) {
        return null;
      }
      const result = await getOrCreateHomeConversation(resolvedAccountId);
      setSnapshot(result.snapshot);
      return result.conversationId || null;
    },
    [activeAccountId]
  );

  const getDocumentConversationId = useCallback(
    async (documentId: string, viewerAccountId?: string): Promise<string | null> => {
      const resolvedAccountId = viewerAccountId ?? activeAccountId;
      if (!resolvedAccountId) {
        return null;
      }
      const result = await getOrCreateDocumentConversation(documentId, resolvedAccountId);
      setSnapshot(result.snapshot);
      return result.conversationId || null;
    },
    [activeAccountId]
  );

  const syncLiveDocumentsFromApi = useCallback(async (): Promise<void> => {
    if (!activeAccount || activeAccount.mode !== "live") {
      return;
    }
    if (!credentials.myOsApiKey.trim() || !credentials.myOsAccountId.trim() || !credentials.myOsBaseUrl.trim()) {
      return;
    }
    const response = await fetch("/api/demo/live-documents/list", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        credentials,
        ownerAccountId: activeAccount.id,
        ownerName: activeAccount.name,
      }),
    });
    const payload = (await response.json()) as
      | { ok: true; documents: DemoSnapshot["documents"] }
      | { ok: false; error: string };
    if (!response.ok || !payload.ok) {
      return;
    }
    const next = await syncLiveDocumentsAction(activeAccount.id, payload.documents);
    setSnapshot(next);
  }, [activeAccount, credentials]);

  const syncLiveDocumentById = useCallback(
    async (documentId: string): Promise<void> => {
      if (!activeAccount || activeAccount.mode !== "live") {
        return;
      }
      if (!documentId.startsWith("doc_live_")) {
        return;
      }
      if (!credentials.myOsApiKey.trim() || !credentials.myOsAccountId.trim() || !credentials.myOsBaseUrl.trim()) {
        return;
      }
      const sessionId = documentId.replace(/^doc_live_/u, "");
      const response = await fetch("/api/demo/live-documents/retrieve", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          credentials,
          sessionId,
          accountId: activeAccount.id,
          accountName: activeAccount.name,
        }),
      });
      const payload = (await response.json()) as
        | {
            ok: true;
            mappedDocument: DemoSnapshot["documents"][number] | null;
            mappedAnchors: DemoSnapshot["documentAnchors"];
            linked: Array<{ anchorKey: string; childSessionId: string }>;
          }
        | { ok: false; error: string };
      if (!response.ok || !payload.ok || !payload.mappedDocument) {
        return;
      }
      const next = await syncLiveRetrievedDocumentAction({
        accountId: activeAccount.id,
        document: payload.mappedDocument,
        anchors: payload.mappedAnchors ?? [],
        linked: (payload.linked ?? []).map((entry) => ({
          anchorKey: entry.anchorKey,
          childDocumentId: `doc_live_${entry.childSessionId}`,
        })),
      });
      setSnapshot(next);
    },
    [activeAccount, credentials]
  );

  const startAssistantDemoDiscussion = useCallback(
    async (scopeId: string): Promise<string | null> => {
      const result = await startAssistantDemoDiscussionAction(scopeId);
      setSnapshot(result.snapshot);
      return result.exchangeId || null;
    },
    []
  );

  const startScopeDiscussion = useCallback(
    async (scopeId: string, text: string): Promise<string | null> => {
      const result = await startUserDiscussionAction(scopeId, text);
      setSnapshot(result.snapshot);
      return result.exchangeId || null;
    },
    []
  );

  const startLiveDiscussion = useCallback(
    async (conversationId: string, text: string): Promise<string | null> => {
      const result = await startLiveDiscussionAction(conversationId, text);
      setSnapshot(result.snapshot);
      return result.exchangeId || null;
    },
    []
  );

  const continueLiveDiscussion = useCallback(async (exchangeId: string, text: string): Promise<void> => {
    const next = await continueLiveDiscussionAction(exchangeId, text);
    setSnapshot(next);
  }, []);

  const finalizeLiveDiscussion = useCallback(
    async (params: {
      exchangeId: string;
      turn: LiveAssistantTurn;
      createdDocument?: {
        kind: string;
        name: string;
        description: string;
        fields: Record<string, string>;
        anchors: Array<{ key: string; label: string; purpose: string }>;
        sessionId: string | null;
        myosDocumentId: string | null;
        mappedDocument?: DemoSnapshot["documents"][number] | null;
        mappedAnchors?: DemoSnapshot["documentAnchors"];
        linked?: Array<{
          anchorKey: string;
          childSessionId: string;
          childDocumentId: string;
          linkSessionId: string | null;
        }>;
        link?: {
          parentDocumentId: string;
          anchorKey: string;
        } | null;
      } | null;
      docCreationError?: string | null;
    }): Promise<void> => {
      const next = await finalizeLiveDiscussionAction(params);
      setSnapshot(next);
    },
    []
  );

  const replyToAssistantExchange = useCallback(async (exchangeId: string, text: string): Promise<void> => {
    const next = await replyToAssistantExchangeAction(exchangeId, text);
    setSnapshot(next);
  }, []);

  const resolveAssistantExchange = useCallback(async (exchangeId: string): Promise<void> => {
    const next = await resolveAssistantExchangeAction(exchangeId);
    setSnapshot(next);
  }, []);

  const updateAssistantPlaybook = useCallback(
    async (
      playbookId: string,
      patch: Partial<
        Pick<
          AssistantPlaybookRecord,
          "identityMarkdown" | "defaultsMarkdown" | "contextMarkdown" | "overridesMarkdown"
        >
      >
    ): Promise<void> => {
      const next = await updateAssistantPlaybookAction(playbookId, patch);
      setSnapshot(next);
    },
    []
  );

  const sendThreadMessageAction = useCallback(async (threadId: string, text: string): Promise<void> => {
    const afterUser = await appendThreadMessage(threadId, "user", text);
    setSnapshot(afterUser);
    const afterAssistant = await appendThreadMessage(
      threadId,
      "assistant",
      "Acknowledged. I logged your update in this thread."
    );
    setSnapshot(afterAssistant);
  }, []);

  const runDocumentActionHandler = useCallback(async (documentId: string, actionId: string): Promise<void> => {
    const next = await applyDocumentAction(documentId, actionId);
    setSnapshot(next);
  }, []);

  const runThreadActionHandler = useCallback(async (threadId: string, actionId: string): Promise<void> => {
    const next = await applyThreadAction(threadId, actionId);
    setSnapshot(next);
  }, []);

  const setDocumentShareEnabledHandler = useCallback(
    async (documentId: string, enabled: boolean): Promise<void> => {
      const next = await toggleDocumentShareEnabled(documentId, enabled);
      setSnapshot(next);
    },
    []
  );

  const setDocumentPublicVisibilityHandler = useCallback(
    async (documentId: string, enabled: boolean): Promise<void> => {
      const liveDocument = snapshot?.documents.find((entry) => entry.id === documentId);
      if (activeAccount?.mode === "live" && documentId.startsWith("doc_live_") && liveDocument?.sessionId) {
        const response = await fetch("/api/demo/live-documents/visibility", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            credentials,
            sessionId: liveDocument.sessionId,
            enabled,
          }),
        });
        const payload = (await response.json()) as
          | {
              ok: true;
              mappedDocument: DemoSnapshot["documents"][number] | null;
              mappedAnchors: DemoSnapshot["documentAnchors"];
            }
          | { ok: false; unsupported?: boolean; error: string };

        if (!response.ok || !payload.ok) {
          if ("unsupported" in payload && payload.unsupported) {
            const next = await markLiveDocumentVisibilityUnsupported(documentId, payload.error);
            setSnapshot(next);
            return;
          }
          return;
        }

        if (payload.mappedDocument) {
          const next = await syncLiveRetrievedDocumentAction({
            accountId: activeAccount.id,
            document: payload.mappedDocument,
            anchors: payload.mappedAnchors ?? [],
          });
          setSnapshot(next);
        }
        return;
      }
      const next = await toggleDocumentPublicVisibility(documentId, enabled);
      setSnapshot(next);
    },
    [activeAccount, credentials, snapshot]
  );

  const addDocumentShareEntryHandler = useCallback(
    async (documentId: string, type: DemoShareRecord["type"], name: string): Promise<void> => {
      const next = await addDocumentShareEntry(documentId, type, name);
      setSnapshot(next);
    },
    []
  );

  const toggleDocumentServiceHandler = useCallback(
    async (documentId: string, serviceId: string): Promise<void> => {
      const next = await toggleDocumentServiceConnection(documentId, serviceId);
      setSnapshot(next);
    },
    []
  );

  const toggleFavoriteHandler = useCallback(
    async (documentId: string): Promise<void> => {
      if (!activeAccountId) {
        return;
      }
      const next = await toggleDocumentFavorite(activeAccountId, documentId);
      setSnapshot(next);
    },
    [activeAccountId]
  );

  const resetDemoDataAction = useCallback(async (): Promise<void> => {
    const next = await resetDemoSnapshot();
    setSnapshot(next);
    const primaryAccount = getActiveAccount(next);
    if (primaryAccount) {
      setActiveAccountIdState(primaryAccount.id);
      writeActiveDemoAccountId(primaryAccount.id);
    }
  }, []);

  const value = useMemo<DemoContextValue>(
    () => ({
      snapshot,
      loading,
      activeAccountId,
      activeAccount,
      setActiveAccountId,
      credentials,
      setCredentials,
      refresh,
      getAccount: (accountId: string) => (snapshot ? getAccountById(snapshot, accountId) : null),
      getHomeConversationId,
      getDocumentConversationId,
      syncLiveDocumentsFromApi,
      syncLiveDocumentById,
      startAssistantDemoDiscussion,
      startScopeDiscussion,
      startLiveDiscussion,
      continueLiveDiscussion,
      finalizeLiveDiscussion,
      replyToAssistantExchange,
      resolveAssistantExchange,
      updateAssistantPlaybook,
      sendThreadMessage: sendThreadMessageAction,
      runDocumentAction: runDocumentActionHandler,
      runThreadAction: runThreadActionHandler,
      setDocumentShareEnabled: setDocumentShareEnabledHandler,
      setDocumentPublicVisibility: setDocumentPublicVisibilityHandler,
      addDocumentShareEntry: addDocumentShareEntryHandler,
      toggleDocumentService: toggleDocumentServiceHandler,
      toggleFavorite: toggleFavoriteHandler,
      resetDemoData: resetDemoDataAction,
    }),
    [
      activeAccount,
      activeAccountId,
      credentials,
      getDocumentConversationId,
      getHomeConversationId,
      loading,
      refresh,
      syncLiveDocumentById,
      syncLiveDocumentsFromApi,
      continueLiveDiscussion,
      finalizeLiveDiscussion,
      replyToAssistantExchange,
      resolveAssistantExchange,
      resetDemoDataAction,
      addDocumentShareEntryHandler,
      runDocumentActionHandler,
      runThreadActionHandler,
      sendThreadMessageAction,
      setDocumentPublicVisibilityHandler,
      setDocumentShareEnabledHandler,
      setActiveAccountId,
      setCredentials,
      snapshot,
      startAssistantDemoDiscussion,
      startLiveDiscussion,
      startScopeDiscussion,
      toggleDocumentServiceHandler,
      toggleFavoriteHandler,
      updateAssistantPlaybook,
    ]
  );

  return <DemoContext.Provider value={value}>{children}</DemoContext.Provider>;
}

export function useDemoApp(): DemoContextValue {
  const value = useContext(DemoContext);
  if (!value) {
    throw new Error("useDemoApp must be used within DemoProvider.");
  }
  return value;
}
