"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowLeftIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DemoAvatar } from "@/components/demo/demo-avatar";
import { ActivityTimeline, CoreFieldsPanel } from "@/components/demo/demo-surface-components";
import { StudioEmptyState, StudioPageHeader, StudioSectionCard } from "@/components/studio/studio-primitives";
import { useDemoApp } from "@/components/demo/demo-provider";
import { getThreadActivity } from "@/lib/demo/selectors";
import type { ThreadRecord } from "@/lib/demo/types";

function formatDate(value: string) {
  const asDate = new Date(value);
  return asDate.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function ThreadDetailShell({
  thread,
  backHref,
  backLabel,
}: {
  thread: ThreadRecord;
  backHref: string;
  backLabel: string;
}) {
  const { snapshot, activeAccount, sendThreadMessage, runThreadAction } = useDemoApp();
  const [composerText, setComposerText] = useState("");
  const [sending, setSending] = useState(false);
  const [busyActionId, setBusyActionId] = useState<string | null>(null);
  const viewerAccountId = activeAccount?.id ?? thread.ownerAccountId;
  const activity = useMemo(
    () => (snapshot ? getThreadActivity(snapshot, thread.id, viewerAccountId) : thread.activity),
    [snapshot, thread.activity, thread.id, viewerAccountId]
  );

  return (
    <section>
      <div>
        <StudioPageHeader
          eyebrow="Task"
          title={thread.title}
          description={thread.summary}
          actions={
            <Link href={backHref}>
              <Button variant="outline" size="sm">
                <ArrowLeftIcon className="size-3.5" />
                {backLabel}
              </Button>
            </Link>
          }
          meta={
            <>
              <Badge variant="secondary">task</Badge>
              <Badge variant="outline">{thread.status}</Badge>
              <Badge variant="outline">{thread.progress}%</Badge>
              {thread.responsibleSummary ? <Badge variant="outline">{thread.responsibleSummary}</Badge> : null}
            </>
          }
        />

        <Tabs defaultValue="chat">
          <TabsList variant="line">
            <TabsTrigger value="chat">Chat</TabsTrigger>
            <TabsTrigger value="ui">UI</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
          </TabsList>
          <TabsContent value="chat">
            <StudioSectionCard
              title="Thread chat"
              subtitle="Conversation"
              action={<Badge variant="secondary">{thread.messages.length} updates</Badge>}
            >
              <div className="space-y-4">
                <div className="max-h-[460px] space-y-3 overflow-auto pr-1">
                  {thread.messages.map((entry) => (
                    <div
                      key={entry.id}
                      className={`rounded-[18px] border px-4 py-3 ${
                        entry.role === "assistant"
                          ? "border-border-soft bg-bg-subtle/80"
                          : entry.role === "user"
                            ? "border-accent-base/12 bg-accent-soft/55"
                            : "border-border-soft bg-card"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <DemoAvatar
                          name={entry.role === "assistant" ? "Blink" : entry.role === "user" ? "You" : "System"}
                          kind={entry.role === "assistant" ? "blink" : "person"}
                          size="sm"
                        />
                        <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-text-muted">
                          {entry.role}
                        </p>
                      </div>
                      <p className="mt-3 text-sm leading-6 text-foreground">{entry.text}</p>
                    </div>
                  ))}
                </div>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <Input
                    className="h-11 flex-1"
                    value={composerText}
                    onChange={(event) => setComposerText(event.target.value)}
                    placeholder="Add an update to this task…"
                  />
                  <Button
                    size="sm"
                    className="h-11 px-4"
                    disabled={sending || composerText.trim().length === 0}
                    onClick={async () => {
                      const text = composerText.trim();
                      if (!text) return;
                      setSending(true);
                      await sendThreadMessage(thread.id, text);
                      setComposerText("");
                      setSending(false);
                    }}
                  >
                    {sending ? "Sending…" : "Send"}
                  </Button>
                </div>
              </div>
            </StudioSectionCard>
          </TabsContent>

          <TabsContent value="ui" className="space-y-4">
            {thread.uiCards.map((card) => (
              <Card key={card.id}>
                <div className="demo-section-header">
                  <div>
                    <p className="demo-page-eyebrow">Action surface</p>
                    <h3 className="mt-1 text-section-title">{card.title}</h3>
                  </div>
                </div>
                <CardContent className="space-y-4 pt-5">
                  <p className="text-body">{card.body}</p>
                  <div className="flex flex-wrap gap-2">
                    {card.actions?.map((entry) => (
                      <Button
                        key={entry.id}
                        size="sm"
                        variant="outline"
                        disabled={busyActionId === entry.id}
                        onClick={async () => {
                          setBusyActionId(entry.id);
                          await runThreadAction(thread.id, entry.id);
                          setBusyActionId(null);
                        }}
                        className="h-9"
                      >
                        {busyActionId === entry.id ? "Applying…" : entry.label}
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="settings">
            <div className="grid gap-4 md:grid-cols-2">
              {thread.settingsBlocks.map((block) => (
                <Card key={block.id}>
                  <CardContent className="space-y-4 pt-5">
                    <h3 className="text-section-title">{block.title}</h3>
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
                  <h3 className="text-section-title">Thread metadata</h3>
                  <CoreFieldsPanel
                    title="Thread snapshot"
                    fields={[
                      { label: "Owner", value: thread.owner },
                      { label: "Parent document", value: thread.parentDocumentId ?? "—" },
                      { label: "Updated", value: formatDate(thread.updatedAt) },
                      { label: "Progress", value: `${thread.progress}%` },
                    ]}
                  />
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="activity">
            <StudioSectionCard title="Thread activity" subtitle="Timeline">
              {activity.length === 0 ? (
                <StudioEmptyState
                  title="No activity recorded yet"
                  body="Changes to this thread will appear here as the task evolves."
                />
              ) : (
                <ActivityTimeline activity={activity} />
              )}
            </StudioSectionCard>
          </TabsContent>
        </Tabs>
      </div>
    </section>
  );
}
