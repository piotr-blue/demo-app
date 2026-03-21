"use client";

import Link from "next/link";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
    <section className="space-y-3">
      <div className="flex items-center justify-between gap-2 rounded-xl border bg-card/80 px-4 py-3">
        <div>
          <p className="font-semibold text-lg">{title}</p>
          <p className="text-muted-foreground text-sm">
            {kind} · {status}
          </p>
        </div>
        <Button variant="outline" size="sm" render={<Link href={backHref} />}>
          {backLabel}
        </Button>
      </div>

      <Tabs defaultValue="ui" className="gap-3">
        <TabsList>
          <TabsTrigger value="ui">UI</TabsTrigger>
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
        </TabsList>

        <TabsContent value="ui" className="space-y-3">
          <Card className="border-border/70 bg-card/80">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Summary</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">{summary}</CardContent>
          </Card>
          {uiCards.length === 0 ? (
            <Card className="border-border/70 bg-card/80">
              <CardContent className="pt-4 text-sm text-muted-foreground">
                No dynamic UI cards available for this document yet.
              </CardContent>
            </Card>
          ) : (
            uiCards.map((card) => (
              <Card key={card.id} className="border-border/70 bg-card/80">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">{card.title}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <p className="text-muted-foreground">{card.body}</p>
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
          <Card className="border-border/70 bg-card/80">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Details</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="max-h-[65vh] overflow-auto rounded-lg border bg-muted/20 p-3 font-mono text-xs whitespace-pre-wrap">
                {JSON.stringify(details, null, 2)}
              </pre>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activity">
          <Card className="border-border/70 bg-card/80">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Activity</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {activity.length === 0 ? (
                <p className="text-muted-foreground text-sm">No activity recorded for this document.</p>
              ) : (
                activity.map((entry) => (
                  <div key={entry.id} className="rounded-lg border bg-muted/20 p-3 text-sm">
                    <p className="font-medium">{entry.title}</p>
                    {entry.detail ? (
                      <p className="text-muted-foreground text-xs">{entry.detail}</p>
                    ) : null}
                    <p className="text-[11px] text-muted-foreground">{entry.createdAt}</p>
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
