"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowLeftIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useDemoApp } from "@/components/demo/demo-provider";
import type { DocumentRecord } from "@/lib/demo/types";

function formatDate(value: string) {
  const asDate = new Date(value);
  return asDate.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function DocumentDetailShell({
  document,
  scopeName,
  backHref,
  backLabel,
}: {
  document: DocumentRecord;
  scopeName: string;
  backHref: string;
  backLabel: string;
}) {
  const { runDocumentAction } = useDemoApp();
  const [busyActionId, setBusyActionId] = useState<string | null>(null);
  const actionCount = useMemo(
    () => document.uiCards.reduce((sum, card) => sum + (card.actions?.length ?? 0), 0),
    [document.uiCards]
  );

  return (
    <section className="mx-auto max-w-5xl space-y-5">
      <div className="demo-surface flex items-center justify-between gap-3 px-6 py-5">
        <div>
          <h1 className="text-page-title">{document.title}</h1>
          <div className="mt-1.5 flex flex-wrap items-center gap-2">
            <Badge variant="secondary">{document.kind}</Badge>
            <Badge variant={document.isService ? "default" : "outline"}>{document.status}</Badge>
            <span className="text-caption">· {scopeName}</span>
          </div>
          <p className="mt-2 text-body">{document.summary}</p>
        </div>
        <Button variant="outline" size="sm" render={<Link href={backHref} />}>
          <ArrowLeftIcon className="size-3.5" />
          {backLabel}
        </Button>
      </div>

      <Tabs defaultValue="ui">
        <TabsList variant="line">
          <TabsTrigger value="ui">UI</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
        </TabsList>

        <TabsContent value="ui" className="space-y-4">
          {document.uiCards.map((card) => (
            <Card key={card.id}>
              <CardContent className="space-y-3 pt-5">
                <div className="flex items-center justify-between gap-2">
                  <h2 className="text-section-title">{card.title}</h2>
                  {card.metric ? <Badge variant="outline">{card.metric}</Badge> : null}
                </div>
                <p className="text-body">{card.body}</p>
                {card.actions?.length ? (
                  <div className="flex flex-wrap gap-2">
                    {card.actions.map((action) => (
                      <Button
                        key={action.id}
                        size="sm"
                        variant="outline"
                        disabled={busyActionId === action.id}
                        onClick={async () => {
                          setBusyActionId(action.id);
                          await runDocumentAction(document.id, action.id);
                          setBusyActionId(null);
                        }}
                        className="h-9"
                      >
                        {busyActionId === action.id ? "Applying…" : action.label}
                      </Button>
                    ))}
                  </div>
                ) : null}
              </CardContent>
            </Card>
          ))}
          {actionCount === 0 ? (
            <Card>
              <CardContent className="pt-5 text-body">
                No UI actions are configured for this document yet.
              </CardContent>
            </Card>
          ) : null}
        </TabsContent>

        <TabsContent value="settings">
          <div className="grid gap-4 md:grid-cols-2">
            {document.settingsBlocks.map((block) => (
              <Card key={block.id}>
                <CardContent className="space-y-2.5 pt-5">
                  <h3 className="text-section-title">{block.title}</h3>
                  {block.description ? <p className="text-body">{block.description}</p> : null}
                  <div className="overflow-hidden rounded-xl border border-border-soft">
                    {block.items.map((item) => (
                      <div
                        key={`${block.id}_${item.label}`}
                        className="grid grid-cols-[140px_1fr] gap-2 border-b border-border-soft/70 bg-card px-3 py-2 text-sm last:border-b-0"
                      >
                        <span className="text-text-muted">{item.label}</span>
                        <span className="text-foreground">{item.value}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
            <Card>
              <CardContent className="space-y-2.5 pt-5">
                <h3 className="text-section-title">Document metadata</h3>
                <div className="grid grid-cols-[140px_1fr] gap-2 text-sm">
                  <span className="text-text-muted">Owner</span>
                  <span className="text-foreground">{document.owner}</span>
                  <span className="text-text-muted">Participants</span>
                  <span className="text-foreground">{document.participants.join(", ")}</span>
                  <span className="text-text-muted">Updated</span>
                  <span className="text-foreground">{formatDate(document.updatedAt)}</span>
                </div>
                <pre className="overflow-auto rounded-xl border border-border-soft bg-bg-subtle p-3 text-xs text-text-secondary">
                  {JSON.stringify(document.details, null, 2)}
                </pre>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="activity">
          <Card>
            <CardContent className="space-y-2.5 pt-5">
              {document.activity.length === 0 ? (
                <p className="text-body py-8 text-center">No activity recorded yet.</p>
              ) : (
                document.activity.map((entry) => (
                  <div key={entry.id} className="rounded-xl border border-border-soft bg-card px-4 py-3">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-semibold text-sm text-foreground">{entry.title}</p>
                      <Badge variant="secondary">{entry.kind}</Badge>
                    </div>
                    {entry.detail ? <p className="mt-1 text-body">{entry.detail}</p> : null}
                    <p className="mt-1 text-caption">{formatDate(entry.createdAt)}</p>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </section>
  );
}
