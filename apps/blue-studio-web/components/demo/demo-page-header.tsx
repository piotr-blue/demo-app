"use client";

import type { ReactNode } from "react";
import { StudioPageHeader } from "@/components/studio/studio-page-header";

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
    <StudioPageHeader
      eyebrow={eyebrow}
      icon={icon}
      title={title}
      description={description}
      actions={actions}
      meta={meta}
      className={className}
    />
  );
}
