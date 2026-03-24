"use client";

import type { FormEvent, ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SearchIcon, SparklesIcon } from "lucide-react";
import { StudioAccountMenu } from "@/components/studio/studio-account-menu";

export function StudioHeader({
  searchValue,
  onSearchValueChange,
  onSearchSubmit,
  rightSlot,
}: {
  searchValue: string;
  onSearchValueChange: (next: string) => void;
  onSearchSubmit: (event: FormEvent<HTMLFormElement>) => void;
  rightSlot?: ReactNode;
}) {
  return (
    <header className="sticky top-0 z-30 border-b bg-background/90 px-4 py-2.5 backdrop-blur supports-[backdrop-filter]:bg-background/70 md:px-6">
      <div className="mx-auto flex max-w-[1600px] flex-wrap items-center gap-2.5 lg:flex-nowrap">
        <form onSubmit={onSearchSubmit} className="flex min-w-0 flex-1 items-center gap-2">
          <div className="relative flex-1">
            <SearchIcon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={searchValue}
              onChange={(event) => onSearchValueChange(event.target.value)}
              placeholder="Search accounts, services, and documents..."
              className="h-9 pl-9 pr-20"
            />
            <span className="pointer-events-none absolute right-2 top-1/2 hidden -translate-y-1/2 rounded-md border bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground md:inline-flex">
              CMD+J
            </span>
          </div>
          <Button type="submit" size="sm" className="h-9 px-4">
            Search
          </Button>
        </form>

        <Badge variant="outline" className="hidden h-8 gap-1.5 rounded-md px-2.5 md:inline-flex">
          <SparklesIcon className="size-3.5" />
          Demo mode
        </Badge>
        {rightSlot ?? <StudioAccountMenu compact />}
      </div>
    </header>
  );
}
