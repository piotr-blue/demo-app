"use client";

import { ScopeShell } from "@/components/demo/scope-shell";

export default function WorkspacePage({
  params,
}: {
  params: { workspaceId: string };
}) {
  return <ScopeShell scopeId={params.workspaceId} />;
}
