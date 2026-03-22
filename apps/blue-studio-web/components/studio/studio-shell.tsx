"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { FormEvent, ReactNode, useEffect, useMemo, useState } from "react";
import { WorkspaceTemplateDialog } from "@/components/demo/workspace-template-dialog";
import { useDemoApp } from "@/components/demo/demo-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  readDemoLeftRailCollapsed,
  writeDemoLastRoute,
  writeDemoLeftRailCollapsed,
} from "@/lib/demo/credentials";
import { getWorkspaceScopes } from "@/lib/demo/selectors";
import { cn } from "@/lib/utils";
import {
  BellIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  HomeIcon,
  LayoutGridIcon,
  MenuIcon,
  SearchIcon,
  Settings2Icon,
  SparklesIcon,
  XIcon,
} from "lucide-react";

type NavItem = {
  key: string;
  href: string;
  label: string;
  icon: ReactNode;
  active: boolean;
};

function StudioNavLink({
  collapsed,
  item,
  onClick,
}: {
  collapsed: boolean;
  item: NavItem;
  onClick?: () => void;
}) {
  return (
    <Link
      href={item.href}
      onClick={onClick}
      aria-current={item.active ? "page" : undefined}
      className={cn(
        "group flex items-center rounded-lg px-2.5 py-2 text-sm font-medium transition-colors",
        collapsed ? "justify-center" : "gap-2.5",
        item.active
          ? "bg-sidebar-primary text-sidebar-primary-foreground"
          : "text-sidebar-foreground/72 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
      )}
      title={collapsed ? item.label : undefined}
    >
      <span className="inline-flex size-4 shrink-0 items-center justify-center">
        {item.icon}
      </span>
      {!collapsed ? <span className="truncate">{item.label}</span> : <span className="sr-only">{item.label}</span>}
    </Link>
  );
}

function StudioWorkspaceLink({
  collapsed,
  active,
  href,
  icon,
  name,
  onClick,
}: {
  collapsed: boolean;
  active: boolean;
  href: string;
  icon: string | null | undefined;
  name: string;
  onClick?: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      aria-current={active ? "page" : undefined}
      className={cn(
        "group flex items-center rounded-lg px-2.5 py-2 text-sm font-medium transition-colors",
        collapsed ? "justify-center" : "gap-2.5",
        active
          ? "bg-sidebar-accent text-sidebar-accent-foreground"
          : "text-sidebar-foreground/72 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
      )}
      title={collapsed ? name : undefined}
    >
      <span
        className={cn(
          "inline-flex size-7 shrink-0 items-center justify-center rounded-lg border text-xs font-semibold",
          active
            ? "border-sidebar-primary/15 bg-sidebar-primary/10 text-sidebar-primary"
            : "border-sidebar-border bg-background text-muted-foreground"
        )}
      >
        {icon ?? name.slice(0, 1).toUpperCase()}
      </span>
      {!collapsed ? <span className="truncate">{name}</span> : <span className="sr-only">{name}</span>}
    </Link>
  );
}

