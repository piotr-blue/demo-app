"use client";

import { DefaultChatTransport } from "ai";
import type { FileUIPart, UIMessage } from "ai";
import { useChat } from "@ai-sdk/react";
import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import { Message, MessageContent, MessageResponse } from "@/components/ai-elements/message";
import {
  PromptInput,
  PromptInputActionAddAttachments,
  PromptInputActionMenu,
  PromptInputActionMenuContent,
  PromptInputActionMenuTrigger,
  PromptInputBody,
  PromptInputFooter,
  PromptInputSubmit,
  PromptInputTextarea,
} from "@/components/ai-elements/prompt-input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { getMessageText } from "@/lib/chat/message-utils";
import { buildSnapshotDiffs } from "@/lib/dsl/diff";
import {
  clearLocalWorkspaceStorage,
  writeSelectedTab,
} from "@/lib/storage/local-storage";
import {
  clearWorkspacePersistence,
  listFileBlobs,
  readWorkspace,
  saveFileBlob,
  saveWorkspace,
} from "@/lib/storage/indexeddb";
import {
  createActivity,
  createBootstrapEvent,
  createWorkspace,
  withInspectorTab,
} from "@/lib/workspace/state";
import type {
  ChannelBindingDraft,
  InspectorTab,
  StoredAttachment,
  UserCredentials,
  WorkspaceState,
} from "@/lib/workspace/types";
import { useEffect, useMemo, useRef, useState } from "react";

const INSPECTOR_TABS: Array<{ key: InspectorTab; label: string }> = [
  { key: "overview", label: "Overview" },
  { key: "blueprint", label: "Blueprint" },
  { key: "dsl", label: "DSL" },
  { key: "bindings", label: "Bindings" },
  { key: "bootstrap", label: "Bootstrap" },
  { key: "document", label: "Document" },
  { key: "changes", label: "Changes" },
  { key: "activity", label: "Activity" },
];

function formatJson(value: unknown): string {
  return JSON.stringify(value ?? null, null, 2);
}

function nowId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

async function filePartToBlob(file: FileUIPart): Promise<Blob> {
  const response = await fetch(file.url);
  return response.blob();
}

