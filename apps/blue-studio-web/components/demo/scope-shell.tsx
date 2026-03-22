"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { AssistantConversationPanel } from "@/components/demo/assistant-conversation-panel";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StudioEmptyState, StudioStatusBadge } from "@/components/studio/studio-primitives";
import { useDemoApp } from "@/components/demo/demo-provider";
import {
  getRootDocuments,
  getScopeDocuments,
  getScopeServices,
  getScopeThreads,
} from "@/lib/demo/selectors";
import type { DocumentRecord } from "@/lib/demo/types";
import {
  BellRingIcon,
  MessageSquareIcon,
  FileTextIcon,
  ListTodoIcon,
  StarIcon,
  WorkflowIcon,
  HomeIcon,
} from "lucide-react";

function formatDate(value: string) {
  const asDate = new Date(value);
  return asDate.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

type ScopeSectionKey =
  | "chat"
  | "tasks"
  | "all-documents"
  | "starred"
  | "services"
  | "subscriptions";

const SCOPE_SECTIONS: Array<{
  key: ScopeSectionKey;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  { key: "chat", label: "Chat", icon: MessageSquareIcon },
  { key: "tasks", label: "Tasks", icon: ListTodoIcon },
  { key: "all-documents", label: "All Documents", icon: FileTextIcon },
  { key: "starred", label: "Starred", icon: StarIcon },
  { key: "services", label: "Services", icon: WorkflowIcon },
  { key: "subscriptions", label: "Subscriptions", icon: BellRingIcon },
];

function resolveSection(input: string | null): ScopeSectionKey {
  const found = SCOPE_SECTIONS.find((entry) => entry.key === input);
  return found?.key ?? "chat";
}

function docMatchesQuery(document: DocumentRecord, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return (
    document.title.toLowerCase().includes(q) ||
    document.summary.toLowerCase().includes(q) ||
    document.status.toLowerCase().includes(q)
  );
}

function DocumentList({
  documents,
  query,
  onQueryChange,
  section,
}: {
  documents: DocumentRecord[];
  query: string;
  onQueryChange: (value: string) => void;
  section: ScopeSectionKey;
}) {
  const filtered = documents.filter((entry) => docMatchesQuery(entry, query));
  return (
    <Card>
      <CardContent className="space-y-3 pt-4">
        <Input
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          placeholder="Search documents..."
          className="h-10"
        />
        {filtered.length === 0 ? (
          <StudioEmptyState title="No documents found." body="Try a different search term." />
        ) : (
          <div className="space-y-2">
            {filtered.map((document) => (
              <Link
                key={document.id}
                href={`/documents/${encodeURIComponent(document.id)}?section=${section}`}
                className="grid gap-2 rounded-lg border bg-card px-3.5 py-3 transition-colors hover:bg-muted/40 md:grid-cols-[1.4fr_0.8fr_0.7fr]"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{document.title}</p>
                  <p className="mt-1 line-clamp-1 text-xs text-muted-foreground">{document.summary}</p>
                </div>
                <div className="flex items-center">
                  <Badge variant="secondary">{document.kind}</Badge>
                </div>
                <p className="text-xs text-muted-foreground md:text-right">{formatDate(document.updatedAt)}</p>
              </Link>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function ScopeShell({ scopeId }: { scopeId: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const {
    snapshot,
    loading,
    createRootDocument,
    createScopeDocument,
    createThread,
    retryWorkspaceBootstrap,
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
  const services = useMemo(
    () => (snapshot ? getScopeServices(snapshot, scopeId) : []),
    [scopeId, snapshot]
  );
  const activeSection = resolveSection(searchParams.get("section"));
  const [taskQuery, setTaskQuery] = useState("");
  const [docQuery, setDocQuery] = useState("");

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

  const starredDocuments = documents.filter((entry) =>
    /(active|ready|approved|review|awaiting|in-progress|priority)/i.test(entry.status)
  );
  const subscriptionDocuments = documents.filter((entry) =>
    /(subscription|access|provider|renewal|plan)/i.test(
      `${entry.title} ${entry.summary} ${entry.kind} ${entry.category}`
    )
  );
  const filteredThreads = (() => {
    const q = taskQuery.trim().toLowerCase();
    if (!q) return threads;
    return threads.filter(
      (thread) =>
        thread.title.toLowerCase().includes(q) ||
        thread.summary.toLowerCase().includes(q) ||
        thread.status.toLowerCase().includes(q)
    );
  })();

  const setSection = (next: ScopeSectionKey) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("section", next);
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <section className="grid gap-4 lg:grid-cols-[220px_minmax(0,1fr)]">
      <aside>
        <Card className="h-[calc(100vh-140px)]">
          <CardContent className="space-y-4 pt-4">
            <div className="rounded-lg border bg-muted/20 px-3 py-4 text-center">
              <span className="inline-flex size-12 items-center justify-center rounded-full border bg-background text-xl">
                {scope.icon ?? <HomeIcon className="size-5" />}
              </span>
              <p className="mt-3 text-sm font-semibold">{scope.name}</p>
              <p className="mt-1 text-xs text-muted-foreground">{scope.type === "blink" ? "Home Space" : "Workspace"}</p>
            </div>

            <div className="rounded-lg border px-3 py-2 text-sm">
              <p className="text-xs text-muted-foreground">Assistant:</p>
              <p className="font-medium">{scope.assistant.name}</p>
            </div>

            <nav className="space-y-1">
              {SCOPE_SECTIONS.map((entry) => (
                <button
                  key={entry.key}
                  type="button"
                  className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                    activeSection === entry.key
                      ? "bg-primary text-primary-foreground"
                      : "text-foreground hover:bg-muted"
                  }`}
                  onClick={() => setSection(entry.key)}
                >
                  <entry.icon className="size-4" />
                  <span>{entry.label}</span>
                </button>
              ))}
            </nav>
          </CardContent>
        </Card>
      </aside>

      <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">{scope.name}</h1>
              <p className="mt-1 text-sm text-muted-foreground">{scope.description}</p>
            </div>
            {scope.type === "workspace" ? (
              <StudioStatusBadge
                status={scope.bootstrapStatus}
                tone={scope.bootstrapStatus === "failed" ? "destructive" : "neutral"}
              />
            ) : null}
          </div>

          {scope.type === "workspace" && scope.bootstrapStatus === "failed" ? (
            <div className="rounded-lg border border-destructive/20 bg-destructive/5 px-3 py-2 text-sm text-destructive">
              <p className="font-medium">Bootstrap failed</p>
              <p className="text-xs">{scope.bootstrapError ?? "Unknown error"}</p>
              <Button size="xs" variant="outline" className="mt-2" onClick={() => void retryWorkspaceBootstrap(scope.id)}>
                Retry bootstrap
              </Button>
            </div>
          ) : null}

          {activeSection === "chat" ? (
            <div className="h-[calc(100vh-220px)] min-h-[560px]">
              <AssistantConversationPanel scope={scope} fullHeight />
            </div>
          ) : null}

          {activeSection === "tasks" ? (
            <Card>
              <CardContent className="space-y-3 pt-4">
                <div className="flex items-center justify-between gap-2">
                  <h2 className="text-xl font-semibold">Tasks</h2>
                  <Button
                    size="sm"
                    onClick={async () => {
                      const threadId = await createThread(scope.id);
                      if (threadId) router.push(`/threads/${encodeURIComponent(threadId)}`);
                    }}
                  >
                    New task
                  </Button>
                </div>
                <Input
                  value={taskQuery}
                  onChange={(event) => setTaskQuery(event.target.value)}
                  placeholder="Search tasks..."
                  className="h-10"
                />
                {filteredThreads.length === 0 ? (
                  <StudioEmptyState title="No tasks found." body="Try a different search term." />
                ) : (
                  <div className="space-y-1">
                    {filteredThreads.map((thread) => (
                      <Link
                        key={thread.id}
                        href={`/threads/${encodeURIComponent(thread.id)}?section=${activeSection}`}
                        className="grid gap-2 border-b px-1 py-3 text-sm last:border-b-0 md:grid-cols-[1.5fr_0.8fr_0.6fr]"
                      >
                        <p className="font-medium">{thread.title}</p>
                        <p className="text-muted-foreground">{thread.summary}</p>
                        <p className="text-right text-muted-foreground">{formatDate(thread.updatedAt)}</p>
                      </Link>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ) : null}

          {activeSection === "all-documents" ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <h2 className="text-xl font-semibold">All Documents</h2>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={async () => {
                    if (scope.type === "blink") {
                      const id = await createRootDocument();
                      if (id) router.push(`/documents/${encodeURIComponent(id)}`);
                    } else {
                      const id = await createScopeDocument(
                        scope.id,
                        `${scope.name} document`,
                        "New workspace document."
                      );
                      if (id) router.push(`/documents/${encodeURIComponent(id)}`);
                    }
                  }}
                >
                  New document
                </Button>
              </div>
              <DocumentList
                documents={documents}
                query={docQuery}
                onQueryChange={setDocQuery}
                section={activeSection}
              />
            </div>
          ) : null}

          {activeSection === "starred" ? (
            <div className="space-y-2">
              <h2 className="text-xl font-semibold">Starred</h2>
              <DocumentList
                documents={starredDocuments}
                query={docQuery}
                onQueryChange={setDocQuery}
                section={activeSection}
              />
            </div>
          ) : null}

          {activeSection === "services" ? (
            <div className="space-y-2">
              <h2 className="text-xl font-semibold">Services</h2>
              <DocumentList
                documents={services}
                query={docQuery}
                onQueryChange={setDocQuery}
                section={activeSection}
              />
            </div>
          ) : null}

          {activeSection === "subscriptions" ? (
            <div className="space-y-2">
              <h2 className="text-xl font-semibold">Subscriptions</h2>
              <DocumentList
                documents={subscriptionDocuments}
                query={docQuery}
                onQueryChange={setDocQuery}
                section={activeSection}
              />
            </div>
          ) : null}
      </div>
    </section>
  );
}
