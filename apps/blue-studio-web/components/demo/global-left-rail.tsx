"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { WorkspaceTemplateDialog } from "@/components/demo/workspace-template-dialog";
import { useDemoApp } from "@/components/demo/demo-provider";
import { getWorkspaceScopes } from "@/lib/demo/selectors";
import { getScopeAvatar } from "@/lib/demo/visuals";
import {
  readDemoLeftRailCollapsed,
  writeDemoLeftRailCollapsed,
} from "@/lib/demo/credentials";
import { cn } from "@/lib/utils";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  FileTextIcon,
  MenuIcon,
  Settings2Icon,
  SparklesIcon,
  XIcon,
} from "lucide-react";

const TOP_LEVEL_NAV_ITEMS = [
  {
    key: "blink",
    href: "/blink",
    label: "Blink",
    icon: SparklesIcon,
    isActive: (pathname: string) => pathname === "/blink",
  },
  {
    key: "documents",
    href: "/documents",
    label: "Documents",
    icon: FileTextIcon,
    isActive: (pathname: string) =>
      pathname === "/documents" || pathname.startsWith("/documents/"),
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
  showAlert = false,
  compactIconLabel,
  onClick,
}: {
  collapsed: boolean;
  label: string;
  href: string;
  icon: ReactNode;
  active: boolean;
  showAlert?: boolean;
  compactIconLabel?: string;
  onClick?: () => void;
}) {
  const base = (
    <Link
      href={href}
      onClick={onClick}
      className={cn(
        "group/rail-link relative flex items-center rounded-lg border border-transparent transition-all duration-150",
        collapsed
          ? "mx-auto h-9 w-9 justify-center"
          : "h-9 gap-2.5 px-3 text-sm",
        active
          ? "border-accent-base/12 bg-accent-soft text-accent-base"
          : "text-text-secondary hover:bg-bg-subtle hover:text-foreground"
      )}
    >
      <span className="inline-flex size-[18px] items-center justify-center shrink-0">
        {icon}
      </span>
      {!collapsed ? (
        <span className="font-medium tracking-[-0.01em]">{label}</span>
      ) : (
        <span className="sr-only">{compactIconLabel ?? label}</span>
      )}
      {showAlert ? (
        <span className="absolute top-1.5 right-1.5 size-1.5 rounded-full bg-[#E63A45]" />
      ) : null}
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
  const hasPendingAttention =
    snapshot?.attentionItems.some((item) => item.status === "pending") ?? false;
  const [collapsed, setCollapsed] = useState(readDemoLeftRailCollapsed);
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

  /* On mobile, we show a hamburger button and an overlay drawer.
     On desktop, we show the permanent sidebar (collapsible). */

  const sidebarContent = (
    <>
      {/* Header */}
      <div
        className={cn(
          "flex items-center border-b border-border-soft",
          railCollapsed ? "justify-center px-2 py-2.5" : "justify-between px-3 py-2.5"
        )}
      >
        <div className={cn("items-center gap-2.5", railCollapsed ? "hidden" : "flex")}>
          <span className="inline-flex size-7 items-center justify-center rounded-full border border-border-soft bg-accent-soft text-accent-base">
            <SparklesIcon className="size-3.5" />
          </span>
          <div>
            <p className="font-semibold text-[13px] tracking-[-0.01em] text-foreground">Navigation</p>
            <p className="text-[11px] text-text-muted">Blink workspaces</p>
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
        <div className={cn("space-y-1", railCollapsed ? "p-1.5" : "p-2.5")}>
          {TOP_LEVEL_NAV_ITEMS
            .filter((item) => item.key !== "settings")
            .map((item) => (
              <RailLink
                key={item.key}
                collapsed={railCollapsed}
                href={item.href}
                label={item.label}
                icon={<item.icon className="size-[16px]" />}
                active={item.isActive(pathname)}
                showAlert={item.key === "documents" ? hasPendingAttention : false}
                onClick={isMobile ? closeMobileDrawer : undefined}
              />
            ))}

          <Separator className={cn("my-2.5", railCollapsed ? "mx-1.5" : "mx-1")} />

          {!railCollapsed ? (
            <p className="px-3 pb-1 text-[10px] text-text-muted uppercase tracking-[0.08em] font-semibold">
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
                    <Image
                      src={getScopeAvatar(workspace)}
                      alt={workspace.name}
                      width={22}
                      height={22}
                      className="size-[22px] rounded-full border border-border-soft object-cover"
                    />
                  }
                  active={pathname === `/workspaces/${workspace.id}`}
                  showAlert={workspace.bootstrapStatus === "failed"}
                  compactIconLabel={workspace.name}
                  onClick={isMobile ? closeMobileDrawer : undefined}
                />
              ))
            )}
          </div>

          <div className={cn("pt-1", railCollapsed ? "flex justify-center" : "")}>
            {railCollapsed ? (
              <WorkspaceTemplateDialog
                compact
                tooltipLabel="New workspace"
                buttonClassName="size-9 justify-center rounded-full border-border-soft bg-bg-subtle hover:bg-accent-soft"
              />
            ) : (
              <WorkspaceTemplateDialog buttonClassName="h-9 w-full justify-center rounded-lg bg-bg-subtle text-foreground hover:bg-accent-soft" />
            )}
          </div>

          <Separator className={cn("my-2.5", railCollapsed ? "mx-1.5" : "mx-1")} />
          {TOP_LEVEL_NAV_ITEMS
            .filter((item) => item.key === "settings")
            .map((item) => (
              <RailLink
                key={item.key}
                collapsed={railCollapsed}
                href={item.href}
                label={item.label}
                icon={<item.icon className="size-[16px]" />}
                active={item.isActive(pathname)}
                onClick={isMobile ? closeMobileDrawer : undefined}
              />
            ))}
        </div>
      </ScrollArea>

      {/* Footer user card */}
      <div
        className={cn(
          "border-t border-border-soft",
          railCollapsed ? "px-1.5 py-2.5" : "px-2.5 py-2.5"
        )}
      >
        <div
          className={cn(
            "flex items-center rounded-lg border border-border-soft bg-bg-subtle",
            railCollapsed ? "justify-center p-1.5" : "gap-2.5 px-2.5 py-2"
          )}
        >
          <Image
            src="/myos/avatars/piotr.svg"
            alt="Piotr Blue"
            width={30}
            height={30}
            className="size-[30px] rounded-full border border-border-soft object-cover"
          />
          {!railCollapsed ? (
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">piotr-blue</p>
              <p className="truncate text-[11px] text-text-muted">MyOS operator</p>
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
          variant="secondary"
          onClick={() => setMobileOpen(true)}
          aria-label="Open navigation"
          className="fixed top-2.5 left-2.5 z-50 rounded-full border-border-soft bg-card md:hidden"
        >
          <MenuIcon className="size-[18px]" />
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
            "fixed inset-y-0 left-0 z-50 mt-12 flex w-[264px] flex-col border-r border-border-soft bg-card shadow-[var(--shadow-elevated)] transition-transform duration-300 ease-in-out md:hidden",
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
        "hidden md:flex h-[calc(100vh-3rem)] shrink-0 flex-col border-r border-border-soft bg-card transition-[width] duration-300 ease-in-out",
        railCollapsed ? "mt-12 w-[66px]" : "mt-12 w-[246px]"
      )}
    >
      {sidebarContent}
    </aside>
  );
}