export function WorkspaceShell({
  credentials,
  workspaceId,
  onLogout,
}: {
  credentials: UserCredentials;
  workspaceId: string;
  onLogout: () => void;
}) {
  const [workspace, setWorkspace] = useState<WorkspaceState | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const pendingQuestionRef = useRef<string | null>(null);

  const chat = useChat({
    transport: new DefaultChatTransport({
      api: "/api/chat",
    }),
    id: workspaceId,
    onData: (part) => {
      setWorkspace((previous) => {
        if (!previous) {
          return previous;
        }

        const data = part.data as Record<string, unknown>;

        if (part.type === "data-blueprint-question") {
          const question = String(data.question ?? "").trim();
          pendingQuestionRef.current = question;
          return {
            ...previous,
            phase: "blueprint-chat",
            activityFeed: [
              ...previous.activityFeed,
              createActivity("assistant-message", "Blueprint question", question),
            ],
          };
        }

        if (part.type === "data-blueprint-ready") {
          const blueprint = String(data.blueprint ?? "").trim();
          return {
            ...previous,
            phase: "blueprint-ready",
            currentBlueprint: blueprint,
            blueprintVersions: [
              ...previous.blueprintVersions,
              {
                id: nowId("bp"),
                createdAt: new Date().toISOString(),
                source: "model",
                content: blueprint,
              },
            ],
            activityFeed: [
              ...previous.activityFeed,
              createActivity("blueprint", "Blueprint ready"),
            ],
          };
        }

        if (part.type === "data-blueprint-error") {
          const message = String(data.message ?? "Unknown blueprint error");
          return {
            ...previous,
            phase: "error",
            errorMessage: message,
            activityFeed: [...previous.activityFeed, createActivity("error", "Blueprint error", message)],
          };
        }

        return previous;
      });
    },
  });

  useEffect(() => {
    void (async () => {
      const existing = await readWorkspace(workspaceId);
      const next = existing ?? createWorkspace(workspaceId, credentials);
      if (!existing) {
        await saveWorkspace(next);
      }
      setWorkspace(next);
      chat.setMessages(next.messages);
      setLoading(false);
    })();
  }, [chat, credentials, workspaceId]);

  useEffect(() => {
    setWorkspace((previous) =>
      previous ? { ...previous, messages: chat.messages as UIMessage[] } : previous
    );
  }, [chat.messages]);

  useEffect(() => {
    if (!workspace) {
      return;
    }
    void saveWorkspace(workspace);
  }, [workspace]);

  useEffect(() => {
    if (!workspace) {
      return;
    }
    writeSelectedTab(workspace.selectedInspectorTab);
  }, [workspace?.selectedInspectorTab, workspace]);

  const handlePromptSubmit = async (prompt: { text: string; files: FileUIPart[] }) => {
    if (!workspace || busy) {
      return;
    }

    setBusy(true);
    try {
      const extractedAttachments: StoredAttachment[] = [];

      for (const filePart of prompt.files) {
        const blob = await filePartToBlob(filePart);
        const file = new File([blob], filePart.filename ?? "attachment", {
          type: filePart.mediaType ?? "application/octet-stream",
        });

        const formData = new FormData();
        formData.set("file", file);

        const extractResponse = await fetch("/api/files/extract", {
          method: "POST",
          body: formData,
        });

        if (!extractResponse.ok) {
          throw new Error("Failed to extract uploaded file text.");
        }

        const extracted = (await extractResponse.json()) as {
          extractedText: string;
          contextLabel: string;
          fileName: string;
          mimeType: string;
          size: number;
        };

        const attachmentId = nowId("att");
        const nextAttachment: StoredAttachment = {
          id: attachmentId,
          name: extracted.fileName,
          mimeType: extracted.mimeType,
          size: extracted.size,
          contextLabel: extracted.contextLabel,
          extractedText: extracted.extractedText,
          createdAt: new Date().toISOString(),
        };

        extractedAttachments.push(nextAttachment);

        await saveFileBlob({
          id: attachmentId,
          workspaceId: workspace.id,
          name: extracted.fileName,
          mimeType: extracted.mimeType,
          blob,
          createdAt: new Date().toISOString(),
        });
      }

      const nextAttachments = [...workspace.attachments, ...extractedAttachments];

      const nextQaPairs = pendingQuestionRef.current
        ? [
            ...workspace.qaPairs,
            {
              question: pendingQuestionRef.current,
              answer: prompt.text,
            },
          ]
        : workspace.qaPairs;

      pendingQuestionRef.current = null;

      setWorkspace({
        ...workspace,
        attachments: nextAttachments,
        qaPairs: nextQaPairs,
        activityFeed: [
          ...workspace.activityFeed,
          createActivity("user-message", "User message", prompt.text),
          ...extractedAttachments.map((attachment) =>
            createActivity("user-message", "File attached", attachment.name)
          ),
        ],
      });

      await chat.sendMessage(
        {
          text: prompt.text,
        },
        {
          body: {
            credentials,
            attachments: nextAttachments,
            currentBlueprint: workspace.currentBlueprint,
            qaPairs: nextQaPairs,
          },
        }
      );
    } finally {
      setBusy(false);
    }
  };

  const handleGenerateDsl = async () => {
    if (!workspace?.currentBlueprint || busy) {
      return;
    }

    setBusy(true);
    setWorkspace({
      ...workspace,
      phase: "dsl-generating",
      selectedInspectorTab: "dsl",
      activityFeed: [...workspace.activityFeed, createActivity("dsl", "Generating DSL")],
    });

    try {
      const response = await fetch("/api/dsl/continue", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          credentials,
          blueprint: workspace.currentBlueprint,
          attachments: workspace.attachments,
        }),
      });

      const payload = (await response.json()) as
        | {
            ok: true;
            repaired: boolean;
            dsl: string;
            structure: unknown;
            documentJson: Record<string, unknown>;
            bindings: ChannelBindingDraft[];
          }
        | { ok: false; error: string };

      if (!payload.ok) {
        throw new Error(payload.error);
      }

      setWorkspace((previous) => {
        if (!previous) {
          return previous;
        }
        return {
          ...previous,
          phase: "binding-review",
          selectedInspectorTab: "bindings",
          currentDsl: payload.dsl,
          currentDocumentJson: payload.documentJson,
          dslVersions: [
            ...previous.dslVersions,
            {
              id: nowId("dsl"),
              createdAt: new Date().toISOString(),
              source: payload.repaired ? "repair" : "model",
              content: payload.dsl,
            },
          ],
          compileStatus: {
            ok: true,
            checkedAt: new Date().toISOString(),
            diagnostics: [
              {
                id: nowId("diag"),
                createdAt: new Date().toISOString(),
                level: "info",
                message: payload.repaired
                  ? "Compile succeeded after one repair pass."
                  : "Compile succeeded.",
              },
            ],
          },
          channelBindings: payload.bindings,
          activityFeed: [
            ...previous.activityFeed,
            createActivity("dsl", "DSL ready"),
            createActivity("compile", "Compile succeeded"),
          ],
        };
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to generate DSL.";
      setWorkspace((previous) =>
        previous
          ? {
              ...previous,
              phase: "error",
              errorMessage: message,
              activityFeed: [...previous.activityFeed, createActivity("error", "DSL generation error", message)],
            }
          : previous
      );
    } finally {
      setBusy(false);
    }
  };

  const handleBindingChange = (
    channelName: string,
    field: "mode" | "value" | "timelineId",
    value: string
  ) => {
    setWorkspace((previous) => {
      if (!previous) {
        return previous;
      }

      return {
        ...previous,
        channelBindings: previous.channelBindings.map((binding) =>
          binding.channelName === channelName
            ? {
                ...binding,
                [field]: value,
              }
            : binding
        ),
      };
    });
  };

  const beginPolling = async (sessionId: string) => {
    for (let index = 0; index < 120; index += 1) {
      await new Promise((resolve) => setTimeout(resolve, 1_000));

      const response = await fetch("/api/myos/retrieve", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          credentials,
          sessionId,
        }),
      });

      if (!response.ok) {
        continue;
      }

      const payload = (await response.json()) as {
        ok: boolean;
        retrieved: Record<string, unknown>;
      };

      if (!payload.ok) {
        continue;
      }

      setWorkspace((previous) => {
        if (!previous) {
          return previous;
        }

        const retrieved = payload.retrieved;
        const document = (retrieved.document ?? null) as unknown;
        const allowedOperations = Array.isArray(retrieved.allowedOperations)
          ? retrieved.allowedOperations.map((entry) => String(entry))
          : [];
        const processingStatus =
          typeof retrieved.processingStatus === "string"
            ? retrieved.processingStatus
            : typeof retrieved.status === "string"
              ? retrieved.status
              : "";
        const lastSnapshot = previous.documentSnapshots.at(-1)?.document ?? null;
        const diffs = buildSnapshotDiffs(lastSnapshot, document);
        const snapshot = {
          id: nowId("snap"),
          createdAt: new Date().toISOString(),
          document,
          allowedOperations,
          diffs,
        };

        const running =
          allowedOperations.length > 0 ||
          /running/i.test(processingStatus) ||
          (typeof document === "object" && document !== null);

        const bootstrapStatus = [
          ...previous.bootstrapStatus,
          createBootstrapEvent(
            running ? "document-running" : "waiting-for-document",
            running
              ? "Document is running and operations are available."
              : "Waiting for document to become runnable..."
          ),
        ];

        return {
          ...previous,
          phase: running ? "document-running" : previous.phase,
          documentSnapshots: [...previous.documentSnapshots, snapshot],
          documentId: (retrieved.documentId as string | undefined) ?? previous.documentId,
          bootstrapStatus,
          activityFeed: [
            ...previous.activityFeed,
            createActivity("document", running ? "Document running" : "Document snapshot updated"),
          ],
        };
      });

      const latestState = await readWorkspace(workspaceId);
      if (latestState?.phase === "document-running") {
        break;
      }
    }
  };

  const handleBootstrap = async () => {
    if (!workspace?.currentDocumentJson || busy) {
      return;
    }

    const invalidBinding = workspace.channelBindings.find((binding) => !binding.value.trim());
    if (invalidBinding) {
      setWorkspace({
        ...workspace,
        errorMessage: `Binding value required for ${invalidBinding.channelName}.`,
        phase: "error",
      });
      return;
    }

    setBusy(true);
    setWorkspace({
      ...workspace,
      phase: "bootstrapping",
      selectedInspectorTab: "bootstrap",
      bootstrapStatus: [
        ...workspace.bootstrapStatus,
        createBootstrapEvent("bootstrap-submitted", "Bootstrap request submitted."),
      ],
      finalBindings: workspace.channelBindings,
      activityFeed: [...workspace.activityFeed, createActivity("bootstrap", "Bootstrap submitted")],
    });

    try {
      const response = await fetch("/api/myos/bootstrap", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          credentials,
          documentJson: workspace.currentDocumentJson,
          bindings: workspace.channelBindings,
        }),
      });
      const payload = (await response.json()) as
        | { ok: true; sessionId: string | null; bootstrap: Record<string, unknown> }
        | { ok: false; error: string };

      if (!payload.ok) {
        throw new Error(payload.error);
      }
      if (!payload.sessionId) {
        throw new Error("Bootstrap response did not include a sessionId.");
      }

      setWorkspace((previous) =>
        previous
          ? {
              ...previous,
              sessionId: payload.sessionId,
              bootstrapStatus: [
                ...previous.bootstrapStatus,
                createBootstrapEvent("session-created", `Session created: ${payload.sessionId}`),
              ],
              activityFeed: [
                ...previous.activityFeed,
                createActivity("bootstrap", "Session created", payload.sessionId ?? undefined),
              ],
            }
          : previous
      );

      await beginPolling(payload.sessionId);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Bootstrap failed.";
      setWorkspace((previous) =>
        previous
          ? {
              ...previous,
              phase: "error",
              errorMessage: message,
              bootstrapStatus: [
                ...previous.bootstrapStatus,
                createBootstrapEvent("error", message),
              ],
              activityFeed: [...previous.activityFeed, createActivity("error", "Bootstrap error", message)],
            }
          : previous
      );
    } finally {
      setBusy(false);
    }
  };

  const openAttachment = async (attachmentId: string) => {
    if (!workspace) {
      return;
    }
    const blobs = await listFileBlobs(workspace.id);
    const found = blobs.find((entry) => entry.id === attachmentId);
    if (!found) {
      return;
    }
    const url = URL.createObjectURL(found.blob);
    window.open(url, "_blank", "noopener,noreferrer");
    setTimeout(() => URL.revokeObjectURL(url), 5_000);
  };

  const handleHardLogout = async () => {
    if (workspace) {
      await clearWorkspacePersistence(workspace.id);
    }
    clearLocalWorkspaceStorage();
    onLogout();
  };

  const latestSnapshot = workspace?.documentSnapshots.at(-1);

  const chatMessages = useMemo(() => chat.messages as UIMessage[], [chat.messages]);

  if (loading || !workspace) {
    return <div className="flex min-h-screen items-center justify-center">Loading workspace…</div>;
  }

  return (
    <div className="grid min-h-screen grid-cols-12 gap-4 bg-background p-4">
      <section className="col-span-7 flex h-[calc(100vh-2rem)] flex-col rounded-xl border">
        <header className="flex items-center justify-between border-b px-4 py-3">
          <div>
            <h1 className="font-semibold text-lg">Blue Studio</h1>
            <p className="text-muted-foreground text-xs">
              Phase: <span className="font-medium">{workspace.phase}</span>
            </p>
          </div>
          <Button variant="outline" onClick={handleHardLogout}>
            Log out
          </Button>
        </header>

        <Conversation className="min-h-0">
          <ConversationContent>
            {workspace.attachments.length > 0 && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Context files</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  {workspace.attachments.map((attachment) => (
                    <button
                      key={attachment.id}
                      className="block text-left text-primary underline-offset-4 hover:underline"
                      onClick={() => void openAttachment(attachment.id)}
                      type="button"
                    >
                      {attachment.name}{" "}
                      <span className="text-muted-foreground">({attachment.contextLabel})</span>
                    </button>
                  ))}
                </CardContent>
              </Card>
            )}

            {chatMessages.map((message) => (
              <Message key={message.id} from={message.role}>
                <MessageContent>
                  <MessageResponse>{getMessageText(message)}</MessageResponse>
                </MessageContent>
              </Message>
            ))}
          </ConversationContent>
          <ConversationScrollButton />
        </Conversation>

        <div className="border-t p-3">
          {workspace.phase === "blueprint-ready" && (
            <div className="mb-3 flex items-center justify-between rounded-lg border p-3 text-sm">
              <div>
                <p className="font-medium">Blueprint is ready.</p>
                <p className="text-muted-foreground">Continue to generate JS/TS DSL.</p>
              </div>
              <Button disabled={busy} onClick={handleGenerateDsl}>
                Continue
              </Button>
            </div>
          )}

          {workspace.phase === "binding-review" && (
            <Card className="mb-3">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Review channel bindings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {workspace.channelBindings.map((binding) => (
                  <div className="grid grid-cols-12 gap-2" key={binding.channelName}>
                    <div className="col-span-3 flex items-center font-mono text-xs">
                      {binding.channelName}
                    </div>
                    <div className="col-span-2 flex gap-2">
                      <Button
                        size="sm"
                        type="button"
                        variant={binding.mode === "email" ? "default" : "outline"}
                        onClick={() => handleBindingChange(binding.channelName, "mode", "email")}
                      >
                        email
                      </Button>
                      <Button
                        size="sm"
                        type="button"
                        variant={binding.mode === "accountId" ? "default" : "outline"}
                        onClick={() => handleBindingChange(binding.channelName, "mode", "accountId")}
                      >
                        accountId
                      </Button>
                    </div>
                    <Input
                      className="col-span-4"
                      value={binding.value}
                      onChange={(event) =>
                        handleBindingChange(binding.channelName, "value", event.target.value)
                      }
                    />
                    <Input
                      className="col-span-3"
                      placeholder="timelineId (optional)"
                      value={binding.timelineId ?? ""}
                      onChange={(event) =>
                        handleBindingChange(binding.channelName, "timelineId", event.target.value)
                      }
                    />
                  </div>
                ))}

                <div className="flex justify-end">
                  <Button disabled={busy} onClick={handleBootstrap}>
                    OK — bootstrap
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          <PromptInput
            onSubmit={(message) => void handlePromptSubmit(message)}
            className="w-full"
            maxFiles={12}
          >
            <PromptInputBody>
              <PromptInputTextarea placeholder="Send a message..." disabled={busy} />
            </PromptInputBody>
            <PromptInputFooter>
              <PromptInputActionMenu>
                <PromptInputActionMenuTrigger />
                <PromptInputActionMenuContent>
                  <PromptInputActionAddAttachments />
                </PromptInputActionMenuContent>
              </PromptInputActionMenu>
              <PromptInputSubmit status={chat.status} disabled={busy} onStop={() => void chat.stop()} />
            </PromptInputFooter>
          </PromptInput>
        </div>
      </section>

      <section className="col-span-5 h-[calc(100vh-2rem)] rounded-xl border">
        <header className="flex flex-wrap gap-2 border-b p-3">
          {INSPECTOR_TABS.map((tab) => (
            <Button
              key={tab.key}
              size="sm"
              type="button"
              variant={workspace.selectedInspectorTab === tab.key ? "default" : "outline"}
              onClick={() =>
                setWorkspace((previous) =>
                  previous ? withInspectorTab(previous, tab.key) : previous
                )
              }
            >
              {tab.label}
            </Button>
          ))}
        </header>

        <div className="h-[calc(100%-56px)] overflow-hidden">
          {INSPECTOR_TABS.map((tab) => (
            <div
              key={tab.key}
              className={workspace.selectedInspectorTab === tab.key ? "h-full overflow-auto p-4" : "hidden"}
            >
              {tab.key === "overview" && (
                <div className="space-y-3 text-sm">
                  <p>
                    <span className="font-medium">Phase:</span> {workspace.phase}
                  </p>
                  <p>
                    <span className="font-medium">Session ID:</span>{" "}
                    <span className="font-mono text-xs">{workspace.sessionId ?? "—"}</span>
                  </p>
                  <p>
                    <span className="font-medium">Document ID:</span>{" "}
                    <span className="font-mono text-xs">{workspace.documentId ?? "—"}</span>
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {(latestSnapshot?.allowedOperations ?? []).map((operation) => (
                      <Badge key={operation} variant="secondary">
                        {operation}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {tab.key === "blueprint" && (
                <pre className="rounded-lg border bg-muted/30 p-3 font-mono text-xs whitespace-pre-wrap">
                  {workspace.currentBlueprint ?? "No blueprint yet."}
                </pre>
              )}

              {tab.key === "dsl" && (
                <div className="space-y-3">
                  <pre className="rounded-lg border bg-muted/30 p-3 font-mono text-xs whitespace-pre-wrap">
                    {workspace.currentDsl ?? "No DSL generated yet."}
                  </pre>
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm">Compile status</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm">
                      <p>{workspace.compileStatus?.ok ? "Success" : "Not compiled"}</p>
                      {workspace.compileStatus?.diagnostics.map((diag) => (
                        <p key={diag.id} className="font-mono text-xs">
                          [{diag.level}] {diag.message}
                        </p>
                      ))}
                    </CardContent>
                  </Card>
                </div>
              )}

              {tab.key === "bindings" && (
                <pre className="rounded-lg border bg-muted/30 p-3 font-mono text-xs whitespace-pre-wrap">
                  {formatJson({
                    draft: workspace.channelBindings,
                    final: workspace.finalBindings,
                  })}
                </pre>
              )}

              {tab.key === "bootstrap" && (
                <div className="space-y-2">
                  {workspace.bootstrapStatus.length === 0 && (
                    <p className="text-sm text-muted-foreground">No bootstrap activity yet.</p>
                  )}
                  {workspace.bootstrapStatus.map((event) => (
                    <Card key={event.id}>
                      <CardContent className="pt-4 text-sm">
                        <p className="font-medium">{event.phase}</p>
                        <p className="text-muted-foreground">{event.message}</p>
                        <p className="font-mono text-xs text-muted-foreground">{event.createdAt}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}

              {tab.key === "document" && (
                <pre className="rounded-lg border bg-muted/30 p-3 font-mono text-xs whitespace-pre-wrap">
                  {formatJson(latestSnapshot?.document ?? null)}
                </pre>
              )}

              {tab.key === "changes" && (
                <pre className="rounded-lg border bg-muted/30 p-3 font-mono text-xs whitespace-pre-wrap">
                  {formatJson(latestSnapshot?.diffs ?? [])}
                </pre>
              )}

              {tab.key === "activity" && (
                <div className="space-y-2">
                  {workspace.activityFeed.map((item) => (
                    <Card key={item.id}>
                      <CardContent className="pt-4 text-sm">
                        <p className="font-medium">{item.title}</p>
                        {item.detail && <p className="text-muted-foreground">{item.detail}</p>}
                        <p className="font-mono text-xs text-muted-foreground">{item.createdAt}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
