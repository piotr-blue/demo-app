"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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
import { searchSnapshot } from "@/lib/demo/search";
import {
  Building2Icon,
  FileTextIcon,
  SearchIcon,
  SparklesIcon,
  UserCircle2Icon,
  WorkflowIcon,
} from "lucide-react";

function resultIcon(type: "account" | "document" | "service") {
  switch (type) {
    case "account":
      return <UserCircle2Icon className="size-4" />;
    case "service":
      return <WorkflowIcon className="size-4" />;
    default:
      return <FileTextIcon className="size-4" />;
  }
}

export default function SearchPage() {
  const { snapshot, loading, activeAccount } = useDemoApp();
  const router = useRouter();
  const searchParams = useSearchParams();
  const query = searchParams.get("q") ?? "";
  const [draftQuery, setDraftQuery] = useState(query);

  const groups = useMemo(() => {
    if (!snapshot || !activeAccount) {
      return [];
    }
    return searchSnapshot(snapshot, activeAccount.id, query);
  }, [activeAccount, query, snapshot]);

  if (loading || !snapshot || !activeAccount) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-muted-foreground">
        Loading search…
      </div>
    );
  }

  const totalResults = groups.reduce((sum, group) => sum + group.results.length, 0);

  return (
    <section>
      <StudioPageHeader
        eyebrow="Global Search"
        title="Search"
        description="Search across public accounts, public services, public documents, and your own accessible documents."
        actions={
          <Badge variant="outline" className="h-8 gap-1.5 rounded-md px-2.5">
            <SparklesIcon className="size-3.5" />
            {totalResults} results
          </Badge>
        }
      />

      <StudioToolbar>
        <form
          className="flex min-w-0 flex-1 items-center gap-2.5"
          onSubmit={(event) => {
            event.preventDefault();
            const nextQuery = draftQuery.trim();
            router.push(nextQuery ? `/search?q=${encodeURIComponent(nextQuery)}` : "/search");
          }}
        >
          <div className="relative min-w-0 flex-1">
            <SearchIcon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={draftQuery}
              onChange={(event) => setDraftQuery(event.target.value)}
              placeholder="Search Fresh Bites, Northwind BI, Partnership Engine, My Life..."
              className="h-10 pl-9"
            />
          </div>
          <Button type="submit" size="sm" className="h-10 px-4">
            Search
          </Button>
        </form>
      </StudioToolbar>

      {totalResults === 0 ? (
        <StudioSectionCard title="Search results" subtitle="No results found for the current query">
          <StudioEmptyState
            title="No results found"
            body="Try searching for Fresh Bites, Northwind BI, Partnership Engine, or My Life."
          />
        </StudioSectionCard>
      ) : (
        <div className="space-y-4">
          {groups.map((group) =>
            group.results.length > 0 ? (
              <StudioSectionCard
                key={group.key}
                title={group.label}
                subtitle={`${group.results.length} result${group.results.length === 1 ? "" : "s"}`}
                action={
                  <Badge variant="outline" className="h-8 rounded-md px-2.5">
                    {group.results.length}
                  </Badge>
                }
              >
                <Card>
                  <CardContent className="space-y-2 p-4">
                    {group.results.map((result) => (
                      <Link
                        key={`${group.key}_${result.id}`}
                        href={result.href}
                        className="flex items-start gap-3 rounded-lg border bg-card px-3.5 py-3 transition-colors hover:bg-muted/40"
                      >
                        <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-md border bg-muted text-primary">
                          {result.type === "account" ? (
                            <Building2Icon className="size-4" />
                          ) : (
                            resultIcon(result.type)
                          )}
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="text-sm font-medium">{result.title}</p>
                            <Badge variant={result.type === "service" ? "default" : "outline"}>
                              {result.type}
                            </Badge>
                          </div>
                          <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
                            {result.subtitle}
                          </p>
                        </div>
                        {result.status ? (
                          <Badge variant="outline" className="shrink-0 rounded-md">
                            {result.status}
                          </Badge>
                        ) : null}
                      </Link>
                    ))}
                  </CardContent>
                </Card>
              </StudioSectionCard>
            ) : null
          )}
        </div>
      )}
    </section>
  );
}
