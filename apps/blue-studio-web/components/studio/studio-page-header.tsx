"use client";

import { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function StudioPageHeader({
  eyebrow,
  icon,
  title,
  description,
  meta,
  actions,
  className,
}: {
  eyebrow?: ReactNode;
  icon?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  meta?: ReactNode;
  actions?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("studio-page-header", className)}>
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div className="min-w-0 space-y-3">
          {eyebrow ? <p className="studio-page-eyebrow">{eyebrow}</p> : null}
          <div className="flex min-w-0 items-start gap-4">
            {icon ? (
              <span className="inline-flex size-11 shrink-0 items-center justify-center rounded-xl border border-border-soft bg-muted/45 text-base text-foreground">
                {icon}
              </span>
            ) : null}
            <div className="min-w-0">
              <h1 className="text-page-title">{title}</h1>
              {description ? <p className="mt-2 max-w-3xl text-body">{description}</p> : null}
              {meta ? <div className="mt-3 flex flex-wrap items-center gap-2">{meta}</div> : null}
            </div>
          </div>
        </div>
        {actions ? <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div> : null}
      </div>
    </div>
  );
}
