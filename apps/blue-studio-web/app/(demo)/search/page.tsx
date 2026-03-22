"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  StudioEmptyState,
  StudioPageHeader,
  StudioSectionCard,
  StudioToolbar,
} from "@/components/studio/studio-primitives";
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
  const router = useRouter();
  const [draftQuery, setDraftQuery] = useState("");
  const [filter, setFilter] = useState<DemoSearchFilter>("all");
  const effectiveQuery = "";

  const results = useMemo(() => {
    if (!snapshot) {
      return [];
    }
    return searchSnapshot(snapshot, effectiveQuery, filter);
  }, [effectiveQuery, filter, snapshot]);

  if (loading || !snapshot) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-text-muted">Loading search…</div>
    );
  }

  return (
    <section>
      <StudioPageHeader
        eyebrow="Global Search"
        title="Search"
        description="Search across workspaces, documents, threads, and services without changing the MyOS object model."
        actions={
          <Badge variant="outline" className="h-8 gap-1.5 rounded-md px-2.5">
            <SparklesIcon className="size-3.5" />
            {results.length} results
          </Badge>
        }
      />

      <StudioToolbar>
        <form
          className="flex min-w-0 flex-1 items-center gap-2.5"
          onSubmit={(event) => {
            event.preventDefault();
            router.push("/search");
          }}
        >
          <div className="relative min-w-0 flex-1">
            <SearchIcon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={draftQuery}
              onChange={(event) => setDraftQuery(event.target.value)}
              placeholder="Search demo results..."
              className="h-10 pl-9"
            />
          </div>
          <Button type="submit" size="sm" className="h-10 px-4">
            Search
          </Button>
        </form>
        <div className="inline-flex items-center gap-2 rounded-md border bg-background px-3 py-2 text-sm text-muted-foreground">
          <FilterIcon className="size-4 text-muted-foreground" />
          Filter by object type
        </div>
      </StudioToolbar>

      <div className="mb-4 flex flex-wrap gap-2">
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

      <StudioSectionCard
        title="Browse all indexed demo objects"
        subtitle="For demo mode, this page intentionally shows a stable result set regardless of the entered query."
        action={
          <Badge variant="outline" className="h-8 rounded-md px-2.5">
            {filter}
          </Badge>
        }
      >
        <Card>
          <CardContent className="p-4">
          {results.length === 0 ? (
            <StudioEmptyState
              title="No results found"
              body="Try a broader query or switch filters to inspect other MyOS object types."
            />
          ) : (
            <div className="space-y-2">
              {results.map((result) => (
                <Link
                  key={`${result.type}_${result.id}`}
                  href={result.href}
                  className="flex items-start gap-3 rounded-lg border bg-card px-3.5 py-3 transition-colors hover:bg-muted/40"
                >
                  <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-md border bg-muted text-primary">
                    {resultIcon(result.type)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-medium">{result.title}</p>
                      <Badge variant={badgeVariant(result.type)}>{result.type}</Badge>
                      <span className="text-xs text-muted-foreground">in {result.scope}</span>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{result.subtitle}</p>
                  </div>
                  {result.status ? (
                    <Badge variant="outline" className="shrink-0 rounded-md">
                      {result.status}
                    </Badge>
                  ) : null}
                </Link>
              ))}
            </div>
          )}
          </CardContent>
        </Card>
      </StudioSectionCard>
    </section>
  );
}
