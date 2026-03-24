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
  getOrCreateDocumentConversation,
  getOrCreateHomeConversation,
  loadDemoSnapshot,
  replyToAssistantExchange as replyToAssistantExchangeAction,
  resolveAssistantExchange as resolveAssistantExchangeAction,
  resetDemoSnapshot,
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
  startAssistantDemoDiscussion: (conversationId: string) => Promise<string | null>;
  startScopeDiscussion: (conversationId: string, text: string) => Promise<string | null>;
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
      const next = await toggleDocumentPublicVisibility(documentId, enabled);
      setSnapshot(next);
    },
    []
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

  const activeAccount = useMemo(
    () => (snapshot ? getActiveAccount(snapshot, activeAccountId) : null),
    [activeAccountId, snapshot]
  );

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
      startAssistantDemoDiscussion,
      startScopeDiscussion,
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
