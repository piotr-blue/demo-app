"use client";

import Link from "next/link";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeftIcon } from "lucide-react";
import type { ActivityRecord, DocumentUiCard } from "@/lib/demo/types";

export function BlueDocumentShell({
  title,
  kind,
  summary,
  status,
  uiCards,
  details,
  activity,
  backHref,
  backLabel = "Back",
}: {
  title: string;
  kind: string;
  summary: string;
  status: string;
  uiCards: DocumentUiCard[];
  details: Record<string, unknown>;
  activity: ActivityRecord[];
  backHref: string;
  backLabel?: string;
}) {
  return (
    <section className="mx-auto max-w-5xl space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 rounded-2xl border border-border-soft bg-card px-6 py-5 shadow-[var(--shadow-card)]">
        <div>
          <h1 className="text-page-title">{title}</h1>
          <div className="mt-1.5 flex items-center gap-2">
            <Badge variant="secondary">{kind}</Badge>
            <span className="text-caption">·</span>
            <Badge variant="secondary">{status}</Badge>
          </div>
        </div>
        <Link href={backHref}>
          <Button variant="outline" size="sm">
            <ArrowLeftIcon className="size-3.5" />
            {backLabel}
          </Button>
        </Link>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="ui">
        <TabsList>
          <TabsTrigger value="ui">UI</TabsTrigger>
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
        </TabsList>

        <TabsContent value="ui" className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle>Summary</CardTitle>
            </CardHeader>
            <CardContent className="text-body">{summary}</CardContent>
          </Card>
          {uiCards.length === 0 ? (
            <Card>
              <CardContent className="pt-5 text-body text-center">
                No dynamic UI cards available for this document yet.
              </CardContent>
            </Card>
          ) : (
            uiCards.map((card) => (
              <Card key={card.id}>
                <CardHeader className="pb-2">
                  <CardTitle>{card.title}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <p className="text-body">{card.body}</p>
                  {card.ctaLabel ? (
                    <Button size="sm" variant="outline">
                      {card.ctaLabel}
                    </Button>
                  ) : null}
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="details">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle>Details</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="max-h-[65vh] overflow-auto rounded-xl border border-border-soft bg-bg-subtle p-4 font-mono text-xs whitespace-pre-wrap leading-relaxed text-text-secondary">
                {JSON.stringify(details, null, 2)}
              </pre>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activity">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle>Activity</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2.5">
              {activity.length === 0 ? (
                <p className="text-body text-center py-4">No activity recorded for this document.</p>
              ) : (
                activity.map((entry) => (
                  <div key={entry.id} className="rounded-xl border border-border-soft bg-card p-4 text-sm">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-semibold text-foreground">{entry.title}</p>
                      <Badge variant="secondary">{entry.kind}</Badge>
                    </div>
                    {entry.detail ? (
                      <p className="mt-1.5 text-body">{entry.detail}</p>
                    ) : null}
                    <p className="mt-1.5 text-caption">{entry.createdAt}</p>
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
