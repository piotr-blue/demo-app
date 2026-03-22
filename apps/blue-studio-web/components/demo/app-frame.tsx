"use client";

import { FormEvent, useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { GlobalLeftRail } from "@/components/demo/global-left-rail";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { writeDemoLastRoute } from "@/lib/demo/credentials";
import { SearchIcon } from "lucide-react";

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
    <div className="flex min-h-screen bg-background/90">
      <GlobalLeftRail />
      <main className="min-h-screen flex-1 overflow-y-auto">
        <header className="sticky top-0 z-30 border-b border-border-soft/90 bg-background/95 px-4 py-3 backdrop-blur md:px-6 lg:px-8">
          <div className="mx-auto flex max-w-7xl items-center gap-3">
            <form onSubmit={onSearchSubmit} className="flex flex-1 items-center gap-2">
              <div className="relative flex-1">
                <SearchIcon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-text-muted" />
                <Input
                  value={searchDraft}
                  onChange={(event) => setSearchDraft(event.target.value)}
                  placeholder="Search workspaces, documents, threads, services…"
                  className="pl-9"
                />
              </div>
              <Button type="submit" size="sm">
                Search
              </Button>
            </form>
            <Badge variant="outline" className="hidden md:inline-flex">
              Demo mode
            </Badge>
            <div className="inline-flex size-9 items-center justify-center rounded-full border border-border-soft bg-card font-semibold text-sm">
              PB
            </div>
          </div>
        </header>
        <div className="p-4 md:p-6 lg:p-8">{children}</div>
      </main>
    </div>
  );
}
