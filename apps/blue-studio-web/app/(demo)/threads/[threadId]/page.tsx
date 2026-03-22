"use client";

import { useParams, useSearchParams } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { ThreadDetailShell } from "@/components/demo/thread-detail-shell";
import { useDemoApp } from "@/components/demo/demo-provider";
import { getScopeById, getThreadById } from "@/lib/demo/selectors";
import { BLINK_SCOPE_ID } from "@/lib/demo/seed";

export default function ThreadDetailsPage() {
  const { snapshot, loading } = useDemoApp();
  const params = useParams<{ threadId: string }>();
  const searchParams = useSearchParams();
  const threadId = Array.isArray(params.threadId) ? params.threadId[0] : params.threadId;

  if (loading || !snapshot) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-text-muted">
        Loading thread…
      </div>
    );
  }

  const thread = getThreadById(snapshot, threadId);
  if (!thread) {
    return (
      <Card>
        <CardContent className="pt-5 text-body">Thread not found.</CardContent>
      </Card>
    );
  }

  const scope = getScopeById(snapshot, thread.scopeId);
  const scopeName = scope?.name ?? "Home";
  const requestedSection = searchParams.get("section");
  const allowedSections = new Set([
    "chat",
    "tasks",
    "all-documents",
    "starred",
    "services",
    "subscriptions",
  ]);
  const activeSection = allowedSections.has(requestedSection ?? "") ? (requestedSection as
    | "chat"
    | "tasks"
    | "all-documents"
    | "starred"
    | "services"
    | "subscriptions") : "tasks";
  const backHref =
    scope?.type === "workspace"
      ? `/workspaces/${encodeURIComponent(scope.id)}?section=${activeSection}`
      : `/home?section=${activeSection}`;

  return (
    <ThreadDetailShell
      thread={thread}
      scopeName={scopeName}
      scopeId={scope?.id ?? BLINK_SCOPE_ID}
      scopeType={scope?.type ?? "blink"}
      scopeIcon={scope?.icon}
      scopeAssistantName={scope?.assistant.name ?? "Blink"}
      activeSection={activeSection}
      backHref={backHref}
      backLabel={scope?.type === "workspace" ? "Back to workspace" : "Back to Home"}
    />
  );
}
