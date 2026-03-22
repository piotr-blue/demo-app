"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowLeftIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
    <section className="mx-auto max-w-5xl space-y-5">
      <div className="demo-surface flex items-center justify-between gap-3 px-6 py-5">
        <div>
          <h1 className="text-page-title">{thread.title}</h1>
          <div className="mt-1.5 flex items-center gap-2">
            <Badge variant="secondary">thread</Badge>
            <Badge variant="outline">{thread.status}</Badge>
            <Badge variant="outline">{thread.progress}%</Badge>
            <span className="text-caption">· {scopeName}</span>
          </div>
          <p className="mt-2 text-body">{thread.summary}</p>
        </div>
        <Button variant="outline" size="sm" render={<Link href={backHref} />}>
          <ArrowLeftIcon className="size-3.5" />
          {backLabel}
        </Button>
      </div>

      <Tabs defaultValue="chat">
        <TabsList variant="line">
          <TabsTrigger value="chat">Chat</TabsTrigger>
          <TabsTrigger value="ui">UI</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
        </TabsList>

        <TabsContent value="chat">
          <Card>
            <CardContent className="space-y-3 pt-5">
              <div className="max-h-[420px] space-y-2 overflow-auto pr-1">
                {thread.messages.map((entry) => (
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
                  className="h-10 flex-1 rounded-xl border border-border-soft bg-card px-3 text-sm shadow-[var(--shadow-subtle)]"
                  value={composerText}
                  onChange={(event) => setComposerText(event.target.value)}
                  placeholder="Add an update to this task…"
                />
                <Button
                  size="sm"
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
              <CardContent className="space-y-3 pt-5">
                <h3 className="text-section-title">{card.title}</h3>
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
                <CardContent className="space-y-2.5 pt-5">
                  <h3 className="text-section-title">{block.title}</h3>
                  <div className="overflow-hidden rounded-xl border border-border-soft">
                    {block.items.map((item) => (
                      <div
                        key={`${block.id}_${item.label}`}
                        className="grid grid-cols-[140px_1fr] gap-2 border-b border-border-soft/70 bg-card px-3 py-2 text-sm last:border-b-0"
                      >
                        <span className="text-text-muted">{item.label}</span>
                        <span className="text-foreground">{item.value}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
            <Card>
              <CardContent className="space-y-2.5 pt-5">
                <h3 className="text-section-title">Thread metadata</h3>
                <div className="grid grid-cols-[140px_1fr] gap-2 text-sm">
                  <span className="text-text-muted">Owner</span>
                  <span className="text-foreground">{thread.owner}</span>
                  <span className="text-text-muted">Linked scope</span>
                  <span className="text-foreground">{scopeName}</span>
                  <span className="text-text-muted">Updated</span>
                  <span className="text-foreground">{formatDate(thread.updatedAt)}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="activity">
          <Card>
            <CardContent className="space-y-2.5 pt-5">
              {thread.activity.length === 0 ? (
                <p className="text-body py-8 text-center">No activity recorded yet.</p>
              ) : (
                thread.activity.map((entry) => (
                  <div key={entry.id} className="rounded-xl border border-border-soft bg-card px-4 py-3">
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
