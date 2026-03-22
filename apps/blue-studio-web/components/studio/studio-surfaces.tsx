"use client";

import { ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function StudioToolbar({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={cn("studio-toolbar", className)}>{children}</div>;
}

export function StudioStatCard({
  label,
  value,
  detail,
  icon,
  trend,
}: {
  label: ReactNode;
  value: ReactNode;
  detail?: ReactNode;
  icon?: ReactNode;
  trend?: ReactNode;
}) {
  return (
    <Card className="overflow-hidden bg-linear-to-t from-primary/5 to-card shadow-xs">
      <CardHeader>
        <CardDescription>{label}</CardDescription>
        <CardTitle className="text-2xl font-semibold tabular-nums sm:text-3xl">{value}</CardTitle>
        {trend ? <div className="ml-auto">{trend}</div> : null}
      </CardHeader>
      {detail || icon ? (
        <CardContent className="flex items-end justify-between gap-3">
          <div className="text-sm text-muted-foreground">{detail}</div>
          {icon ? (
            <span className="inline-flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
              {icon}
            </span>
          ) : null}
        </CardContent>
      ) : null}
    </Card>
  );
}

export function StudioSectionCard({
  eyebrow,
  title,
  description,
  action,
  children,
  className,
  contentClassName,
}: {
  eyebrow?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  contentClassName?: string;
}) {
  return (
    <Card className={cn("studio-section-card", className)}>
      <div className="studio-section-header">
        <div className="min-w-0">
          {eyebrow ? <p className="studio-page-eyebrow">{eyebrow}</p> : null}
          <h2 className="mt-1 text-section-title">{title}</h2>
          {description ? <p className="mt-1 text-body">{description}</p> : null}
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </div>
      <CardContent className={cn("pt-5", contentClassName)}>{children}</CardContent>
    </Card>
  );
}

export function StudioEmptyState({
  title,
  description,
  icon,
  className,
}: {
  title: ReactNode;
  description?: ReactNode;
  icon?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("studio-empty-state", className)}>
      <div className="mx-auto flex max-w-sm flex-col items-center gap-3">
        {icon ? (
          <span className="inline-flex size-11 items-center justify-center rounded-xl border border-border-soft bg-card text-primary">
            {icon}
          </span>
        ) : null}
        <div className="space-y-1">
          <p className="text-section-title">{title}</p>
          {description ? <p className="text-body">{description}</p> : null}
        </div>
      </div>
    </div>
  );
}

export function StudioMetaList({
  items,
  className,
}: {
  items: Array<{ label: ReactNode; value: ReactNode }>;
  className?: string;
}) {
  return (
    <div className={cn("space-y-2", className)}>
      {items.map((item, index) => (
        <div key={index} className="studio-meta-row">
          <span className="text-sm text-muted-foreground">{item.label}</span>
          <span className="text-right text-sm font-medium text-foreground">{item.value}</span>
        </div>
      ))}
    </div>
  );
}

export function StudioTimelineItem({
  title,
  detail,
  badge,
  meta,
}: {
  title: ReactNode;
  detail?: ReactNode;
  badge?: ReactNode;
  meta?: ReactNode;
}) {
  return (
    <div className="rounded-lg border border-border-soft bg-card px-4 py-4 shadow-[var(--shadow-subtle)]">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-medium text-foreground">{title}</p>
        {badge}
      </div>
      {detail ? <p className="mt-2 text-body">{detail}</p> : null}
      {meta ? <p className="mt-2 text-caption">{meta}</p> : null}
    </div>
  );
}

export function StudioMessageBubble({
  role,
  text,
}: {
  role: "assistant" | "user" | "system";
  text: ReactNode;
}) {
  return (
    <div
      className={cn(
        "rounded-lg border px-4 py-3 text-sm",
        role === "user"
          ? "border-primary/15 bg-primary/5"
          : role === "assistant"
            ? "border-border-soft bg-muted/45"
            : "border-border-soft bg-card"
      )}
    >
      <p className="mb-2 text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground">{role}</p>
      <p className="leading-6 text-foreground">{text}</p>
    </div>
  );
}

export function StudioPill({
  children,
  variant = "outline",
}: {
  children: ReactNode;
  variant?: "outline" | "secondary" | "default" | "destructive";
}) {
  return (
    <Badge variant={variant} className="gap-1">
      {children}
    </Badge>
  );
}
