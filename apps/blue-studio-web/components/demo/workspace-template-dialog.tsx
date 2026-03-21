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
import { useDemoApp } from "@/components/demo/demo-provider";
import { listWorkspaceTemplates } from "@/lib/demo/workspace-templates";
import type { WorkspaceTemplateKey } from "@/lib/demo/types";

export function WorkspaceTemplateDialog({
  buttonClassName,
}: {
  buttonClassName?: string;
}) {
  const router = useRouter();
  const { createWorkspace } = useDemoApp();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const templates = listWorkspaceTemplates();
  const [templateKey, setTemplateKey] = useState<WorkspaceTemplateKey>("shop");
  const [workspaceName, setWorkspaceName] = useState("My Workspace");

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button className={buttonClassName}>New workspace</Button>} />
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Create workspace</DialogTitle>
          <DialogDescription>
            Start from a static template. Workspace is created immediately and bootstrap runs in background.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="space-y-2">
            <Label htmlFor="workspace-name">Workspace name</Label>
            <Input
              id="workspace-name"
              value={workspaceName}
              onChange={(event) => setWorkspaceName(event.target.value)}
              placeholder="Workspace name"
            />
          </div>

          <div className="grid gap-2">
            {templates.map((template) => (
              <button
                key={template.key}
                type="button"
                className={`rounded-lg text-left ${templateKey === template.key ? "ring-2 ring-primary/50" : ""}`}
                onClick={() => {
                  setTemplateKey(template.key);
                  if (!workspaceName.trim()) {
                    setWorkspaceName(`${template.name} Workspace`);
                  }
                }}
              >
                <Card className="border-border/70 bg-card/80">
                  <CardContent className="space-y-1 pt-4">
                    <p className="font-medium">
                      <span className="mr-2">{template.icon}</span>
                      {template.name}
                    </p>
                    <p className="text-muted-foreground text-sm">{template.description}</p>
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
