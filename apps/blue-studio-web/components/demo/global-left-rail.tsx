"use client";

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
  ChevronLeftIcon,
  ChevronRightIcon,
  FileTextIcon,
  Settings2Icon,
  SparklesIcon,
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
  compactIconLabel,
}: {
  collapsed: boolean;
  label: string;
  href: string;
  icon: ReactNode;
  active: boolean;
  compactIconLabel?: string;
}) {
  const base = (
    <Link
      href={href}
      className={cn(
        "group/rail-link flex items-center rounded-xl border border-transparent transition-all duration-150",
        collapsed
          ? "mx-auto h-11 w-11 justify-center"
          : "h-11 gap-2.5 px-3.5 text-sm",
        active
          ? "bg-accent text-accent-strong shadow-[inset_0_0_0_1px_rgba(37,99,235,0.18)]"
          : "text-secondary-foreground hover:bg-muted"
      )}
    >
      <span
        className={cn(
          "inline-flex items-center justify-center",
          collapsed
            ? "size-7 rounded-full bg-card text-accent-strong"
            : "size-7 rounded-full bg-muted text-secondary-foreground group-hover/rail-link:text-foreground"
        )}
      >
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
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCollapsed(readDemoLeftRailCollapsed());
  }, []);

  const railCollapsed = collapsed;
  const navItems = useMemo(() => TOP_LEVEL_NAV_ITEMS, []);

  return (
    <aside
      className={cn(
        "flex h-screen shrink-0 flex-col border-r border-border/70 bg-card shadow-[2px_0_10px_rgba(16,24,40,0.04)] transition-[width] duration-300",
        railCollapsed ? "w-[84px]" : "w-[286px]"
      )}
    >
      <div
        className={cn(
          "flex items-center border-b border-border/75",
          railCollapsed ? "justify-center px-2 py-3" : "justify-between px-4 py-3"
        )}
      >
        <div className={cn("items-center gap-2.5", railCollapsed ? "hidden" : "flex")}>
          <span className="inline-flex size-8 items-center justify-center rounded-xl bg-accent text-accent-strong">
            <SparklesIcon className="size-4" />
          </span>
          <div>
            <p className="font-bold text-base tracking-[-0.02em] text-foreground">MyOS</p>
            <p className="text-[11px] text-muted-foreground">Demo</p>
          </div>
        </div>
        <Button
          size="icon-sm"
          variant="ghost"
          onClick={() => {
            const next = !railCollapsed;
            setCollapsed(next);
            writeDemoLeftRailCollapsed(next);
          }}
          aria-label={railCollapsed ? "Expand navigation" : "Collapse navigation"}
        >
          {railCollapsed ? <ChevronRightIcon /> : <ChevronLeftIcon />}
        </Button>
      </div>
      <ScrollArea className="min-h-0 flex-1">
        <div className={cn("space-y-2", railCollapsed ? "p-2.5" : "p-3")}>
          {navItems
            .filter((item) => item.key !== "settings")
            .map((item) => (
              <RailLink
                key={item.key}
                collapsed={railCollapsed}
                href={item.href}
                label={item.label}
                icon={<item.icon className="size-4" />}
                active={item.isActive(pathname)}
              />
            ))}

          <Separator className={cn("my-3", railCollapsed ? "mx-2" : "mx-1")} />

          {!railCollapsed ? (
            <p className="px-2 text-[11px] text-muted-foreground uppercase tracking-[0.06em]">
              Workspaces
            </p>
          ) : null}
          <div className={cn("space-y-1.5", railCollapsed ? "px-0.5" : "")}>
            {workspaces.length === 0 ? (
              <p
                className={cn(
                  "text-muted-foreground",
                  railCollapsed ? "text-center text-xs" : "px-2 text-sm"
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
                    <span className="text-[13px] leading-none">
                      {workspace.icon ?? workspace.name.slice(0, 1).toUpperCase()}
                    </span>
                  }
                  active={pathname === `/workspaces/${workspace.id}`}
                  compactIconLabel={workspace.name}
                />
              ))
            )}
          </div>

          <div className={cn("pt-1", railCollapsed ? "flex justify-center" : "")}>
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

          <Separator className={cn("my-3", railCollapsed ? "mx-2" : "mx-1")} />
          {navItems
            .filter((item) => item.key === "settings")
            .map((item) => (
              <RailLink
                key={item.key}
                collapsed={railCollapsed}
                href={item.href}
                label={item.label}
                icon={<item.icon className="size-4" />}
                active={item.isActive(pathname)}
              />
            ))}
        </div>
      </ScrollArea>

      <div
        className={cn(
          "border-t border-border/75",
          railCollapsed ? "px-2 py-2.5" : "px-4 py-3"
        )}
      >
        <div
          className={cn(
            "flex items-center rounded-xl bg-muted/65",
            railCollapsed ? "justify-center p-2" : "gap-2 p-2.5"
          )}
        >
          <span className="inline-flex size-8 items-center justify-center rounded-full bg-accent text-accent-strong text-xs font-bold">
            PB
          </span>
          {!railCollapsed ? (
            <div>
              <p className="text-sm font-semibold">piotr-blue</p>
              <p className="text-[11px] text-muted-foreground">MyOS operator</p>
            </div>
          ) : null}
        </div>
      </div>
    </aside>
  );
}
