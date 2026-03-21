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
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle>Threads</CardTitle>
        <Button size="sm" onClick={() => void onAddThread()}>
          Add thread
        </Button>
      </CardHeader>
      <CardContent className="space-y-2.5">
        {threads.length === 0 ? (
          <p className="text-body py-4 text-center">No threads in this scope yet.</p>
        ) : (
          threads.map((thread) => (
            <Link
              key={thread.id}
              href={`/threads/${encodeURIComponent(thread.id)}`}
              className="block rounded-xl border border-border-soft bg-card p-4 transition-colors hover:border-accent-base/15 hover:bg-accent-soft/30"
            >
              <div className="flex items-center justify-between gap-2">
                <p className="font-semibold text-sm text-foreground">{thread.title}</p>
                <Badge variant="secondary">{thread.status}</Badge>
              </div>
              <p className="mt-1.5 text-body line-clamp-2">{thread.summary}</p>
              <p className="mt-1.5 text-caption">{thread.updatedAt}</p>
            </Link>
          ))
        )}
      </CardContent>
    </Card>
  );
}
