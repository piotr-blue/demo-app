"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowLeftIcon, FileTextIcon } from "lucide-react";
import { StudioPageHeader } from "@/components/studio/studio-page-header";
import {
  StudioEmptyState,
  StudioMetaList,
  StudioSectionCard,
  StudioTimelineItem,
} from "@/components/studio/studio-surfaces";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
    <section className="studio-page-shell max-w-[1400px]">
      <StudioPageHeader
        eyebrow="Document detail"
        icon={<FileTextIcon className="size-5" />}
        title={document.title}
        description={document.summary}
        actions={
          <Button variant="outline" size="sm" render={<Link href={backHref} />}>
            <ArrowLeftIcon className="size-3.5" />
            {backLabel}
          </Button>
        }
        meta={
          <>
            <Badge variant="secondary">{document.kind}</Badge>
            <Badge variant={document.isService ? "default" : "outline"}>{document.status}</Badge>
            <Badge variant="outline">{scopeName}</Badge>
          </>
        }
      />

      <Tabs defaultValue="ui">
        <TabsList variant="line" className="w-full justify-start overflow-x-auto">
          <TabsTrigger value="ui">UI</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
        </TabsList>

        <TabsContent value="ui" className="space-y-4">
          {document.uiCards.map((card) => (
            <StudioSectionCard
              key={card.id}
              eyebrow="Action surface"
              title={card.title}
              description="Document controls are preserved while moving to the donor-style detail grammar."
              action={card.metric ? <Badge variant="outline">{card.metric}</Badge> : undefined}
            >
              <div className="space-y-4">
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
              </div>
            </StudioSectionCard>
          ))}
          {actionCount === 0 ? (
            <StudioSectionCard eyebrow="Action surface" title="No UI actions configured">
              <StudioEmptyState
                title="No UI actions configured"
                description="This document does not expose interactive controls yet."
              />
            </StudioSectionCard>
          ) : null}
        </TabsContent>

        <TabsContent value="settings">
          <div className="grid gap-4 md:grid-cols-2">
            {document.settingsBlocks.map((block) => (
              <StudioSectionCard
                key={block.id}
                eyebrow="Settings block"
                title={block.title}
                description={block.description}
              >
                <StudioMetaList
                  items={block.items.map((item) => ({
                    label: item.label,
                    value: item.value,
                  }))}
                />
              </StudioSectionCard>
            ))}
            <StudioSectionCard eyebrow="Metadata" title="Document metadata">
              <div className="space-y-4">
                <StudioMetaList
                  items={[
                    { label: "Owner", value: document.owner },
                    { label: "Participants", value: document.participants.join(", ") },
                    { label: "Updated", value: formatDate(document.updatedAt) },
                  ]}
                />
                <pre className="overflow-auto rounded-lg border border-border-soft bg-muted/45 p-4 text-xs leading-6 text-text-secondary">
                  {JSON.stringify(document.details, null, 2)}
                </pre>
              </div>
            </StudioSectionCard>
          </div>
        </TabsContent>

        <TabsContent value="activity">
          <StudioSectionCard eyebrow="Timeline" title="Document activity">
            <div className="space-y-3">
              {document.activity.length === 0 ? (
                <StudioEmptyState
                  title="No activity recorded yet"
                  description="Document actions, updates, and timeline entries will appear here."
                />
              ) : (
                document.activity.map((entry) => (
                  <StudioTimelineItem
                    key={entry.id}
                    title={entry.title}
                    detail={entry.detail}
                    badge={<Badge variant="secondary">{entry.kind}</Badge>}
                    meta={formatDate(entry.createdAt)}
                  />
                ))
              )}
            </div>
          </StudioSectionCard>
        </TabsContent>
      </Tabs>
    </section>
  );
}
