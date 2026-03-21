"use client";

import { useMemo } from "react";
import Image from "next/image";
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
import { getScopeAvatar, getScopeVisualLabel } from "@/lib/demo/visuals";
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
    <Tabs defaultValue="assistant" orientation="vertical" className="mx-auto max-w-[1320px]">
      <section className="grid gap-4 lg:grid-cols-[264px_1fr]">
        <aside className="h-fit rounded-xl border border-border-soft bg-card p-4 shadow-[var(--shadow-card)]">
          <div className="flex flex-col items-center border-b border-border-soft pb-4 text-center">
            <Image
              src={getScopeAvatar(scope)}
              alt={scope.name}
              width={74}
              height={74}
              className="size-[74px] rounded-full border border-border-soft object-cover"
            />
            <p className="mt-3 text-[10px] font-semibold uppercase tracking-[0.1em] text-text-muted">
              {getScopeVisualLabel(scope)}
            </p>
            <h1 className="mt-1 text-[19px] font-bold tracking-[-0.02em] text-foreground">{scope.name}</h1>
            <p className="mt-1 text-[12px] leading-relaxed text-text-secondary">{scope.description}</p>
          </div>
          <div className="mt-4 rounded-lg border border-border-soft bg-bg-subtle px-3 py-2.5">
            <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-text-muted">Assistant</p>
            <p className="mt-0.5 text-sm font-semibold text-foreground">{scope.assistant.name}</p>
            <p className="text-[11px] text-text-muted">{scope.assistant.tone}</p>
          </div>
          <TabsList
            className="mt-4 flex w-full flex-col items-stretch gap-1 rounded-none border-0 bg-transparent p-0"
          >
            <TabsTrigger
              value="assistant"
              className="h-9 justify-start rounded-lg px-3.5 data-active:border-accent-base/10 data-active:bg-accent-soft"
            >
              Chat
            </TabsTrigger>
            <TabsTrigger
              value="threads"
              className="h-9 justify-start rounded-lg px-3.5 data-active:border-accent-base/10 data-active:bg-accent-soft"
            >
              Tasks
            </TabsTrigger>
            <TabsTrigger
              value="documents"
              className="h-9 justify-start rounded-lg px-3.5 data-active:border-accent-base/10 data-active:bg-accent-soft"
            >
              Documents
            </TabsTrigger>
            <TabsTrigger
              value="activity"
              className="h-9 justify-start rounded-lg px-3.5 data-active:border-accent-base/10 data-active:bg-accent-soft"
            >
              Activity
            </TabsTrigger>
            <TabsTrigger
              value="scope"
              className="h-9 justify-start rounded-lg px-3.5 data-active:border-accent-base/10 data-active:bg-accent-soft"
            >
              Settings
            </TabsTrigger>
          </TabsList>
        </aside>

        <div className="space-y-4">
          <div className="rounded-xl border border-border-soft bg-card px-5 py-4 shadow-[var(--shadow-card)]">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-page-title">{scope.name}</p>
                <p className="mt-1 text-body">{scope.description}</p>
              </div>
              {scope.type === "workspace" && scope.bootstrapStatus === "failed" ? (
                <Button size="sm" variant="outline" onClick={() => void retryWorkspaceBootstrap(scope.id)}>
                  Retry bootstrap
                </Button>
              ) : null}
            </div>
          </div>

          {scope.type === "workspace" && scope.bootstrapStatus !== "ready" ? (
            <div className="flex items-center gap-2.5 rounded-lg border border-border-soft bg-card px-4 py-3 text-sm">
              <span className="text-text-secondary">Core document bootstrap:</span>
              <Badge variant={scope.bootstrapStatus === "failed" ? "destructive" : "secondary"}>
                {scope.bootstrapStatus}
              </Badge>
              {scope.bootstrapError ? (
                <p className="ml-2 text-xs text-destructive">{scope.bootstrapError}</p>
              ) : null}
            </div>
          ) : null}

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
        </div>
      </section>
    </Tabs>
  );
}
