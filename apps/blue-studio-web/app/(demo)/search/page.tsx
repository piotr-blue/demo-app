"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { StudioPageHeader } from "@/components/studio/studio-page-header";
import { StudioEmptyState, StudioSectionCard, StudioToolbar } from "@/components/studio/studio-surfaces";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
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
    <section className="studio-page-shell">
      <StudioPageHeader
        eyebrow="Global search"
        icon={<SearchIcon className="size-5" />}
        title="Search"
        description="Search across workspaces, documents, threads, and services without changing the MyOS object model."
        actions={
          <Badge variant="outline" className="h-6 gap-1.5 px-2">
            <SparklesIcon className="size-3.5" />
            {results.length} results
          </Badge>
        }
      />

      <StudioToolbar>
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
              className="pl-10"
            />
          </div>
          <Button type="submit" size="sm">
            Search
          </Button>
        </form>
        <div className="inline-flex items-center gap-2 rounded-lg border border-border-soft bg-muted/40 px-3 py-2 text-sm text-text-secondary">
          <FilterIcon className="size-4 text-text-muted" />
          Filter by object type
        </div>
      </StudioToolbar>

      <div className="flex flex-wrap gap-2">
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
        eyebrow="Search results"
        title={query ? `Results for “${query}”` : "Browse all indexed demo objects"}
        description="Workspaces, documents, threads, and services remain grouped by their original MyOS object meaning."
        action={<Badge variant="outline">{filter}</Badge>}
        contentClassName="pt-0"
      >
        {results.length === 0 ? (
          <StudioEmptyState
            title="No results found"
            description="Try a broader query or switch filters to inspect other MyOS object types."
            icon={<SearchIcon className="size-5" />}
          />
        ) : (
          <div className="overflow-hidden rounded-lg border border-border-soft">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead>Result</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Scope</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {results.map((result) => (
                  <TableRow key={`${result.type}_${result.id}`}>
                    <TableCell>
                      <Link href={result.href} className="flex items-start gap-3">
                        <span className="mt-0.5 inline-flex size-9 shrink-0 items-center justify-center rounded-lg border border-border-soft bg-muted/45 text-primary">
                          {resultIcon(result.type)}
                        </span>
                        <span className="min-w-0">
                          <span className="block font-medium text-foreground">{result.title}</span>
                          <span className="mt-1 block text-body line-clamp-2">{result.subtitle}</span>
                        </span>
                      </Link>
                    </TableCell>
                    <TableCell>
                      <Badge variant={badgeVariant(result.type)}>{result.type}</Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{result.scope}</TableCell>
                    <TableCell>
                      {result.status ? <Badge variant="outline">{result.status}</Badge> : <span className="text-muted-foreground">—</span>}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </StudioSectionCard>
    </section>
  );
}
