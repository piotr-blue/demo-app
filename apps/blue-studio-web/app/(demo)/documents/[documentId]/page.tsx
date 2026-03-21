"use client";

import { useParams } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { BlueDocumentShell } from "@/components/demo/blue-document-shell";
import { useDemoApp } from "@/components/demo/demo-provider";
import { getDocumentById, getScopeById } from "@/lib/demo/selectors";

export default function DocumentDetailsPage() {
  const { snapshot, loading } = useDemoApp();
  const params = useParams<{ documentId: string }>();
  const documentId = Array.isArray(params.documentId) ? params.documentId[0] : params.documentId;

  if (loading || !snapshot) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-text-muted">
        Loading document…
      </div>
    );
  }

  const document = getDocumentById(snapshot, documentId);
  if (!document) {
    return (
      <Card>
        <CardContent className="pt-5 text-body">
          Document not found.
        </CardContent>
      </Card>
    );
  }

  const scope = document.scopeId ? getScopeById(snapshot, document.scopeId) : null;
  const backHref = scope ? `/workspaces/${encodeURIComponent(scope.id)}` : "/documents";
  const details = {
    id: document.id,
    scopeId: document.scopeId,
    kind: document.kind,
    status: document.status,
    createdAt: document.createdAt,
    updatedAt: document.updatedAt,
    sessionId: document.sessionId ?? null,
    myosDocumentId: document.myosDocumentId ?? null,
    details: document.details,
  };

  return (
    <BlueDocumentShell
      title={document.title}
      kind={document.kind}
      summary={document.summary}
      status={document.status}
      uiCards={document.uiCards}
      details={details}
      activity={document.activity}
      backHref={backHref}
      backLabel={scope ? "Back to workspace" : "Back to documents"}
    />
  );
}
