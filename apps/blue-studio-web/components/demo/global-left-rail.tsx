"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { WorkspaceTemplateDialog } from "@/components/demo/workspace-template-dialog";
import { useDemoApp } from "@/components/demo/demo-provider";
import { getWorkspaceScopes } from "@/lib/demo/selectors";
import {
  readDemoLeftRailCollapsed,
  writeDemoLeftRailCollapsed,
} from "@/lib/demo/credentials";
import { cn } from "@/lib/utils";
import {
  HomeIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  MenuIcon,
  SearchIcon,
  Settings2Icon,
  SparklesIcon,
  XIcon,
} from "lucide-react";

const TOP_LEVEL_NAV_ITEMS = [
  {
    key: "home",
    href: "/home",
    label: "Home",
    icon: HomeIcon,
    isActive: (pathname: string) => pathname === "/home",
  },
  {
    key: "search",
    href: "/search",
    label: "Search",
    icon: SearchIcon,
    isActive: (pathname: string) => pathname === "/search",
  },
  {
    key: "settings",
    href: "/settings",
    label: "Settings",
    icon: Settings2Icon,
    isActive: (pathname: string) => pathname === "/settings",
  },
] as const;

function RailLink({
  collapsed,
  label,
  href,
  icon,
  active,
  compactIconLabel,
  onClick,
}: {
  collapsed: boolean;
  label: string;
  href: string;
  icon: ReactNode;
  active: boolean;
  compactIconLabel?: string;
  onClick?: () => void;
}) {
  const base = (
    <Link
      href={href}
      onClick={onClick}
      className={cn(
        "group/rail-link flex items-center rounded-[14px] border border-transparent transition-all duration-150",
        collapsed
          ? "mx-auto h-11 w-11 justify-center"
          : "h-11 gap-3 px-3.5 text-sm",
        active
          ? "border-accent-base/10 bg-accent-soft text-accent-base shadow-[var(--shadow-subtle)]"
          : "text-text-secondary hover:border-border-soft hover:bg-bg-subtle hover:text-foreground"
      )}
    >
      <span className="inline-flex size-5 shrink-0 items-center justify-center">
        {icon}
      </span>
      {!collapsed ? (
        <span className="font-semibold tracking-[-0.01em]">{label}</span>
      ) : (
        <span className="sr-only">{compactIconLabel ?? label}</span>
      )}
    </Link>
  );

  if (!collapsed) {
    return base;
  }
  return (
    <Tooltip>
      <TooltipTrigger>{base}</TooltipTrigger>
      <TooltipContent side="right">{label}</TooltipContent>
    </Tooltip>
  );
}

