"use client";

import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import {
  HomeIcon,
  StarIcon,
  UserCircle2Icon,
  MenuIcon,
  XIcon,
} from "lucide-react";
import { StudioAccountMenu } from "@/components/studio/studio-account-menu";

export type StudioTopNavItem = {
  key: "home" | "profile";
  href: string;
  label: string;
  icon: typeof HomeIcon | typeof UserCircle2Icon;
  isActive: (pathname: string) => boolean;
};

export type StudioFavoriteNavItem = {
  id: string;
  title: string;
  subtitle: string;
  href: string;
  active: boolean;
  starred?: boolean;
};

function SidebarLink({
  collapsed,
  href,
  label,
  icon,
  active,
  compactLabel,
  onClick,
}: {
  collapsed: boolean;
  href: string;
  label: string;
  icon: ReactNode;
  active: boolean;
  compactLabel?: string;
  onClick?: () => void;
}) {
  const link = (
    <Link
      href={href}
      onClick={onClick}
      className={cn(
        "group/nav inline-flex w-full items-center rounded-lg border border-transparent text-sm font-medium transition-colors",
        collapsed ? "h-9 justify-center" : "h-9 gap-3 px-3",
        active
          ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-xs"
          : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
      )}
    >
      <span className="inline-flex size-4 items-center justify-center">{icon}</span>
      {collapsed ? <span className="sr-only">{compactLabel ?? label}</span> : <span>{label}</span>}
    </Link>
  );

  if (!collapsed) {
    return link;
  }

  return (
    <Tooltip>
      <TooltipTrigger>{link}</TooltipTrigger>
      <TooltipContent side="right">{label}</TooltipContent>
    </Tooltip>
  );
}

export function StudioSidebar({
  topItems,
  favoriteItems,
  collapsed,
}: {
  topItems: StudioTopNavItem[];
  favoriteItems: StudioFavoriteNavItem[];
  collapsed: boolean;
}) {
  const pathname = usePathname();
  const [isMobile, setIsMobile] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(min-width: 768px)");
    const update = (value: MediaQueryList | MediaQueryListEvent) => {
      const desktop = "matches" in value ? value.matches : false;
      setIsMobile(!desktop);
      if (desktop) {
        setMobileOpen(false);
      }
    };
    update(media);
    media.addEventListener("change", update as (event: MediaQueryListEvent) => void);
    return () => media.removeEventListener("change", update as (event: MediaQueryListEvent) => void);
  }, []);

  const railCollapsed = isMobile ? false : collapsed;
  const favoriteCount = favoriteItems.length;
  const content = (
    <>
      <div
        className={cn(
          "flex items-center border-b border-sidebar-border/70",
          railCollapsed ? "justify-center px-2 py-3" : "justify-between px-4 py-3"
        )}
      >
        <div className="flex items-center gap-2.5">
          <div>
            <p className="text-lg font-semibold tracking-tight text-foreground">MyOS Demo</p>
          </div>
        </div>
        {isMobile ? (
          <Button size="icon-sm" variant="ghost" onClick={() => setMobileOpen(false)} aria-label="Close nav">
            <XIcon className="size-4" />
          </Button>
        ) : null}
      </div>

      <ScrollArea className="min-h-0 flex-1">
        <div className={cn("space-y-3", railCollapsed ? "p-2" : "p-3")}>
          <div className="space-y-1">
            {topItems.map((item) => (
              <SidebarLink
                key={item.key}
                collapsed={railCollapsed}
                href={item.href}
                label={item.label}
                icon={<item.icon className="size-4" />}
                active={item.isActive(pathname)}
                onClick={isMobile ? () => setMobileOpen(false) : undefined}
              />
            ))}
          </div>

          <Separator />

          {!railCollapsed ? (
            <div className="flex items-center justify-between px-2 pt-1">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-sidebar-foreground/60">
                Favourites
              </p>
              <Badge variant="outline">{favoriteCount}</Badge>
            </div>
          ) : null}

          <div className={cn("space-y-1", railCollapsed ? "" : "max-h-[52vh] overflow-y-auto pr-1")}>
            {favoriteItems.length === 0 ? (
              <p className={cn("text-xs text-sidebar-foreground/60", railCollapsed ? "text-center" : "px-2 py-1")}>
                {railCollapsed ? "—" : "No favourites yet"}
              </p>
            ) : (
              favoriteItems.map((item) =>
                railCollapsed ? (
                  <SidebarLink
                    key={item.id}
                    collapsed
                    href={item.href}
                    label={item.title}
                    compactLabel={item.title}
                    active={item.active}
                    onClick={isMobile ? () => setMobileOpen(false) : undefined}
                    icon={<StarIcon className="size-4" />}
                  />
                ) : (
                  <Link
                    key={item.id}
                    href={item.href}
                    onClick={isMobile ? () => setMobileOpen(false) : undefined}
                    className={cn(
                      "block rounded-lg border px-3 py-2 transition-colors",
                      item.active
                        ? "border-sidebar-primary/30 bg-sidebar-primary/10"
                        : "border-transparent hover:bg-sidebar-accent"
                    )}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-foreground">{item.title}</p>
                        <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">
                          {item.subtitle}
                        </p>
                      </div>
                      {item.starred !== false ? (
                        <StarIcon className="mt-0.5 size-3.5 fill-current text-amber-500" />
                      ) : null}
                    </div>
                  </Link>
                )
              )
            )}
          </div>
        </div>
      </ScrollArea>

      <div className={cn("border-t border-sidebar-border/70", railCollapsed ? "px-2 py-3" : "px-3 py-3")}>
        <StudioAccountMenu compact={railCollapsed} />
      </div>
    </>
  );

  if (isMobile) {
    return (
      <>
        <Button
          size="icon"
          variant="outline"
          className="fixed left-3 top-3 z-50 md:hidden"
          onClick={() => setMobileOpen(true)}
          aria-label="Open nav"
        >
          <MenuIcon className="size-5" />
        </Button>
        {mobileOpen ? (
          <button
            type="button"
            className="fixed inset-0 z-40 bg-black/25 md:hidden"
            aria-label="Close nav backdrop"
            onClick={() => setMobileOpen(false)}
          />
        ) : null}
        <aside
          className={cn(
            "fixed inset-y-0 left-0 z-50 flex w-[280px] flex-col border-r border-sidebar-border bg-sidebar shadow-xl transition-transform md:hidden",
            mobileOpen ? "translate-x-0" : "-translate-x-full"
          )}
        >
          {content}
        </aside>
      </>
    );
  }

  return (
    <aside
      className={cn(
        "hidden h-screen shrink-0 border-r border-sidebar-border bg-sidebar md:flex md:flex-col",
        railCollapsed ? "w-[76px]" : "w-[272px]"
      )}
    >
      {content}
    </aside>
  );
}

export const STUDIO_TOP_NAV_ITEMS: StudioTopNavItem[] = [
  {
    key: "home",
    href: "/home",
    label: "Home",
    icon: HomeIcon,
    isActive: (pathname) => pathname === "/home",
  },
  {
    key: "profile",
    href: "/profile",
    label: "My Profile",
    icon: UserCircle2Icon,
    isActive: (pathname) => pathname === "/profile",
  },
];
