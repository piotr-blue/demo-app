"use client";

import { useParams } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { BlueDocumentShell } from "@/components/demo/blue-document-shell";
import { useDemoApp } from "@/components/demo/demo-provider";
import { buildThreadUiCards } from "@/lib/demo/document-ui";
import { getScopeById, getThreadById, getDocumentById } from "@/lib/demo/selectors";

export default function ThreadDetailsPage() {
  const { snapshot, loading } = useDemoApp();
  const params = useParams<{ threadId: string }>();
  const threadId = Array.isArray(params.threadId) ? params.threadId[0] : params.threadId;

  if (loading || !snapshot) {
    return <div className="flex min-h-[40vh] items-center justify-center">Loading thread…</div>;
  }

  const thread = getThreadById(snapshot, threadId);
  if (!thread) {
    return (
      <Card className="border-border/70 bg-card/80">
        <CardContent className="pt-4 text-sm text-muted-foreground">Thread not found.</CardContent>
      </Card>
    );
  }

  const scope = getScopeById(snapshot, thread.scopeId);
  const relatedDocument = thread.coreDocumentId ? getDocumentById(snapshot, thread.coreDocumentId) : null;
  const details = {
    id: thread.id,
    scopeId: thread.scopeId,
    scopeName: scope?.name ?? null,
    status: thread.status,
    createdAt: thread.createdAt,
    updatedAt: thread.updatedAt,
    sessionId: thread.sessionId ?? null,
    coreDocumentId: thread.coreDocumentId ?? null,
    messageCount: thread.messages.length,
  };

  return (
    <BlueDocumentShell
      title={thread.title}
      kind="thread"
      summary={thread.summary}
      status={thread.status}
      uiCards={relatedDocument?.uiCards ?? buildThreadUiCards(thread, scope)}
      details={details}
      activity={thread.activity}
      backHref={scope?.type === "workspace" ? `/workspaces/${encodeURIComponent(scope.id)}` : "/blink"}
      backLabel={scope?.type === "workspace" ? "Back to workspace" : "Back to Blink"}
    />
  );
}