export function GlobalLeftRail() {
  const pathname = usePathname();
  const { snapshot } = useDemoApp();
  const workspaces = snapshot ? getWorkspaceScopes(snapshot) : [];
  const [collapsed, setCollapsed] = useState(() => readDemoLeftRailCollapsed());
  const [isMobile, setIsMobile] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  /* track mobile breakpoint */
  useEffect(() => {
    const mql = window.matchMedia("(min-width: 768px)");
    const handler = (e: MediaQueryListEvent | MediaQueryList) => {
      const isDesktop = "matches" in e ? e.matches : (e as MediaQueryListEvent).matches;
      setIsMobile(!isDesktop);
      if (!isDesktop) {
        setMobileOpen(false);
      }
    };
    handler(mql);
    mql.addEventListener("change", handler as (e: MediaQueryListEvent) => void);
    return () => mql.removeEventListener("change", handler as (e: MediaQueryListEvent) => void);
  }, []);

  const closeMobileDrawer = () => {
    setMobileOpen(false);
  };

  const railCollapsed = isMobile ? false : collapsed;
  const navItems = useMemo(() => TOP_LEVEL_NAV_ITEMS, []);

  /* On mobile, we show a hamburger button and an overlay drawer.
     On desktop, we show the permanent sidebar (collapsible). */

  const sidebarContent = (
    <>
      {/* Header */}
      <div
        className={cn(
          "flex items-center border-b border-border-soft/80",
          railCollapsed ? "justify-center px-2 py-4" : "justify-between px-5 py-5"
        )}
      >
        <div className={cn("items-center gap-2.5", railCollapsed ? "hidden" : "flex")}>
          <span className="inline-flex size-10 items-center justify-center rounded-2xl border border-border-soft bg-accent-soft text-accent-base shadow-[var(--shadow-subtle)]">
            <SparklesIcon className="size-4" />
          </span>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-accent-base">
              TailAdmin shell
            </p>
            <p className="font-bold text-base tracking-[-0.02em] text-foreground">MyOS Demo</p>
          </div>
        </div>
        {isMobile ? (
          <Button
            size="icon-sm"
            variant="ghost"
            onClick={closeMobileDrawer}
            aria-label="Close navigation"
            className="text-text-muted hover:text-foreground"
          >
            <XIcon className="size-4" />
          </Button>
        ) : (
          <Button
            size="icon-sm"
            variant="ghost"
            onClick={() => {
              const next = !railCollapsed;
              setCollapsed(next);
              writeDemoLeftRailCollapsed(next);
            }}
            aria-label={railCollapsed ? "Expand navigation" : "Collapse navigation"}
            className="text-text-muted hover:text-foreground"
          >
            {railCollapsed ? <ChevronRightIcon className="size-4" /> : <ChevronLeftIcon className="size-4" />}
          </Button>
        )}
      </div>

      {/* Navigation */}
      <ScrollArea className="min-h-0 flex-1">
        <div className={cn("space-y-2", railCollapsed ? "p-2.5" : "p-4")}>
          {!railCollapsed ? (
            <p className="px-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-text-muted">
              Navigation
            </p>
          ) : null}
          {navItems
            .filter((item) => item.key !== "settings")
            .map((item) => (
              <RailLink
                key={item.key}
                collapsed={railCollapsed}
                href={item.href}
                label={item.label}
                icon={<item.icon className="size-[18px]" />}
                active={item.isActive(pathname)}
                onClick={isMobile ? closeMobileDrawer : undefined}
              />
            ))}

          <Separator className={cn("my-3.5", railCollapsed ? "mx-1.5" : "mx-1")} />

          {!railCollapsed ? (
            <p className="px-2 pb-1 text-[11px] text-text-muted uppercase tracking-[0.12em] font-semibold">
              Workspaces
            </p>
          ) : null}
          <div className={cn("space-y-0.5", railCollapsed ? "px-0" : "")}>
            {workspaces.length === 0 ? (
              <p
                className={cn(
                  "text-text-muted",
                  railCollapsed ? "text-center text-xs py-2" : "px-3 py-2 text-sm"
                )}
              >
                {railCollapsed ? "—" : "No workspaces yet."}
              </p>
            ) : (
              workspaces.map((workspace) => (
                <RailLink
                  key={workspace.id}
                  collapsed={railCollapsed}
                  href={`/workspaces/${encodeURIComponent(workspace.id)}`}
                  label={workspace.name}
                  icon={
                    <span className="inline-flex size-7 items-center justify-center rounded-xl border border-border-soft bg-bg-subtle text-xs font-semibold text-text-secondary">
                      {workspace.icon ?? workspace.name.slice(0, 1).toUpperCase()}
                    </span>
                  }
                  active={pathname.startsWith(`/workspaces/${workspace.id}`)}
                  compactIconLabel={workspace.name}
                  onClick={isMobile ? closeMobileDrawer : undefined}
                />
              ))
            )}
          </div>

          <div className={cn("pt-2", railCollapsed ? "flex justify-center" : "")}>
            {railCollapsed ? (
              <WorkspaceTemplateDialog
                compact
                tooltipLabel="New workspace"
                buttonClassName="size-11 justify-center"
              />
            ) : (
              <WorkspaceTemplateDialog buttonClassName="w-full justify-center" />
            )}
          </div>

          <Separator className={cn("my-3.5", railCollapsed ? "mx-1.5" : "mx-1")} />
          {!railCollapsed ? (
            <p className="px-2 pb-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-text-muted">
              Preferences
            </p>
          ) : null}
          {navItems
            .filter((item) => item.key === "settings")
            .map((item) => (
              <RailLink
                key={item.key}
                collapsed={railCollapsed}
                href={item.href}
                label={item.label}
                icon={<item.icon className="size-[18px]" />}
                active={item.isActive(pathname)}
                onClick={isMobile ? closeMobileDrawer : undefined}
              />
            ))}
        </div>
      </ScrollArea>

      {/* Footer user card */}
      <div
        className={cn(
          "border-t border-border-soft/80",
          railCollapsed ? "px-2.5 py-4" : "px-4 py-4"
        )}
      >
        <div
          className={cn(
            "flex items-center rounded-[18px] border border-border-soft bg-bg-subtle/75",
            railCollapsed ? "justify-center p-2.5" : "gap-3 px-3.5 py-3"
          )}
        >
          <span className="relative inline-flex size-9 shrink-0 overflow-hidden rounded-2xl border border-border-soft bg-card">
            <Image src="/user-avatar.png" alt="piotr-blue avatar" fill sizes="36px" className="object-cover" />
          </span>
          {!railCollapsed ? (
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">piotr-blue</p>
              <p className="truncate text-xs text-text-muted">MyOS operator</p>
            </div>
          ) : null}
        </div>
      </div>
    </>
  );

  /* Mobile: overlay drawer */
  if (isMobile) {
    return (
      <>
        {/* Fixed hamburger button */}
        <Button
          size="icon"
          variant="outline"
          onClick={() => setMobileOpen(true)}
          aria-label="Open navigation"
          className="fixed top-3 left-3 z-50 shadow-[var(--shadow-card)] md:hidden"
        >
          <MenuIcon className="size-5" />
        </Button>

        {/* Overlay backdrop */}
        {mobileOpen ? (
          <div
            className="fixed inset-0 z-40 bg-black/15 backdrop-blur-[2px] transition-opacity md:hidden"
            onClick={closeMobileDrawer}
          />
        ) : null}

        {/* Drawer */}
        <aside
          className={cn(
            "fixed inset-y-0 left-0 z-50 flex w-[292px] flex-col border-r border-border-soft bg-card shadow-[var(--shadow-elevated)] transition-transform duration-300 ease-in-out md:hidden",
            mobileOpen ? "translate-x-0" : "-translate-x-full"
          )}
        >
          {sidebarContent}
        </aside>
      </>
    );
  }

  /* Desktop: permanent sidebar */
  return (
    <aside
      className={cn(
        "hidden md:flex h-screen shrink-0 flex-col border-r border-border-soft/80 bg-card/95 transition-[width] duration-300 ease-in-out",
        railCollapsed ? "w-[84px]" : "w-[286px]"
      )}
    >
      {sidebarContent}
    </aside>
  );
}
