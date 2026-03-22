"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  StudioEmptyState,
  StudioPageHeader,
  StudioSectionCard,
  StudioStatCard,
  StudioToolbar,
} from "@/components/studio/studio-primitives";
import { ActivityIcon, FilterIcon, ListTodoIcon, SearchIcon, SparklesIcon, WorkflowIcon } from "lucide-react";

const demoRows = [
  { id: "w_1", title: "Northwind Ops", type: "workspace", status: "active", owner: "alice@myos" },
  { id: "d_1", title: "Order Review Policy", type: "document", status: "ready", owner: "ops@myos" },
  { id: "t_1", title: "Escalate delayed shipment", type: "thread", status: "in-progress", owner: "piotr@myos" },
];

export default function StudioBenchPage() {
  return (
    <section>
      <StudioPageHeader
        eyebrow="Studio Bench"
        title="Donor Visual Benchmark"
        description="Hidden route used to validate shell, cards, list density, detail surfaces, and settings composition before applying to real MyOS pages."
        actions={<Badge variant="outline">/__studio-bench</Badge>}
      />

      <StudioToolbar>
        <div className="relative min-w-0 flex-1">
          <SearchIcon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search benchmark entities..." className="h-10 pl-9" />
        </div>
        <Button variant="outline" size="sm">
          <FilterIcon className="size-3.5" />
          Filters
        </Button>
        <Button size="sm">
          <SparklesIcon className="size-3.5" />
          Create
        </Button>
      </StudioToolbar>

      <div className="mb-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StudioStatCard label="Open tasks" value={14} icon={<ListTodoIcon className="size-4" />} />
        <StudioStatCard label="Documents" value={26} icon={<WorkflowIcon className="size-4" />} />
        <StudioStatCard label="Activity today" value={42} icon={<ActivityIcon className="size-4" />} />
        <StudioStatCard label="Attention items" value={3} icon={<SparklesIcon className="size-4" />} />
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
        <div className="space-y-5">
          <StudioSectionCard title="List / table styling" subtitle="Compact donor-style row density">
            <div className="space-y-2">
              {demoRows.map((row) => (
                <div key={row.id} className="grid gap-2 rounded-lg border bg-card px-3.5 py-3 md:grid-cols-[1.6fr_0.7fr_0.7fr_1fr] md:items-center">
                  <p className="text-sm font-medium">{row.title}</p>
                  <Badge variant="secondary" className="w-fit">
                    {row.type}
                  </Badge>
                  <Badge variant="outline" className="w-fit">
                    {row.status}
                  </Badge>
                  <p className="text-xs text-muted-foreground">{row.owner}</p>
                </div>
              ))}
            </div>
          </StudioSectionCard>

          <StudioSectionCard title="Task card group" subtitle="Kanban/list card quality check">
            <div className="grid gap-3 md:grid-cols-2">
              {["In Progress", "Blocked"].map((column) => (
                <Card key={column}>
                  <CardContent className="space-y-3 pt-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{column}</p>
                    <div className="space-y-2">
                      <div className="rounded-lg border bg-muted/25 px-3 py-2.5">
                        <p className="text-sm font-medium">Review supplier onboarding packet</p>
                        <p className="mt-1 text-xs text-muted-foreground">Owner: alice · 78% complete</p>
                      </div>
                      <div className="rounded-lg border bg-muted/25 px-3 py-2.5">
                        <p className="text-sm font-medium">Sync escalation playbook with legal</p>
                        <p className="mt-1 text-xs text-muted-foreground">Owner: piotr · 35% complete</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </StudioSectionCard>
        </div>

        <div className="space-y-5">
          <StudioSectionCard title="Detail panel" subtitle="Metadata + actions">
            <div className="space-y-2">
              <div className="grid grid-cols-[120px_1fr] gap-2 rounded-lg border bg-muted/25 px-3 py-2.5 text-sm">
                <span className="text-muted-foreground">Scope</span>
                <span className="font-medium">Northwind Ops</span>
              </div>
              <div className="grid grid-cols-[120px_1fr] gap-2 rounded-lg border bg-muted/25 px-3 py-2.5 text-sm">
                <span className="text-muted-foreground">Status</span>
                <span className="font-medium">active</span>
              </div>
            </div>
          </StudioSectionCard>

          <StudioSectionCard title="Assistant panel" subtitle="Chat surface polish">
            <div className="space-y-2">
              <div className="rounded-lg border bg-muted/20 px-3 py-2.5 text-sm">
                <p className="font-medium">Assistant</p>
                <p className="mt-1 text-muted-foreground">
                  I can summarize this workspace and prepare the next bootstrap steps.
                </p>
              </div>
              <div className="flex gap-2">
                <Input placeholder="Ask the assistant..." />
                <Button size="sm">Send</Button>
              </div>
            </div>
          </StudioSectionCard>

          <StudioSectionCard title="Settings form" subtitle="Admin form styling">
            <Tabs defaultValue="general">
              <TabsList variant="line">
                <TabsTrigger value="general">General</TabsTrigger>
                <TabsTrigger value="notifications">Notifications</TabsTrigger>
              </TabsList>
              <TabsContent value="general" className="space-y-2 pt-2">
                <Input placeholder="Workspace name" defaultValue="Northwind Ops" />
                <Input placeholder="Owner" defaultValue="alice@myos" />
              </TabsContent>
              <TabsContent value="notifications" className="pt-2">
                <StudioEmptyState title="Notification channels not configured yet." />
              </TabsContent>
            </Tabs>
          </StudioSectionCard>
        </div>
      </div>
    </section>
  );
}
