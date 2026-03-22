"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowLeftIcon, BellRingIcon, FileTextIcon, ListTodoIcon, MessageSquareIcon, StarIcon, WorkflowIcon, HomeIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StudioEmptyState, StudioPageHeader, StudioSectionCard } from "@/components/studio/studio-primitives";
import { useDemoApp } from "@/components/demo/demo-provider";
import type { DocumentRecord } from "@/lib/demo/types";

function formatDate(value: string) {
  const asDate = new Date(value);
  return asDate.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function DocumentDetailShell({
  document,
  scopeName,
  scopeId,
  scopeType,
  scopeIcon,
  scopeAssistantName,
  activeSection,
  backHref,
  backLabel,
}: {
  document: DocumentRecord;
  scopeName: string;
  scopeId: string;
  scopeType: "blink" | "workspace";
  scopeIcon?: string | null;
  scopeAssistantName: string;
  activeSection: "chat" | "tasks" | "all-documents" | "starred" | "services" | "subscriptions";
  backHref: string;
  backLabel: string;
}) {
  const { runDocumentAction } = useDemoApp();
  const [busyActionId, setBusyActionId] = useState<string | null>(null);
  const actionCount = useMemo(
    () => document.uiCards.reduce((sum, card) => sum + (card.actions?.length ?? 0), 0),
    [document.uiCards]
  );

  const scopeHref =
    scopeType === "workspace" ? `/workspaces/${encodeURIComponent(scopeId)}` : "/home";
  const scopeSections: Array<{
    key: "chat" | "tasks" | "all-documents" | "starred" | "services" | "subscriptions";
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

  return (
    <section className="grid gap-4 lg:grid-cols-[220px_minmax(0,1fr)]">
      <aside>
        <Card className="h-[calc(100vh-140px)]">
          <CardContent className="space-y-4 pt-4">
            <div className="rounded-lg border bg-muted/20 px-3 py-4 text-center">
              <span className="inline-flex size-12 items-center justify-center rounded-full border bg-background text-xl">
                {scopeIcon ?? <HomeIcon className="size-5" />}
              </span>
              <p className="mt-3 text-sm font-semibold">{scopeName}</p>
              <p className="mt-1 text-xs text-muted-foreground">{scopeType === "blink" ? "Home Space" : "Workspace"}</p>
            </div>
            <div className="rounded-lg border px-3 py-2 text-sm">
              <p className="text-xs text-muted-foreground">Assistant:</p>
              <p className="font-medium">{scopeAssistantName}</p>
            </div>
            <nav className="space-y-1">
              {scopeSections.map((entry) => (
                <Link
                  key={entry.key}
                  href={`${scopeHref}?section=${entry.key}`}
                  className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                    activeSection === entry.key
                      ? "bg-primary text-primary-foreground"
                      : "text-foreground hover:bg-muted"
                  }`}
                >
                  <entry.icon className="size-4" />
                  <span>{entry.label}</span>
                </Link>
              ))}
            </nav>
          </CardContent>
        </Card>
      </aside>

      <div>
        <StudioPageHeader
          eyebrow="Document Detail"
          title={document.title}
          description={document.summary}
          actions={
            <Button variant="outline" size="sm" render={<Link href={backHref} />}>
              <ArrowLeftIcon className="size-3.5" />
              {backLabel}
            </Button>
          }
          meta={
            <>
              <Badge variant="secondary">{document.kind}</Badge>
              <Badge variant={document.isService ? "default" : "outline"}>{document.status}</Badge>
              <Badge variant="outline">{scopeName}</Badge>
            </>
          }
        />

        <Tabs defaultValue="ui">
          <TabsList variant="line">
            <TabsTrigger value="ui">UI</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
          </TabsList>

        <TabsContent value="ui" className="space-y-4">
          {document.uiCards.map((card) => (
            <StudioSectionCard
              key={card.id}
              title={card.title}
              subtitle="Action surface"
              action={card.metric ? <Badge variant="outline">{card.metric}</Badge> : undefined}
            >
              <div className="space-y-4">
                <p className="text-body">{card.body}</p>
                {card.actions?.length ? (
                  <div className="flex flex-wrap gap-2">
                    {card.actions.map((action) => (
                      <Button
                        key={action.id}
                        size="sm"
                        variant="outline"
                        disabled={busyActionId === action.id}
                        onClick={async () => {
                          setBusyActionId(action.id);
                          await runDocumentAction(document.id, action.id);
                          setBusyActionId(null);
                        }}
                        className="h-9"
                      >
                        {busyActionId === action.id ? "Applying…" : action.label}
                      </Button>
                    ))}
                  </div>
                ) : null}
              </div>
            </StudioSectionCard>
          ))}
          {actionCount === 0 ? (
            <StudioEmptyState
              title="No UI actions configured"
              body="This document does not expose interactive controls yet."
            />
          ) : null}
        </TabsContent>

        <TabsContent value="settings">
          <div className="grid gap-4 md:grid-cols-2">
            {document.settingsBlocks.map((block) => (
              <Card key={block.id}>
                <CardContent className="space-y-4 pt-5">
                  <h3 className="text-section-title">{block.title}</h3>
                  {block.description ? <p className="text-body">{block.description}</p> : null}
                  <div className="overflow-hidden rounded-[18px] border border-border-soft">
                    {block.items.map((item) => (
                      <div
                        key={`${block.id}_${item.label}`}
                        className="grid grid-cols-[140px_1fr] gap-2 border-b border-border-soft/70 bg-bg-subtle/45 px-4 py-3 text-sm last:border-b-0"
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
                <h3 className="text-section-title">Document metadata</h3>
                <div className="space-y-2">
                  <div className="demo-meta-row border-border-soft/80 bg-bg-subtle/60 py-2.5">
                    <span className="text-text-muted">Owner</span>
                    <span className="font-medium text-foreground">{document.owner}</span>
                  </div>
                  <div className="demo-meta-row border-border-soft/80 bg-bg-subtle/60 py-2.5">
                    <span className="text-text-muted">Participants</span>
                    <span className="text-right font-medium text-foreground">{document.participants.join(", ")}</span>
                  </div>
                  <div className="demo-meta-row border-border-soft/80 bg-bg-subtle/60 py-2.5">
                    <span className="text-text-muted">Updated</span>
                    <span className="font-medium text-foreground">{formatDate(document.updatedAt)}</span>
                  </div>
                </div>
                <pre className="overflow-auto rounded-[18px] border border-border-soft bg-bg-subtle/75 p-4 text-xs leading-6 text-text-secondary">
                  {JSON.stringify(document.details, null, 2)}
                </pre>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="activity">
          <StudioSectionCard title="Document activity" subtitle="Timeline">
            <div className="space-y-3">
              {document.activity.length === 0 ? (
                <StudioEmptyState
                  title="No activity recorded yet"
                  body="Document actions, updates, and timeline entries will appear here."
                />
              ) : (
                document.activity.map((entry) => (
                  <div
                    key={entry.id}
                    className="rounded-[18px] border border-border-soft bg-card px-4 py-4 shadow-[var(--shadow-subtle)]"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-semibold text-sm text-foreground">{entry.title}</p>
                      <Badge variant="secondary">{entry.kind}</Badge>
                    </div>
                    {entry.detail ? <p className="mt-1 text-body">{entry.detail}</p> : null}
                    <p className="mt-1 text-caption">{formatDate(entry.createdAt)}</p>
                  </div>
                ))
              )}
            </div>
          </StudioSectionCard>
        </TabsContent>
        </Tabs>
      </div>
    </section>
  );
}
