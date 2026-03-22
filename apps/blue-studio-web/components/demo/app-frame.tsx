"use client";

import { FormEvent, useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { GlobalLeftRail } from "@/components/demo/global-left-rail";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { writeDemoLastRoute } from "@/lib/demo/credentials";
import { BellIcon, LayoutGridIcon, SearchIcon, SparklesIcon } from "lucide-react";

export function AppFrame({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const activeQuery = searchParams.get("q") ?? "";
  const [searchDraft, setSearchDraft] = useState(activeQuery);

  useEffect(() => {
    writeDemoLastRoute(pathname);
  }, [pathname]);

  useEffect(() => {
    setSearchDraft(activeQuery);
  }, [activeQuery]);

  function onSearchSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = searchDraft.trim();
    if (!trimmed) {
      router.push("/search");
      return;
    }
    router.push(`/search?q=${encodeURIComponent(trimmed)}`);
  }

  return (
    <div className="flex min-h-screen bg-background">
      <GlobalLeftRail />
      <main className="min-h-screen flex-1 overflow-y-auto bg-transparent">
        <header className="sticky top-0 z-30 border-b border-border-soft bg-card/95 px-4 py-3 backdrop-blur-xl md:px-6 lg:px-8">
          <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-3 lg:flex-nowrap">
            <div className="hidden items-center gap-3 lg:flex">
              <span className="inline-flex size-10 items-center justify-center rounded-2xl border border-border-soft bg-bg-subtle text-accent-base shadow-[var(--shadow-subtle)]">
                <LayoutGridIcon className="size-4" />
              </span>
              <div className="min-w-0">
                <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-accent-base">
                  Workspace shell
                </p>
                <p className="text-sm font-semibold text-foreground">MyOS Demo</p>
              </div>
            </div>
            <form onSubmit={onSearchSubmit} className="flex min-w-0 flex-1 items-center gap-2">
              <div className="relative flex-1">
                <SearchIcon className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-text-muted" />
                <Input
                  value={searchDraft}
                  onChange={(event) => setSearchDraft(event.target.value)}
                  placeholder="Search workspaces, documents, threads, services…"
                  className="h-11 rounded-[16px] border-border-soft bg-card pl-10 pr-20"
                />
                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 rounded-[10px] border border-border-soft bg-bg-subtle px-2 py-1 text-[11px] font-medium text-text-muted">
                  ⌘K
                </span>
              </div>
              <Button type="submit" size="sm" className="h-11 px-4">
                Search
              </Button>
            </form>
            <Badge variant="outline" className="hidden h-9 gap-1.5 rounded-[12px] px-3 md:inline-flex">
              <SparklesIcon className="size-3.5" />
              Demo mode
            </Badge>
            <Button variant="outline" size="icon-sm" className="hidden md:inline-flex">
              <BellIcon className="size-4" />
            </Button>
            <div className="inline-flex h-11 items-center gap-2 rounded-[16px] border border-border-soft bg-card px-2.5 shadow-[var(--shadow-subtle)]">
              <span className="inline-flex size-8 items-center justify-center rounded-2xl bg-accent-soft text-accent-base text-xs font-bold">
                PB
              </span>
              <div className="hidden min-w-0 md:block">
                <p className="text-sm font-semibold text-foreground">piotr-blue</p>
                <p className="text-[11px] text-text-muted">MyOS operator</p>
              </div>
            </div>
          </div>
        </header>
        <div className="p-4 md:p-6 lg:p-8">{children}</div>
      </main>
    </div>
  );
}
