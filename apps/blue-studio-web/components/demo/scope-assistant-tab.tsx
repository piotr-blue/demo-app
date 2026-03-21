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
    <div className="grid gap-4 lg:grid-cols-[280px_1fr_320px]">
      <div className="space-y-4">
        <Card className="border-border/80 bg-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">
              <span className="mr-2">{scope.icon ?? "🧩"}</span>
              {scope.name}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <p className="text-muted-foreground">{scope.description}</p>
            <p className="text-muted-foreground text-xs">
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

      <Card className="border-border/80 bg-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Assistant chat</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="max-h-[56vh] space-y-2.5 overflow-auto pr-1">
            {scope.messages.length === 0 ? (
              <p className="text-muted-foreground text-sm">No messages yet.</p>
            ) : (
              scope.messages.map((messageItem) => (
                <div
                  key={messageItem.id}
                  className={`rounded-xl border px-3 py-2.5 text-sm ${
                    messageItem.role === "assistant"
                      ? "bg-muted/75"
                      : messageItem.role === "user"
                        ? "border-primary/15 bg-accent/65"
                        : "bg-background"
                  }`}
                >
                  <p className="mb-1.5 text-[11px] uppercase tracking-[0.04em] text-muted-foreground">
                    {messageItem.role}
                  </p>
                  <p className="leading-relaxed text-secondary-foreground">{messageItem.text}</p>
                </div>
              ))
            )}
          </div>

          <div className="space-y-2">
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
                {busy ? "Sending..." : "Send"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <Card className="border-border/80 bg-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Active threads</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {threads.length === 0 ? (
              <p className="text-muted-foreground">No threads yet.</p>
            ) : (
              threads.slice(0, 6).map((thread) => (
                <Link
                  key={thread.id}
                  href={`/threads/${encodeURIComponent(thread.id)}`}
                  className="block rounded-xl border border-border/75 bg-muted/50 p-2.5 hover:bg-muted"
                >
                  <p className="font-medium">{thread.title}</p>
                  <p className="line-clamp-2 text-muted-foreground text-xs">{thread.summary}</p>
                </Link>
              ))
            )}
          </CardContent>
        </Card>

        <Card className="border-border/80 bg-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Recent documents</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {documents.length === 0 ? (
              <p className="text-muted-foreground">No documents linked to this scope.</p>
            ) : (
              documents.slice(0, 6).map((document) => (
                <Link
                  key={document.id}
                  href={`/documents/${encodeURIComponent(document.id)}`}
                  className="block rounded-xl border border-border/75 bg-muted/50 p-2.5 hover:bg-muted"
                >
                  <p className="font-medium">{document.title}</p>
                  <p className="text-muted-foreground text-xs">{document.status}</p>
                </Link>
              ))
            )}
          </CardContent>
        </Card>

        <Card className="border-border/80 bg-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Recent activity</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {recentActivity.length === 0 ? (
              <p className="text-muted-foreground">No activity yet.</p>
            ) : (
              recentActivity.slice(0, 5).map((entry) => (
                <div key={entry.id} className="rounded-xl border border-border/75 bg-muted/55 p-2.5">
                  <p className="font-medium">{entry.title}</p>
                  {entry.detail ? (
                    <p className="text-muted-foreground text-xs">{entry.detail}</p>
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
