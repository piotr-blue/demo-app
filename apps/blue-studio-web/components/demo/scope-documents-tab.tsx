"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { DocumentRecord } from "@/lib/demo/types";

export function ScopeDocumentsTab({
  documents,
  onCreateDocument,
}: {
  documents: DocumentRecord[];
  onCreateDocument: () => Promise<void>;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle>Documents</CardTitle>
        <Button size="sm" variant="outline" onClick={() => void onCreateDocument()}>
          New document
        </Button>
      </CardHeader>
      <CardContent className="space-y-2.5">
        {documents.length === 0 ? (
          <p className="text-body py-4 text-center">No scope documents yet.</p>
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
              <p className="mt-1.5 text-caption">status: {document.status}</p>
            </Link>
          ))
        )}
      </CardContent>
    </Card>
  );
}
