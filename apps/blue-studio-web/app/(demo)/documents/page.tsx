"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useDemoApp } from "@/components/demo/demo-provider";
import { getRootDocuments } from "@/lib/demo/selectors";

export default function DocumentsPage() {
  const router = useRouter();
  const { snapshot, loading, createRootDocument } = useDemoApp();

  if (loading || !snapshot) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-text-muted">
        Loading documents…
      </div>
    );
  }

  const documents = getRootDocuments(snapshot);

  return (
    <section className="mx-auto max-w-5xl space-y-5">
      <div className="flex items-center justify-between gap-3 rounded-2xl border border-border-soft bg-card px-6 py-5 shadow-[var(--shadow-card)]">
        <div>
          <h1 className="text-page-title">Documents</h1>
          <p className="mt-1.5 text-body">Root-only documents (unscoped) for V1.</p>
        </div>
        <Button
          size="sm"
          onClick={async () => {
            const documentId = await createRootDocument();
            if (!documentId) {
              return;
            }
            router.push(`/documents/${encodeURIComponent(documentId)}`);
          }}
        >
          New document
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Root documents</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2.5">
          {documents.length === 0 ? (
            <p className="text-body py-4 text-center">No root documents yet.</p>
          ) : (
            documents.map((document) => (
              <Link
                key={document.id}
                href={`/documents/${encodeURIComponent(document.id)}`}
                className="block rounded-xl border border-border-soft bg-card p-4 transition-colors hover:border-accent-base/15 hover:bg-accent-soft/30"
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="font-semibold text-sm text-foreground">{document.title}</p>
                  <Badge variant="secondary">{document.kind}</Badge>
                </div>
                <p className="mt-1.5 text-body line-clamp-2">{document.summary}</p>
                <p className="mt-1.5 text-caption">Updated: {document.updatedAt}</p>
              </Link>
            ))
          )}
        </CardContent>
      </Card>
    </section>
  );
}
