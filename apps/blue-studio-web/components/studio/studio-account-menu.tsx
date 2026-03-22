"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { CreditCardIcon, LogOutIcon, Settings2Icon } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function StudioAccountMenu({
  compact = false,
  name = "piotr-blue",
  subtitle = "MyOS operator",
}: {
  compact?: boolean;
  name?: string;
  subtitle?: string;
}) {
  const router = useRouter();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={
          compact
            ? "inline-flex size-9 items-center justify-center rounded-lg border border-border bg-card text-xs font-semibold"
            : "flex w-full items-center gap-2.5 rounded-lg border border-sidebar-border bg-sidebar-accent/60 px-2.5 py-2 text-left"
        }
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
        <DropdownMenuItem onClick={() => router.push("/settings")}>
          <Settings2Icon className="size-4" />
          Settings
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => router.push("/settings")}>
          <CreditCardIcon className="size-4" />
          Billing
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
