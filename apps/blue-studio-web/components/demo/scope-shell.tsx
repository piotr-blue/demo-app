"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useSearchParams } from "next/navigation";
import { StudioPageHeader } from "@/components/studio/studio-page-header";
import {
  StudioEmptyState,
  StudioMessageBubble,
  StudioMetaList,
  StudioSectionCard,
  StudioStatCard,
  StudioTimelineItem,
} from "@/components/studio/studio-surfaces";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import {
  ActivityIcon,
  FileTextIcon,
  Layers3Icon,
  ListTodoIcon,
  SparklesIcon,
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

function ScopeSettingsView({ scope }: { scope: ScopeRecord }) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {scope.settingsBlocks.map((block) => (
        <StudioSectionCard
          key={block.id}
          eyebrow="Settings block"
          title={block.title}
          description={block.description}
        >
          <StudioMetaList
            items={block.items.map((item) => ({
              label: item.label,
              value: item.value,
            }))}
          />
        </StudioSectionCard>
      ))}
      <StudioSectionCard eyebrow="Assistant" title="Assistant profile">
        <StudioMetaList
          items={[
            { label: "Name", value: scope.assistant.name },
            { label: "Tone", value: scope.assistant.tone },
            { label: "Anchors", value: scope.anchors.join(", ") },
          ]}
        />
      </StudioSectionCard>
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
    <section className="studio-page-shell">
      <StudioPageHeader
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
        <TabsList variant="line" className="w-full flex-wrap justify-start">
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
                      <StudioStatCard
                        key={metric.label}
                        label={metric.label}
                        value={metric.value}
                        detail={scope.type === "blink" ? "Account-level overview" : "Workspace-level overview"}
                        icon={metric.icon}
                      />
                    ))}
                  </div>

                  <StudioSectionCard
                    eyebrow="Overview"
                    title={scope.recap.headline}
                    description="Recap and attention surfaces follow the donor dashboard composition while preserving MyOS content structure."
                    action={<Badge variant="outline">{scope.type === "blink" ? "Root scope" : "Scoped workspace"}</Badge>}
                  >
                    <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_280px]">
                      <ul className="space-y-3">
                        {scope.recap.updates.map((item) => (
                          <li
                            key={item}
                            className="flex gap-3 rounded-lg border border-border-soft bg-muted/40 px-4 py-3"
                          >
                            <span className="mt-0.5 inline-flex size-6 items-center justify-center rounded-full bg-primary/10 text-primary">
                              <SparklesIcon className="size-3" />
                            </span>
                            <span className="text-body">{item}</span>
                          </li>
                        ))}
                      </ul>
                      <div className="rounded-lg border border-border-soft bg-muted/40 p-4">
                        <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
                          Needs attention
                        </p>
                        <ul className="mt-3 space-y-2 text-sm text-foreground">
                          {scope.recap.asks.map((ask) => (
                            <li key={ask} className="flex gap-2">
                              <span className="text-primary">•</span>
                              <span>{ask}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </StudioSectionCard>

                  <StudioSectionCard
                    eyebrow="Assistant panel"
                    title={`${scope.assistant.name} conversation`}
                    action={<Badge variant="secondary">{scope.messages.length} messages</Badge>}
                  >
                    <div className="space-y-4">
                      <div className="max-h-[420px] space-y-3 overflow-auto pr-1">
                        {scope.messages.map((entry) => (
                          <StudioMessageBubble key={entry.id} role={entry.role} text={entry.text} />
                        ))}
                      </div>
                      <div className="flex flex-col gap-2 sm:flex-row">
                        <Input
                          value={composerText}
                          onChange={(event) => setComposerText(event.target.value)}
                          placeholder={`Message ${scope.assistant.name}…`}
                          className="flex-1"
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
                    </div>
                  </StudioSectionCard>
                </div>

                <div className="space-y-5">
                  <StudioSectionCard
                    eyebrow="Tasks"
                    title="Recent tasks"
                    action={
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
                    }
                    className="shadow-xs"
                  >
                    <div className="space-y-3">
                      {recentThreads.length === 0 ? (
                        <StudioEmptyState title="No tasks yet." />
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
                    </div>
                  </StudioSectionCard>

                  <StudioSectionCard eyebrow="Documents" title="Recent documents" className="shadow-xs">
                    <div className="space-y-3">
                      {recentDocuments.length === 0 ? (
                        <StudioEmptyState title="No documents yet." />
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
                    </div>
                  </StudioSectionCard>

                  <StudioSectionCard eyebrow="Alerts" title="Attention" className="shadow-xs">
                    <div className="space-y-3">
                      {attention.length === 0 ? (
                        <StudioEmptyState title="No urgent asks." />
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
                    </div>
                  </StudioSectionCard>
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
              <StudioSectionCard
                eyebrow="Timeline"
                title="Activity timeline"
                action={<Badge variant="outline">{recentActivity.length} entries</Badge>}
              >
                <div className="space-y-3">
                  {recentActivity.length === 0 ? (
                    <StudioEmptyState
                      title="No activity yet"
                      description="Timeline updates will appear here as actions occur inside this scope."
                    />
                  ) : (
                    recentActivity.map((entry) => (
                      <StudioTimelineItem
                        key={entry.id}
                        title={entry.title}
                        detail={entry.detail}
                        badge={<Badge variant="secondary">{entry.kind}</Badge>}
                        meta={formatDate(entry.createdAt)}
                      />
                    ))
                  )}
                </div>
              </StudioSectionCard>
            ) : null}

            {section.kind === "settings" ? <ScopeSettingsView scope={scope} /> : null}
          </TabsContent>
        ))}
      </Tabs>
    </section>
  );
}
