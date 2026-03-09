"use client";

import { useMemo, useState } from "react";
import {
  PromptInputActionMenu,
  PromptInputActionMenuContent,
  PromptInputActionMenuItem,
  PromptInputActionMenuTrigger,
  usePromptInputAttachments,
} from "@/components/ai-elements/prompt-input";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { createSyntheticReferenceFile } from "@/lib/document/reference/synthetic-file";
import {
  getAttachableWorkspaceCandidates,
  type AttachableWorkspaceCandidate,
} from "@/lib/document/reference/workspace-picker";
import { listWorkspaces } from "@/lib/storage/indexeddb";
import type {
  DocumentReferenceSourceType,
} from "@/lib/document/reference/reference";
import type { UserCredentials } from "@/lib/workspace/types";

interface RenderReferenceResponse {
  ok: boolean;
  fileName?: string;
  text?: string;
  contextLabel?: string;
  sourceMeta?: Record<string, unknown>;
  error?: string;
}

interface FetchExternalResponse {
  ok: boolean;
  sourceType?: DocumentReferenceSourceType;
  content?: string;
  sourceMeta?: Record<string, unknown>;
  error?: string;
}

async function renderReferenceFile(params: {
  credentials: UserCredentials;
  sourceType: DocumentReferenceSourceType;
  content: string;
  threadTitle?: string;
  sessionId: string;
}): Promise<{ fileName: string; text: string }> {
  const response = await fetch("/api/document/reference/render", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(params),
  });
  const payload = (await response.json()) as RenderReferenceResponse;
  if (!response.ok || !payload.ok || !payload.fileName || !payload.text) {
    throw new Error(payload.error ?? "Failed to render document reference.");
  }
  return {
    fileName: payload.fileName,
    text: payload.text,
  };
}

