"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useDemoApp } from "@/components/demo/demo-provider";
import type { DemoSearchFilter } from "@/lib/demo/search";
import { searchSnapshot } from "@/lib/demo/search";

const FILTERS: Array<{ key: DemoSearchFilter; label: string }> = [
  { key: "all", label: "All" },
  { key: "workspaces", label: "Workspaces" },
  { key: "documents", label: "Documents" },
  { key: "threads", label: "Threads" },
  { key: "services", label: "Services" },
];

function badgeVariant(type: "workspace" | "thread" | "document" | "service") {
  if (type === "service") {
    return "default";
  }
  if (type === "workspace") {
    return "outline";
  }
  return "secondary";
}

export default function SearchPage() {
  const { snapshot, loading } = useDemoApp();
  const searchParams = useSearchParams();
  const router = useRouter();
  const query = searchParams.get("q") ?? "";
  const [draftQuery, setDraftQuery] = useState(query);
  const [filter, setFilter] = useState<DemoSearchFilter>("all");

  useEffect(() => {
    setDraftQuery(query);
  }, [query]);

  const results = useMemo(() => {
    if (!snapshot) {
      return [];
    }
    return searchSnapshot(snapshot, query, filter);
  }, [filter, query, snapshot]);

  if (loading || !snapshot) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-text-muted">Loading search…</div>
    );
  }

  return (
    <section className="mx-auto max-w-6xl space-y-5">
      <div className="rounded-2xl border border-border-soft bg-card px-6 py-5 shadow-[var(--shadow-card)]">
        <h1 className="text-page-title">Search</h1>
        <p className="mt-1.5 text-body">Search across workspaces, documents, threads, and services.</p>
        <form
          className="mt-4 flex items-center gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            router.push(`/search?q=${encodeURIComponent(draftQuery.trim())}`);
          }}
        >
          <Input
            value={draftQuery}
            onChange={(event) => setDraftQuery(event.target.value)}
            placeholder="Search alice, order, sms, northwind, review, supplier…"
          />
          <Button type="submit" size="sm">
            Search
          </Button>
        </form>
      </div>

      <div className="flex flex-wrap gap-2">
        {FILTERS.map((entry) => (
          <Button
            key={entry.key}
            size="sm"
            variant={filter === entry.key ? "default" : "outline"}
            onClick={() => setFilter(entry.key)}
          >
            {entry.label}
          </Button>
        ))}
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Results {query ? `for “${query}”` : ""}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2.5">
          {results.length === 0 ? (
            <p className="text-body py-8 text-center">No results found. Try a broader query.</p>
          ) : (
            results.map((result) => (
              <Link
                key={`${result.type}_${result.id}`}
                href={result.href}
                className="flex items-start gap-3 rounded-xl border border-border-soft bg-card px-4 py-3 transition-colors hover:border-accent-base/20 hover:bg-accent-soft/30"
              >
                <span className="mt-0.5 inline-flex size-8 items-center justify-center rounded-lg bg-bg-subtle text-base">
                  {result.icon}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold text-sm text-foreground">{result.title}</p>
                    <Badge variant={badgeVariant(result.type)}>{result.type}</Badge>
                    <span className="text-caption">· {result.scope}</span>
                  </div>
                  <p className="mt-1 text-body line-clamp-2">{result.subtitle}</p>
                </div>
                {result.status ? (
                  <Badge variant="secondary" className="shrink-0">
                    {result.status}
                  </Badge>
                ) : null}
              </Link>
            ))
          )}
        </CardContent>
      </Card>
    </section>
  );
}
