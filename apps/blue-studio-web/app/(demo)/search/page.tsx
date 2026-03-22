"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { DemoPageHeader } from "@/components/demo/demo-page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useDemoApp } from "@/components/demo/demo-provider";
import type { DemoSearchFilter } from "@/lib/demo/search";
import { searchSnapshot } from "@/lib/demo/search";
import {
  BlocksIcon,
  Building2Icon,
  FileTextIcon,
  FilterIcon,
  MessagesSquareIcon,
  SearchIcon,
  SparklesIcon,
  WorkflowIcon,
} from "lucide-react";

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

function resultIcon(type: "workspace" | "thread" | "document" | "service") {
  switch (type) {
    case "workspace":
      return <Building2Icon className="size-4" />;
    case "thread":
      return <MessagesSquareIcon className="size-4" />;
    case "service":
      return <WorkflowIcon className="size-4" />;
    default:
      return <FileTextIcon className="size-4" />;
  }
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
    <section className="demo-page-shell">
      <DemoPageHeader
        eyebrow="Global search"
        icon={<SearchIcon className="size-5" />}
        title="Search"
        description="Search across workspaces, documents, threads, and services without changing the MyOS object model."
        actions={
          <Badge variant="outline" className="h-9 gap-1.5 rounded-[12px] px-3">
            <SparklesIcon className="size-3.5" />
            {results.length} results
          </Badge>
        }
      />

      <div className="demo-control-bar">
        <form
          className="flex min-w-0 flex-1 items-center gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            router.push(`/search?q=${encodeURIComponent(draftQuery.trim())}`);
          }}
        >
          <div className="relative min-w-0 flex-1">
            <SearchIcon className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-text-muted" />
            <Input
              value={draftQuery}
              onChange={(event) => setDraftQuery(event.target.value)}
              placeholder="Search alice, order, sms, northwind, review, supplier…"
              className="h-11 rounded-[14px] bg-card pl-10"
            />
          </div>
          <Button type="submit" size="sm" className="h-11 px-4">
            Search
          </Button>
        </form>
        <div className="inline-flex items-center gap-2 rounded-[14px] border border-border-soft bg-card px-3 py-2 text-sm text-text-secondary">
          <FilterIcon className="size-4 text-text-muted" />
          Filter by object type
        </div>
      </div>

      <div className="demo-muted-surface flex flex-wrap gap-2 p-2">
        {FILTERS.map((entry) => (
          <Button
            key={entry.key}
            size="sm"
            variant={filter === entry.key ? "default" : "outline"}
            onClick={() => setFilter(entry.key)}
          >
            {entry.key === "all" ? <BlocksIcon className="size-3.5" /> : null}
            {entry.label}
          </Button>
        ))}
      </div>

      <Card className="overflow-hidden">
        <CardContent className="p-0">
          <div className="demo-section-header border-b-0">
            <div>
              <p className="demo-page-eyebrow">Search results</p>
              <h2 className="mt-1 text-section-title">
                {query ? `Results for “${query}”` : "Browse all indexed demo objects"}
              </h2>
              <p className="mt-1 text-body">
                Workspaces, documents, threads, and services remain grouped by their original MyOS object meaning.
              </p>
            </div>
            <Badge variant="outline" className="h-9 rounded-[12px] px-3">
              {filter}
            </Badge>
          </div>
          {results.length === 0 ? (
            <div className="p-5">
              <div className="demo-empty-state">
                <div className="mx-auto flex max-w-sm flex-col items-center gap-3">
                  <span className="inline-flex size-12 items-center justify-center rounded-2xl border border-border-soft bg-card text-accent-base shadow-[var(--shadow-subtle)]">
                    <SearchIcon className="size-5" />
                  </span>
                  <div className="space-y-1">
                    <p className="text-section-title">No results found</p>
                    <p className="text-body">
                      Try a broader query or switch filters to inspect other MyOS object types.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-3 p-5">
              {results.map((result) => (
                <Link
                  key={`${result.type}_${result.id}`}
                  href={result.href}
                  className="demo-list-card flex items-start gap-4"
                >
                  <span className="inline-flex size-11 shrink-0 items-center justify-center rounded-2xl border border-border-soft bg-bg-subtle text-accent-base">
                    {resultIcon(result.type)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-semibold text-foreground">{result.title}</p>
                      <Badge variant={badgeVariant(result.type)}>{result.type}</Badge>
                      <span className="text-caption">in {result.scope}</span>
                    </div>
                    <p className="mt-1.5 text-body line-clamp-2">{result.subtitle}</p>
                  </div>
                  {result.status ? (
                    <Badge variant="outline" className="shrink-0">
                      {result.status}
                    </Badge>
                  ) : null}
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </section>
  );
}
