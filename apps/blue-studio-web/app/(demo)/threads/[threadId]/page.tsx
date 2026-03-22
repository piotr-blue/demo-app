"use client";

import { useParams } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { ThreadDetailShell } from "@/components/demo/thread-detail-shell";
import { useDemoApp } from "@/components/demo/demo-provider";
import { getScopeById, getThreadById } from "@/lib/demo/selectors";

export default function ThreadDetailsPage() {
  const { snapshot, loading } = useDemoApp();
  const params = useParams<{ threadId: string }>();
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

  return (
    <ThreadDetailShell
      thread={thread}
      scopeName={scopeName}
      backHref={scope?.type === "workspace" ? `/workspaces/${encodeURIComponent(scope.id)}` : "/home?section=tasks"}
      backLabel={scope?.type === "workspace" ? "Back to workspace" : "Back to Home"}
    />
  );
}
