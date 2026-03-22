"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function DemoPageHeader({
  eyebrow,
  icon,
  title,
  description,
  actions,
  meta,
  className,
}: {
  eyebrow?: string;
  icon?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  meta?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("demo-page-header", className)}>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 space-y-3">
          {eyebrow ? <p className="demo-page-eyebrow">{eyebrow}</p> : null}
          <div className="flex items-start gap-3">
            {icon ? (
              <span className="mt-0.5 inline-flex size-11 shrink-0 items-center justify-center rounded-2xl border border-border-soft bg-bg-subtle text-lg text-foreground shadow-[var(--shadow-subtle)]">
                {icon}
              </span>
            ) : null}
            <div className="min-w-0">
              <h1 className="text-page-title">{title}</h1>
              {description ? <p className="mt-2 max-w-3xl text-body">{description}</p> : null}
            </div>
          </div>
          {meta ? <div className="flex flex-wrap items-center gap-2">{meta}</div> : null}
        </div>
        {actions ? <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div> : null}
      </div>
    </div>
  );
}