function StudioSidebar({
  collapsed,
  mobile,
  onCloseMobile,
  onToggleCollapse,
}: {
  collapsed: boolean;
  mobile?: boolean;
  onCloseMobile?: () => void;
  onToggleCollapse?: () => void;
}) {
  const pathname = usePathname();
  const { snapshot } = useDemoApp();
  const workspaces = snapshot ? getWorkspaceScopes(snapshot) : [];

  const navItems = useMemo<NavItem[]>(
    () => [
      {
        key: "home",
        href: "/home",
        label: "Home",
        icon: <HomeIcon className="size-4" />,
        active: pathname === "/home",
      },
      {
        key: "search",
        href: "/search",
        label: "Search",
        icon: <SearchIcon className="size-4" />,
        active: pathname === "/search",
      },
    ],
    [pathname]
  );

  const footerItems = useMemo<NavItem[]>(
    () => [
      {
        key: "settings",
        href: "/settings",
        label: "Settings",
        icon: <Settings2Icon className="size-4" />,
        active: pathname === "/settings",
      },
    ],
    [pathname]
  );

  return (
    <div
      className={cn(
        "flex h-full flex-col rounded-xl border border-sidebar-border bg-sidebar text-sidebar-foreground shadow-[var(--shadow-card)]",
        mobile ? "rounded-none border-0 shadow-none" : ""
      )}
    >
      <div
        className={cn(
          "flex h-14 items-center border-b border-sidebar-border",
          collapsed ? "justify-center px-2.5" : "justify-between px-4"
        )}
      >
        {collapsed ? (
          <span className="inline-flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <LayoutGridIcon className="size-4" />
          </span>
        ) : (
          <Link href="/home" className="flex min-w-0 items-center gap-3">
            <span className="inline-flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <LayoutGridIcon className="size-4" />
            </span>
            <span className="min-w-0">
              <span className="block truncate text-sm font-semibold text-sidebar-foreground">MyOS Demo</span>
              <span className="block truncate text-xs text-muted-foreground">Studio Admin shell</span>
            </span>
          </Link>
        )}
        {mobile ? (
          <Button
            size="icon-sm"
            variant="ghost"
            onClick={onCloseMobile}
            aria-label="Close navigation"
          >
            <XIcon className="size-4" />
          </Button>
        ) : (
          <Button
            size="icon-sm"
            variant="ghost"
            onClick={onToggleCollapse}
            aria-label={collapsed ? "Expand navigation" : "Collapse navigation"}
          >
            {collapsed ? <ChevronRightIcon className="size-4" /> : <ChevronLeftIcon className="size-4" />}
          </Button>
        )}
      </div>

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <div className="space-y-1 px-2.5 py-3">
          {!collapsed ? (
            <p className="px-1 text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
              Navigation
            </p>
          ) : null}
          {navItems.map((item) => (
            <StudioNavLink key={item.key} collapsed={collapsed} item={item} onClick={onCloseMobile} />
          ))}
        </div>

        <div className="px-2.5 pb-3">
          {collapsed ? (
            <WorkspaceTemplateDialog
              compact
              tooltipLabel="New workspace"
              buttonClassName="size-10 w-full rounded-lg"
            />
          ) : (
            <WorkspaceTemplateDialog buttonClassName="h-9 w-full rounded-lg justify-center" />
          )}
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-2.5 pb-3">
          {!collapsed ? (
            <p className="mb-2 px-1 text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
              Workspaces
            </p>
          ) : null}
          <div className="space-y-1">
            {workspaces.map((workspace) => (
              <StudioWorkspaceLink
                key={workspace.id}
                collapsed={collapsed}
                active={pathname.startsWith(`/workspaces/${workspace.id}`)}
                href={`/workspaces/${encodeURIComponent(workspace.id)}`}
                icon={workspace.icon}
                name={workspace.name}
                onClick={onCloseMobile}
              />
            ))}
          </div>
        </div>
      </div>

      <div className="border-t border-sidebar-border px-2.5 py-3">
        <div className="space-y-1">
          {footerItems.map((item) => (
            <StudioNavLink key={item.key} collapsed={collapsed} item={item} onClick={onCloseMobile} />
          ))}
        </div>
        <div
          className={cn(
            "mt-3 rounded-lg border border-sidebar-border bg-background/80",
            collapsed ? "p-2" : "px-3 py-3"
          )}
        >
          <div className={cn("flex items-center", collapsed ? "justify-center" : "gap-3")}>
            <span className="inline-flex size-8 items-center justify-center rounded-lg bg-primary/10 text-xs font-semibold text-primary">
              PB
            </span>
            {!collapsed ? (
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-sidebar-foreground">piotr-blue</p>
                <p className="truncate text-xs text-muted-foreground">MyOS operator</p>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}

function StudioHeader({
  searchDraft,
  setSearchDraft,
  onSearchSubmit,
  onOpenMobile,
  onToggleDesktop,
}: {
  searchDraft: string;
  setSearchDraft: (value: string) => void;
  onSearchSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onOpenMobile: () => void;
  onToggleDesktop: () => void;
}) {
  return (
    <header className="sticky top-2 z-30 h-14 border-b border-border-soft bg-background/85 backdrop-blur-md">
      <div className="flex h-full items-center justify-between gap-3 px-4 md:px-5">
        <div className="flex min-w-0 items-center gap-2">
          <Button
            size="icon-sm"
            variant="ghost"
            onClick={onOpenMobile}
            className="md:hidden"
            aria-label="Open navigation"
          >
            <MenuIcon className="size-4" />
          </Button>
          <Button
            size="icon-sm"
            variant="ghost"
            className="hidden md:inline-flex"
            onClick={onToggleDesktop}
            aria-label="Toggle dashboard navigation"
          >
            <LayoutGridIcon className="size-4" />
          </Button>
          <div className="hidden md:block">
            <p className="text-sm font-medium text-foreground">Studio Admin transplant</p>
            <p className="text-xs text-muted-foreground">Preserving MyOS IA and demo logic</p>
          </div>
        </div>

        <form onSubmit={onSearchSubmit} className="flex min-w-0 flex-1 items-center justify-center">
          <div className="relative w-full max-w-xl">
            <SearchIcon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={searchDraft}
              onChange={(event) => setSearchDraft(event.target.value)}
              placeholder="Search workspaces, documents, threads, services…"
              className="h-9 rounded-lg border-input bg-background pl-9 pr-18"
            />
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 rounded-md border border-border-soft bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
              ⌘K
            </span>
          </div>
          <Button type="submit" size="sm" className="ml-2 hidden sm:inline-flex">
            Search
          </Button>
        </form>

        <div className="flex items-center gap-2">
          <Badge variant="outline" className="hidden h-6 gap-1 px-2 md:inline-flex">
            <SparklesIcon className="size-3" />
            Demo mode
          </Badge>
          <Button variant="outline" size="icon-sm" className="hidden md:inline-flex">
            <BellIcon className="size-4" />
          </Button>
          <div className="hidden items-center gap-2 rounded-lg border border-border-soft bg-card px-2 py-1.5 shadow-[var(--shadow-card)] md:flex">
            <span className="inline-flex size-7 items-center justify-center rounded-lg bg-primary/10 text-xs font-semibold text-primary">
              PB
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-foreground">piotr-blue</p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

export function StudioAppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const activeQuery = searchParams.get("q") ?? "";
  const [searchDraft, setSearchDraft] = useState(activeQuery);
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    writeDemoLastRoute(pathname);
  }, [pathname]);

  useEffect(() => {
    setSearchDraft(activeQuery);
  }, [activeQuery]);

  useEffect(() => {
    setCollapsed(readDemoLeftRailCollapsed());
  }, []);

  function onSearchSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = searchDraft.trim();
    if (!trimmed) {
      router.push("/search");
      return;
    }
    router.push(`/search?q=${encodeURIComponent(trimmed)}`);
  }

  function toggleCollapse() {
    const next = !collapsed;
    setCollapsed(next);
    writeDemoLeftRailCollapsed(next);
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="flex min-h-screen">
        <aside className="hidden shrink-0 p-2 md:block">
          <div className={cn("h-[calc(100vh-1rem)]", collapsed ? "w-[76px]" : "w-[272px]")}>
            <StudioSidebar collapsed={collapsed} onToggleCollapse={toggleCollapse} />
          </div>
        </aside>

        {mobileOpen ? (
          <>
            <div
              className="fixed inset-0 z-40 bg-slate-950/20 backdrop-blur-[2px] md:hidden"
              onClick={() => setMobileOpen(false)}
            />
            <aside className="fixed inset-y-0 left-0 z-50 w-[288px] md:hidden">
              <StudioSidebar
                collapsed={false}
                mobile
                onCloseMobile={() => setMobileOpen(false)}
              />
            </aside>
          </>
        ) : null}

        <main className="min-w-0 flex-1 p-2">
          <div className="flex min-h-[calc(100vh-1rem)] flex-col rounded-xl border border-border-soft bg-background shadow-[var(--shadow-card)]">
            <StudioHeader
              searchDraft={searchDraft}
              setSearchDraft={setSearchDraft}
              onSearchSubmit={onSearchSubmit}
              onOpenMobile={() => setMobileOpen(true)}
              onToggleDesktop={toggleCollapse}
            />
            <div className="flex-1 p-4 md:p-6">{children}</div>
          </div>
        </main>
      </div>
    </div>
  );
}
