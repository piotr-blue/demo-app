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
    <section className="mx-auto max-w-[1120px] space-y-4">
      <div className="flex items-center justify-between gap-3 rounded-xl border border-border-soft bg-card px-5 py-4 shadow-[var(--shadow-card)]">
        <div>
          <h1 className="text-page-title">Documents</h1>
          <p className="mt-1 text-body">Root-only documents (unscoped) for V1.</p>
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

      <Card className="overflow-hidden">
        <CardHeader className="border-b border-border-soft pb-3">
          <CardTitle>Root documents</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {documents.length === 0 ? (
            <p className="text-body py-4 text-center">No root documents yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <div className="min-w-[700px]">
                <div className="grid grid-cols-[1fr_140px_180px] border-b border-border-soft bg-bg-subtle px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-text-muted">
                  <span>Document</span>
                  <span>Kind</span>
                  <span className="text-right">Updated</span>
                </div>
                {documents.map((document) => (
                  <Link
                    key={document.id}
                    href={`/documents/${encodeURIComponent(document.id)}`}
                    className="grid grid-cols-[1fr_140px_180px] items-center border-b border-border-soft/80 px-4 py-3 transition-colors last:border-b-0 hover:bg-accent-soft/40"
                  >
                    <div className="min-w-0 pr-4">
                      <p className="truncate text-[13px] font-semibold text-foreground">{document.title}</p>
                      <p className="mt-0.5 truncate text-[12px] text-text-secondary">{document.summary}</p>
                    </div>
                    <Badge variant="secondary" className="w-fit">
                      {document.kind}
                    </Badge>
                    <p className="text-right text-[11px] text-text-muted">{document.updatedAt}</p>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </section>
  );
}
