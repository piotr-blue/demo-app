"use client";

import Image from "next/image";
import { Input } from "@/components/ui/input";
import { UserAccountDropdown } from "@/components/demo/user-account-dropdown";
import { MYOS_BRAND_ASSETS } from "@/lib/demo/visuals";
import { SearchIcon } from "lucide-react";

export function TopHeader() {
  return (
    <header className="fixed top-0 right-0 left-0 z-30 border-b border-border-soft bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/85">
      <div className="mx-auto flex h-12 max-w-[1600px] items-center justify-between gap-4 px-3 md:px-4">
        <div className="flex min-w-[112px] items-center">
          <Image
            src={MYOS_BRAND_ASSETS.logo}
            alt="MyOS"
            width={110}
            height={24}
            className="h-6 w-auto"
            priority
          />
        </div>

        <div className="relative w-full max-w-[420px]">
          <SearchIcon className="pointer-events-none absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-text-muted" />
          <Input
            readOnly
            value=""
            placeholder="Search"
            className="h-7 rounded-md border-border-soft bg-bg-subtle pl-8 text-[12px] shadow-none placeholder:text-text-muted"
            aria-label="Search"
          />
        </div>

        <div className="flex min-w-[40px] items-center justify-end">
          <UserAccountDropdown />
        </div>
      </div>
    </header>
  );
}
