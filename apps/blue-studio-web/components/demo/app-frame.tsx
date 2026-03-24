"use client";

import { FormEvent, useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useDemoApp } from "@/components/demo/demo-provider";
import { getFavoriteDocumentsForAccount } from "@/lib/demo/selectors";
import { writeDemoLastRoute } from "@/lib/demo/credentials";
import { StudioHeader } from "@/components/studio/studio-header";
import {
  STUDIO_TOP_NAV_ITEMS,
  StudioSidebar,
  type StudioFavoriteNavItem,
} from "@/components/studio/studio-sidebar";

export function AppFrame({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { snapshot, activeAccount } = useDemoApp();
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
    const query = searchDraft.trim();
    router.push(query ? `/search?q=${encodeURIComponent(query)}` : "/search");
  }

  const favoriteItems: StudioFavoriteNavItem[] =
    snapshot && activeAccount
      ? getFavoriteDocumentsForAccount(snapshot, activeAccount.id).map((document) => ({
          id: document.id,
          title: document.title,
          subtitle: document.oneLineSummary ?? document.summary,
          href: `/documents/${encodeURIComponent(document.id)}`,
          active: pathname.startsWith(`/documents/${document.id}`),
          starred: true,
        }))
      : [];

  return (
    <div className="flex min-h-screen bg-background">
      <StudioSidebar topItems={STUDIO_TOP_NAV_ITEMS} favoriteItems={favoriteItems} collapsed={false} />
      <main className="min-h-screen min-w-0 flex-1 overflow-y-auto">
        <StudioHeader
          searchValue={searchDraft}
          onSearchValueChange={setSearchDraft}
          onSearchSubmit={onSearchSubmit}
        />
        <div className="mx-auto max-w-[1600px] p-4 md:p-6">{children}</div>
      </main>
    </div>
  );
}
