"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { WorkspacePhase } from "@/lib/workspace/types";

export interface ThreadListItem {
  id: string;
  threadTitle: string;
  threadSummary: string;
  phase: WorkspacePhase;
  updatedAt: string;
  unread?: boolean;
}

function formatRelativeTime(timestamp: string): string {
  const time = Date.parse(timestamp);
  if (!Number.isFinite(time)) {
    return "unknown";
  }
  const diff = Date.now() - time;
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 1) {
    return "just now";
  }
  if (minutes < 60) {
    return `${minutes}m ago`;
  }
  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return `${hours}h ago`;
  }
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function ThreadSidebar({
  activeThreadId,
  threads,
  unreadThreadIds,
  onSelectThread,
  onCreateThread,
}: {
  activeThreadId: string;
  threads: ThreadListItem[];
  unreadThreadIds: Set<string>;
  onSelectThread: (threadId: string) => void;
  onCreateThread: () => void;
}) {
  return (
    <aside className="col-span-2 h-[calc(100vh-2rem)] rounded-2xl border bg-gradient-to-b from-muted/35 via-muted/20 to-background p-3 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="font-semibold text-sm tracking-wide">Threads</h2>
        <Button size="sm" type="button" onClick={onCreateThread}>
          New thread
        </Button>
      </div>

      <div className="space-y-2 overflow-auto">
        {threads.map((thread) => {
          const active = thread.id === activeThreadId;
          const unread = !active && (thread.unread ?? unreadThreadIds.has(thread.id));
          return (
            <button
              key={thread.id}
              type="button"
              className={`w-full text-left transition-all ${active ? "ring-2 ring-primary/40" : ""}`}
              onClick={() => onSelectThread(thread.id)}
            >
              <Card
                className={
                  active
                    ? "border-primary/50 bg-primary/[0.04] shadow-sm"
                    : unread
                      ? "border-sky-300/70 bg-sky-50/60 shadow-sm dark:border-sky-500/40 dark:bg-sky-950/20"
                      : "border-border/70 bg-card/85"
                }
              >
                <CardContent className="space-y-1 pt-4">
                  <div className="flex items-center justify-between gap-2">
                    <p className="line-clamp-1 font-medium text-sm">{thread.threadTitle}</p>
                    {unread && (
                      <span
                        className="h-2.5 w-2.5 shrink-0 rounded-full bg-sky-500 shadow-[0_0_0_3px_rgba(14,165,233,0.2)]"
                        aria-label="Unread thread updates"
                        title="Unread updates"
                      />
                    )}
                  </div>
                  <p className="line-clamp-2 text-muted-foreground text-xs">
                    {thread.threadSummary}
                  </p>
                  <div className="flex items-center justify-between text-[10px] text-muted-foreground uppercase">
                    <span>{thread.phase}</span>
                    <span>{formatRelativeTime(thread.updatedAt)}</span>
                  </div>
                </CardContent>
              </Card>
            </button>
          );
        })}
      </div>
    </aside>
  );
}