export function AttachSourceMenu({
  credentials,
  currentWorkspaceId,
  disabled,
  onError,
}: {
  credentials: UserCredentials;
  currentWorkspaceId: string;
  disabled: boolean;
  onError: (message: string) => void;
}) {
  const attachments = usePromptInputAttachments();
  const [workspaceDialogOpen, setWorkspaceDialogOpen] = useState(false);
  const [externalDialogOpen, setExternalDialogOpen] = useState(false);
  const [loadingWorkspaces, setLoadingWorkspaces] = useState(false);
  const [attaching, setAttaching] = useState(false);
  const [workspaceQuery, setWorkspaceQuery] = useState("");
  const [workspaceCandidates, setWorkspaceCandidates] = useState<
    AttachableWorkspaceCandidate[]
  >([]);
  const [externalSessionId, setExternalSessionId] = useState("");
  const [externalDisplayName, setExternalDisplayName] = useState("");

  const filteredCandidates = useMemo(() => {
    const query = workspaceQuery.trim().toLowerCase();
    if (!query) {
      return workspaceCandidates;
    }
    return workspaceCandidates.filter((candidate) =>
      [candidate.threadTitle, candidate.threadSummary, candidate.sessionId]
        .join(" ")
        .toLowerCase()
        .includes(query)
    );
  }, [workspaceCandidates, workspaceQuery]);

  const loadWorkspaceCandidates = async () => {
    setLoadingWorkspaces(true);
    try {
      const allWorkspaces = await listWorkspaces();
      const candidates = getAttachableWorkspaceCandidates({
        workspaces: allWorkspaces,
        currentWorkspaceId,
      });
      setWorkspaceCandidates(candidates);
    } finally {
      setLoadingWorkspaces(false);
    }
  };

  const handleAttachWorkspaceDocument = async (candidate: AttachableWorkspaceCandidate) => {
    setAttaching(true);
    try {
      const rendered = await renderReferenceFile({
        credentials,
        sourceType: "blueprint",
        content: candidate.blueprint,
        threadTitle: candidate.threadTitle,
        sessionId: candidate.sessionId,
      });
      const file = createSyntheticReferenceFile({
        fileName: rendered.fileName,
        text: rendered.text,
      });
      attachments.add([file]);
      setWorkspaceDialogOpen(false);
      setWorkspaceQuery("");
    } catch (error) {
      onError(error instanceof Error ? error.message : "Failed to attach workspace document.");
    } finally {
      setAttaching(false);
    }
  };

  const handleAttachExternalSession = async () => {
    setAttaching(true);
    try {
      const response = await fetch("/api/document/reference/fetch-external", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          credentials,
          sessionId: externalSessionId.trim(),
          displayName: externalDisplayName.trim() || undefined,
        }),
      });
      const payload = (await response.json()) as FetchExternalResponse;
      if (!response.ok || !payload.ok || !payload.sourceType || !payload.content) {
        throw new Error(payload.error ?? "Failed to fetch external MyOS session.");
      }

      const rendered = await renderReferenceFile({
        credentials,
        sourceType: payload.sourceType,
        content: payload.content,
        threadTitle: externalDisplayName.trim() || undefined,
        sessionId: externalSessionId.trim(),
      });
      const file = createSyntheticReferenceFile({
        fileName: rendered.fileName,
        text: rendered.text,
      });
      attachments.add([file]);
      setExternalDialogOpen(false);
      setExternalSessionId("");
      setExternalDisplayName("");
    } catch (error) {
      onError(error instanceof Error ? error.message : "Failed to attach external MyOS session.");
    } finally {
      setAttaching(false);
    }
  };

  return (
    <>
      <PromptInputActionMenu>
        <PromptInputActionMenuTrigger aria-label="Attachment sources" disabled={disabled} />
        <PromptInputActionMenuContent>
          <PromptInputActionMenuItem
            onClick={() => attachments.openFileDialog()}
            onSelect={(event) => {
              event.preventDefault();
            }}
          >
            Upload file
          </PromptInputActionMenuItem>
          <PromptInputActionMenuItem
            onClick={() => {
              setWorkspaceDialogOpen(true);
              void loadWorkspaceCandidates();
            }}
            onSelect={(event) => {
              event.preventDefault();
            }}
          >
            Attach app document from another thread
          </PromptInputActionMenuItem>
          <PromptInputActionMenuItem
            onClick={() => {
              setExternalDialogOpen(true);
            }}
            onSelect={(event) => {
              event.preventDefault();
            }}
          >
            Attach external MyOS session by sessionId
          </PromptInputActionMenuItem>
        </PromptInputActionMenuContent>
      </PromptInputActionMenu>

      <Dialog open={workspaceDialogOpen} onOpenChange={setWorkspaceDialogOpen}>
        <DialogContent className="max-w-[min(56rem,calc(100%-2rem))] sm:!max-w-2xl">
          <DialogHeader>
            <DialogTitle>Attach app document</DialogTitle>
            <DialogDescription>
              Select another local thread with a bootstrapped session and blueprint.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <Input
              placeholder="Search by title, summary, or sessionId"
              value={workspaceQuery}
              onChange={(event) => setWorkspaceQuery(event.target.value)}
            />
            <div className="max-h-80 space-y-2 overflow-auto rounded-md border p-2">
              {loadingWorkspaces && (
                <p className="text-muted-foreground text-sm">Loading workspaces…</p>
              )}
              {!loadingWorkspaces && filteredCandidates.length === 0 && (
                <p className="text-muted-foreground text-sm">No attachable app documents found.</p>
              )}
              {filteredCandidates.map((candidate) => (
                <div
                  className="space-y-1 rounded border bg-muted/20 p-2"
                  key={candidate.id}
                >
                  <p className="break-words font-medium text-sm">{candidate.threadTitle}</p>
                  <p className="line-clamp-2 break-words text-muted-foreground text-xs">
                    {candidate.threadSummary}
                  </p>
                  <p className="break-all font-mono text-[11px] text-muted-foreground">
                    sessionId: {candidate.sessionId}
                  </p>
                  <div className="flex justify-end">
                    <Button
                      size="sm"
                      type="button"
                      disabled={attaching}
                      onClick={() => void handleAttachWorkspaceDocument(candidate)}
                    >
                      Attach
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={externalDialogOpen} onOpenChange={setExternalDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Attach external MyOS session</DialogTitle>
            <DialogDescription>
              Enter a sessionId to fetch and attach a document reference.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <Input
              placeholder="sessionId"
              value={externalSessionId}
              onChange={(event) => setExternalSessionId(event.target.value)}
            />
            <Input
              placeholder="Display name (optional)"
              value={externalDisplayName}
              onChange={(event) => setExternalDisplayName(event.target.value)}
            />
          </div>
          <DialogFooter>
            <Button
              type="button"
              disabled={attaching || externalSessionId.trim().length === 0}
              onClick={() => void handleAttachExternalSession()}
            >
              Attach
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
