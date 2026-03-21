"use client";

import Image from "next/image";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { MYOS_DEMO_USER } from "@/lib/demo/visuals";
import { PowerIcon } from "lucide-react";

export function UserAccountDropdown() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="ghost"
            size="icon-sm"
            className="rounded-full p-0 hover:bg-transparent"
            aria-label="Open account menu"
          />
        }
      >
        <Image
          src={MYOS_DEMO_USER.avatar}
          alt={MYOS_DEMO_USER.name}
          width={32}
          height={32}
          className="size-8 rounded-full border border-border-soft object-cover"
        />
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        sideOffset={8}
        className="w-[246px] rounded-xl border-border-soft p-1.5"
      >
        <DropdownMenuLabel className="px-2.5 py-1.5">
          <div className="flex items-center gap-2.5">
            <Image
              src={MYOS_DEMO_USER.avatar}
              alt={MYOS_DEMO_USER.name}
              width={30}
              height={30}
              className="size-[30px] rounded-full border border-border-soft object-cover"
            />
            <div className="min-w-0">
              <p className="truncate text-[12px] font-semibold text-foreground">{MYOS_DEMO_USER.name}</p>
              <p className="truncate text-[11px] text-text-muted">{MYOS_DEMO_USER.mainAccountLabel}</p>
            </div>
            <PowerIcon className="ml-auto size-3.5 text-text-muted" />
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="mx-1 my-1" />
        <DropdownMenuLabel className="px-2.5 pb-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-text-muted">
          Agent sub-accounts
        </DropdownMenuLabel>
        {MYOS_DEMO_USER.subAccounts.map((account) => (
          <DropdownMenuItem key={account.id} className="rounded-lg px-2.5 py-2">
            <Image
              src={account.avatar}
              alt={account.name}
              width={24}
              height={24}
              className="size-6 rounded-full border border-border-soft object-cover"
            />
            <div className="min-w-0">
              <p className="truncate text-[12px] font-medium text-foreground">{account.name}</p>
              <p className="truncate text-[10px] text-text-muted">{account.subtitle}</p>
            </div>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
