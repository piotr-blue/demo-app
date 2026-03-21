"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { DocumentRecord } from "@/lib/demo/types";

export function ScopeDocumentsTab({
  documents,
  onCreateDocument,
}: {
  documents: DocumentRecord[];
  onCreateDocument: () => Promise<void>;
}) {
  return (
    <Card className="border-border/70 bg-card/80">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle className="text-sm">Documents</CardTitle>
        <Button size="sm" variant="outline" onClick={() => void onCreateDocument()}>
          New document
        </Button>
      </CardHeader>
      <CardContent className="space-y-2">
        {documents.length === 0 ? (
          <p className="text-muted-foreground text-sm">No scope documents yet.</p>
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
              <p className="mt-1 text-[11px] text-muted-foreground">status: {document.status}</p>
            </Link>
          ))
        )}
      </CardContent>
    </Card>
  );
}
