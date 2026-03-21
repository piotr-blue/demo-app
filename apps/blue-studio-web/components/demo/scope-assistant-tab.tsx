"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { AttentionList } from "@/components/demo/attention-list";
import { MYOS_DEMO_USER, getScopeAvatar } from "@/lib/demo/visuals";
import type {
  ActivityRecord,
  AttentionItem,
  DocumentRecord,
  ScopeRecord,
  ThreadRecord,
} from "@/lib/demo/types";
import { PaperclipIcon, SendIcon } from "lucide-react";

export function ScopeAssistantTab({
  scope,
  threads,
  documents,
  recentActivity,
  attentionItems,
  onAddThread,
  onAddDocument,
  onSendMessage,
}: {
  scope: ScopeRecord;
  threads: ThreadRecord[];
  documents: DocumentRecord[];
  recentActivity: ActivityRecord[];
  attentionItems: AttentionItem[];
  onAddThread: () => Promise<void>;
  onAddDocument: () => Promise<void>;
  onSendMessage: (text: string) => Promise<void>;
}) {
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const recapItems = [
    ...attentionItems.slice(0, 2).map((item) => item.title),
    ...recentActivity.slice(0, 2).map((item) => item.title),
    ...threads.slice(0, 1).map((thread) => `${thread.title} needs follow-up`),
  ].slice(0, scope.type === "blink" ? 5 : 3);

  return (
    <div className="grid gap-4 xl:grid-cols-[1fr_286px]">
      <Card className="overflow-hidden">
        <CardContent className="space-y-4 pt-4">
          <div className="rounded-lg border border-border-soft bg-bg-subtle p-3.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-text-muted">
                  Today
                </p>
                <h2 className="text-[15px] font-semibold text-foreground">Here&apos;s what&apos;s new today</h2>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => void onAddThread()}>
                  New task
                </Button>
                <Button size="sm" onClick={() => void onAddDocument()}>
                  New doc
                </Button>
              </div>
            </div>
            {recapItems.length === 0 ? (
              <p className="mt-2 text-[13px] text-text-secondary">No updates yet.</p>
            ) : (
              <ul className="mt-2.5 space-y-1.5">
                {recapItems.map((recapItem) => (
                  <li key={recapItem} className="text-[13px] text-text-secondary">
                    <span className="mr-2 text-accent-base">•</span>
                    {recapItem}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="max-h-[52vh] space-y-3 overflow-auto pr-1">
            {scope.messages.length === 0 ? (
              <p className="py-4 text-center text-body">No messages yet. Start a conversation.</p>
            ) : (
              scope.messages.map((messageItem) => (
                <div key={messageItem.id} className="flex items-start gap-2.5">
                  <Image
                    src={messageItem.role === "assistant" ? getScopeAvatar(scope) : MYOS_DEMO_USER.avatar}
                    alt={messageItem.role}
                    width={28}
                    height={28}
                    className="mt-0.5 size-7 rounded-full border border-border-soft object-cover"
                  />
                  <div className="min-w-0 flex-1">
                    <div
                      className={`rounded-lg border px-3.5 py-2.5 text-[13px] ${
                        messageItem.role === "assistant"
                          ? "border-border-soft bg-bg-subtle"
                          : messageItem.role === "user"
                            ? "border-accent-base/15 bg-accent-soft/65"
                            : "border-border-soft bg-card"
                      }`}
                    >
                      <p className="leading-relaxed text-foreground">{messageItem.text}</p>
                    </div>
                    <p className="mt-1 text-[10px] font-medium uppercase tracking-[0.08em] text-text-muted">
                      {messageItem.role}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="rounded-lg border border-border-soft bg-card p-2.5">
            <Textarea
              rows={2}
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              placeholder="Ask Blink or this workspace assistant..."
              disabled={busy}
              className="min-h-[66px] border-none bg-transparent px-1.5 py-1 text-[13px] shadow-none focus-visible:ring-0"
            />
            <div className="mt-1 flex items-center justify-between">
              <Button size="icon-sm" variant="ghost" className="rounded-md text-text-muted">
                <PaperclipIcon className="size-4" />
                <span className="sr-only">Attach file</span>
              </Button>
              <Button
                size="sm"
                disabled={busy || message.trim().length === 0}
                onClick={async () => {
                  const text = message.trim();
                  if (!text) {
                    return;
                  }
                  setBusy(true);
                  await onSendMessage(text);
                  setMessage("");
                  setBusy(false);
                }}
                className="min-w-[90px]"
              >
                <SendIcon className="size-3.5" />
                {busy ? "Sending..." : "Send"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Right sidebar */}
      <div className="space-y-3.5">
        <AttentionList items={attentionItems} />

        <Card size="sm">
          <CardHeader className="pb-1.5">
            <CardTitle>Active threads</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1.5 text-sm">
            {threads.length === 0 ? (
              <p className="text-body">No threads yet.</p>
            ) : (
              threads.slice(0, 6).map((thread) => (
                <Link
                  key={thread.id}
                  href={`/threads/${encodeURIComponent(thread.id)}`}
                  className="block rounded-lg border border-border-soft bg-card px-3 py-2.5 transition-colors hover:border-accent-base/15 hover:bg-accent-soft/40"
                >
                  <p className="text-[13px] font-medium text-foreground">{thread.title}</p>
                  <p className="mt-0.5 line-clamp-2 text-caption">{thread.summary}</p>
                </Link>
              ))
            )}
          </CardContent>
        </Card>

        <Card size="sm">
          <CardHeader className="pb-1.5">
            <CardTitle>Recent documents</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1.5 text-sm">
            {documents.length === 0 ? (
              <p className="text-body">No documents linked to this scope.</p>
            ) : (
              documents.slice(0, 6).map((document) => (
                <Link
                  key={document.id}
                  href={`/documents/${encodeURIComponent(document.id)}`}
                  className="block rounded-lg border border-border-soft bg-card px-3 py-2.5 transition-colors hover:border-accent-base/15 hover:bg-accent-soft/40"
                >
                  <p className="text-[13px] font-medium text-foreground">{document.title}</p>
                  <p className="mt-0.5 text-caption">{document.status}</p>
                </Link>
              ))
            )}
          </CardContent>
        </Card>

        <Card size="sm">
          <CardHeader className="pb-1.5">
            <CardTitle>Recent activity</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1.5 text-sm">
            {recentActivity.length === 0 ? (
              <p className="text-body">No activity yet.</p>
            ) : (
              recentActivity.slice(0, 5).map((entry) => (
                <div key={entry.id} className="rounded-lg border border-border-soft bg-card px-3 py-2.5">
                  <p className="text-[13px] font-medium text-foreground">{entry.title}</p>
                  {entry.detail ? (
                    <p className="mt-0.5 text-caption">{entry.detail}</p>
                  ) : null}
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
