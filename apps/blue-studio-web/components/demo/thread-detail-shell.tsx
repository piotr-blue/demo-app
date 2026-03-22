"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowLeftIcon, BotIcon, MessageSquareTextIcon } from "lucide-react";
import { DemoPageHeader } from "@/components/demo/demo-page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useDemoApp } from "@/components/demo/demo-provider";
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
  scopeName,
  backHref,
  backLabel,
}: {
  thread: ThreadRecord;
  scopeName: string;
  backHref: string;
  backLabel: string;
}) {
  const { sendThreadMessage, runThreadAction } = useDemoApp();
  const [composerText, setComposerText] = useState("");
  const [sending, setSending] = useState(false);
  const [busyActionId, setBusyActionId] = useState<string | null>(null);

  return (
    <section className="demo-page-shell max-w-6xl">
      <DemoPageHeader
        eyebrow="Thread detail"
        icon={<MessageSquareTextIcon className="size-5" />}
        title={thread.title}
        description={thread.summary}
        actions={
          <Button variant="outline" size="sm" render={<Link href={backHref} />}>
            <ArrowLeftIcon className="size-3.5" />
            {backLabel}
          </Button>
        }
        meta={
          <>
            <Badge variant="secondary">thread</Badge>
            <Badge variant="outline">{thread.status}</Badge>
            <Badge variant="outline">{thread.progress}%</Badge>
            <Badge variant="outline">{scopeName}</Badge>
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
          <Card>
            <div className="demo-section-header">
              <div>
                <p className="demo-page-eyebrow">Conversation</p>
                <h2 className="mt-1 text-section-title">Thread chat</h2>
              </div>
              <Badge variant="secondary">{thread.messages.length} updates</Badge>
            </div>
            <CardContent className="space-y-4 pt-5">
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
                      <span className="inline-flex size-7 items-center justify-center rounded-2xl border border-border-soft bg-card text-accent-base">
                        <BotIcon className="size-3.5" />
                      </span>
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
            </CardContent>
          </Card>
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
                <div className="space-y-2">
                  <div className="demo-meta-row border-border-soft/80 bg-bg-subtle/60 py-2.5">
                    <span className="text-text-muted">Owner</span>
                    <span className="font-medium text-foreground">{thread.owner}</span>
                  </div>
                  <div className="demo-meta-row border-border-soft/80 bg-bg-subtle/60 py-2.5">
                    <span className="text-text-muted">Linked scope</span>
                    <span className="font-medium text-foreground">{scopeName}</span>
                  </div>
                  <div className="demo-meta-row border-border-soft/80 bg-bg-subtle/60 py-2.5">
                    <span className="text-text-muted">Updated</span>
                    <span className="font-medium text-foreground">{formatDate(thread.updatedAt)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="activity">
          <Card>
            <div className="demo-section-header">
              <div>
                <p className="demo-page-eyebrow">Timeline</p>
                <h2 className="mt-1 text-section-title">Thread activity</h2>
              </div>
            </div>
            <CardContent className="space-y-3 pt-5">
              {thread.activity.length === 0 ? (
                <div className="demo-empty-state">
                  <p className="text-section-title">No activity recorded yet</p>
                  <p className="mt-1 text-body">Changes to this thread will appear here as the task evolves.</p>
                </div>
              ) : (
                thread.activity.map((entry) => (
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
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </section>
  );
}
