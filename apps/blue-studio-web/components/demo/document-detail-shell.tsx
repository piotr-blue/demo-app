"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  ArrowLeftIcon,
  CircleAlertIcon,
  HistoryIcon,
  ListTodoIcon,
  MessageSquareIcon,
  PanelRightOpenIcon,
  Settings2Icon,
  StarIcon,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ConversationPanelV2 } from "@/components/demo/conversation-panel-v2";
import { useDemoApp } from "@/components/demo/demo-provider";
import {
  getConversationPlaybook,
  getDocumentAnchorsForViewer,
  getDocumentConversation,
  getDocumentViewerAccess,
  getNeedsActionForDocument,
  getTasksForDocument,
  getVisibleDocumentsForAnchor,
} from "@/lib/demo/selectors";
import type { DocumentRecord } from "@/lib/demo/types";
import { StudioEmptyState, StudioPageHeader, StudioSectionCard } from "@/components/studio/studio-primitives";

function formatDate(value: string) {
  return new Date(value).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

type DocumentNavKey =
  | "chat-ui"
  | "details"
  | "activity"
  | "needs-action"
  | "tasks"
  | "settings"
  | `anchor:${string}`;

export function DocumentDetailShell({
  document,
  backHref,
  backLabel,
}: {
  document: DocumentRecord;
  backHref: string;
  backLabel: string;
}) {
  const { snapshot, activeAccount, runDocumentAction, toggleFavorite } = useDemoApp();
  const [busyActionId, setBusyActionId] = useState<string | null>(null);
  const [anchorQuery, setAnchorQuery] = useState("");

  const viewerAccountId = activeAccount?.id ?? document.ownerAccountId;
  const conversation = useMemo(
    () => (snapshot ? getDocumentConversation(snapshot, document.id, viewerAccountId) : null),
    [document.id, snapshot, viewerAccountId]
  );
  const playbook = useMemo(
    () =>
      snapshot
        ? getConversationPlaybook(snapshot, "document", document.id, viewerAccountId)
        : null,
    [document.id, snapshot, viewerAccountId]
  );
  const tasks = useMemo(
    () => (snapshot ? getTasksForDocument(snapshot, document.id, viewerAccountId) : []),
    [document.id, snapshot, viewerAccountId]
  );
  const needsAction = useMemo(
    () => (snapshot ? getNeedsActionForDocument(snapshot, document.id, viewerAccountId) : []),
    [document.id, snapshot, viewerAccountId]
  );
  const anchors = useMemo(
    () => (snapshot ? getDocumentAnchorsForViewer(snapshot, document.id, viewerAccountId) : []),
    [document.id, snapshot, viewerAccountId]
  );
  const viewerAccess = useMemo(
    () => (snapshot ? getDocumentViewerAccess(snapshot, document.id, viewerAccountId) : "none"),
    [document.id, snapshot, viewerAccountId]
  );

  const navItems: Array<{
    key: DocumentNavKey;
    label: string;
    icon?: React.ComponentType<{ className?: string }>;
  }> = [
    { key: "chat-ui", label: "Chat / UI", icon: MessageSquareIcon },
    { key: "details", label: "Details", icon: PanelRightOpenIcon },
    { key: "activity", label: "Activity", icon: HistoryIcon },
    ...(needsAction.length > 0
      ? [{ key: "needs-action" as const, label: "Needs Action", icon: CircleAlertIcon }]
      : []),
    ...(tasks.length > 0 ? [{ key: "tasks" as const, label: "Tasks", icon: ListTodoIcon }] : []),
    ...anchors.map((anchor) => ({ key: `anchor:${anchor.id}` as const, label: anchor.label })),
    { key: "settings", label: "Settings", icon: Settings2Icon },
  ];

  const [activeNavKey, setActiveNavKey] = useState<DocumentNavKey>("chat-ui");
  const activeAnchor = activeNavKey.startsWith("anchor:")
    ? anchors.find((anchor) => anchor.id === activeNavKey.slice("anchor:".length))
    : null;

  const anchorDocuments = useMemo(() => {
    if (!snapshot || !activeAnchor) {
      return [];
    }
    const docs = getVisibleDocumentsForAnchor(snapshot, document.id, activeAnchor.id, viewerAccountId);
    const query = anchorQuery.trim().toLowerCase();
    if (!query) {
      return docs;
    }
    return docs.filter(
      (entry) =>
        entry.title.toLowerCase().includes(query) ||
        entry.summary.toLowerCase().includes(query)
    );
  }, [activeAnchor, anchorQuery, document.id, snapshot, viewerAccountId]);

  return (
    <section className="grid gap-4 lg:grid-cols-[220px_minmax(0,1fr)]">
      <aside>
        <Card className="h-[calc(100vh-140px)]">
          <CardContent className="space-y-4 pt-4">
            <div className="rounded-lg border bg-muted/20 px-3 py-4 text-center">
              <p className="text-sm font-semibold">{document.title}</p>
              <p className="mt-1 text-xs text-muted-foreground">{document.typeLabel ?? document.kind}</p>
            </div>
            <nav className="space-y-1">
              {navItems.map((item) => (
                <button
                  key={item.key}
                  type="button"
                  className={`flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                    activeNavKey === item.key
                      ? "bg-primary text-primary-foreground"
                      : "text-foreground hover:bg-muted"
                  }`}
                  onClick={() => setActiveNavKey(item.key)}
                >
                  <span className="flex items-center gap-2.5">
                    {item.icon ? <item.icon className="size-4" /> : null}
                    <span>{item.label}</span>
                  </span>
                  {item.key === "needs-action" && needsAction.length > 0 ? (
                    <Badge variant="secondary">{needsAction.length}</Badge>
                  ) : null}
                </button>
              ))}
            </nav>
          </CardContent>
        </Card>
      </aside>

      <div className="space-y-4">
        <StudioPageHeader
          eyebrow="Document"
          title={document.title}
          description={document.summary}
          actions={
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => void toggleFavorite(document.id)}>
                <StarIcon
                  className={`size-3.5 ${
                    document.starredByAccountIds.includes(viewerAccountId) ? "fill-current" : ""
                  }`}
                />
                {document.starredByAccountIds.includes(viewerAccountId) ? "Starred" : "Star"}
              </Button>
              <Button variant="outline" size="sm" render={<Link href={backHref} />}>
                <ArrowLeftIcon className="size-3.5" />
                {backLabel}
              </Button>
            </div>
          }
          meta={
            <>
              <Badge variant="secondary">{document.typeLabel ?? document.kind}</Badge>
              <Badge variant={document.isPublic ? "secondary" : "outline"}>{document.visibilityLabel}</Badge>
              <Badge variant="outline">{viewerAccess}</Badge>
              <Badge variant={document.isService ? "default" : "outline"}>{document.status}</Badge>
            </>
          }
        />

        {activeNavKey === "chat-ui" ? (
          <div className="space-y-4">
            <StudioSectionCard title="Document summary" subtitle="Shared truth + viewer context">
              <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
                <Card>
                  <CardContent className="space-y-3 pt-5">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="outline">{document.owner}</Badge>
                      {document.participants.map((participant) => (
                        <Badge key={participant} variant="secondary">
                          {participant}
                        </Badge>
                      ))}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {document.oneLineSummary ?? document.summary}
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="space-y-2 pt-5">
                    <h3 className="text-sm font-semibold">Core fields</h3>
                    {document.coreFields.map((entry) => (
                      <div
                        key={`${document.id}_${entry.label}`}
                        className="flex items-center justify-between gap-3 text-sm"
                      >
                        <span className="text-muted-foreground">{entry.label}</span>
                        <span>{entry.value}</span>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>
            </StudioSectionCard>

            {document.uiCards.length > 0 ? (
              <StudioSectionCard title="Available actions" subtitle="Viewer-specific actions on this document">
                <div className="space-y-3">
                  {document.uiCards.map((card) => (
                    <Card key={card.id}>
                      <CardContent className="space-y-3 pt-5">
                        <p className="text-sm font-semibold">{card.title}</p>
                        <p className="text-sm text-muted-foreground">{card.body}</p>
                        <div className="flex flex-wrap gap-2">
                          {(card.actions ?? []).map((entry) => (
                            <Button
                              key={entry.id}
                              size="sm"
                              variant="outline"
                              disabled={busyActionId === entry.id}
                              onClick={async () => {
                                setBusyActionId(entry.id);
                                await runDocumentAction(document.id, entry.id);
                                setBusyActionId(null);
                              }}
                            >
                              {busyActionId === entry.id ? "Applying…" : entry.label}
                            </Button>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </StudioSectionCard>
            ) : null}

            {tasks.length > 0 ? (
              <StudioSectionCard title="Pending tasks" subtitle="Tasks attached to this document">
                <div className="space-y-3">
                  {tasks.map((task) => (
                    <Link
                      key={task.id}
                      href={`/threads/${task.id}`}
                      className="block rounded-lg border bg-card px-4 py-4 transition-colors hover:bg-muted/30"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-sm font-semibold text-foreground">{task.title}</p>
                        <Badge variant="outline">{task.status}</Badge>
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground">{task.summary}</p>
                      <p className="mt-2 text-xs text-muted-foreground">{task.responsibleSummary}</p>
                    </Link>
                  ))}
                </div>
              </StudioSectionCard>
            ) : null}

            {needsAction.length > 0 ? (
              <StudioSectionCard title="Pending asks / needs action" subtitle="Structured queue for the current viewer">
                <div className="space-y-3">
                  {needsAction.map((item) => (
                    <div key={item.id} className="rounded-lg border bg-card px-4 py-4">
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-sm font-semibold text-foreground">{item.title}</p>
                        <Badge variant={item.priority === "high" ? "destructive" : "outline"}>
                          {item.priority}
                        </Badge>
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground">{item.body}</p>
                    </div>
                  ))}
                </div>
              </StudioSectionCard>
            ) : null}

            <StudioSectionCard
              title="Chat history"
              subtitle="Viewer-specific Blink narrative on top of the shared document state"
            >
              <div className="h-[520px]">
                <ConversationPanelV2
                  conversationId={conversation?.id ?? null}
                  assistantName="Blink"
                  title={`${document.title} · ${document.owner}`}
                  fullHeight
                />
              </div>
              {playbook ? (
                <p className="mt-3 text-xs text-muted-foreground">Playbook: {playbook.identityMarkdown}</p>
              ) : null}
            </StudioSectionCard>
          </div>
        ) : null}

        {activeNavKey === "details" ? (
          <StudioSectionCard title="Details" subtitle="Power-user factual detail view">
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardContent className="space-y-3 pt-5">
                  <h3 className="text-sm font-semibold">Document facts</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between gap-3">
                      <span className="text-muted-foreground">ID</span>
                      <span>{document.id}</span>
                    </div>
                    <div className="flex justify-between gap-3">
                      <span className="text-muted-foreground">Type</span>
                      <span>{document.typeLabel ?? document.kind}</span>
                    </div>
                    <div className="flex justify-between gap-3">
                      <span className="text-muted-foreground">Owner</span>
                      <span>{document.owner}</span>
                    </div>
                    <div className="flex justify-between gap-3">
                      <span className="text-muted-foreground">Visibility</span>
                      <span>{document.visibilityLabel}</span>
                    </div>
                    <div className="flex justify-between gap-3">
                      <span className="text-muted-foreground">Access mode</span>
                      <span>{viewerAccess}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
              {document.detailBlocks.map((block) => (
                <Card key={block.id}>
                  <CardContent className="space-y-3 pt-5">
                    <h3 className="text-sm font-semibold">{block.title}</h3>
                    {block.items.map((item) => (
                      <div key={`${block.id}_${item.label}`} className="flex justify-between gap-3 text-sm">
                        <span className="text-muted-foreground">{item.label}</span>
                        <span>{item.value}</span>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              ))}
            </div>
          </StudioSectionCard>
        ) : null}

        {activeNavKey === "activity" ? (
          <StudioSectionCard title="Activity" subtitle="Chronological audit log">
            <div className="space-y-3">
              {document.activity.length === 0 ? (
                <StudioEmptyState title="No activity yet" body="Document timeline entries will appear here." />
              ) : (
                document.activity.map((entry) => (
                  <div key={entry.id} className="rounded-lg border bg-card px-4 py-4">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-semibold text-foreground">{entry.title}</p>
                      <Badge variant="outline">{entry.kind}</Badge>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">{entry.detail}</p>
                    <p className="mt-2 text-xs text-muted-foreground">{formatDate(entry.createdAt)}</p>
                  </div>
                ))
              )}
            </div>
          </StudioSectionCard>
        ) : null}

        {activeNavKey === "needs-action" ? (
          <StudioSectionCard title="Needs Action" subtitle="Structured queue for this document only">
            <div className="space-y-3">
              {needsAction.map((item) => (
                <div key={item.id} className="rounded-lg border bg-card px-4 py-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold text-foreground">{item.title}</p>
                    <Badge variant={item.priority === "high" ? "destructive" : "outline"}>
                      {item.priority}
                    </Badge>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">{item.body}</p>
                  <p className="mt-2 text-xs text-muted-foreground">{formatDate(item.createdAt)}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {(item.availableActionLabels ?? []).map((label) => (
                      <Button key={label} size="sm" variant="outline">
                        {label}
                      </Button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </StudioSectionCard>
        ) : null}

        {activeNavKey === "tasks" ? (
          <StudioSectionCard title="Tasks" subtitle="Task documents attached to this document">
            <div className="space-y-3">
              {tasks.map((task) => (
                <Link
                  key={task.id}
                  href={`/threads/${task.id}`}
                  className="block rounded-lg border bg-card px-4 py-4 transition-colors hover:bg-muted/30"
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold text-foreground">{task.title}</p>
                    <Badge variant="outline">{task.status}</Badge>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">{task.summary}</p>
                </Link>
              ))}
            </div>
          </StudioSectionCard>
        ) : null}

        {activeAnchor ? (
          <StudioSectionCard title={activeAnchor.label} subtitle="Linked documents filtered for the current viewer">
            <div className="mb-3">
              <Input
                value={anchorQuery}
                onChange={(event) => setAnchorQuery(event.target.value)}
                placeholder={`Search ${activeAnchor.label.toLowerCase()}...`}
                className="max-w-sm"
              />
            </div>
            <div className="space-y-3">
              {anchorDocuments.length === 0 ? (
                <StudioEmptyState
                  title="No visible linked documents"
                  body="Nothing in this anchor matches the current viewer or search."
                />
              ) : (
                anchorDocuments.map((entry) => (
                  <Link
                    key={entry.id}
                    href={`/documents/${entry.id}`}
                    className="block rounded-lg border bg-card px-4 py-4 transition-colors hover:bg-muted/30"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-semibold text-foreground">{entry.title}</p>
                      <Badge variant="outline">{entry.status}</Badge>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">{entry.summary}</p>
                    <p className="mt-2 text-xs text-muted-foreground">{formatDate(entry.updatedAt)}</p>
                  </Link>
                ))
              )}
            </div>
          </StudioSectionCard>
        ) : null}

        {activeNavKey === "settings" ? (
          <StudioSectionCard
            title="Settings"
            subtitle="Sharing, participants, access grants, and service/task relationships"
          >
            <div className="grid gap-4 md:grid-cols-2">
              {document.settingsBlocks.map((block) => (
                <Card key={block.id}>
                  <CardContent className="space-y-3 pt-5">
                    <h3 className="text-sm font-semibold">{block.title}</h3>
                    {block.items.map((item) => (
                      <div key={`${block.id}_${item.label}`} className="flex justify-between gap-3 text-sm">
                        <span className="text-muted-foreground">{item.label}</span>
                        <span>{item.value}</span>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              ))}
              <Card>
                <CardContent className="space-y-3 pt-5">
                  <h3 className="text-sm font-semibold">Raw details</h3>
                  <pre className="overflow-auto rounded-lg border bg-muted/20 p-3 text-xs text-muted-foreground">
                    {JSON.stringify(document.details, null, 2)}
                  </pre>
                </CardContent>
              </Card>
            </div>
          </StudioSectionCard>
        ) : null}
      </div>
    </section>
  );
}
