"use client";

import { useParams } from "next/navigation";
import { ScopeShell } from "@/components/demo/scope-shell";

export default function WorkspacePage() {
  const params = useParams<{ workspaceId: string }>();
  const workspaceId = Array.isArray(params.workspaceId)
    ? params.workspaceId[0]
    : params.workspaceId;
  return <ScopeShell scopeId={workspaceId} />;
}
