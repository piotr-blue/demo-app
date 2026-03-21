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
    <Card className="overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between border-b border-border-soft pb-3">
        <CardTitle>Documents</CardTitle>
        <Button size="sm" variant="outline" onClick={() => void onCreateDocument()}>
          New document
        </Button>
      </CardHeader>
      <CardContent className="p-0">
        {documents.length === 0 ? (
          <p className="py-4 text-center text-body">No scope documents yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <div className="min-w-[620px]">
              <div className="grid grid-cols-[1fr_140px_140px] border-b border-border-soft bg-bg-subtle px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-text-muted">
                <span>Document</span>
                <span>Kind</span>
                <span className="text-right">Status</span>
              </div>
              {documents.map((document) => (
                <Link
                  key={document.id}
                  href={`/documents/${encodeURIComponent(document.id)}`}
                  className="grid grid-cols-[1fr_140px_140px] items-center border-b border-border-soft/80 px-4 py-3 transition-colors last:border-b-0 hover:bg-accent-soft/40"
                >
                  <div className="min-w-0 pr-4">
                    <p className="truncate text-[13px] font-semibold text-foreground">{document.title}</p>
                    <p className="mt-0.5 truncate text-[12px] text-text-secondary">{document.summary}</p>
                  </div>
                  <Badge variant="secondary" className="w-fit">
                    {document.kind}
                  </Badge>
                  <p className="text-right text-[12px] text-text-secondary">{document.status}</p>
                </Link>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
