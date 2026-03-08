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
  onSelectThread,
  onCreateThread,
}: {
  activeThreadId: string;
  threads: ThreadListItem[];
  onSelectThread: (threadId: string) => void;
  onCreateThread: () => void;
}) {
  return (
    <aside className="col-span-2 h-[calc(100vh-2rem)] rounded-xl border bg-muted/10 p-3">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="font-semibold text-sm">Threads</h2>
        <Button size="sm" type="button" onClick={onCreateThread}>
          New thread
        </Button>
      </div>

      <div className="space-y-2 overflow-auto">
        {threads.map((thread) => {
          const active = thread.id === activeThreadId;
          return (
            <button
              key={thread.id}
              type="button"
              className={`w-full text-left ${active ? "ring-2 ring-primary/50" : ""}`}
              onClick={() => onSelectThread(thread.id)}
            >
              <Card className={active ? "border-primary/50" : ""}>
                <CardContent className="space-y-1 pt-4">
                  <p className="line-clamp-1 font-medium text-sm">{thread.threadTitle}</p>
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

