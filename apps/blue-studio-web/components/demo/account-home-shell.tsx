"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ConversationPanelV2 } from "@/components/demo/conversation-panel-v2";
import { NeedsYouList, TaskList } from "@/components/demo/demo-surface-components";
import { useDemoApp } from "@/components/demo/demo-provider";
import {
  getHomeConversation,
  getHomeDocumentsForAccount,
  getHomeNeedsActionForAccount,
  getHomeServicesForAccount,
  getHomeTasksForAccount,
  type HomeSectionKey,
} from "@/lib/demo/selectors";
import { StudioEmptyState, StudioPageHeader, StudioSectionCard } from "@/components/studio/studio-primitives";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  FileTextIcon,
  ListTodoIcon,
  MessageSquareIcon,
  WorkflowIcon,
  CircleAlertIcon,
} from "lucide-react";

const HOME_SECTIONS: Array<{
  key: HomeSectionKey;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  { key: "chat", label: "Chat", icon: MessageSquareIcon },
  { key: "needs-action", label: "Needs You", icon: CircleAlertIcon },
  { key: "tasks", label: "Tasks", icon: ListTodoIcon },
  { key: "documents", label: "Documents", icon: FileTextIcon },
  { key: "services", label: "Services", icon: WorkflowIcon },
];

function formatDate(value: string) {
  return new Date(value).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function resolveSection(input: string | null): HomeSectionKey {
  return (
    HOME_SECTIONS.find((entry) => entry.key === input)?.key ?? "chat"
  );
}

export function AccountHomeShell() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { snapshot, activeAccount, loading } = useDemoApp();
  const [query, setQuery] = useState("");

  const activeSection = resolveSection(searchParams.get("section"));

  const needsAction = useMemo(
    () => (snapshot && activeAccount ? getHomeNeedsActionForAccount(snapshot, activeAccount.id) : []),
    [activeAccount, snapshot]
  );
  const tasks = useMemo(
    () => (snapshot && activeAccount ? getHomeTasksForAccount(snapshot, activeAccount.id) : []),
    [activeAccount, snapshot]
  );
  const documents = useMemo(
    () => (snapshot && activeAccount ? getHomeDocumentsForAccount(snapshot, activeAccount.id) : []),
    [activeAccount, snapshot]
  );
  const services = useMemo(
    () => (snapshot && activeAccount ? getHomeServicesForAccount(snapshot, activeAccount.id) : []),
    [activeAccount, snapshot]
  );
  const conversation = useMemo(
    () => (snapshot && activeAccount ? getHomeConversation(snapshot, activeAccount.id) : null),
    [activeAccount, snapshot]
  );

  if (loading || !snapshot || !activeAccount) {
    return <div className="flex min-h-[40vh] items-center justify-center text-muted-foreground">Loading home…</div>;
  }

  const setSection = (next: HomeSectionKey) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("section", next);
    router.push(`${pathname}?${params.toString()}`);
  };

  const filterText = query.trim().toLowerCase();
  const filteredDocuments = documents.filter((document) =>
    !filterText ||
    document.title.toLowerCase().includes(filterText) ||
    document.summary.toLowerCase().includes(filterText)
  );
  const filteredServices = services.filter((document) =>
    !filterText ||
    document.title.toLowerCase().includes(filterText) ||
    document.summary.toLowerCase().includes(filterText)
  );
  const filteredTasks = tasks.filter((task) =>
    !filterText || task.title.toLowerCase().includes(filterText) || task.summary.toLowerCase().includes(filterText)
  );

  return (
    <section className="grid gap-4 lg:grid-cols-[220px_minmax(0,1fr)]">
      <aside>
        <Card className="h-[calc(100vh-140px)]">
          <CardContent className="space-y-4 pt-4">
            <div className="rounded-lg border bg-muted/20 px-3 py-4 text-center">
              <span className="inline-flex size-12 items-center justify-center rounded-full border bg-background text-sm font-semibold">
                {activeAccount.name.slice(0, 1)}
              </span>
              <p className="mt-3 text-sm font-semibold">{activeAccount.name}</p>
              <p className="mt-1 text-xs text-muted-foreground">{activeAccount.subtitle}</p>
            </div>

            <nav className="space-y-1">
              {HOME_SECTIONS.map((entry) => (
                <button
                  key={entry.key}
                  type="button"
                  className={`flex w-full items-center justify-between gap-2.5 rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                    activeSection === entry.key
                      ? "bg-primary text-primary-foreground"
                      : "text-foreground hover:bg-muted"
                  }`}
                  onClick={() => setSection(entry.key)}
                >
                  <span className="flex items-center gap-2.5">
                    <entry.icon className="size-4" />
                    <span>{entry.label}</span>
                  </span>
                  {entry.key === "needs-action" && needsAction.length > 0 ? (
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
          eyebrow="Home"
          title={activeAccount.name}
          description={activeAccount.description}
          meta={
            <>
              <Badge variant="outline">{activeAccount.accountId}</Badge>
              <Badge variant="outline">{activeAccount.email}</Badge>
            </>
          }
        />

        {activeSection === "chat" ? (
          <div className="h-[calc(100vh-220px)] min-h-[560px]">
            <ConversationPanelV2
              conversationId={conversation?.id ?? null}
              assistantName="Blink"
              title={`${activeAccount.name} Home`}
              fullHeight
            />
          </div>
        ) : null}

        {activeSection !== "chat" ? (
          <div className="flex items-center gap-3">
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={`Search ${activeSection.replace("-", " ")}...`}
              className="max-w-sm"
            />
          </div>
        ) : null}

        {activeSection === "needs-action" ? (
          <StudioSectionCard title="Needs You" subtitle="Structured pending items across accessible documents">
            <NeedsYouList items={needsAction} />
          </StudioSectionCard>
        ) : null}

        {activeSection === "tasks" ? (
          <StudioSectionCard title="Tasks" subtitle="Browsable task documents attached to real documents">
            {filteredTasks.length === 0 ? (
              <StudioEmptyState title="No tasks found" body="Try a different search term." />
            ) : (
              <TaskList tasks={filteredTasks} />
            )}
          </StudioSectionCard>
        ) : null}

        {activeSection === "documents" ? (
          <StudioSectionCard title="Documents" subtitle="All documents accessible to the active account">
            <div className="space-y-3">
              {filteredDocuments.length === 0 ? (
                <StudioEmptyState title="No documents found" body="Try a different search term." />
              ) : (
                filteredDocuments.map((document) => (
                  <Link
                    key={document.id}
                    href={`/documents/${document.id}`}
                    className="block rounded-lg border bg-card px-4 py-4 transition-colors hover:bg-muted/30"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-semibold text-foreground">{document.title}</p>
                      <Badge variant={document.isPublic ? "secondary" : "outline"}>{document.visibilityLabel}</Badge>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">{document.summary}</p>
                    <p className="mt-2 text-xs text-muted-foreground">{formatDate(document.updatedAt)}</p>
                  </Link>
                ))
              )}
            </div>
          </StudioSectionCard>
        ) : null}

        {activeSection === "services" ? (
          <StudioSectionCard title="Services" subtitle="Service offerings and agreements the active account participates in">
            <div className="space-y-3">
              {filteredServices.length === 0 ? (
                <StudioEmptyState title="No services found" body="Try a different search term." />
              ) : (
                filteredServices.map((document) => (
                  <Link
                    key={document.id}
                    href={`/documents/${document.id}`}
                    className="block rounded-lg border bg-card px-4 py-4 transition-colors hover:bg-muted/30"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-semibold text-foreground">{document.title}</p>
                      <Badge>{document.status}</Badge>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">{document.summary}</p>
                    <p className="mt-2 text-xs text-muted-foreground">{document.oneLineSummary}</p>
                  </Link>
                ))
              )}
            </div>
          </StudioSectionCard>
        ) : null}
      </div>
    </section>
  );
}
