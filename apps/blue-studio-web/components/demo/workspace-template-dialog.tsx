"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useDemoApp } from "@/components/demo/demo-provider";
import { listWorkspaceTemplates } from "@/lib/demo/workspace-templates";
import type { WorkspaceTemplateKey } from "@/lib/demo/types";
import { PlusIcon } from "lucide-react";

export function WorkspaceTemplateDialog({
  buttonClassName,
  compact = false,
  tooltipLabel,
}: {
  buttonClassName?: string;
  compact?: boolean;
  tooltipLabel?: string;
}) {
  const router = useRouter();
  const { createWorkspace } = useDemoApp();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const templates = listWorkspaceTemplates();
  const [templateKey, setTemplateKey] = useState<WorkspaceTemplateKey>("shop");
  const [workspaceName, setWorkspaceName] = useState("My Workspace");
  const triggerButton = (
    <Button
      className={buttonClassName}
      size={compact ? "icon" : "default"}
      variant={compact ? "outline" : "default"}
    >
      <PlusIcon />
      <span className={compact ? "sr-only" : ""}>New workspace</span>
    </Button>
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          compact && tooltipLabel ? (
            <Tooltip>
              <TooltipTrigger>{triggerButton}</TooltipTrigger>
              <TooltipContent side="right">{tooltipLabel}</TooltipContent>
            </Tooltip>
          ) : (
            triggerButton
          )
        }
      />
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Create workspace</DialogTitle>
          <DialogDescription>
            Start from a static template. Workspace is created immediately and bootstrap runs in background.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="workspace-name">Workspace name</Label>
            <Input
              id="workspace-name"
              value={workspaceName}
              onChange={(event) => setWorkspaceName(event.target.value)}
              placeholder="Workspace name"
            />
          </div>

          <div className="grid gap-2.5">
            {templates.map((template) => (
              <button
                key={template.key}
                type="button"
                className={`rounded-xl text-left transition-all ${
                  templateKey === template.key
                    ? "ring-2 ring-accent-base/30 shadow-[var(--shadow-card)]"
                    : "hover:ring-1 hover:ring-border-soft"
                }`}
                onClick={() => {
                  setTemplateKey(template.key);
                  if (!workspaceName.trim()) {
                    setWorkspaceName(`${template.name} Workspace`);
                  }
                }}
              >
                <Card size="sm" className={templateKey === template.key ? "border-accent-base/20" : ""}>
                  <CardContent className="space-y-1 pt-4">
                    <p className="font-semibold text-foreground">
                      <span className="mr-2">{template.icon}</span>
                      {template.name}
                    </p>
                    <p className="text-body">{template.description}</p>
                  </CardContent>
                </Card>
              </button>
            ))}
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            disabled={busy}
            onClick={async () => {
              setBusy(true);
              const workspaceId = await createWorkspace({
                templateKey,
                workspaceName: workspaceName.trim() || "My Workspace",
              });
              setBusy(false);
              if (!workspaceId) {
                return;
              }
              setOpen(false);
              router.push(`/workspaces/${encodeURIComponent(workspaceId)}`);
            }}
          >
            {busy ? "Creating..." : "Create workspace"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
