"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useSearchParams } from "next/navigation";
import { DemoPageHeader } from "@/components/demo/demo-page-header";
import { AssistantConversationPanel } from "@/components/demo/assistant-conversation-panel";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useDemoApp } from "@/components/demo/demo-provider";
import {
  getScopeAssistantPlaybook,
  getRootDocuments,
  getScopeActivity,
  getScopeAttention,
  getScopeDocumentsBySection,
  getScopeDocuments,
  getScopeServices,
  getScopeThreads,
} from "@/lib/demo/selectors";
import type { ScopeRecord } from "@/lib/demo/types";
import {
  ActivityIcon,
  FileTextIcon,
  Layers3Icon,
  ListTodoIcon,
  WorkflowIcon,
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

function ScopeSettingsView({
  scope,
  playbook,
  onSavePlaybook,
}: {
  scope: ScopeRecord;
  playbook: ReturnType<typeof getScopeAssistantPlaybook>;
  onSavePlaybook: (patch: {
    identityMarkdown: string;
    defaultsMarkdown: string;
    contextMarkdown: string;
    overridesMarkdown: string;
  }) => Promise<void>;
}) {
  const [identityMarkdown, setIdentityMarkdown] = useState(playbook?.identityMarkdown ?? "");
  const [defaultsMarkdown, setDefaultsMarkdown] = useState(playbook?.defaultsMarkdown ?? "");
  const [contextMarkdown, setContextMarkdown] = useState(playbook?.contextMarkdown ?? "");
  const [overridesMarkdown, setOverridesMarkdown] = useState(playbook?.overridesMarkdown ?? "");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setIdentityMarkdown(playbook?.identityMarkdown ?? "");
    setDefaultsMarkdown(playbook?.defaultsMarkdown ?? "");
    setContextMarkdown(playbook?.contextMarkdown ?? "");
    setOverridesMarkdown(playbook?.overridesMarkdown ?? "");
  }, [
    playbook?.id,
    playbook?.identityMarkdown,
    playbook?.defaultsMarkdown,
    playbook?.contextMarkdown,
    playbook?.overridesMarkdown,
  ]);

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {scope.settingsBlocks.map((block) => (
        <Card key={block.id}>
          <CardContent className="space-y-4 pt-5">
            <h3 className="text-section-title">{block.title}</h3>
            {block.description ? <p className="text-body">{block.description}</p> : null}
            <div className="space-y-2">
              {block.items.map((item) => (
                <div
                  key={`${block.id}_${item.label}`}
                  className="demo-meta-row border-border-soft/80 bg-bg-subtle/60 py-2.5"
                >
                  <span className="text-text-muted">{item.label}</span>
                  <span className="text-right font-medium text-foreground">{item.value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}
      <Card>
        <CardContent className="space-y-4 pt-5">
          <h3 className="text-section-title">Assistant profile</h3>
          <div className="space-y-2">
            <div className="demo-meta-row border-border-soft/80 bg-bg-subtle/60 py-2.5">
              <span className="text-text-muted">Name</span>
              <span className="text-right font-medium text-foreground">{scope.assistant.name}</span>
            </div>
            <div className="demo-meta-row border-border-soft/80 bg-bg-subtle/60 py-2.5">
              <span className="text-text-muted">Tone</span>
              <span className="text-right font-medium text-foreground">{scope.assistant.tone}</span>
            </div>
            <div className="demo-meta-row border-border-soft/80 bg-bg-subtle/60 py-2.5">
              <span className="text-text-muted">Anchors</span>
              <span className="text-right font-medium text-foreground">{scope.anchors.join(", ")}</span>
            </div>
          </div>
        </CardContent>
      </Card>
      <Card className="md:col-span-2">
        <CardContent className="space-y-4 pt-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-section-title">Assistant playbook</h3>
            {playbook?.inheritsFromScopeId ? (
              <Badge variant="outline">Inherits from {playbook.inheritsFromScopeId}</Badge>
            ) : (
              <Badge variant="secondary">Root playbook</Badge>
            )}
          </div>
          <p className="text-body">
            Best-effort guidance for language, tone, priorities, summarization, and what can stay in digest mode.
          </p>
          <div className="grid gap-3 md:grid-cols-2">
            <label className="space-y-1 text-sm">
              <span className="font-medium text-foreground">Identity</span>
              <textarea
                className="min-h-28 w-full rounded-xl border border-border-soft bg-card px-3 py-2 text-sm"
                value={identityMarkdown}
                onChange={(event) => setIdentityMarkdown(event.target.value)}
              />
            </label>
            <label className="space-y-1 text-sm">
              <span className="font-medium text-foreground">Defaults</span>
              <textarea
                className="min-h-28 w-full rounded-xl border border-border-soft bg-card px-3 py-2 text-sm"
                value={defaultsMarkdown}
                onChange={(event) => setDefaultsMarkdown(event.target.value)}
              />
            </label>
            <label className="space-y-1 text-sm">
              <span className="font-medium text-foreground">Context</span>
              <textarea
                className="min-h-28 w-full rounded-xl border border-border-soft bg-card px-3 py-2 text-sm"
                value={contextMarkdown}
                onChange={(event) => setContextMarkdown(event.target.value)}
              />
            </label>
            <label className="space-y-1 text-sm">
              <span className="font-medium text-foreground">Overrides</span>
              <textarea
                className="min-h-28 w-full rounded-xl border border-border-soft bg-card px-3 py-2 text-sm"
                value={overridesMarkdown}
                onChange={(event) => setOverridesMarkdown(event.target.value)}
              />
            </label>
          </div>
          <div className="flex justify-end">
            <Button
              size="sm"
              disabled={saving}
              onClick={async () => {
                setSaving(true);
                await onSavePlaybook({
                  identityMarkdown,
                  defaultsMarkdown,
                  contextMarkdown,
                  overridesMarkdown,
                });
                setSaving(false);
              }}
            >
              {saving ? "Saving…" : "Save playbook"}
            </Button>
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
    updateAssistantPlaybook,
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
  const assistantPlaybook = useMemo(
    () => (snapshot ? getScopeAssistantPlaybook(snapshot, scopeId) : null),
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
  const overviewMetrics = [
    {
      label: "Open tasks",
      value: threads.length,
      icon: <ListTodoIcon className="size-4" />,
    },
    {
      label: "Documents",
      value: documents.length,
      icon: <FileTextIcon className="size-4" />,
    },
    {
      label: scope.type === "blink" ? "Services" : "Sections",
      value: scope.type === "blink" ? services.length : scope.sectionDefinitions.length,
      icon: scope.type === "blink" ? <WorkflowIcon className="size-4" /> : <Layers3Icon className="size-4" />,
    },
    {
      label: "Attention",
      value: attention.length,
      icon: <ActivityIcon className="size-4" />,
    },
  ];
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
      <div className="overflow-hidden rounded-[20px] border border-border-soft">
        {sectionDocuments.length === 0 ? (
          <div className="demo-empty-state m-4">
            <p className="text-section-title">No documents in this section yet</p>
            <p className="mt-1 text-body">Create a new document to seed this section without changing the MyOS structure.</p>
          </div>
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
    <section className="demo-page-shell">
      <DemoPageHeader
        eyebrow={scope.type === "blink" ? "Home scope" : "Workspace scope"}
        icon={<span>{scope.icon ?? "🧩"}</span>}
        title={scope.name}
        description={scope.description}
        actions={
          scope.type === "workspace" && scope.bootstrapStatus === "failed" ? (
            <Button size="sm" variant="outline" onClick={() => void retryWorkspaceBootstrap(scope.id)}>
              Retry bootstrap
            </Button>
          ) : null
        }
        meta={
          <>
            <Badge variant="outline">{scope.assistant.name}</Badge>
            <Badge variant="secondary">{scope.sectionDefinitions.length} sections</Badge>
            {scope.type === "workspace" ? (
              <Badge variant={scope.bootstrapStatus === "failed" ? "destructive" : "secondary"}>
                bootstrap {scope.bootstrapStatus}
              </Badge>
            ) : null}
          </>
        }
      />

      {scope.type === "workspace" && scope.bootstrapStatus !== "ready" ? (
        <div className="demo-muted-surface flex flex-wrap items-center gap-2.5 px-4 py-3 text-sm">
          <span className="font-medium text-text-secondary">Core document bootstrap</span>
          <Badge variant={scope.bootstrapStatus === "failed" ? "destructive" : "secondary"}>
            {scope.bootstrapStatus}
          </Badge>
          {scope.bootstrapError ? <p className="text-destructive text-xs">{scope.bootstrapError}</p> : null}
        </div>
      ) : null}

      <Tabs value={activeSection} onValueChange={setActiveSection}>
        <TabsList variant="line" className="flex-wrap">
          {scope.sectionDefinitions.map((section) => (
            <TabsTrigger key={section.key} value={section.key}>
              {section.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {scope.sectionDefinitions.map((section) => (
          <TabsContent key={section.key} value={section.key} className="pt-1">
            {section.kind === "overview" ? (
              <div className="grid gap-6 xl:grid-cols-[minmax(0,1.25fr)_360px]">
                <div className="space-y-6">
                  <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    {overviewMetrics.map((metric) => (
                      <div key={metric.label} className="demo-kpi">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-text-muted">
                              {metric.label}
                            </p>
                            <p className="mt-2 text-3xl font-bold tracking-[-0.03em] text-foreground">
                              {metric.value}
                            </p>
                          </div>
                          <span className="inline-flex size-10 items-center justify-center rounded-2xl border border-border-soft bg-bg-subtle text-accent-base">
                            {metric.icon}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>

                  <AssistantConversationPanel scope={scope} />
                </div>

                <div className="space-y-5">
                  <Card size="sm">
                    <div className="demo-section-header border-b-0 px-4 py-4">
                      <div>
                        <p className="demo-page-eyebrow">Tasks</p>
                        <h3 className="mt-1 text-section-title">Recent tasks</h3>
                      </div>
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
                    <CardContent className="space-y-3 pt-1">
                      {recentThreads.length === 0 ? (
                        <div className="demo-empty-state px-4 py-8">
                          <p className="text-body">No tasks yet.</p>
                        </div>
                      ) : (
                        recentThreads.map((thread) => (
                          <Link
                            key={thread.id}
                            href={`/threads/${encodeURIComponent(thread.id)}`}
                            className="demo-list-card block"
                          >
                            <div className="flex items-center justify-between gap-2">
                              <p className="text-sm font-semibold text-foreground">{thread.title}</p>
                              <Badge variant="outline">{thread.progress}%</Badge>
                            </div>
                            <p className="mt-1.5 text-caption">
                              {thread.status} · updated {formatDate(thread.updatedAt)}
                            </p>
                          </Link>
                        ))
                      )}
                    </CardContent>
                  </Card>

                  <Card size="sm">
                    <div className="demo-section-header border-b-0 px-4 py-4">
                      <div>
                        <p className="demo-page-eyebrow">Documents</p>
                        <h3 className="mt-1 text-section-title">Recent documents</h3>
                      </div>
                    </div>
                    <CardContent className="space-y-3 pt-1">
                      {recentDocuments.length === 0 ? (
                        <div className="demo-empty-state px-4 py-8">
                          <p className="text-body">No documents yet.</p>
                        </div>
                      ) : (
                        recentDocuments.map((document) => (
                          <Link
                            key={document.id}
                            href={`/documents/${encodeURIComponent(document.id)}`}
                            className="demo-list-card block"
                          >
                            <div className="flex items-center justify-between gap-2">
                              <p className="text-sm font-semibold text-foreground">{document.title}</p>
                              <Badge variant="secondary">{document.kind}</Badge>
                            </div>
                            <p className="mt-1.5 text-caption">{document.status}</p>
                          </Link>
                        ))
                      )}
                    </CardContent>
                  </Card>

                  <Card size="sm">
                    <div className="demo-section-header border-b-0 px-4 py-4">
                      <div>
                        <p className="demo-page-eyebrow">Alerts</p>
                        <h3 className="mt-1 text-section-title">Attention</h3>
                      </div>
                    </div>
                    <CardContent className="space-y-3 pt-1">
                      {attention.length === 0 ? (
                        <div className="demo-empty-state px-4 py-8">
                          <p className="text-body">No urgent asks.</p>
                        </div>
                      ) : (
                        attention.slice(0, 4).map((item) => (
                          <div key={item.id} className="demo-list-card">
                            <div className="flex items-center justify-between gap-2">
                              <p className="text-sm font-semibold text-foreground">{item.title}</p>
                              <Badge variant={item.priority === "high" ? "destructive" : "secondary"}>
                                {item.priority}
                              </Badge>
                            </div>
                            <p className="mt-1.5 text-caption">{item.body}</p>
                          </div>
                        ))
                      )}
                    </CardContent>
                  </Card>
                </div>
              </div>
            ) : null}

            {section.kind === "tasks" ? (
              <div className="space-y-5">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <p className="demo-page-eyebrow">Task board</p>
                    <h2 className="mt-1 text-section-title">{section.label}</h2>
                    <p className="mt-1 text-body">
                      {section.description ?? "Track threads in a kanban board styled to mirror TailAdmin task cards."}
                    </p>
                  </div>
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
                  <div className="demo-empty-state">
                    <p className="text-section-title">No tasks in this scope yet</p>
                    <p className="mt-1 text-body">Create a new thread to populate this board.</p>
                  </div>
                ) : (
                  <div className="grid gap-5 xl:grid-cols-4">
                    {threadColumns.map((column) => {
                      const grouped = threads.filter((thread) => thread.status === column.key);
                      return (
                        <div key={column.key} className="demo-kanban-column">
                          <div className="flex items-center justify-between border-b border-border-soft bg-bg-subtle/75 px-4 py-4">
                            <div>
                              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-text-muted">
                                Column
                              </p>
                              <p className="mt-1 text-sm font-semibold text-foreground">{column.label}</p>
                            </div>
                            <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${column.tone}`}>
                              {grouped.length}
                            </span>
                          </div>
                          <div className="space-y-3 p-4">
                            {grouped.length === 0 ? (
                              <div className="demo-empty-state px-4 py-8">
                                <p className="text-caption">No tasks in this column.</p>
                              </div>
                            ) : (
                              grouped.map((thread) => (
                                <Link
                                  key={thread.id}
                                  href={`/threads/${encodeURIComponent(thread.id)}`}
                                  className="demo-kanban-card block"
                                >
                                  <div className="flex items-center justify-between gap-2">
                                    <Badge variant="outline">{thread.owner}</Badge>
                                    <span className="text-caption">{formatDate(thread.updatedAt)}</span>
                                  </div>
                                  <p className="mt-3 text-sm font-semibold text-foreground">{thread.title}</p>
                                  <p className="mt-1.5 text-caption line-clamp-3">{thread.summary}</p>
                                  <div className="mt-4 space-y-2">
                                    <div className="flex items-center justify-between text-[11px] font-medium uppercase tracking-[0.08em] text-text-muted">
                                      <span>Progress</span>
                                      <span>{thread.progress}%</span>
                                    </div>
                                    <div className="h-2 rounded-full bg-bg-subtle">
                                      <div
                                        className="h-2 rounded-full bg-primary"
                                        style={{ width: `${thread.progress}%` }}
                                      />
                                    </div>
                                  </div>
                                </Link>
                              ))
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ) : null}

            {section.kind === "documents" || section.kind === "domain" ? (
              <Card>
                <div className="demo-section-header">
                  <div>
                    <p className="demo-page-eyebrow">
                      {section.kind === "domain" ? "Workspace section" : "Documents"}
                    </p>
                    <h2 className="mt-1 text-section-title">{section.label}</h2>
                    <p className="mt-1 text-body">
                      {section.description ?? "Keep seeded demo content intact while presenting it with cleaner admin table styling."}
                    </p>
                  </div>
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
                <CardContent className="space-y-3 pt-5">
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
                <div className="demo-section-header">
                  <div>
                    <p className="demo-page-eyebrow">Service relationships</p>
                    <h2 className="mt-1 text-section-title">Services</h2>
                  </div>
                  <Badge variant="outline">{services.length} linked</Badge>
                </div>
                <CardContent className="space-y-3 pt-5">
                  {services.length === 0 ? (
                    <div className="demo-empty-state">
                      <p className="text-section-title">No services available</p>
                      <p className="mt-1 text-body">Service documents will appear here when linked to the current scope.</p>
                    </div>
                  ) : (
                    services.map((service) => (
                      <Link
                        key={service.id}
                        href={`/documents/${encodeURIComponent(service.id)}`}
                        className="demo-list-card flex items-start justify-between gap-3"
                      >
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-foreground">{service.title}</p>
                          <p className="mt-1 text-body">{service.summary}</p>
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
                <div className="demo-section-header">
                  <div>
                    <p className="demo-page-eyebrow">Timeline</p>
                    <h2 className="mt-1 text-section-title">Activity timeline</h2>
                  </div>
                  <Badge variant="outline">{recentActivity.length} entries</Badge>
                </div>
                <CardContent className="space-y-3 pt-5">
                  {recentActivity.length === 0 ? (
                    <div className="demo-empty-state">
                      <p className="text-section-title">No activity yet</p>
                      <p className="mt-1 text-body">Timeline updates will appear here as actions occur inside this scope.</p>
                    </div>
                  ) : (
                    recentActivity.map((entry) => (
                      <div
                        key={entry.id}
                        className="rounded-[18px] border border-border-soft bg-card px-4 py-4 shadow-[var(--shadow-subtle)]"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-sm font-semibold text-foreground">{entry.title}</p>
                          <Badge variant="secondary">{entry.kind}</Badge>
                        </div>
                        {entry.detail ? <p className="mt-2 text-body">{entry.detail}</p> : null}
                        <p className="mt-2 text-caption">{formatDate(entry.createdAt)}</p>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            ) : null}

            {section.kind === "settings" ? (
              <ScopeSettingsView
                scope={scope}
                playbook={assistantPlaybook}
                onSavePlaybook={async (patch) => {
                  await updateAssistantPlaybook(scope.id, patch);
                }}
              />
            ) : null}
          </TabsContent>
        ))}
      </Tabs>
    </section>
  );
}
