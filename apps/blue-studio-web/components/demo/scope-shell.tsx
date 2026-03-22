"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useSearchParams } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useDemoApp } from "@/components/demo/demo-provider";
import {
  getRootDocuments,
  getScopeActivity,
  getScopeAttention,
  getScopeDocumentsBySection,
  getScopeDocuments,
  getScopeServices,
  getScopeThreads,
} from "@/lib/demo/selectors";
import type { ScopeRecord } from "@/lib/demo/types";

function formatDate(value: string) {
  const asDate = new Date(value);
  return asDate.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function ScopeSettingsView({ scope }: { scope: ScopeRecord }) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {scope.settingsBlocks.map((block) => (
        <Card key={block.id}>
          <CardContent className="space-y-2.5 pt-5">
            <h3 className="text-section-title">{block.title}</h3>
            {block.description ? <p className="text-body">{block.description}</p> : null}
            {block.items.map((item) => (
              <div key={`${block.id}_${item.label}`} className="grid grid-cols-[140px_1fr] gap-2 text-sm">
                <span className="text-text-muted">{item.label}</span>
                <span className="text-foreground">{item.value}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      ))}
      <Card>
        <CardContent className="space-y-2.5 pt-5">
          <h3 className="text-section-title">Assistant profile</h3>
          <div className="grid grid-cols-[140px_1fr] gap-2 text-sm">
            <span className="text-text-muted">Name</span>
            <span className="text-foreground">{scope.assistant.name}</span>
            <span className="text-text-muted">Tone</span>
            <span className="text-foreground">{scope.assistant.tone}</span>
            <span className="text-text-muted">Anchors</span>
            <span className="text-foreground">{scope.anchors.join(", ")}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export function ScopeShell({ scopeId }: { scopeId: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
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
  const [composerText, setComposerText] = useState("");
  const [sending, setSending] = useState(false);

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
  const services = useMemo(
    () => (snapshot ? getScopeServices(snapshot, scopeId) : []),
    [scopeId, snapshot]
  );
  const sectionKeys = scope?.sectionDefinitions.map((entry) => entry.key) ?? ["overview"];
  const requestedSection = searchParams.get("section");
  const initialSection =
    requestedSection && sectionKeys.includes(requestedSection) ? requestedSection : sectionKeys[0] ?? "overview";
  const [activeSection, setActiveSection] = useState(initialSection);

  useEffect(() => {
    setActiveSection(initialSection);
  }, [initialSection]);

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

  const recentThreads = threads.slice(0, 4);
  const recentDocuments = documents.slice(0, 4);
  const recentActivity = activity.slice(0, 8);
  const threadColumns: Array<{ key: string; label: string; tone: string }> = [
    { key: "active", label: "In Progress", tone: "bg-indigo-100 text-indigo-700" },
    { key: "paused", label: "Paused", tone: "bg-amber-100 text-amber-700" },
    { key: "blocked", label: "Blocked", tone: "bg-rose-100 text-rose-700" },
    { key: "completed", label: "Completed", tone: "bg-emerald-100 text-emerald-700" },
  ];

  const renderDocumentsBySection = (sectionKey: string) => {
    const sectionDocuments =
      scope.type === "blink"
        ? documents.filter((document) => document.sectionKey === sectionKey)
        : getScopeDocumentsBySection(snapshot, scope.id, sectionKey);

    return (
      <div className="overflow-hidden rounded-xl border border-border-soft">
        {sectionDocuments.length === 0 ? (
          <p className="text-body bg-card py-8 text-center">No documents in this section yet.</p>
        ) : (
          sectionDocuments.map((document) => (
            <Link
              key={document.id}
              href={`/documents/${encodeURIComponent(document.id)}`}
              className="demo-table-row md:grid-cols-[1.4fr_0.8fr_0.8fr_0.7fr]"
            >
              <div>
                <p className="font-semibold text-sm text-foreground">{document.title}</p>
                <p className="mt-1 text-caption line-clamp-1">{document.summary}</p>
              </div>
              <div className="flex items-center">
                <Badge variant="secondary">{document.kind}</Badge>
              </div>
              <div className="flex items-center">
                <Badge variant="outline">{document.status}</Badge>
              </div>
              <span className="flex items-center text-caption">{formatDate(document.updatedAt)}</span>
            </Link>
          ))
        )}
      </div>
    );
  };

  return (
    <section className="mx-auto max-w-6xl space-y-5">
      {/* Page header */}
      <div className="demo-surface px-6 py-5">
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
      <Tabs value={activeSection} onValueChange={setActiveSection}>
        <TabsList variant="line" className="flex-wrap">
          {scope.sectionDefinitions.map((section) => (
            <TabsTrigger key={section.key} value={section.key}>
              {section.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {scope.sectionDefinitions.map((section) => (
          <TabsContent key={section.key} value={section.key}>
            {section.kind === "overview" ? (
              <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
                <div className="space-y-4">
                  <div className="grid gap-3 sm:grid-cols-3">
                    <div className="demo-kpi">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-text-muted">
                        Open tasks
                      </p>
                      <p className="mt-1 text-2xl font-bold text-foreground">{threads.length}</p>
                    </div>
                    <div className="demo-kpi">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-text-muted">
                        Documents
                      </p>
                      <p className="mt-1 text-2xl font-bold text-foreground">{documents.length}</p>
                    </div>
                    <div className="demo-kpi">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-text-muted">
                        Attention
                      </p>
                      <p className="mt-1 text-2xl font-bold text-foreground">{attention.length}</p>
                    </div>
                  </div>
                  <Card>
                    <CardContent className="space-y-3 pt-5">
                      <h2 className="text-section-title">{scope.recap.headline}</h2>
                      <ul className="space-y-2 text-body">
                        {scope.recap.updates.map((item) => (
                          <li key={item} className="flex gap-2">
                            <span className="mt-1 text-accent-base">•</span>
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                      <div className="rounded-xl border border-accent-base/20 bg-accent-soft/60 p-3">
                        <p className="text-xs font-semibold uppercase tracking-[0.08em] text-accent-base">
                          Needs attention
                        </p>
                        <ul className="mt-2 space-y-1.5 text-sm text-foreground">
                          {scope.recap.asks.map((ask) => (
                            <li key={ask}>• {ask}</li>
                          ))}
                        </ul>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="space-y-3 pt-5">
                      <div className="flex items-center justify-between">
                        <h2 className="text-section-title">{scope.assistant.name} conversation</h2>
                        <Badge variant="secondary">{scope.messages.length} messages</Badge>
                      </div>
                      <div className="max-h-[360px] space-y-2 overflow-auto pr-1">
                        {scope.messages.map((entry) => (
                          <div
                            key={entry.id}
                            className={`rounded-xl border px-3 py-2.5 ${
                              entry.role === "assistant"
                                ? "border-border-soft bg-bg-subtle"
                                : entry.role === "user"
                                  ? "border-accent-base/20 bg-accent-soft/40"
                                  : "border-border-soft bg-card"
                            }`}
                          >
                            <p className="text-xs uppercase tracking-[0.06em] text-text-muted">{entry.role}</p>
                            <p className="mt-1 text-sm text-foreground">{entry.text}</p>
                          </div>
                        ))}
                      </div>
                      <div className="flex gap-2">
                        <input
                          className="h-10 flex-1 rounded-xl border border-border-soft bg-card px-3 text-sm"
                          value={composerText}
                          onChange={(event) => setComposerText(event.target.value)}
                          placeholder={`Message ${scope.assistant.name}…`}
                        />
                        <Button
                          size="sm"
                          disabled={sending || composerText.trim().length === 0}
                          onClick={async () => {
                            const text = composerText.trim();
                            if (!text) return;
                            setSending(true);
                            await sendScopeMessage(scope.id, text);
                            setComposerText("");
                            setSending(false);
                          }}
                        >
                          {sending ? "Sending…" : "Send"}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <div className="space-y-4">
                  <Card size="sm">
                    <CardContent className="space-y-2 pt-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-section-title">Recent tasks</h3>
                        <Button
                          size="xs"
                          onClick={async () => {
                            const threadId = await createThread(scope.id);
                            if (threadId) {
                              router.push(`/threads/${encodeURIComponent(threadId)}`);
                            }
                          }}
                        >
                          New task
                        </Button>
                      </div>
                      {recentThreads.length === 0 ? (
                        <p className="text-body">No tasks yet.</p>
                      ) : (
                        recentThreads.map((thread) => (
                          <Link
                            key={thread.id}
                            href={`/threads/${encodeURIComponent(thread.id)}`}
                              className="block rounded-xl border border-border-soft bg-card px-3 py-2.5 hover:border-accent-base/30 hover:bg-accent-soft/30"
                          >
                            <p className="font-medium text-sm text-foreground">{thread.title}</p>
                            <p className="text-caption">{thread.status} · {thread.progress}%</p>
                          </Link>
                        ))
                      )}
                    </CardContent>
                  </Card>
                  <Card size="sm">
                    <CardContent className="space-y-2 pt-4">
                      <h3 className="text-section-title">Recent documents</h3>
                      {recentDocuments.length === 0 ? (
                        <p className="text-body">No documents yet.</p>
                      ) : (
                        recentDocuments.map((document) => (
                          <Link
                            key={document.id}
                            href={`/documents/${encodeURIComponent(document.id)}`}
                              className="block rounded-xl border border-border-soft bg-card px-3 py-2.5 hover:border-accent-base/30 hover:bg-accent-soft/30"
                          >
                            <p className="font-medium text-sm text-foreground">{document.title}</p>
                            <p className="text-caption">{document.status}</p>
                          </Link>
                        ))
                      )}
                    </CardContent>
                  </Card>
                  <Card size="sm">
                    <CardContent className="space-y-2 pt-4">
                      <h3 className="text-section-title">Attention</h3>
                      {attention.length === 0 ? (
                        <p className="text-body">No urgent asks.</p>
                      ) : (
                        attention.slice(0, 4).map((item) => (
                          <div key={item.id} className="rounded-xl border border-border-soft px-3 py-2.5">
                            <div className="flex items-center justify-between gap-2">
                              <p className="font-medium text-sm text-foreground">{item.title}</p>
                              <Badge variant={item.priority === "high" ? "destructive" : "secondary"}>
                                {item.priority}
                              </Badge>
                            </div>
                            <p className="mt-1 text-caption">{item.body}</p>
                          </div>
                        ))
                      )}
                    </CardContent>
                  </Card>
                </div>
              </div>
            ) : null}

            {section.kind === "tasks" ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-section-title">{section.label}</h2>
                  <Button
                    size="sm"
                    onClick={async () => {
                      const threadId = await createThread(scope.id);
                      if (threadId) {
                        router.push(`/threads/${encodeURIComponent(threadId)}`);
                      }
                    }}
                  >
                    New task
                  </Button>
                </div>
                {threads.length === 0 ? (
                  <Card>
                    <CardContent className="py-8 text-body text-center">No tasks in this scope yet.</CardContent>
                  </Card>
                ) : (
                  <div className="grid gap-4 xl:grid-cols-4">
                    {threadColumns.map((column) => {
                      const grouped = threads.filter((thread) => thread.status === column.key);
                      return (
                        <Card key={column.key} className="overflow-hidden">
                          <CardContent className="space-y-3 p-0">
                            <div className="flex items-center justify-between border-b border-border-soft bg-bg-subtle/70 px-4 py-3">
                              <p className="text-sm font-semibold text-foreground">{column.label}</p>
                              <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${column.tone}`}>
                                {grouped.length}
                              </span>
                            </div>
                            <div className="space-y-3 p-4">
                              {grouped.length === 0 ? (
                                <p className="text-caption">No tasks in this column.</p>
                              ) : (
                                grouped.map((thread) => (
                                  <Link
                                    key={thread.id}
                                    href={`/threads/${encodeURIComponent(thread.id)}`}
                                    className="block rounded-xl border border-border-soft bg-card px-3 py-3 shadow-[var(--shadow-subtle)] hover:border-accent-base/25 hover:bg-accent-soft/25"
                                  >
                                    <p className="font-semibold text-sm text-foreground">{thread.title}</p>
                                    <p className="mt-1.5 text-caption">{thread.summary}</p>
                                    <div className="mt-2 flex items-center justify-between">
                                      <Badge variant="outline">{thread.progress}%</Badge>
                                      <span className="text-caption">{formatDate(thread.updatedAt)}</span>
                                    </div>
                                  </Link>
                                ))
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </div>
            ) : null}

            {section.kind === "documents" || section.kind === "domain" ? (
              <Card>
                <CardContent className="space-y-3 pt-5">
                  <div className="flex items-center justify-between">
                    <h2 className="text-section-title">{section.label}</h2>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={async () => {
                        if (scope.type === "blink") {
                          const rootDocumentId = await createRootDocument();
                          if (rootDocumentId) {
                            router.push(`/documents/${encodeURIComponent(rootDocumentId)}`);
                          }
                          return;
                        }
                        const scopeDocumentId = await createScopeDocument(
                          scope.id,
                          `${scope.name} ${section.label} document`,
                          "New workspace document for this section."
                        );
                        if (scopeDocumentId) {
                          router.push(`/documents/${encodeURIComponent(scopeDocumentId)}`);
                        }
                      }}
                    >
                      New document
                    </Button>
                  </div>
                  <div className="demo-table-head md:grid-cols-[1.4fr_0.8fr_0.8fr_0.7fr]">
                    <span>Title</span>
                    <span>Type</span>
                    <span>Status</span>
                    <span>Updated</span>
                  </div>
                  {renderDocumentsBySection(section.key)}
                </CardContent>
              </Card>
            ) : null}

            {section.kind === "services" ? (
              <Card>
                <CardContent className="space-y-3 pt-5">
                  <h2 className="text-section-title">Services</h2>
                  {services.length === 0 ? (
                    <p className="text-body py-8 text-center">No services available.</p>
                  ) : (
                    services.map((service) => (
                      <Link
                        key={service.id}
                        href={`/documents/${encodeURIComponent(service.id)}`}
                        className="flex items-start justify-between gap-3 rounded-xl border border-border-soft bg-card px-4 py-3 hover:border-accent-base/25 hover:bg-accent-soft/25"
                      >
                        <div>
                          <p className="font-semibold text-sm text-foreground">{service.title}</p>
                          <p className="text-body">{service.summary}</p>
                        </div>
                        <Badge>{service.status}</Badge>
                      </Link>
                    ))
                  )}
                </CardContent>
              </Card>
            ) : null}

            {section.kind === "activity" ? (
              <Card>
                <CardContent className="space-y-2.5 pt-5">
                  <h2 className="text-section-title">Activity timeline</h2>
                  {recentActivity.length === 0 ? (
                    <p className="text-body py-8 text-center">No activity yet.</p>
                  ) : (
                    recentActivity.map((entry) => (
                      <div key={entry.id} className="rounded-xl border border-border-soft px-4 py-3">
                        <div className="flex items-center justify-between gap-2">
                          <p className="font-medium text-sm text-foreground">{entry.title}</p>
                          <Badge variant="secondary">{entry.kind}</Badge>
                        </div>
                        {entry.detail ? <p className="mt-1 text-body">{entry.detail}</p> : null}
                        <p className="mt-1 text-caption">{formatDate(entry.createdAt)}</p>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            ) : null}

            {section.kind === "settings" ? <ScopeSettingsView scope={scope} /> : null}
          </TabsContent>
        ))}
      </Tabs>
    </section>
  );
}
