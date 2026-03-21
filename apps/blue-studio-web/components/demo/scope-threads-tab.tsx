"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import type { ThreadRecord } from "@/lib/demo/types";
import { ChevronLeftIcon, ChevronRightIcon, SearchIcon } from "lucide-react";

export function ScopeThreadsTab({
  threads,
  onAddThread,
}: {
  threads: ThreadRecord[];
  onAddThread: () => Promise<void>;
}) {
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(0);
  const pageSize = 6;

  const filteredThreads = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) {
      return threads;
    }
    return threads.filter((thread) => {
      return (
        thread.title.toLowerCase().includes(normalizedQuery) ||
        thread.summary.toLowerCase().includes(normalizedQuery)
      );
    });
  }, [query, threads]);

  const totalPages = Math.max(1, Math.ceil(filteredThreads.length / pageSize));
  const safePage = Math.min(page, totalPages - 1);
  const visibleThreads = filteredThreads.slice(safePage * pageSize, (safePage + 1) * pageSize);

  return (
    <Card className="overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between border-b border-border-soft pb-3">
        <CardTitle>Tasks</CardTitle>
        <Button size="sm" onClick={() => void onAddThread()}>
          Add thread
        </Button>
      </CardHeader>
      <div className="flex items-center justify-between gap-3 border-b border-border-soft bg-card px-4 py-2.5">
        <div className="relative w-full max-w-[300px]">
          <SearchIcon className="pointer-events-none absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-text-muted" />
          <Input
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setPage(0);
            }}
            placeholder="Search"
            className="h-8 rounded-md bg-bg-subtle pl-8 text-[12px] shadow-none"
          />
        </div>
        <div className="flex items-center gap-1.5">
          <Button
            variant="outline"
            size="icon-xs"
            disabled={safePage === 0}
            onClick={() => setPage((previous) => Math.max(0, previous - 1))}
            className="h-7 w-7 rounded-md"
            aria-label="Previous page"
          >
            <ChevronLeftIcon className="size-3.5" />
          </Button>
          <Button
            variant="outline"
            size="icon-xs"
            disabled={safePage >= totalPages - 1}
            onClick={() => setPage((previous) => Math.min(totalPages - 1, previous + 1))}
            className="h-7 w-7 rounded-md"
            aria-label="Next page"
          >
            <ChevronRightIcon className="size-3.5" />
          </Button>
        </div>
      </div>
      <CardContent className="p-0">
        {filteredThreads.length === 0 ? (
          <p className="py-4 text-center text-body">
            {threads.length === 0 ? "No threads in this scope yet." : "No tasks match this search."}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <div className="min-w-[660px]">
              <div className="grid grid-cols-[1fr_160px_150px] border-b border-border-soft bg-bg-subtle px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-text-muted">
                <span>Task</span>
                <span>Status</span>
                <span className="text-right">Last change</span>
              </div>
              {visibleThreads.map((thread) => (
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
