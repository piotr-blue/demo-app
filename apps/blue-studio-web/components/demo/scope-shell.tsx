"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useDemoApp } from "@/components/demo/demo-provider";
import { ScopeAssistantTab } from "@/components/demo/scope-assistant-tab";
import { ScopeThreadsTab } from "@/components/demo/scope-threads-tab";
import { ScopeDocumentsTab } from "@/components/demo/scope-documents-tab";
import { ScopeActivityTab } from "@/components/demo/scope-activity-tab";
import { ScopeSettingsTab } from "@/components/demo/scope-settings-tab";
import {
  getRootDocuments,
  getScopeActivity,
  getScopeAttention,
  getScopeDocuments,
  getScopeThreads,
} from "@/lib/demo/selectors";

export function ScopeShell({ scopeId }: { scopeId: string }) {
  const router = useRouter();
  const {
    snapshot,
    loading,
    createRootDocument,
    createScopeDocument,
    createThread,
    retryWorkspaceBootstrap,
    sendScopeMessage,
    getScope,
  } = useDemoApp();

  const scope = getScope(scopeId);

  const threads = useMemo(
    () => (snapshot ? getScopeThreads(snapshot, scopeId) : []),
    [scopeId, snapshot]
  );
  const documents = useMemo(() => {
    if (!snapshot || !scope) {
      return [];
    }
    if (scope.type === "blink") {
      return getRootDocuments(snapshot);
    }
    return getScopeDocuments(snapshot, scopeId);
  }, [scope, scopeId, snapshot]);
  const attention = useMemo(
    () => (snapshot ? getScopeAttention(snapshot, scopeId) : []),
    [scopeId, snapshot]
  );
  const activity = useMemo(
    () => (snapshot ? getScopeActivity(snapshot, scopeId) : []),
    [scopeId, snapshot]
  );

  if (loading || !snapshot) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-text-muted">
        Loading scope…
      </div>
    );
  }

  if (!scope) {
    return (
      <Card>
        <CardContent className="pt-5 text-sm text-muted-foreground">Scope not found.</CardContent>
      </Card>
    );
  }

  return (
    <section className="mx-auto max-w-6xl space-y-5">
      {/* Page header */}
      <div className="rounded-2xl border border-border-soft bg-card px-6 py-5 shadow-[var(--shadow-card)]">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-page-title">
              <span className="mr-2.5">{scope.icon ?? "🧩"}</span>
              {scope.name}
            </h1>
            <p className="mt-1.5 text-body">{scope.description}</p>
          </div>
          {scope.type === "workspace" && scope.bootstrapStatus === "failed" ? (
            <Button size="sm" variant="outline" onClick={() => void retryWorkspaceBootstrap(scope.id)}>
              Retry bootstrap
            </Button>
          ) : null}
        </div>
        {scope.type === "workspace" && scope.bootstrapStatus !== "ready" ? (
          <div className="mt-4 flex items-center gap-2.5 rounded-xl border border-border-soft bg-bg-subtle px-4 py-3 text-sm">
            <span className="text-text-secondary">Core document bootstrap:</span>
            <Badge variant={scope.bootstrapStatus === "failed" ? "destructive" : "secondary"}>
              {scope.bootstrapStatus}
            </Badge>
            {scope.bootstrapError ? (
              <p className="text-destructive text-xs ml-2">{scope.bootstrapError}</p>
            ) : null}
          </div>
        ) : null}
      </div>

      {/* Tab section */}
      <Tabs defaultValue="assistant">
        <TabsList>
          <TabsTrigger value="assistant">Assistant</TabsTrigger>
          <TabsTrigger value="threads">Threads</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
          <TabsTrigger value="scope">Scope</TabsTrigger>
        </TabsList>

        <TabsContent value="assistant">
          <ScopeAssistantTab
            scope={scope}
            threads={threads}
            documents={documents}
            recentActivity={activity}
            attentionItems={attention}
            onAddThread={async () => {
              const threadId = await createThread(scope.id);
              if (!threadId) {
                return;
              }
              router.push(`/threads/${encodeURIComponent(threadId)}`);
            }}
            onAddDocument={async () => {
              if (scope.type === "blink") {
                const rootDocumentId = await createRootDocument();
                if (!rootDocumentId) {
                  return;
                }
                router.push(`/documents/${encodeURIComponent(rootDocumentId)}`);
                return;
              }
              const scopeDocumentId = await createScopeDocument(
                scope.id,
                `${scope.name} document`,
                "A workspace-scoped artifact."
              );
              if (!scopeDocumentId) {
                return;
              }
              router.push(`/documents/${encodeURIComponent(scopeDocumentId)}`);
            }}
            onSendMessage={(text) => sendScopeMessage(scope.id, text)}
          />
        </TabsContent>

        <TabsContent value="threads">
          <ScopeThreadsTab
            threads={threads}
            onAddThread={async () => {
              const threadId = await createThread(scope.id);
              if (!threadId) {
                return;
              }
              router.push(`/threads/${encodeURIComponent(threadId)}`);
            }}
          />
        </TabsContent>

        <TabsContent value="documents">
          <ScopeDocumentsTab
            documents={documents}
            onCreateDocument={async () => {
              if (scope.type === "blink") {
                const rootDocumentId = await createRootDocument();
                if (!rootDocumentId) {
                  return;
                }
                router.push(`/documents/${encodeURIComponent(rootDocumentId)}`);
                return;
              }
              const scopeDocumentId = await createScopeDocument(
                scope.id,
                `${scope.name} document`,
                "A workspace-scoped artifact."
              );
              if (!scopeDocumentId) {
                return;
              }
              router.push(`/documents/${encodeURIComponent(scopeDocumentId)}`);
            }}
          />
        </TabsContent>

        <TabsContent value="activity">
          <ScopeActivityTab activity={activity} />
        </TabsContent>

        <TabsContent value="scope">
          <ScopeSettingsTab scope={scope} />
        </TabsContent>
      </Tabs>
    </section>
  );
}
