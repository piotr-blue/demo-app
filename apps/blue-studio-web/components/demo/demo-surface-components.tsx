"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ChevronRightIcon, Link2Icon, SearchIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DemoAvatar } from "@/components/demo/demo-avatar";
import { StudioEmptyState } from "@/components/studio/studio-primitives";
import type {
  ActivityRecord,
  AttentionItem,
  DemoEmbeddedDocumentRecord,
  DemoFieldRecord,
  DemoOperationRecord,
  DemoParticipantRecord,
  DemoServiceConnectionRecord,
  DemoShareRecord,
  DemoShareSettings,
  ThreadRecord,
} from "@/lib/demo/types";

function formatDate(value: string) {
  return new Date(value).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatDateLabel(value: string) {
  return new Date(value).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

function badgeVariantForStatus(status?: string | null): "default" | "secondary" | "outline" | "destructive" {
  const normalized = status?.toLowerCase() ?? "";
  if (
    normalized.includes("blocked") ||
    normalized.includes("failed") ||
    normalized.includes("high")
  ) {
    return "destructive";
  }
  if (
    normalized.includes("connected") ||
    normalized.includes("ready") ||
    normalized.includes("active") ||
    normalized.includes("public")
  ) {
    return "secondary";
  }
  return "outline";
}

function groupActivityByDate(activity: ActivityRecord[]) {
  return activity.reduce<Array<{ label: string; items: ActivityRecord[] }>>((groups, entry) => {
    const label = formatDateLabel(entry.createdAt);
    const current = groups[groups.length - 1];
    if (current && current.label === label) {
      current.items.push(entry);
      return groups;
    }
    groups.push({ label, items: [entry] });
    return groups;
  }, []);
}

export function DocumentSummaryPanel({
  title,
  summary,
  chips,
  ownerLine,
}: {
  title: string;
  summary: string;
  chips: string[];
  ownerLine?: string | null;
}) {
  return (
    <Card>
      <CardContent className="space-y-4 pt-5">
        <div className="space-y-2">
          <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
          <p className="max-w-3xl text-sm leading-6 text-muted-foreground">{summary}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {chips.map((chip) => (
            <Badge key={chip} variant="outline">
              {chip}
            </Badge>
          ))}
        </div>
        {ownerLine ? <p className="text-xs text-muted-foreground">{ownerLine}</p> : null}
      </CardContent>
    </Card>
  );
}

export function CoreFieldsPanel({
  title = "Core fields",
  fields,
}: {
  title?: string;
  fields: DemoFieldRecord[];
}) {
  if (fields.length === 0) {
    return <StudioEmptyState title="No core fields" body="Important business fields will appear here." />;
  }

  return (
    <Card>
      <CardContent className="space-y-3 pt-5">
        <h3 className="text-sm font-semibold">{title}</h3>
        <div className="grid gap-3 md:grid-cols-2">
          {fields.map((entry) => (
            <div
              key={`${entry.label}_${entry.value}`}
              className="rounded-xl border border-border/80 bg-muted/30 px-3.5 py-3"
            >
              <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                {entry.label}
              </p>
              <p className="mt-2 text-sm font-medium text-foreground">{entry.value}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export function OperationsPanel({
  operations,
  onRunAction,
  busyActionId,
  emptyTitle = "No operations available",
  emptyBody = "This document does not expose any operations right now.",
}: {
  operations: Array<
    DemoOperationRecord & {
      id: string;
      actionLabel?: string | null;
    }
  >;
  onRunAction?: (actionId: string) => Promise<void> | void;
  busyActionId?: string | null;
  emptyTitle?: string;
  emptyBody?: string;
}) {
  if (operations.length === 0) {
    return <StudioEmptyState title={emptyTitle} body={emptyBody} />;
  }

  return (
    <div className="space-y-3">
      {operations.map((operation) => (
        <Card key={operation.id}>
          <CardContent className="flex flex-col gap-4 pt-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-sm font-semibold text-foreground">{operation.title}</p>
                <Badge variant={badgeVariantForStatus(operation.status)}>{operation.status}</Badge>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">{operation.summary}</p>
            </div>
            {onRunAction && operation.actionLabel ? (
              <Button
                size="sm"
                variant="outline"
                disabled={busyActionId === operation.id}
                onClick={() => void onRunAction(operation.id)}
              >
                {busyActionId === operation.id ? "Applying…" : operation.actionLabel}
              </Button>
            ) : (
              <span className="inline-flex items-center gap-1 text-sm text-muted-foreground">
                {operation.actionLabel ?? "Review"}
                <ChevronRightIcon className="size-4" />
              </span>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export function NeedsYouList({
  items,
  limit,
  viewAllLabel,
  onViewAll,
}: {
  items: AttentionItem[];
  limit?: number;
  viewAllLabel?: string;
  onViewAll?: () => void;
}) {
  const visibleItems = typeof limit === "number" ? items.slice(0, limit) : items;
  if (visibleItems.length === 0) {
    return (
      <StudioEmptyState title="No pending items" body="There is nothing in the queue for this surface right now." />
    );
  }

  return (
    <div className="space-y-3">
      {visibleItems.map((item) => (
        <Card key={item.id}>
          <CardContent className="space-y-3 pt-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-foreground">{item.title}</p>
                <p className="mt-1 text-sm text-muted-foreground">{item.body}</p>
              </div>
              <Badge variant={badgeVariantForStatus(item.priority)}>{item.priority}</Badge>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              {item.sourceLabel ? <span>{item.sourceLabel}</span> : null}
              <span>{formatDate(item.createdAt)}</span>
            </div>
            {(item.availableActionLabels ?? []).length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {(item.availableActionLabels ?? []).map((label) => (
                  <Button key={label} size="sm" variant="outline">
                    {label}
                  </Button>
                ))}
              </div>
            ) : null}
          </CardContent>
        </Card>
      ))}
      {limit && items.length > limit && onViewAll ? (
        <div className="flex justify-end">
          <Button size="sm" variant="ghost" onClick={onViewAll}>
            {viewAllLabel ?? "View all"}
          </Button>
        </div>
      ) : null}
    </div>
  );
}

export function TaskList({
  tasks,
  limit,
  viewAllLabel,
  onViewAll,
}: {
  tasks: ThreadRecord[];
  limit?: number;
  viewAllLabel?: string;
  onViewAll?: () => void;
}) {
  const visibleTasks = typeof limit === "number" ? tasks.slice(0, limit) : tasks;
  if (visibleTasks.length === 0) {
    return <StudioEmptyState title="No tasks yet" body="Tasks attached to this document will appear here." />;
  }

  return (
    <div className="space-y-3">
      {visibleTasks.map((task) => (
        <Link
          key={task.id}
          href={`/threads/${task.id}`}
          className="block rounded-xl border border-border/80 bg-card px-4 py-4 transition-colors hover:bg-muted/30"
        >
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-foreground">{task.title}</p>
              <p className="mt-1 text-sm text-muted-foreground">{task.summary}</p>
              <p className="mt-2 text-xs text-muted-foreground">
                {task.responsibleSummary ?? task.activityLabel ?? "Task document"}
              </p>
            </div>
            <div className="flex flex-col items-end gap-2">
              <Badge variant={badgeVariantForStatus(task.status)}>{task.status}</Badge>
              <span className="text-xs text-muted-foreground">{task.progress}%</span>
            </div>
          </div>
        </Link>
      ))}
      {limit && tasks.length > limit && onViewAll ? (
        <div className="flex justify-end">
          <Button size="sm" variant="ghost" onClick={onViewAll}>
            {viewAllLabel ?? "View all"}
          </Button>
        </div>
      ) : null}
    </div>
  );
}

export function ParticipantsList({ participants }: { participants: DemoParticipantRecord[] }) {
  if (participants.length === 0) {
    return <StudioEmptyState title="No participants listed" body="Participants will appear when access is granted." />;
  }

  return (
    <Card>
      <CardContent className="space-y-1 p-0">
        <div className="flex items-center justify-between px-4 py-3">
          <Button size="sm" variant="link" className="px-0">
            Manage participants
          </Button>
        </div>
        <Separator />
        {participants.map((participant, index) => (
          <div key={participant.id}>
            <div className="flex items-center justify-between gap-3 px-4 py-3">
              <div className="flex min-w-0 items-center gap-3">
                <DemoAvatar
                  name={participant.name}
                  src={participant.avatar ?? undefined}
                  size="md"
                />
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-foreground">{participant.name}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {participant.email ?? participant.subtitle ?? "Participant"}
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap justify-end gap-2">
                {(participant.roles ?? []).map((role) => (
                  <Badge key={role} variant="outline">
                    {role}
                  </Badge>
                ))}
              </div>
            </div>
            {index < participants.length - 1 ? <Separator /> : null}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

export function EmbeddedDocumentsList({
  items,
  emptyTitle = "No embedded documents",
  emptyBody = "Linked or embedded documents will appear here.",
}: {
  items: DemoEmbeddedDocumentRecord[];
  emptyTitle?: string;
  emptyBody?: string;
}) {
  if (items.length === 0) {
    return <StudioEmptyState title={emptyTitle} body={emptyBody} />;
  }

  return (
    <div className="space-y-3">
      {items.map((item) => (
        <Link
          key={item.documentId}
          href={item.documentId.startsWith("thread_") ? `/threads/${item.documentId}` : `/documents/${item.documentId}`}
          className="block rounded-xl border border-border/80 bg-card px-4 py-4 transition-colors hover:bg-muted/30"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-primary">{item.title}</p>
              <p className="mt-1 text-xs text-muted-foreground">{item.subtitle ?? "Document"}</p>
              <p className="mt-2 text-sm text-muted-foreground">{item.summary}</p>
            </div>
            <div className="flex items-center gap-2">
              {item.status ? <Badge variant={badgeVariantForStatus(item.status)}>{item.status}</Badge> : null}
              <ChevronRightIcon className="size-4 text-muted-foreground" />
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}

export function AnchorDocumentBrowser({
  title,
  documents,
}: {
  title: string;
  documents: Array<{
    id: string;
    title: string;
    summary: string;
    status: string;
    updatedAt?: string;
  }>;
}) {
  const [query, setQuery] = useState("");
  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) {
      return documents;
    }
    return documents.filter(
      (entry) =>
        entry.title.toLowerCase().includes(normalized) ||
        entry.summary.toLowerCase().includes(normalized)
    );
  }, [documents, query]);

  return (
    <div className="space-y-4">
      <div className="relative max-w-sm">
        <SearchIcon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={`Search ${title.toLowerCase()}...`}
          className="pl-9"
        />
      </div>
      {filtered.length === 0 ? (
        <StudioEmptyState
          title="No visible linked documents"
          body="Nothing in this anchor matches the current viewer or search."
        />
      ) : (
        <div className="space-y-3">
          {filtered.map((entry) => (
            <Link
              key={entry.id}
              href={`/documents/${entry.id}`}
              className="block rounded-xl border border-border/80 bg-card px-4 py-4 transition-colors hover:bg-muted/30"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <Link2Icon className="size-4 text-muted-foreground" />
                    <p className="text-sm font-semibold text-foreground">{entry.title}</p>
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">{entry.summary}</p>
                  {entry.updatedAt ? (
                    <p className="mt-2 text-xs text-muted-foreground">{formatDate(entry.updatedAt)}</p>
                  ) : null}
                </div>
                <Badge variant={badgeVariantForStatus(entry.status)}>{entry.status}</Badge>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

export function ActivityTimeline({ activity }: { activity: ActivityRecord[] }) {
  if (activity.length === 0) {
    return <StudioEmptyState title="No activity yet" body="Timeline entries will appear here as work happens." />;
  }

  const groups = groupActivityByDate(activity);

  return (
    <div className="space-y-6">
      {groups.map((group) => (
        <div key={group.label} className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="h-px flex-1 bg-border" />
            <p className="text-xs font-medium text-muted-foreground">{group.label}</p>
            <div className="h-px flex-1 bg-border" />
          </div>
          <div className="space-y-4">
            {group.items.map((entry) => {
              const alignRight = entry.actorSide === "right";
              const toneClass =
                entry.tone === "operation"
                  ? "bg-emerald-50/90 border-emerald-200"
                  : entry.tone === "event"
                    ? "bg-sky-50/90 border-sky-200"
                    : "bg-muted/35 border-border/80";
              return (
                <div
                  key={entry.id}
                  className={`flex gap-3 ${alignRight ? "justify-end" : "justify-start"}`}
                >
                  {!alignRight ? (
                    <DemoAvatar
                      name={entry.actorName ?? "Actor"}
                      src={entry.actorAvatar ?? undefined}
                      kind={entry.actorType === "assistant" ? "blink" : "person"}
                      size="md"
                    />
                  ) : null}
                  <div className={`max-w-[760px] ${alignRight ? "order-1" : ""}`}>
                    <div className={`rounded-2xl border px-4 py-4 shadow-xs ${toneClass}`}>
                      <p className="text-sm font-semibold text-foreground">{entry.title}</p>
                      {entry.detail ? <p className="mt-2 text-sm leading-6 text-muted-foreground">{entry.detail}</p> : null}
                    </div>
                    <div className={`mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground ${alignRight ? "justify-end" : "justify-start"}`}>
                      <span>{entry.actorName ?? "System"}</span>
                      <span>•</span>
                      <span>{formatDate(entry.createdAt)}</span>
                      {entry.linkedLabel ? (
                        <>
                          <span>•</span>
                          <span>{entry.linkedLabel}</span>
                        </>
                      ) : null}
                    </div>
                  </div>
                  {alignRight ? (
                    <DemoAvatar
                      name={entry.actorName ?? "Actor"}
                      src={entry.actorAvatar ?? undefined}
                      kind={entry.actorType === "assistant" ? "blink" : "person"}
                      size="md"
                    />
                  ) : null}
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

export function SimpleDocumentList({
  documents,
  emptyTitle,
  emptyBody,
}: {
  documents: Array<{
    id: string;
    title: string;
    summary: string;
    visibilityLabel?: string | null;
    status?: string | null;
    updatedAt?: string;
  }>;
  emptyTitle: string;
  emptyBody: string;
}) {
  if (documents.length === 0) {
    return <StudioEmptyState title={emptyTitle} body={emptyBody} />;
  }

  return (
    <div className="space-y-3">
      {documents.map((document) => (
        <Link
          key={document.id}
          href={`/documents/${document.id}`}
          className="block rounded-xl border border-border/80 bg-card px-4 py-4 transition-colors hover:bg-muted/30"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-foreground">{document.title}</p>
              <p className="mt-1 text-sm text-muted-foreground">{document.summary}</p>
              {document.updatedAt ? (
                <p className="mt-2 text-xs text-muted-foreground">{formatDate(document.updatedAt)}</p>
              ) : null}
            </div>
            {document.visibilityLabel ? (
              <Badge variant={badgeVariantForStatus(document.visibilityLabel)}>
                {document.visibilityLabel}
              </Badge>
            ) : document.status ? (
              <Badge variant={badgeVariantForStatus(document.status)}>{document.status}</Badge>
            ) : null}
          </div>
        </Link>
      ))}
    </div>
  );
}

export function DetailsTabs({
  description,
  initialMessage,
  currentStateText,
  currentStateFields,
  participants,
  allOperations,
  pendingOperations,
  embeddedDocuments,
  sourceData,
}: {
  description: string;
  initialMessage: string;
  currentStateText: string;
  currentStateFields: DemoFieldRecord[];
  participants: DemoParticipantRecord[];
  allOperations: DemoOperationRecord[];
  pendingOperations: DemoOperationRecord[];
  embeddedDocuments: DemoEmbeddedDocumentRecord[];
  sourceData: Record<string, unknown> | string;
}) {
  return (
    <Tabs defaultValue="description" className="gap-4">
      <TabsList variant="line" className="flex-wrap justify-start">
        <TabsTrigger value="description">Description</TabsTrigger>
        <TabsTrigger value="initial-message">Initial message</TabsTrigger>
        <TabsTrigger value="current-state">Current state</TabsTrigger>
        <TabsTrigger value="participants">Participants</TabsTrigger>
        <TabsTrigger value="all-operations">All operations</TabsTrigger>
        <TabsTrigger value="pending-operations">Pending operations</TabsTrigger>
        <TabsTrigger value="embedded-documents">Embedded documents</TabsTrigger>
        <TabsTrigger value="source">Source</TabsTrigger>
      </TabsList>

      <TabsContent value="description">
        {description ? (
          <Card>
            <CardContent className="pt-5">
              <p className="max-w-4xl text-sm leading-7 text-foreground">{description}</p>
            </CardContent>
          </Card>
        ) : (
          <StudioEmptyState title="No description available" body="This document does not have a long-form description yet." />
        )}
      </TabsContent>

      <TabsContent value="initial-message">
        {initialMessage ? (
          <Card>
            <CardContent className="pt-5">
              <p className="max-w-4xl text-sm leading-7 text-foreground">{initialMessage}</p>
            </CardContent>
          </Card>
        ) : (
          <StudioEmptyState title="No initial message available" body="This document does not have an opening request recorded." />
        )}
      </TabsContent>

      <TabsContent value="current-state" className="space-y-4">
        {currentStateText ? (
          <Card>
            <CardContent className="space-y-4 pt-5">
              <p className="max-w-4xl text-sm leading-7 text-foreground">{currentStateText}</p>
              <CoreFieldsPanel title="State snapshot" fields={currentStateFields} />
            </CardContent>
          </Card>
        ) : (
          <StudioEmptyState title="No current state available" body="State details will appear here when available." />
        )}
      </TabsContent>

      <TabsContent value="participants">
        <ParticipantsList participants={participants} />
      </TabsContent>

      <TabsContent value="all-operations">
        <OperationsPanel
          operations={allOperations}
          emptyTitle="No operations listed"
          emptyBody="All available operations will appear here."
        />
      </TabsContent>

      <TabsContent value="pending-operations">
        <OperationsPanel
          operations={pendingOperations}
          emptyTitle="No pending operations"
          emptyBody="Nothing currently needs a direct operation from this surface."
        />
      </TabsContent>

      <TabsContent value="embedded-documents">
        <EmbeddedDocumentsList items={embeddedDocuments} />
      </TabsContent>

      <TabsContent value="source">
        <Card>
          <CardContent className="pt-5">
            <pre className="overflow-x-auto rounded-xl border bg-muted/40 p-4 text-xs leading-6 text-foreground">
              {typeof sourceData === "string" ? sourceData : JSON.stringify(sourceData, null, 2)}
            </pre>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}

export function SettingsPanels({
  documentTitle,
  documentId,
  visibilityLabel,
  owner,
  participantCount,
  typeLabel,
  shareSettings,
  services,
  onShareEnabledChange,
  onPublicVisibilityChange,
  onAddShareEntry,
  onToggleService,
}: {
  documentTitle: string;
  documentId: string;
  visibilityLabel: string;
  owner: string;
  participantCount: number;
  typeLabel: string;
  shareSettings: DemoShareSettings | null;
  services: DemoServiceConnectionRecord[];
  onShareEnabledChange: (enabled: boolean) => void;
  onPublicVisibilityChange: (enabled: boolean) => void;
  onAddShareEntry: (type: DemoShareRecord["type"], name: string) => void;
  onToggleService: (serviceId: string) => void;
}) {
  const [shareMode, setShareMode] = useState<"account" | "document">("account");
  const [query, setQuery] = useState("");
  const [shareInput, setShareInput] = useState("");

  const filteredEntries = useMemo(() => {
    const entries = shareSettings?.entries ?? [];
    const normalized = query.trim().toLowerCase();
    return entries.filter((entry) => {
      if (entry.type !== shareMode) return false;
      if (!normalized) return true;
      return (
        entry.name.toLowerCase().includes(normalized) ||
        (entry.subtitle ?? "").toLowerCase().includes(normalized) ||
        (entry.agreement ?? "").toLowerCase().includes(normalized)
      );
    });
  }, [query, shareMode, shareSettings?.entries]);

  return (
    <Tabs defaultValue="main" className="gap-4">
      <TabsList variant="line">
        <TabsTrigger value="main">Main</TabsTrigger>
        <TabsTrigger value="share">Share</TabsTrigger>
        <TabsTrigger value="services">Services</TabsTrigger>
      </TabsList>

      <TabsContent value="main">
        <Card>
          <CardContent className="space-y-4 pt-5">
            <CoreFieldsPanel
              title="Document settings"
              fields={[
                { label: "Title", value: documentTitle },
                { label: "Reference", value: documentId },
                { label: "Visibility", value: visibilityLabel },
                { label: "Owner", value: owner },
                { label: "Participants", value: `${participantCount}` },
                { label: "Type", value: typeLabel },
              ]}
            />
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="share">
        <div className="space-y-4">
          <Card>
            <CardContent className="grid gap-4 pt-5 md:grid-cols-2">
              <div className="rounded-xl border px-4 py-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-foreground">Share with others</p>
                    <p className="mt-2 text-sm text-muted-foreground">
                      When off, this document is only available to you and current core participants.
                    </p>
                  </div>
                  <Switch
                    checked={shareSettings?.shareWithOthers ?? false}
                    onCheckedChange={(checked) => onShareEnabledChange(Boolean(checked))}
                  />
                </div>
              </div>

              <div className="rounded-xl border px-4 py-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-foreground">Make public</p>
                    <p className="mt-2 text-sm text-muted-foreground">
                      Every user will have read-only access when public visibility is enabled.
                    </p>
                  </div>
                  <Switch
                    checked={shareSettings?.makePublic ?? false}
                    onCheckedChange={(checked) => onPublicVisibilityChange(Boolean(checked))}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="space-y-4 pt-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-foreground">Agreements to access</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Manage account and document-level access relationships for this document.
                  </p>
                </div>
                <Tabs value={shareMode} onValueChange={(value) => setShareMode(value as "account" | "document")}>
                  <TabsList className="h-8">
                    <TabsTrigger value="account">Accounts</TabsTrigger>
                    <TabsTrigger value="document">Documents</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>

              <div className="flex flex-col gap-3 lg:flex-row">
                <div className="relative flex-1">
                  <SearchIcon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Search"
                    className="pl-9"
                    disabled={!shareSettings?.shareWithOthers}
                  />
                </div>
                <Input
                  value={shareInput}
                  onChange={(event) => setShareInput(event.target.value)}
                  placeholder={shareMode === "account" ? "alice@freshbites.example" : "Fresh Bites / Orders"}
                  disabled={!shareSettings?.shareWithOthers}
                  className="lg:max-w-xs"
                />
                <Button
                  disabled={!shareSettings?.shareWithOthers || shareInput.trim().length === 0}
                  onClick={() => {
                    onAddShareEntry(shareMode, shareInput.trim());
                    setShareInput("");
                  }}
                >
                  Share
                </Button>
              </div>

              {filteredEntries.length === 0 ? (
                <StudioEmptyState
                  title="No share relationships"
                  body="Use the controls above to add account or document access relationships."
                />
              ) : (
                <div className="overflow-hidden rounded-xl border border-border/80">
                  <div className="grid grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)_auto] gap-3 bg-muted/40 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                    <span>{shareMode === "account" ? "Participant" : "Document"}</span>
                    <span>Agreement</span>
                    <span>Status</span>
                  </div>
                  {filteredEntries.map((entry) => (
                    <div
                      key={entry.id}
                      className="grid grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)_auto] gap-3 border-t border-border/80 px-4 py-3"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-foreground">{entry.name}</p>
                        <p className="truncate text-xs text-muted-foreground">{entry.subtitle ?? "Access relationship"}</p>
                      </div>
                      <p className="truncate text-sm text-primary">{entry.agreement ?? "Direct access"}</p>
                      <Badge variant={badgeVariantForStatus(entry.status)}>{entry.status ?? "active"}</Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </TabsContent>

      <TabsContent value="services">
        {services.length === 0 ? (
          <StudioEmptyState title="No services connected" body="Connected and available services will appear here." />
        ) : (
          <div className="space-y-3">
            {services.map((service) => (
              <Card key={service.id}>
                <CardContent className="flex flex-col gap-4 pt-5 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-semibold text-foreground">{service.name}</p>
                      <Badge variant={badgeVariantForStatus(service.status)}>{service.status}</Badge>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">{service.provider}</p>
                    <p className="mt-2 text-sm text-muted-foreground">{service.description}</p>
                  </div>
                  <Button size="sm" variant="outline" onClick={() => onToggleService(service.id)}>
                    {service.status === "connected" ? "Disconnect" : "Connect"}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </TabsContent>
    </Tabs>
  );
}
