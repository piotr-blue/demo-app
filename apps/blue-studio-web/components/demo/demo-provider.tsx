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
  addScopeDocument,
  appendThreadMessage,
  applyDocumentAction,
  applyThreadAction,
  createRootDocument,
  createThreadInScope,
  createWorkspaceFromTemplate,
  loadDemoSnapshot,
  replyToAssistantExchange as replyToAssistantExchangeAction,
  resolveAssistantExchange as resolveAssistantExchangeAction,
  resetDemoSnapshot,
  retryWorkspaceBootstrap,
  startAssistantDemoDiscussion as startAssistantDemoDiscussionAction,
  startUserDiscussion as startUserDiscussionAction,
  updateAssistantPlaybook as updateAssistantPlaybookAction,
} from "@/lib/demo/scope-actions";
import {
  emptyDemoCredentials,
  readDemoCredentials,
  writeDemoCredentials,
} from "@/lib/demo/credentials";
import {
  getBlinkScope,
  getScopeById,
} from "@/lib/demo/selectors";
import type {
  AssistantPlaybookRecord,
  DemoCredentials,
  DemoSnapshot,
  ScopeRecord,
  WorkspaceTemplateKey,
} from "@/lib/demo/types";

interface DemoContextValue {
  snapshot: DemoSnapshot | null;
  loading: boolean;
  credentials: DemoCredentials;
  setCredentials: (credentials: DemoCredentials) => void;
  refresh: () => Promise<void>;
  getScope: (scopeId: string) => ScopeRecord | null;
  createWorkspace: (params: {
    templateKey: WorkspaceTemplateKey;
    workspaceName: string;
  }) => Promise<string | null>;
  createThread: (scopeId: string, title?: string) => Promise<string | null>;
  createRootDocument: () => Promise<string | null>;
  createScopeDocument: (
    scopeId: string,
    title: string,
    summary: string
  ) => Promise<string | null>;
  startAssistantDemoDiscussion: (scopeId: string) => Promise<string | null>;
  startScopeDiscussion: (scopeId: string, text: string) => Promise<string | null>;
  replyToAssistantExchange: (exchangeId: string, text: string) => Promise<void>;
  resolveAssistantExchange: (exchangeId: string) => Promise<void>;
  updateAssistantPlaybook: (
    scopeId: string,
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
  retryWorkspaceBootstrap: (scopeId: string) => Promise<void>;
  resetDemoData: () => Promise<void>;
}

const DemoContext = createContext<DemoContextValue | null>(null);

export function DemoProvider({ children }: { children: ReactNode }) {
  const [snapshot, setSnapshot] = useState<DemoSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [credentials, setCredentialsState] = useState<DemoCredentials>(emptyDemoCredentials());

  const refresh = useCallback(async () => {
    const next = await loadDemoSnapshot();
    setSnapshot(next);
  }, []);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const [seededSnapshot, storedCredentials] = await Promise.all([
        loadDemoSnapshot(),
        Promise.resolve(readDemoCredentials()),
      ]);
      if (cancelled) {
        return;
      }
      setSnapshot(seededSnapshot);
      setCredentialsState(storedCredentials ?? emptyDemoCredentials());
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

  const createWorkspaceAction = useCallback(
    async (params: {
      templateKey: WorkspaceTemplateKey;
      workspaceName: string;
    }): Promise<string | null> => {
      const result = await createWorkspaceFromTemplate({
        templateKey: params.templateKey,
        workspaceName: params.workspaceName,
      });
      if (!result.workspaceId) {
        return null;
      }
      setSnapshot(result.snapshot);
      return result.workspaceId;
    },
    []
  );

  const createThreadAction = useCallback(
    async (scopeId: string, title?: string): Promise<string | null> => {
      const created = await createThreadInScope({
        scopeId,
        title,
      });
      if (!created.threadId) {
        return null;
      }
      setSnapshot(created.snapshot);
      return created.threadId;
    },
    []
  );

  const createRootDocumentAction = useCallback(async (): Promise<string | null> => {
    const created = await createRootDocument();
    setSnapshot(created.snapshot);
    return created.documentId || null;
  }, []);

  const createScopeDocumentAction = useCallback(
    async (scopeId: string, title: string, summary: string): Promise<string | null> => {
      const created = await addScopeDocument({
        scopeId,
        title,
        summary,
        kind: "generic",
      });
      setSnapshot(created.snapshot);
      return created.documentId || null;
    },
    []
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
      scopeId: string,
      patch: Partial<
        Pick<
          AssistantPlaybookRecord,
          "identityMarkdown" | "defaultsMarkdown" | "contextMarkdown" | "overridesMarkdown"
        >
      >
    ): Promise<void> => {
      const next = await updateAssistantPlaybookAction(scopeId, patch);
      setSnapshot(next);
    },
    []
  );

  const retryWorkspaceBootstrapAction = useCallback(
    async (scopeId: string): Promise<void> => {
      const next = await retryWorkspaceBootstrap(scopeId);
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

  const resetDemoDataAction = useCallback(async (): Promise<void> => {
    const next = await resetDemoSnapshot();
    setSnapshot(next);
  }, []);

  const value = useMemo<DemoContextValue>(
    () => ({
      snapshot,
      loading,
      credentials,
      setCredentials,
      refresh,
      getScope: (scopeId: string) => (snapshot ? getScopeById(snapshot, scopeId) : null),
      createWorkspace: createWorkspaceAction,
      createThread: createThreadAction,
      createRootDocument: createRootDocumentAction,
      createScopeDocument: createScopeDocumentAction,
      startAssistantDemoDiscussion,
      startScopeDiscussion,
      replyToAssistantExchange,
      resolveAssistantExchange,
      updateAssistantPlaybook,
      sendThreadMessage: sendThreadMessageAction,
      runDocumentAction: runDocumentActionHandler,
      runThreadAction: runThreadActionHandler,
      retryWorkspaceBootstrap: retryWorkspaceBootstrapAction,
      resetDemoData: resetDemoDataAction,
    }),
    [
      createRootDocumentAction,
      createScopeDocumentAction,
      createThreadAction,
      createWorkspaceAction,
      credentials,
      loading,
      refresh,
      replyToAssistantExchange,
      retryWorkspaceBootstrapAction,
      resolveAssistantExchange,
      resetDemoDataAction,
      runDocumentActionHandler,
      runThreadActionHandler,
      sendThreadMessageAction,
      setCredentials,
      snapshot,
      startAssistantDemoDiscussion,
      startScopeDiscussion,
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

export function useBlinkScope(): ScopeRecord | null {
  const { snapshot } = useDemoApp();
  if (!snapshot) {
    return null;
  }
  return getBlinkScope(snapshot);
}
