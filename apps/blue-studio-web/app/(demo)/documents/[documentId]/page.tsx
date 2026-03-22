"use client";

import { useParams } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { DocumentDetailShell } from "@/components/demo/document-detail-shell";
import { useDemoApp } from "@/components/demo/demo-provider";
import { getDocumentById, getScopeById } from "@/lib/demo/selectors";
import { BLINK_SCOPE_ID } from "@/lib/demo/seed";

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
  const resolvedScope = scope ?? getScopeById(snapshot, BLINK_SCOPE_ID);
  const scopeName = resolvedScope?.name ?? "Home";
  const backHref = scope ? `/workspaces/${encodeURIComponent(scope.id)}` : "/home?section=documents";
  const backLabel = scope ? "Back to workspace" : "Back to Home";

  return (
    <DocumentDetailShell
      document={document}
      scopeName={scopeName}
      backHref={backHref}
      backLabel={backLabel}
    />
  );
}
