"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { CreditCardIcon, LogOutIcon, Settings2Icon } from "lucide-react";
import { useDemoApp } from "@/components/demo/demo-provider";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function StudioAccountMenu({ compact = false }: { compact?: boolean }) {
  const router = useRouter();
  const { snapshot, activeAccount, setActiveAccountId } = useDemoApp();
  const name = activeAccount?.name ?? "piotr-blue";
  const subtitle = activeAccount?.subtitle ?? "MyOS operator";
  const switchTargets = (snapshot?.accounts ?? []).filter((account) => account.id !== activeAccount?.id);
  const currentModeLabel = activeAccount?.mode === "live" ? "Live" : "Demo";
  const currentModeVariant = activeAccount?.mode === "live" ? "default" : "outline";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={
          compact
            ? "inline-flex size-9 items-center justify-center rounded-lg border border-border bg-card text-xs font-semibold"
            : "flex w-full items-center gap-2.5 rounded-lg border border-sidebar-border bg-sidebar-accent/60 px-2.5 py-2 text-left"
        }
        aria-label={compact ? "Account switcher compact" : "Account switcher"}
      >
        <span className="relative inline-flex size-7 overflow-hidden rounded-md border border-border/80 bg-muted">
          <Image src="/user-avatar.png" alt={`${name} avatar`} fill sizes="28px" className="object-cover" />
        </span>
        {!compact ? (
          <span className="min-w-0">
            <span className="block truncate text-sm font-medium">{name}</span>
            <span className="block truncate text-xs text-muted-foreground">{subtitle}</span>
          </span>
        ) : null}
      </DropdownMenuTrigger>
      <DropdownMenuContent side={compact ? "bottom" : "top"} align={compact ? "end" : "start"}>
        <div className="min-w-[220px] px-2 py-2">
          <div className="flex items-center gap-3 rounded-lg border bg-muted/20 px-3 py-2">
            <span className="relative inline-flex size-9 overflow-hidden rounded-md border border-border/80 bg-muted">
              <Image
                src={activeAccount?.avatar ?? "/user-avatar.png"}
                alt={`${name} avatar`}
                fill
                sizes="36px"
                className="object-cover"
              />
            </span>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <p className="truncate text-sm font-medium">{name}</p>
                <Badge variant={currentModeVariant}>{currentModeLabel}</Badge>
              </div>
              <p className="truncate text-xs text-muted-foreground">{subtitle}</p>
            </div>
          </div>
        </div>
        {switchTargets.length > 0 ? (
          <>
            <DropdownMenuGroup>
              {switchTargets.map((account) => (
                <DropdownMenuItem
                  key={account.id}
                  onClick={() => {
                    setActiveAccountId(account.id);
                    router.push("/home");
                  }}
                >
                  <span className="relative inline-flex size-7 overflow-hidden rounded-md border border-border/80 bg-muted">
                    <Image
                      src={account.avatar ?? "/user-avatar.png"}
                      alt={`${account.name} avatar`}
                      fill
                      sizes="28px"
                      className="object-cover"
                    />
                  </span>
                  <span className="min-w-0">
                    <span className="flex items-center gap-1.5 truncate text-sm">
                      <span>Switch to {account.name}</span>
                      <Badge variant={account.mode === "live" ? "default" : "outline"}>
                        {account.mode === "live" ? "Live" : "Demo"}
                      </Badge>
                    </span>
                    <span className="block truncate text-xs text-muted-foreground">{account.subtitle}</span>
                  </span>
                </DropdownMenuItem>
              ))}
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
          </>
        ) : null}
        <DropdownMenuItem onClick={() => router.push("/settings")}>
          <CreditCardIcon className="size-4" />
          Billing
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => router.push("/settings")}>
          <Settings2Icon className="size-4" />
          Settings
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive" onClick={() => router.push("/home")}>
          <LogOutIcon className="size-4" />
          Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
