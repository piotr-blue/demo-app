"use client";

import { FormEvent, useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useDemoApp } from "@/components/demo/demo-provider";
import { getWorkspaceScopes } from "@/lib/demo/selectors";
import { writeDemoLastRoute } from "@/lib/demo/credentials";
import { StudioHeader } from "@/components/studio/studio-header";
import {
  STUDIO_TOP_NAV_ITEMS,
  StudioSidebar,
  type StudioWorkspaceNavItem,
} from "@/components/studio/studio-sidebar";
import { WorkspaceTemplateDialog } from "@/components/demo/workspace-template-dialog";

export function AppFrame({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { snapshot } = useDemoApp();
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
    router.push("/search");
  }

  const workspaceItems: StudioWorkspaceNavItem[] = (snapshot ? getWorkspaceScopes(snapshot) : []).map(
    (workspace) => ({
      id: workspace.id,
      name: workspace.name,
      icon: workspace.icon ?? undefined,
      href: `/workspaces/${encodeURIComponent(workspace.id)}`,
      active: pathname.startsWith(`/workspaces/${workspace.id}`),
    })
  );

  return (
    <div className="flex min-h-screen bg-background">
      <StudioSidebar
        topItems={STUDIO_TOP_NAV_ITEMS}
        workspaceItems={workspaceItems}
        collapsed={false}
        addWorkspaceControl={
          <WorkspaceTemplateDialog
            triggerLabel="Add workspace"
            compact={false}
            triggerVariant="outline"
            buttonClassName="h-8 w-full justify-start gap-2"
            tooltipLabel="Add workspace"
          />
        }
      />
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
