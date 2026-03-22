"use client";

import { StudioPageHeader } from "@/components/studio/studio-page-header";
import {
  StudioEmptyState,
  StudioMessageBubble,
  StudioSectionCard,
  StudioStatCard,
  StudioToolbar,
} from "@/components/studio/studio-surfaces";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import {
  BotIcon,
  FilterIcon,
  LayoutDashboardIcon,
  SearchIcon,
  Settings2Icon,
  SparklesIcon,
} from "lucide-react";

const benchRows = [
  { name: "Shared NDA", type: "document", owner: "Blink", status: "awaiting review" },
  { name: "Daily operations triage", type: "thread", owner: "Blink", status: "active" },
  { name: "SMS Provider", type: "service", owner: "Platform", status: "quota warning" },
];

export default function StudioBenchPage() {
  return (
    <section className="studio-page-shell">
      <StudioPageHeader
        eyebrow="Visual benchmark"
        icon={<LayoutDashboardIcon className="size-5" />}
        title="Studio Bench"
        description="A hidden donor-template proving ground for shell, cards, tables, toolbars, and settings surfaces before applying them to real MyOS screens."
        meta={
          <>
            <Badge variant="outline">hidden route</Badge>
            <Badge variant="secondary">Studio Admin donor grammar</Badge>
          </>
        }
        actions={
          <>
            <Button variant="outline" size="sm">
              Export
            </Button>
            <Button size="sm">Primary action</Button>
          </>
        }
      />

      <StudioToolbar>
        <div className="relative min-w-[260px] flex-1">
          <SearchIcon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search records, activity, and settings…" className="pl-9" />
        </div>
        <Button variant="outline" size="sm">
          <FilterIcon className="size-3.5" />
          Filters
        </Button>
        <Button variant="outline" size="sm">
          Secondary
        </Button>
        <Button size="sm">
          <SparklesIcon className="size-3.5" />
          Create item
        </Button>
      </StudioToolbar>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StudioStatCard label="Open work" value="24" detail="Across dashboard, CRM, and detail contexts." />
        <StudioStatCard label="Documents" value="18" detail="Compact donor-style metrics." />
        <StudioStatCard label="Assist replies" value="93%" detail="Intentional assistant surface quality." />
        <StudioStatCard label="Settings blocks" value="7" detail="Structured form and metadata sections." />
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.55fr)_minmax(320px,1fr)]">
        <div className="space-y-4">
          <StudioSectionCard
            eyebrow="Browse"
            title="Table / list benchmark"
            description="A donor-style bordered table section used to validate list density and admin browse ergonomics."
            action={
              <Badge variant="outline" className="h-6 px-2">
                3 rows
              </Badge>
            }
          >
            <div className="overflow-hidden rounded-lg border border-border-soft">
              <Table>
                <TableHeader className="bg-muted/60">
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Owner</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {benchRows.map((row) => (
                    <TableRow key={row.name}>
                      <TableCell className="font-medium text-foreground">{row.name}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">{row.type}</Badge>
                      </TableCell>
                      <TableCell>{row.owner}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{row.status}</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </StudioSectionCard>

          <div className="grid gap-4 lg:grid-cols-2">
            <StudioSectionCard eyebrow="Tasks" title="Operational cards" description="Kanban/list style cards with donor spacing and softer surface density.">
              <div className="space-y-3">
                <div className="studio-list-card">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-medium text-foreground">Partner approvals</p>
                    <Badge variant="outline">62%</Badge>
                  </div>
                  <p className="mt-1 text-body">Route partnership asks into the correct workspace detail surfaces.</p>
                </div>
                <div className="studio-list-card">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-medium text-foreground">Quota monitoring</p>
                    <Badge variant="secondary">warning</Badge>
                  </div>
                  <p className="mt-1 text-body">Intentional cards, not generic demo placeholders.</p>
                </div>
              </div>
            </StudioSectionCard>

            <StudioSectionCard eyebrow="Details" title="Detail panel" description="A benchmark for thread/document detail surfaces and metadata blocks.">
              <div className="space-y-2">
                <div className="studio-meta-row">
                  <span className="text-muted-foreground">Owner</span>
                  <span className="font-medium text-foreground">piotr-blue</span>
                </div>
                <div className="studio-meta-row">
                  <span className="text-muted-foreground">Scope</span>
                  <span className="font-medium text-foreground">Home</span>
                </div>
                <div className="studio-meta-row">
                  <span className="text-muted-foreground">Updated</span>
                  <span className="font-medium text-foreground">Mar 22, 2:11 PM</span>
                </div>
              </div>
            </StudioSectionCard>
          </div>
        </div>

        <div className="space-y-4">
          <StudioSectionCard
            eyebrow="Assistant"
            title="Chat / assistant panel"
            description="A more intentional donor-aligned chat treatment for MyOS assistant surfaces."
            action={<Badge variant="secondary">3 messages</Badge>}
          >
            <div className="space-y-3">
              <StudioMessageBubble role="assistant" text="I reorganized the dashboard shell and now the page grammar looks donor-aligned." />
              <StudioMessageBubble role="user" text="Keep Home, Search, and workspace detail meaning intact while you transplant the shell." />
              <StudioMessageBubble role="assistant" text="Understood — shell first, logic untouched, donor grammar applied consistently." />
              <Textarea rows={4} placeholder="Message the assistant…" />
              <div className="flex justify-end">
                <Button size="sm">
                  <BotIcon className="size-3.5" />
                  Send
                </Button>
              </div>
            </div>
          </StudioSectionCard>

          <StudioSectionCard
            eyebrow="Settings"
            title="Settings form benchmark"
            description="Reference structure for credential forms and operational settings pages."
            action={<Settings2Icon className="size-4 text-muted-foreground" />}
          >
            <div className="space-y-3">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Workspace name</label>
                <Input value="MyOS Demo Workspace" readOnly />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Notes</label>
                <Textarea rows={4} defaultValue="Settings sections should look like a real admin page, not stacked generic cards." />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" size="sm">
                  Cancel
                </Button>
                <Button size="sm">Save changes</Button>
              </div>
            </div>
          </StudioSectionCard>

          <StudioEmptyState
            title="Optional empty-state benchmark"
            description="Used to validate empty screens after the shell is transplanted."
            icon={<SparklesIcon className="size-5" />}
          />
        </div>
      </div>
    </section>
  );
}
