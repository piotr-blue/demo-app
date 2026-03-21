"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { ThreadRecord } from "@/lib/demo/types";

export function ScopeThreadsTab({
  threads,
  onAddThread,
}: {
  threads: ThreadRecord[];
  onAddThread: () => Promise<void>;
}) {
  return (
    <Card className="overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between border-b border-border-soft pb-3">
        <CardTitle>Threads</CardTitle>
        <Button size="sm" onClick={() => void onAddThread()}>
          New task
        </Button>
      </CardHeader>
      <CardContent className="p-0">
        {threads.length === 0 ? (
          <p className="py-4 text-center text-body">No threads in this scope yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <div className="min-w-[660px]">
              <div className="grid grid-cols-[1fr_160px_150px] border-b border-border-soft bg-bg-subtle px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-text-muted">
                <span>Task</span>
                <span>Status</span>
                <span className="text-right">Last change</span>
              </div>
              {threads.map((thread) => (
                <Link
                  key={thread.id}
                  href={`/threads/${encodeURIComponent(thread.id)}`}
                  className="grid grid-cols-[1fr_160px_150px] items-center border-b border-border-soft/80 px-4 py-3 transition-colors last:border-b-0 hover:bg-accent-soft/40"
                >
                  <div className="min-w-0 pr-4">
                    <p className="truncate text-[13px] font-semibold text-foreground">{thread.title}</p>
                    <p className="mt-0.5 truncate text-[12px] text-text-secondary">{thread.summary}</p>
                  </div>
                  <div>
                    <Badge variant="secondary">{thread.status}</Badge>
                  </div>
                  <p className="text-right text-[11px] text-text-muted">{thread.updatedAt}</p>
                </Link>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
