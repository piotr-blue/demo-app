"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ThreadRecord } from "@/lib/demo/types";

export function ScopeThreadsTab({
  threads,
  onAddThread,
}: {
  threads: ThreadRecord[];
  onAddThread: () => Promise<void>;
}) {
  return (
    <Card className="border-border/80 bg-card">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle className="text-sm">Threads</CardTitle>
        <Button size="sm" onClick={() => void onAddThread()}>
          Add thread
        </Button>
      </CardHeader>
      <CardContent className="space-y-2">
        {threads.length === 0 ? (
          <p className="text-muted-foreground text-sm">No threads in this scope yet.</p>
        ) : (
          threads.map((thread) => (
            <Link
              key={thread.id}
              href={`/threads/${encodeURIComponent(thread.id)}`}
              className="block rounded-xl border border-border/75 bg-muted/55 p-3 hover:bg-muted"
            >
              <div className="flex items-center justify-between gap-2">
                <p className="font-medium text-sm">{thread.title}</p>
                <span className="text-muted-foreground text-xs">{thread.status}</span>
              </div>
              <p className="mt-1 text-muted-foreground text-xs">{thread.summary}</p>
              <p className="mt-1 text-[11px] text-muted-foreground">{thread.updatedAt}</p>
            </Link>
          ))
        )}
      </CardContent>
    </Card>
  );
}
