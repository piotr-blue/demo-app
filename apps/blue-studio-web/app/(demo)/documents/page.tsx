"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useDemoApp } from "@/components/demo/demo-provider";
import { getRootDocuments } from "@/lib/demo/selectors";

export default function DocumentsPage() {
  const router = useRouter();
  const { snapshot, loading, createRootDocument } = useDemoApp();

  if (loading || !snapshot) {
    return <div className="flex min-h-[40vh] items-center justify-center">Loading documents…</div>;
  }

  const documents = getRootDocuments(snapshot);

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between gap-2 rounded-xl border bg-card/80 px-4 py-3">
        <div>
          <h1 className="font-semibold text-xl">Documents</h1>
          <p className="text-muted-foreground text-sm">Root-only documents (unscoped) for V1.</p>
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

      <Card className="border-border/70 bg-card/80">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Root documents</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {documents.length === 0 ? (
            <p className="text-muted-foreground text-sm">No root documents yet.</p>
          ) : (
            documents.map((document) => (
              <Link
                key={document.id}
                href={`/documents/${encodeURIComponent(document.id)}`}
                className="block rounded-lg border bg-muted/20 p-3 hover:bg-muted/40"
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="font-medium text-sm">{document.title}</p>
                  <span className="text-muted-foreground text-xs">{document.kind}</span>
                </div>
                <p className="mt-1 text-muted-foreground text-xs">{document.summary}</p>
                <p className="mt-1 text-[11px] text-muted-foreground">Updated: {document.updatedAt}</p>
              </Link>
            ))
          )}
        </CardContent>
      </Card>
    </section>
  );
}
