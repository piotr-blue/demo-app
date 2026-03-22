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
  appendScopeMessage,
  createRootDocument,
  createThreadInScope,
  createWorkspaceFromTemplate,
  loadDemoSnapshot,
  resetDemoSnapshot,
  retryWorkspaceBootstrap,
} from "@/lib/demo/scope-actions";
import {
  emptyDemoCredentials,
  readDemoCredentials,
  writeDemoCredentials,
} from "@/lib/demo/credentials";
import {
  getBlinkScope,
  getScopeById,
  getScopeDocuments,
  getScopeThreads,
  getWorkspaceScopes,
} from "@/lib/demo/selectors";
import type {
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
  sendScopeMessage: (scopeId: string, text: string) => Promise<void>;
  sendThreadMessage: (threadId: string, text: string) => Promise<void>;
  runDocumentAction: (documentId: string, actionId: string) => Promise<void>;
  runThreadAction: (threadId: string, actionId: string) => Promise<void>;
  retryWorkspaceBootstrap: (scopeId: string) => Promise<void>;
  resetDemoData: () => Promise<void>;
}

const DemoContext = createContext<DemoContextValue | null>(null);

function fallbackAssistantReply(scopeName: string): string {
  return `I can help inside ${scopeName}. For repeated or long-running work, create a thread. For a concrete artifact, create a document.`;
}

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

  const sendScopeMessage = useCallback(
    async (scopeId: string, text: string): Promise<void> => {
      const afterUser = await appendScopeMessage(scopeId, "user", text);
      setSnapshot(afterUser);
      const scope = getScopeById(afterUser, scopeId);
      if (!scope) {
        return;
      }

      const threadSummaries = getScopeThreads(afterUser, scopeId).map((thread) => ({
        id: thread.id,
        title: thread.title,
        summary: thread.summary,
        status: thread.status,
      }));
      const documentSummaries = getScopeDocuments(afterUser, scopeId).map((document) => ({
        id: document.id,
        title: document.title,
        kind: document.kind,
        status: document.status,
      }));
      const workspaceSummaries =
        scope.type === "blink"
          ? getWorkspaceScopes(afterUser).map((entry) => ({
              id: entry.id,
              name: entry.name,
              bootstrapStatus: entry.bootstrapStatus,
            }))
          : [];
      const rootDocuments =
        scope.type === "blink"
          ? afterUser.documents
              .filter((document) => document.scopeId === null)
              .map((document) => ({
                id: document.id,
                title: document.title,
                kind: document.kind,
                status: document.status,
              }))
          : [];

      let assistantReply = "";
      try {
        const response = await fetch("/api/demo/assistant/chat", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            credentials,
            scope: {
              id: scope.id,
              type: scope.type,
              name: scope.name,
              templateKey: scope.templateKey ?? null,
              anchors: scope.anchors,
              threadSummaries,
              documentSummaries,
              workspaceSummaries,
              rootDocuments,
            },
            messages: [...scope.messages, { role: "user", text }],
          }),
        });
        const payload = (await response.json()) as
          | { ok: true; message: string }
          | { ok: false; error?: string };
        assistantReply =
          payload.ok && payload.message.trim().length > 0
            ? payload.message
            : fallbackAssistantReply(scope.name);
      } catch {
        assistantReply = fallbackAssistantReply(scope.name);
      }

      const afterAssistant = await appendScopeMessage(scopeId, "assistant", assistantReply);
      setSnapshot(afterAssistant);
    },
    [credentials]
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
      sendScopeMessage,
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
      retryWorkspaceBootstrapAction,
      resetDemoDataAction,
      runDocumentActionHandler,
      runThreadActionHandler,
      sendScopeMessage,
      sendThreadMessageAction,
      setCredentials,
      snapshot,
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
