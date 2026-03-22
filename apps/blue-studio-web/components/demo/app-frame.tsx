"use client";

import { StudioAppShell } from "@/components/studio/studio-shell";

export function AppFrame({ children }: { children: React.ReactNode }) {
  return <StudioAppShell>{children}</StudioAppShell>;
}
