"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  ArrowLeftIcon,
  CircleAlertIcon,
  HistoryIcon,
  Link2Icon,
  ListTodoIcon,
  MessageSquareIcon,
  PanelRightOpenIcon,
  Settings2Icon,
  StarIcon,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ConversationPanelV2 } from "@/components/demo/conversation-panel-v2";
import {
  ActivityTimeline,
  AnchorDocumentBrowser,
  CoreFieldsPanel,
  DetailsTabs,
  DocumentSummaryPanel,
  NeedsYouList,
  OperationsPanel,
  SettingsPanels,
  TaskList,
} from "@/components/demo/demo-surface-components";
import { useDemoApp } from "@/components/demo/demo-provider";
import {
  getDocumentActivity,
  getDocumentAllOperations,
  getDocumentAnchorsForViewer,
  getDocumentConversation,
  getDocumentCurrentStateFields,
  getDocumentCurrentStateText,
  getDocumentDescription,
  getDocumentEmbeddedDocuments,
  getDocumentInitialMessage,
  getDocumentParticipants,
  getDocumentPendingOperations,
  getDocumentServices,
  getDocumentShareSettings,
  getDocumentSourceData,
  getDocumentViewerAccess,
  getNeedsActionForDocument,
  getTasksForDocument,
  getVisibleDocumentsForAnchor,
} from "@/lib/demo/selectors";
import type { DocumentRecord } from "@/lib/demo/types";
import { StudioPageHeader, StudioSectionCard } from "@/components/studio/studio-primitives";

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
  const {
    snapshot,
    activeAccount,
    runDocumentAction,
    toggleFavorite,
    setDocumentShareEnabled,
    setDocumentPublicVisibility,
    addDocumentShareEntry,
    toggleDocumentService,
  } = useDemoApp();
  const [busyActionId, setBusyActionId] = useState<string | null>(null);

  const viewerAccountId = activeAccount?.id ?? document.ownerAccountId;
  const conversation = useMemo(
    () => (snapshot ? getDocumentConversation(snapshot, document.id, viewerAccountId) : null),
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
  const detailsDescription = useMemo(
    () => (snapshot ? getDocumentDescription(snapshot, document.id) : document.summary),
    [document.id, document.summary, snapshot]
  );
  const initialMessage = useMemo(
    () => (snapshot ? getDocumentInitialMessage(snapshot, document.id) : ""),
    [document.id, snapshot]
  );
  const currentStateText = useMemo(
    () => (snapshot ? getDocumentCurrentStateText(snapshot, document.id) : ""),
    [document.id, snapshot]
  );
  const currentStateFields = useMemo(
    () => (snapshot ? getDocumentCurrentStateFields(snapshot, document.id) : document.coreFields.slice(0, 4)),
    [document.coreFields, document.id, snapshot]
  );
  const participants = useMemo(
    () => (snapshot ? getDocumentParticipants(snapshot, document.id) : []),
    [document.id, snapshot]
  );
  const allOperations = useMemo(
    () => (snapshot ? getDocumentAllOperations(snapshot, document.id) : []),
    [document.id, snapshot]
  );
  const pendingOperations = useMemo(
    () => (snapshot ? getDocumentPendingOperations(snapshot, document.id, viewerAccountId) : []),
    [document.id, snapshot, viewerAccountId]
  );
  const embeddedDocuments = useMemo(
    () => (snapshot ? getDocumentEmbeddedDocuments(snapshot, document.id, viewerAccountId) : []),
    [document.id, snapshot, viewerAccountId]
  );
  const shareSettings = useMemo(
    () => (snapshot ? getDocumentShareSettings(snapshot, document.id) : null),
    [document.id, snapshot]
  );
  const services = useMemo(
    () => (snapshot ? getDocumentServices(snapshot, document.id) : []),
    [document.id, snapshot]
  );
  const activity = useMemo(
    () => (snapshot ? getDocumentActivity(snapshot, document.id, viewerAccountId) : document.activity),
    [document.activity, document.id, snapshot, viewerAccountId]
  );
  const sourceData = useMemo(
    () => (snapshot ? getDocumentSourceData(snapshot, document.id) : document.details),
    [document.details, document.id, snapshot]
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
    { key: "chat-ui", label: "UI", icon: MessageSquareIcon },
    { key: "details", label: "Details", icon: PanelRightOpenIcon },
    { key: "activity", label: "Activity", icon: HistoryIcon },
    ...(needsAction.length > 0
      ? [{ key: "needs-action" as const, label: "Needs You", icon: CircleAlertIcon }]
      : []),
    ...(tasks.length > 0 ? [{ key: "tasks" as const, label: "Tasks", icon: ListTodoIcon }] : []),
    ...anchors.map((anchor) => ({
      key: `anchor:${anchor.id}` as const,
      label: anchor.label,
      icon: Link2Icon,
    })),
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
    return getVisibleDocumentsForAnchor(snapshot, document.id, activeAnchor.id, viewerAccountId);
  }, [activeAnchor, document.id, snapshot, viewerAccountId]);

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
              <Link href={backHref}>
                <Button variant="outline" size="sm">
                  <ArrowLeftIcon className="size-3.5" />
                  {backLabel}
                </Button>
              </Link>
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
              <div className="space-y-4">
                <DocumentSummaryPanel
                  title={document.title}
                  summary={document.oneLineSummary ?? document.summary}
                  chips={[
                    document.typeLabel ?? document.kind,
                    document.status,
                    document.visibilityLabel ?? (document.isPublic ? "Public" : "Private"),
                  ]}
                  ownerLine={`Owner: ${document.owner} • Participants: ${participants.map((entry) => entry.name).join(", ")}`}
                />
                <CoreFieldsPanel fields={document.coreFields} />
              </div>
            </StudioSectionCard>

            <StudioSectionCard title="Available operations" subtitle="What can be done next from this document">
              <OperationsPanel
                operations={allOperations}
                busyActionId={busyActionId}
                onRunAction={async (actionId) => {
                  setBusyActionId(actionId);
                  await runDocumentAction(document.id, actionId);
                  setBusyActionId(null);
                }}
              />
            </StudioSectionCard>

            <StudioSectionCard title="Needs You preview" subtitle="The first items that still need the current viewer">
              <NeedsYouList
                items={needsAction}
                limit={3}
                onViewAll={() => setActiveNavKey("needs-action")}
                viewAllLabel="View all Needs You"
              />
            </StudioSectionCard>

            <StudioSectionCard title="Tasks preview" subtitle="The most relevant task documents attached to this document">
              <TaskList
                tasks={tasks}
                limit={3}
                onViewAll={() => setActiveNavKey("tasks")}
                viewAllLabel="View all tasks"
              />
            </StudioSectionCard>

            <StudioSectionCard
              title="Conversation"
              subtitle="Talk with Blink about this document without leaving the document surface"
            >
              <div className="h-[520px]">
                <ConversationPanelV2
                  conversationId={conversation?.id ?? null}
                  assistantName="Blink"
                  title={`${document.title} · ${document.owner}`}
                  target={{ type: "document", id: document.id }}
                  fullHeight
                />
              </div>
            </StudioSectionCard>
          </div>
        ) : null}

        {activeNavKey === "details" ? (
          <StudioSectionCard title="Details" subtitle="Structured, human-readable detail for this document">
            <DetailsTabs
              description={detailsDescription}
              initialMessage={initialMessage}
              currentStateText={currentStateText}
              currentStateFields={currentStateFields}
              participants={participants}
              allOperations={allOperations}
              pendingOperations={pendingOperations}
              embeddedDocuments={embeddedDocuments}
              sourceData={sourceData}
            />
          </StudioSectionCard>
        ) : null}

        {activeNavKey === "activity" ? (
          <StudioSectionCard title="Activity" subtitle="Read-only timeline of what happened around this document">
            <ActivityTimeline activity={activity} />
          </StudioSectionCard>
        ) : null}

        {activeNavKey === "needs-action" ? (
          <StudioSectionCard title="Needs You" subtitle="Everything on this document that still needs the current viewer">
            <NeedsYouList items={needsAction} />
          </StudioSectionCard>
        ) : null}

        {activeNavKey === "tasks" ? (
          <StudioSectionCard title="Tasks" subtitle="Task documents attached to this document">
            <TaskList tasks={tasks} />
          </StudioSectionCard>
        ) : null}

        {activeAnchor ? (
          <StudioSectionCard title={activeAnchor.label} subtitle="Linked documents filtered for the current viewer">
            <AnchorDocumentBrowser
              title={activeAnchor.label}
              documents={anchorDocuments.map((entry) => ({
                id: entry.id,
                title: entry.title,
                summary: entry.summary,
                status: entry.status,
                updatedAt: entry.updatedAt,
              }))}
            />
          </StudioSectionCard>
        ) : null}

        {activeNavKey === "settings" ? (
          <StudioSectionCard
            title="Settings"
            subtitle="Main settings, sharing controls, and connected services for this document"
          >
            <SettingsPanels
              documentTitle={document.title}
              documentId={document.id}
              visibilityLabel={document.visibilityLabel ?? (document.isPublic ? "Public" : "Private")}
              owner={document.owner}
              participantCount={participants.length}
              typeLabel={document.typeLabel ?? document.kind}
              shareSettings={shareSettings}
              services={services}
              onShareEnabledChange={(enabled) => void setDocumentShareEnabled(document.id, enabled)}
              onPublicVisibilityChange={(enabled) => void setDocumentPublicVisibility(document.id, enabled)}
              onAddShareEntry={(type, name) => void addDocumentShareEntry(document.id, type, name)}
              onToggleService={(serviceId) => void toggleDocumentService(document.id, serviceId)}
            />
          </StudioSectionCard>
        ) : null}
      </div>
    </section>
  );
}
