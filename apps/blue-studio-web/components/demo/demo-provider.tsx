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
  appendScopeMessage,
  createRootDocument,
  createThreadInScope,
  createWorkspaceFromTemplate,
  loadDemoSnapshot,
  markWorkspaceBootstrapFailed,
  markWorkspaceBootstrapRunning,
  markWorkspaceBootstrapSuccess,
  retryWorkspaceBootstrap,
  syncThreadDocumentSnapshot,
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
  retryWorkspaceBootstrap: (scopeId: string) => Promise<void>;
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

  const runWorkspaceBootstrap = useCallback(
    async (params: {
      workspaceId: string;
      templateKey: WorkspaceTemplateKey;
      workspaceName: string;
    }) => {
      const runningSnapshot = await markWorkspaceBootstrapRunning(params.workspaceId);
      setSnapshot(runningSnapshot);

      try {
        const response = await fetch("/api/demo/workspaces/bootstrap", {
          method: "POST",
          headers: {
            "content-type": "application/json",
          },
          body: JSON.stringify({
            credentials,
            templateKey: params.templateKey,
            workspaceName: params.workspaceName,
          }),
        });
        const payload = (await response.json()) as
          | {
              ok: true;
              sessionId: string | null;
              coreDocumentId: string | null;
              myosDocumentId?: string | null;
            }
          | {
              ok: false;
              error: string;
            };
        if (!payload.ok) {
          const failedSnapshot = await markWorkspaceBootstrapFailed(
            params.workspaceId,
            payload.error || "Workspace bootstrap failed."
          );
          setSnapshot(failedSnapshot);
          return;
        }
        const successSnapshot = await markWorkspaceBootstrapSuccess({
          scopeId: params.workspaceId,
          sessionId: payload.sessionId,
          coreDocumentId: payload.coreDocumentId,
          myosDocumentId: payload.myosDocumentId ?? null,
        });
        setSnapshot(successSnapshot);
      } catch (error) {
        const failedSnapshot = await markWorkspaceBootstrapFailed(
          params.workspaceId,
          error instanceof Error ? error.message : "Workspace bootstrap failed."
        );
        setSnapshot(failedSnapshot);
      }
    },
    [credentials]
  );

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
      void runWorkspaceBootstrap({
        workspaceId: result.workspaceId,
        templateKey: params.templateKey,
        workspaceName: params.workspaceName,
      });
      return result.workspaceId;
    },
    [runWorkspaceBootstrap]
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
      const synced = await syncThreadDocumentSnapshot(created.threadId);
      setSnapshot(synced);
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
      const scope = getScopeById(next, scopeId);
      if (!scope || scope.type !== "workspace" || !scope.templateKey) {
        return;
      }
      void runWorkspaceBootstrap({
        workspaceId: scopeId,
        templateKey: scope.templateKey,
        workspaceName: scope.name,
      });
    },
    [runWorkspaceBootstrap]
  );

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
      retryWorkspaceBootstrap: retryWorkspaceBootstrapAction,
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
      sendScopeMessage,
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
