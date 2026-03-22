"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowLeftIcon, BotIcon, MessageSquareTextIcon } from "lucide-react";
import { StudioPageHeader } from "@/components/studio/studio-page-header";
import {
  StudioEmptyState,
  StudioMessageBubble,
  StudioMetaList,
  StudioSectionCard,
  StudioTimelineItem,
} from "@/components/studio/studio-surfaces";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
    <section className="studio-page-shell max-w-[1400px]">
      <StudioPageHeader
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
        <TabsList variant="line" className="w-full justify-start overflow-x-auto">
          <TabsTrigger value="chat">Chat</TabsTrigger>
          <TabsTrigger value="ui">UI</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
        </TabsList>

        <TabsContent value="chat">
          <StudioSectionCard
            eyebrow="Conversation"
            title="Thread chat"
            description="Keep the task conversation visible alongside donor-style metadata and action surfaces."
            action={<Badge variant="secondary">{thread.messages.length} updates</Badge>}
          >
            <div className="space-y-4">
              <div className="max-h-[500px] space-y-3 overflow-auto pr-1">
                {thread.messages.map((entry) => (
                  <StudioMessageBubble key={entry.id} role={entry.role} text={entry.text} />
                ))}
              </div>
              <div className="flex flex-col gap-2 sm:flex-row">
                <Input
                  className="flex-1"
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
                  <BotIcon className="size-3.5" />
                  {sending ? "Sending…" : "Send"}
                </Button>
              </div>
            </div>
          </StudioSectionCard>
        </TabsContent>

        <TabsContent value="ui" className="space-y-4">
          {thread.uiCards.map((card) => (
            <StudioSectionCard
              key={card.id}
              eyebrow="Action surface"
              title={card.title}
              description="Thread controls remain intact while adopting donor-aligned card structure."
            >
              <div className="space-y-4">
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
              </div>
            </StudioSectionCard>
          ))}
        </TabsContent>

        <TabsContent value="settings">
          <div className="grid gap-4 md:grid-cols-2">
            {thread.settingsBlocks.map((block) => (
              <StudioSectionCard key={block.id} eyebrow="Settings block" title={block.title}>
                <StudioMetaList
                  items={block.items.map((item) => ({
                    label: item.label,
                    value: item.value,
                  }))}
                />
              </StudioSectionCard>
            ))}
            <StudioSectionCard eyebrow="Metadata" title="Thread metadata">
              <StudioMetaList
                items={[
                  { label: "Owner", value: thread.owner },
                  { label: "Linked scope", value: scopeName },
                  { label: "Updated", value: formatDate(thread.updatedAt) },
                ]}
              />
            </StudioSectionCard>
          </div>
        </TabsContent>

        <TabsContent value="activity">
          <StudioSectionCard eyebrow="Timeline" title="Thread activity">
            <div className="space-y-3">
              {thread.activity.length === 0 ? (
                <StudioEmptyState
                  title="No activity recorded yet"
                  description="Changes to this thread will appear here as the task evolves."
                />
              ) : (
                thread.activity.map((entry) => (
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
        </TabsContent>
      </Tabs>
    </section>
  );
}
