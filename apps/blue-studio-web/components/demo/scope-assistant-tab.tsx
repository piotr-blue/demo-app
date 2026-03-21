"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { AttentionList } from "@/components/demo/attention-list";
import type {
  ActivityRecord,
  AttentionItem,
  DocumentRecord,
  ScopeRecord,
  ThreadRecord,
} from "@/lib/demo/types";
import { SendIcon } from "lucide-react";

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

  return (
    <div className="grid gap-5 lg:grid-cols-[260px_1fr_300px]">
      {/* Left sidebar - scope info */}
      <div className="space-y-4">
        <Card size="sm">
          <CardHeader className="pb-2">
            <CardTitle>
              <span className="mr-1.5">{scope.icon ?? "🧩"}</span>
              {scope.name}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <p className="text-body">{scope.description}</p>
            <p className="text-caption">
              Assistant: {scope.assistant.name} · {scope.assistant.tone}
            </p>
            <div className="flex flex-col gap-2 pt-1">
              <Button size="sm" onClick={() => void onAddThread()}>
                Add thread
              </Button>
              <Button size="sm" variant="outline" onClick={() => void onAddDocument()}>
                Create document
              </Button>
            </div>
          </CardContent>
        </Card>

        <AttentionList items={attentionItems} />
      </div>

      {/* Center - chat */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Assistant chat</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="max-h-[56vh] space-y-3 overflow-auto pr-1">
            {scope.messages.length === 0 ? (
              <p className="text-body py-4 text-center">No messages yet. Start a conversation.</p>
            ) : (
              scope.messages.map((messageItem) => (
                <div
                  key={messageItem.id}
                  className={`rounded-xl border px-4 py-3 text-sm ${
                    messageItem.role === "assistant"
                      ? "border-border-soft bg-bg-subtle"
                      : messageItem.role === "user"
                        ? "border-accent-base/12 bg-accent-soft"
                        : "border-border-soft bg-card"
                  }`}
                >
                  <p className="mb-1.5 text-xs uppercase tracking-[0.04em] text-text-muted font-medium">
                    {messageItem.role}
                  </p>
                  <p className="leading-relaxed text-foreground">{messageItem.text}</p>
                </div>
              ))
            )}
          </div>

          <div className="space-y-2.5">
            <Textarea
              rows={3}
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              placeholder="Ask Blink or this workspace assistant..."
              disabled={busy}
            />
            <div className="flex justify-end">
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
              >
                <SendIcon className="size-3.5" />
                {busy ? "Sending..." : "Send"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Right sidebar */}
      <div className="space-y-4">
        <Card size="sm">
          <CardHeader className="pb-2">
            <CardTitle>Active threads</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {threads.length === 0 ? (
              <p className="text-body">No threads yet.</p>
            ) : (
              threads.slice(0, 6).map((thread) => (
                <Link
                  key={thread.id}
                  href={`/threads/${encodeURIComponent(thread.id)}`}
                  className="block rounded-xl border border-border-soft bg-card p-3 transition-colors hover:border-accent-base/15 hover:bg-accent-soft/40"
                >
                  <p className="font-medium text-foreground">{thread.title}</p>
                  <p className="line-clamp-2 text-caption mt-1">{thread.summary}</p>
                </Link>
              ))
            )}
          </CardContent>
        </Card>

        <Card size="sm">
          <CardHeader className="pb-2">
            <CardTitle>Recent documents</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {documents.length === 0 ? (
              <p className="text-body">No documents linked to this scope.</p>
            ) : (
              documents.slice(0, 6).map((document) => (
                <Link
                  key={document.id}
                  href={`/documents/${encodeURIComponent(document.id)}`}
                  className="block rounded-xl border border-border-soft bg-card p-3 transition-colors hover:border-accent-base/15 hover:bg-accent-soft/40"
                >
                  <p className="font-medium text-foreground">{document.title}</p>
                  <p className="text-caption mt-0.5">{document.status}</p>
                </Link>
              ))
            )}
          </CardContent>
        </Card>

        <Card size="sm">
          <CardHeader className="pb-2">
            <CardTitle>Recent activity</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {recentActivity.length === 0 ? (
              <p className="text-body">No activity yet.</p>
            ) : (
              recentActivity.slice(0, 5).map((entry) => (
                <div key={entry.id} className="rounded-xl border border-border-soft bg-card p-3">
                  <p className="font-medium text-foreground">{entry.title}</p>
                  {entry.detail ? (
                    <p className="text-caption mt-0.5">{entry.detail}</p>
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
