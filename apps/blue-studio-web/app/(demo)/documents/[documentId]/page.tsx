"use client";

import { useParams } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { DocumentDetailShell } from "@/components/demo/document-detail-shell";
import { useDemoApp } from "@/components/demo/demo-provider";
import { getDocumentById } from "@/lib/demo/selectors";

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

  return (
    <DocumentDetailShell
      document={document}
      backHref="/home?section=documents"
      backLabel="Back to Home"
    />
  );
}
