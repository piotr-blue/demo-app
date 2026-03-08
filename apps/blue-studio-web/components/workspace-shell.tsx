"use client";

import { DefaultChatTransport } from "ai";
import type { FileUIPart, UIMessage } from "ai";
import { useChat } from "@ai-sdk/react";
import { useRouter } from "next/navigation";
import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import { Message, MessageContent, MessageResponse } from "@/components/ai-elements/message";
import {
  PromptInput,
  PromptInputAttachments,
  PromptInputBody,
  PromptInputFooter,
  PromptInputSubmit,
  PromptInputTextarea,
} from "@/components/ai-elements/prompt-input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { DocumentAssistantPanel } from "@/components/document-assistant-panel";
import { DocumentStatusPanel } from "@/components/document-status-panel";
import { AttachSourceMenu } from "@/components/attach-source-menu";
import { ThreadSidebar, type ThreadListItem } from "@/components/thread-sidebar";
import {
  chooseDefaultViewer,
  parseBlueprintMetadata,
} from "@/lib/blueprint/metadata";
import { getMessageText } from "@/lib/chat/message-utils";
import { resolveStatusMessage } from "@/lib/document/status-templates/evaluate";
import {
  buildAccountHash,
  clearThreadRoutingStorage,
  clearWebhookRegistration,
  getOrCreateBrowserInstallId,
  readWebhookRegistration,
  writeWebhookRegistration,
} from "@/lib/storage/local-storage";
import {
  clearAllWorkspacePersistence,
  listFileBlobs,
  listWorkspaces,
  readWorkspace,
  saveFileBlob,
  saveWorkspace,
} from "@/lib/storage/indexeddb";
import { createThreadId } from "@/lib/workspace/thread-id";
import { deriveThreadMeta } from "@/lib/workspace/thread-meta";
import { applyRetrievedDocumentRefresh } from "@/lib/workspace/polling";
import {
  createActivity,
  createBootstrapEvent,
  createWorkspace,
  normalizeWorkspaceState,
  withInspectorTab,
} from "@/lib/workspace/state";
import type {
  ChannelBindingDraft,
  DocumentQaMode,
  InspectorTab,
  StoredAttachment,
  StatusTemplateBundle,
  UserCredentials,
  WorkspaceState,
} from "@/lib/workspace/types";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

const INSPECTOR_TABS: Array<{ key: InspectorTab; label: string }> = [
  { key: "overview", label: "Overview" },
  { key: "status", label: "Status" },
  { key: "assistant", label: "Assistant" },
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

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function filePartToBlob(file: FileUIPart): Promise<Blob> {
  const response = await fetch(file.url);
  return response.blob();
}

async function hashText(value: string): Promise<string> {
  if (typeof window !== "undefined" && window.crypto?.subtle) {
    const encoded = new TextEncoder().encode(value);
    const digest = await window.crypto.subtle.digest("SHA-256", encoded);
    return Array.from(new Uint8Array(digest))
      .map((entry) => entry.toString(16).padStart(2, "0"))
      .join("");
  }
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0;
  }
  return String(hash);
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
  const [assistantBusy, setAssistantBusy] = useState(false);
  const [refreshBusy, setRefreshBusy] = useState(false);
  const [templateBusy, setTemplateBusy] = useState(false);
  const [threads, setThreads] = useState<ThreadListItem[]>([]);
  const router = useRouter();
  const pendingQuestionRef = useRef<string | null>(null);
  const lastBlueprintRef = useRef<string | null>(null);
  const liveEventSourceRef = useRef<EventSource | null>(null);
  const liveIdentityRef = useRef<{ browserId: string; accountHash: string } | null>(null);
  const accountHash = useMemo(
    () => buildAccountHash(credentials.myOsBaseUrl, credentials.myOsAccountId),
    [credentials.myOsAccountId, credentials.myOsBaseUrl]
  );

  const { messages, sendMessage, setMessages, status, stop } = useChat({
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
          const next = {
            ...previous,
            phase: "blueprint-chat" as const,
            activityFeed: [
              ...previous.activityFeed,
              createActivity("assistant-message", "Blueprint question", question),
            ],
          };
          const meta = deriveThreadMeta(next);
          return {
            ...next,
            ...meta,
            updatedAt: new Date().toISOString(),
          };
        }

        if (part.type === "data-blueprint-ready") {
          const blueprint = String(data.blueprint ?? "").trim();
          const next = {
            ...previous,
            phase: "blueprint-ready" as const,
            currentBlueprint: blueprint,
            currentDsl: null,
            currentDocumentJson: null,
            compileStatus: null,
            channelBindings: [],
            finalBindings: null,
            sessionId: null,
            documentId: null,
            documentSnapshots: [],
            bootstrapStatus: [],
            blueprintVersions: [
              ...previous.blueprintVersions,
              {
                id: nowId("bp"),
                createdAt: new Date().toISOString(),
                source: "model" as const,
                content: blueprint,
              },
            ],
            activityFeed: [
              ...previous.activityFeed,
              createActivity("blueprint", "Blueprint ready"),
            ],
          };
          const meta = deriveThreadMeta(next);
          return {
            ...next,
            ...meta,
            updatedAt: new Date().toISOString(),
          };
        }

        if (part.type === "data-blueprint-error") {
          const message = String(data.message ?? "Unknown blueprint error");
          const next = {
            ...previous,
            phase: "error" as const,
            errorMessage: message,
            activityFeed: [...previous.activityFeed, createActivity("error", "Blueprint error", message)],
          };
          const meta = deriveThreadMeta(next);
          return {
            ...next,
            ...meta,
            updatedAt: new Date().toISOString(),
          };
        }

        return previous;
      });
    },
  });

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      const existing = await readWorkspace(workspaceId);
      const next = normalizeWorkspaceState(
        existing ?? createWorkspace(workspaceId, credentials)
      );
      if (!existing) {
        await saveWorkspace(next);
      }

      if (cancelled) {
        return;
      }

      setWorkspace(next);
      setMessages(next.messages);
      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [credentials, setMessages, workspaceId]);

  useEffect(() => {
    setWorkspace((previous) =>
      previous
        ? {
            ...previous,
            messages: messages as UIMessage[],
            ...deriveThreadMeta({ ...previous, messages: messages as UIMessage[] }),
            updatedAt: new Date().toISOString(),
          }
        : previous
    );
  }, [messages]);

  useEffect(() => {
    if (loading || !workspace) {
      return;
    }
    void saveWorkspace(workspace);
  }, [loading, workspace]);

  const reloadThreadList = useCallback(async () => {
    const currentWorkspace = workspace;
    if (!currentWorkspace) {
      return;
    }
    const all = await listWorkspaces();
    const mapped = all.map((entry) => ({
      id: entry.id,
      threadTitle: entry.threadTitle,
      threadSummary: entry.threadSummary,
      phase: entry.phase,
      updatedAt: entry.updatedAt,
    }));
    if (!mapped.some((entry) => entry.id === currentWorkspace.id)) {
      mapped.unshift({
        id: currentWorkspace.id,
        threadTitle: currentWorkspace.threadTitle,
        threadSummary: currentWorkspace.threadSummary,
        phase: currentWorkspace.phase,
        updatedAt: currentWorkspace.updatedAt,
      });
    }
    setThreads(mapped.sort((left, right) => right.updatedAt.localeCompare(left.updatedAt)));
  }, [workspace]);

  useEffect(() => {
    if (!workspace || loading) {
      return;
    }
    void reloadThreadList();
  }, [loading, reloadThreadList, workspace, workspaceId]);

  useEffect(() => {
    if (!workspace?.currentBlueprint) {
      return;
    }
    const blueprint = workspace.currentBlueprint;
    if (lastBlueprintRef.current === blueprint) {
      return;
    }
    lastBlueprintRef.current = blueprint;
    const metadata = parseBlueprintMetadata(blueprint);
    const defaultViewer =
      workspace.viewerChannel ?? chooseDefaultViewer(metadata.participants);
    setWorkspace((previous) => {
      if (!previous || previous.currentBlueprint !== blueprint) {
        return previous;
      }
      const next = {
        ...previous,
        blueprintMetadata: metadata,
        viewerChannel: defaultViewer,
        statusTemplatesByViewer: {},
        resolvedStatus: null,
        statusHistory: [],
        documentQaHistory: [],
        lastDocumentFingerprint: null,
      };
      const meta = deriveThreadMeta(next);
      return {
        ...next,
        ...meta,
        updatedAt: new Date().toISOString(),
      };
    });
  }, [workspace?.currentBlueprint, workspace?.viewerChannel]);

  useEffect(() => {
    const currentBlueprint = workspace?.currentBlueprint;
    const viewer = workspace?.viewerChannel;
    if (!currentBlueprint || !viewer) {
      return;
    }

    let cancelled = false;
    void (async () => {
      const blueprintHash = await hashText(currentBlueprint);
      const existingBundle = workspace.statusTemplatesByViewer[viewer];
      if (existingBundle?.blueprintHash === blueprintHash) {
        return;
      }
      setTemplateBusy(true);
      try {
        const response = await fetch("/api/document/status-templates", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            credentials,
            blueprint: currentBlueprint,
            viewer,
          }),
        });
        const payload = (await response.json()) as
          | { ok: true; bundle: StatusTemplateBundle }
          | { ok: false; error: string };
        if (!payload.ok) {
          throw new Error(payload.error);
        }

        if (cancelled) {
          return;
        }

        setWorkspace((previous) => {
          if (!previous) {
            return previous;
          }
          const next = {
            ...previous,
            statusTemplatesByViewer: {
              ...previous.statusTemplatesByViewer,
              [viewer]: payload.bundle,
            },
            activityFeed: [
              ...previous.activityFeed,
              createActivity("status", "Status templates generated", viewer),
            ],
          };
          const latestSnapshot = next.documentSnapshots.at(-1);
          if (!latestSnapshot) {
            const meta = deriveThreadMeta(next);
            return {
              ...next,
              ...meta,
              updatedAt: new Date().toISOString(),
            };
          }
          const resolved = resolveStatusMessage({
            bundle: payload.bundle,
            viewer,
            document: latestSnapshot.document,
            currencyCode: next.blueprintMetadata?.currencyCode ?? null,
            sourceSnapshotId: latestSnapshot.id,
            previous: next.resolvedStatus,
          });
          if (!resolved.changed) {
            const meta = deriveThreadMeta(next);
            return {
              ...next,
              ...meta,
              updatedAt: new Date().toISOString(),
            };
          }
          const withStatus = {
            ...next,
            resolvedStatus: resolved.resolved,
            statusHistory: [...next.statusHistory, resolved.resolved],
          };
          const meta = deriveThreadMeta(withStatus);
          return {
            ...withStatus,
            ...meta,
            updatedAt: new Date().toISOString(),
          };
        });
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Failed to generate status templates.";
        if (cancelled) {
          return;
        }
        setWorkspace((previous) =>
          previous
            ? {
                ...previous,
                errorMessage: message,
                activityFeed: [
                  ...previous.activityFeed,
                  createActivity("error", "Status template generation failed", message),
                ],
                updatedAt: new Date().toISOString(),
              }
            : previous
        );
      } finally {
        if (!cancelled) {
          setTemplateBusy(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [
    credentials,
    workspace?.currentBlueprint,
    workspace?.viewerChannel,
    workspace?.statusTemplatesByViewer,
  ]);

  const refreshDocument = useCallback(
    async (sessionId: string): Promise<{ running: boolean; changed: boolean }> => {
      const response = await fetch("/api/myos/retrieve", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          credentials,
          sessionId,
        }),
      });
      if (!response.ok) {
        return { running: false, changed: false };
      }
      const payload = (await response.json()) as
        | { ok: true; retrieved: Record<string, unknown> }
        | { ok: false; error: string };
      if (!payload.ok) {
        return { running: false, changed: false };
      }

      let running = false;
      let changed = false;
      setWorkspace((previous) => {
        if (!previous) {
          return previous;
        }
        const selectedViewer = previous.viewerChannel;
        const templateBundle = selectedViewer
          ? previous.statusTemplatesByViewer[selectedViewer] ?? null
          : null;
        const refreshed = applyRetrievedDocumentRefresh({
          workspace: previous,
          retrieved: payload.retrieved,
          selectedViewer,
          templateBundle,
          currencyCode: previous.blueprintMetadata?.currencyCode ?? null,
        });
        running = refreshed.running;
        changed = refreshed.changed;
        if (!refreshed.changed) {
          return previous;
        }
        const withEvents = {
          ...refreshed.workspace,
          bootstrapStatus: [
            ...refreshed.workspace.bootstrapStatus,
            createBootstrapEvent(
              refreshed.running ? "document-running" : "document-fetched",
              refreshed.running
                ? "Document is running and operations are available."
                : "Document snapshot refreshed."
            ),
          ],
          activityFeed: [
            ...refreshed.workspace.activityFeed,
            createActivity(
              "document",
              refreshed.running ? "Document running" : "Document snapshot updated"
            ),
          ],
          updatedAt: new Date().toISOString(),
        };
        const meta = deriveThreadMeta(withEvents);
        return {
          ...withEvents,
          ...meta,
        };
      });
      return { running, changed };
    },
    [credentials]
  );

  const waitUntilRunnable = useCallback(
    async (sessionId: string) => {
      for (let index = 0; index < 120; index += 1) {
        await sleep(1_000);
        const refreshed = await refreshDocument(sessionId);
        if (refreshed.running) {
          break;
        }
      }
    },
    [refreshDocument]
  );
  const workspaceReady = !loading && workspace !== null;
  const currentSessionId = workspace?.sessionId ?? null;

  const sendLiveSubscriptions = useCallback(async () => {
    const identity = liveIdentityRef.current;
    if (!identity) {
      return;
    }
    const all = await listWorkspaces();
    const sessionIds = [...new Set(all.map((entry) => entry.sessionId).filter(Boolean))] as string[];
    const threadIds = [...new Set(all.map((entry) => entry.id))];
    await fetch("/api/myos/live/subscriptions", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        browserId: identity.browserId,
        accountHash: identity.accountHash,
        sessionIds,
        threadIds,
      }),
    });
  }, []);

  const handleLiveInvalidation = useCallback(
    async (sessionId: string) => {
      const response = await fetch("/api/myos/retrieve", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          credentials,
          sessionId,
        }),
      });
      if (!response.ok) {
        return;
      }
      const payload = (await response.json()) as
        | { ok: true; retrieved: Record<string, unknown> }
        | { ok: false; error: string };
      if (!payload.ok) {
        return;
      }

      const all = await listWorkspaces();
      const matching = all.filter((entry) => entry.sessionId === sessionId);
      if (matching.length === 0) {
        return;
      }

      for (const entry of matching) {
        const selectedViewer = entry.viewerChannel;
        const bundle = selectedViewer
          ? entry.statusTemplatesByViewer[selectedViewer] ?? null
          : null;
        const refreshed = applyRetrievedDocumentRefresh({
          workspace: entry,
          retrieved: payload.retrieved,
          selectedViewer,
          templateBundle: bundle,
          currencyCode: entry.blueprintMetadata?.currencyCode ?? null,
        });
        if (!refreshed.changed) {
          continue;
        }
        await saveWorkspace(refreshed.workspace);
        if (refreshed.workspace.id === workspaceId) {
          setWorkspace(refreshed.workspace);
        }
      }

      await reloadThreadList();
    },
    [credentials, reloadThreadList, workspaceId]
  );

  const unregisterWebhookBestEffort = useCallback(async () => {
    const identity = liveIdentityRef.current;
    if (!identity) {
      return;
    }
    const existing = readWebhookRegistration(identity.accountHash);
    if (!existing) {
      return;
    }
    try {
      await fetch("/api/myos/webhooks/unregister", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          credentials,
          registrationId: existing.registrationId,
        }),
      });
    } catch {
      // noop best-effort cleanup
    }
    clearWebhookRegistration(identity.accountHash);
  }, [credentials]);

  useEffect(() => {
    if (!workspaceReady) {
      return;
    }

    if (window.location.hostname === "localhost") {
      liveEventSourceRef.current?.close();
      liveEventSourceRef.current = null;
      liveIdentityRef.current = null;
      clearWebhookRegistration(accountHash);
      return;
    }

    let cancelled = false;
    const browserId = getOrCreateBrowserInstallId();
    if (!browserId) {
      return;
    }

    const previousIdentity = liveIdentityRef.current;
    if (
      previousIdentity &&
      (previousIdentity.browserId !== browserId || previousIdentity.accountHash !== accountHash)
    ) {
      liveEventSourceRef.current?.close();
      liveEventSourceRef.current = null;
    }

    liveIdentityRef.current = { browserId, accountHash };

    void (async () => {
      const registerResponse = await fetch("/api/myos/webhooks/register", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          credentials,
          browserId,
          accountHash,
        }),
      });
      const registerPayload = (await registerResponse.json()) as
        | {
            ok: true;
            registration: {
              registrationId: string;
              webhookId: string;
              accountHash: string;
              browserId: string;
              createdAt: string;
              updatedAt: string;
            };
          }
        | { ok: false; error: string };
      if (!registerResponse.ok || !registerPayload.ok || cancelled) {
        return;
      }

      writeWebhookRegistration(accountHash, registerPayload.registration);

      if (!liveEventSourceRef.current) {
        const source = new EventSource(
          `/api/myos/live?browserId=${encodeURIComponent(browserId)}&accountHash=${encodeURIComponent(accountHash)}`
        );
        source.onmessage = (event) => {
          try {
            const payload = JSON.parse(event.data) as Record<string, unknown>;
            if (payload.type !== "myos-epoch-advanced") {
              return;
            }
            const sessionId = typeof payload.sessionId === "string" ? payload.sessionId : null;
            if (!sessionId) {
              return;
            }
            void handleLiveInvalidation(sessionId);
          } catch {
            // noop
          }
        };
        liveEventSourceRef.current = source;
      }

      await sendLiveSubscriptions();
    })();

    return () => {
      cancelled = true;
    };
  }, [accountHash, credentials, handleLiveInvalidation, sendLiveSubscriptions, workspaceId, workspaceReady]);

  useEffect(() => {
    if (!workspaceReady) {
      return;
    }
    void sendLiveSubscriptions();
  }, [currentSessionId, sendLiveSubscriptions, workspaceId, workspaceReady]);

  useEffect(
    () => () => {
      liveEventSourceRef.current?.close();
      liveEventSourceRef.current = null;
    },
    []
  );

  useEffect(() => {
    if (
      !workspace ||
      workspace.phase !== "document-running" ||
      !workspace.sessionId ||
      !workspace.autoRefreshEnabled
    ) {
      return;
    }

    const intervalId = window.setInterval(() => {
      void refreshDocument(workspace.sessionId!);
    }, 5_000);
    return () => {
      window.clearInterval(intervalId);
    };
  }, [refreshDocument, workspace]);

  const handlePromptSubmit = async (prompt: { text: string; files: FileUIPart[] }) => {
    const currentWorkspace = workspace;

    if (!currentWorkspace || busy) {
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
          workspaceId: currentWorkspace.id,
          name: extracted.fileName,
          mimeType: extracted.mimeType,
          blob,
          createdAt: new Date().toISOString(),
        });
      }

      const pendingQuestion = pendingQuestionRef.current;
      const nextQaEntry = pendingQuestion
        ? {
            question: pendingQuestion,
            answer: prompt.text,
          }
        : null;
      const nextAttachments = [...currentWorkspace.attachments, ...extractedAttachments];
      const nextQaPairs = nextQaEntry
        ? [...currentWorkspace.qaPairs, nextQaEntry]
        : currentWorkspace.qaPairs;

      pendingQuestionRef.current = null;

      setWorkspace((previous) =>
        previous
          ? {
              ...previous,
              errorMessage: null,
              attachments: [...previous.attachments, ...extractedAttachments],
              qaPairs: nextQaEntry ? [...previous.qaPairs, nextQaEntry] : previous.qaPairs,
              activityFeed: [
                ...previous.activityFeed,
                createActivity("user-message", "User message", prompt.text),
                ...extractedAttachments.map((attachment) =>
                  createActivity("user-message", "File attached", attachment.name)
                ),
              ],
              updatedAt: new Date().toISOString(),
              ...deriveThreadMeta(previous),
            }
          : previous
      );

      await sendMessage(
        {
          text: prompt.text,
        },
        {
          body: {
            credentials,
            attachments: nextAttachments,
            currentBlueprint: currentWorkspace.currentBlueprint,
            qaPairs: nextQaPairs,
          },
        }
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to send message.";
      setWorkspace((previous) =>
        previous
          ? {
              ...previous,
              errorMessage: message,
              activityFeed: [
                ...previous.activityFeed,
                createActivity("error", "Chat submission error", message),
              ],
              updatedAt: new Date().toISOString(),
            }
          : previous
      );
    } finally {
      setBusy(false);
    }
  };

  const handleGenerateDsl = async () => {
    const currentWorkspace = workspace;

    if (!currentWorkspace?.currentBlueprint || busy) {
      return;
    }

    setBusy(true);
    setWorkspace((previous) =>
      previous
        ? {
            ...previous,
            phase: "dsl-generating",
            selectedInspectorTab: "dsl",
            errorMessage: null,
            activityFeed: [...previous.activityFeed, createActivity("dsl", "Generating DSL")],
            updatedAt: new Date().toISOString(),
          }
        : previous
    );

    try {
      const response = await fetch("/api/dsl/generate", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          credentials,
          blueprint: currentWorkspace.currentBlueprint,
          attachments: currentWorkspace.attachments,
        }),
      });

      const payload = (await response.json()) as
        | {
            ok: true;
            dsl: string;
            inputTokens: number;
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
          phase: "dsl-ready",
          selectedInspectorTab: "dsl",
          currentDsl: payload.dsl,
          currentDocumentJson: null,
          channelBindings: [],
          finalBindings: null,
          dslVersions: [
            ...previous.dslVersions,
            {
              id: nowId("dsl"),
              createdAt: new Date().toISOString(),
              source: "model",
              content: payload.dsl,
            },
          ],
          compileStatus: null,
          activityFeed: [
            ...previous.activityFeed,
            createActivity("dsl", "DSL ready"),
          ],
          updatedAt: new Date().toISOString(),
        };
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to generate DSL.";
      setWorkspace((previous) =>
        previous
          ? {
              ...previous,
              phase: previous.currentBlueprint ? "blueprint-ready" : previous.phase,
              errorMessage: message,
              activityFeed: [...previous.activityFeed, createActivity("error", "DSL generation error", message)],
              updatedAt: new Date().toISOString(),
            }
          : previous
      );
    } finally {
      setBusy(false);
    }
  };

  const handleCompileDsl = async () => {
    const currentWorkspace = workspace;

    if (!currentWorkspace?.currentDsl || busy) {
      return;
    }

    setBusy(true);
    setWorkspace((previous) =>
      previous
        ? {
            ...previous,
            selectedInspectorTab: "dsl",
            errorMessage: null,
            activityFeed: [...previous.activityFeed, createActivity("compile", "Compiling DSL")],
            updatedAt: new Date().toISOString(),
          }
        : previous
    );

    try {
      const response = await fetch("/api/dsl/compile", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          code: currentWorkspace.currentDsl,
          accountId: credentials.myOsAccountId,
        }),
      });

      const payload = (await response.json()) as
        | {
            ok: true;
            documentJson: Record<string, unknown>;
            structure: unknown;
            bindings: ChannelBindingDraft[];
          }
        | { ok: false; error: string };

      if (!payload.ok) {
        throw new Error(payload.error);
      }

      setWorkspace((previous) =>
        previous
          ? {
              ...previous,
              phase: "binding-review",
              selectedInspectorTab: "bindings",
              currentDocumentJson: payload.documentJson,
              channelBindings: payload.bindings,
              compileStatus: {
                ok: true,
                checkedAt: new Date().toISOString(),
                diagnostics: [
                  {
                    id: nowId("diag"),
                    createdAt: new Date().toISOString(),
                    level: "info",
                    message: "Compile succeeded.",
                  },
                ],
              },
              activityFeed: [
                ...previous.activityFeed,
                createActivity("compile", "Compile succeeded"),
                createActivity("bindings", "Bindings extracted"),
              ],
              updatedAt: new Date().toISOString(),
            }
          : previous
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to compile DSL.";
      setWorkspace((previous) =>
        previous
          ? {
              ...previous,
              phase: "dsl-ready",
              selectedInspectorTab: "dsl",
              errorMessage: message,
              compileStatus: {
                ok: false,
                checkedAt: new Date().toISOString(),
                diagnostics: [
                  {
                    id: nowId("diag"),
                    createdAt: new Date().toISOString(),
                    level: "error",
                    message,
                  },
                ],
              },
              activityFeed: [...previous.activityFeed, createActivity("error", "DSL compile error", message)],
              updatedAt: new Date().toISOString(),
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
        updatedAt: new Date().toISOString(),
      };
    });
  };

  const handleBootstrap = async () => {
    const currentWorkspace = workspace;

    if (!currentWorkspace?.currentDocumentJson || busy) {
      return;
    }

    const invalidBinding = currentWorkspace.channelBindings.find((binding) => !binding.value.trim());
    if (invalidBinding) {
      setWorkspace((previous) =>
        previous
          ? {
              ...previous,
              errorMessage: `Binding value required for ${invalidBinding.channelName}.`,
              phase: "error",
              updatedAt: new Date().toISOString(),
            }
          : previous
      );
      return;
    }

    setBusy(true);
    setWorkspace((previous) =>
      previous
        ? {
            ...previous,
            phase: "bootstrapping",
            selectedInspectorTab: "bootstrap",
            errorMessage: null,
            bootstrapStatus: [
              ...previous.bootstrapStatus,
              createBootstrapEvent("bootstrap-submitted", "Bootstrap request submitted."),
            ],
            finalBindings: previous.channelBindings,
            activityFeed: [...previous.activityFeed, createActivity("bootstrap", "Bootstrap submitted")],
            updatedAt: new Date().toISOString(),
          }
        : previous
    );

    try {
      const response = await fetch("/api/myos/bootstrap", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          credentials,
          documentJson: currentWorkspace.currentDocumentJson,
          bindings: currentWorkspace.channelBindings,
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
              updatedAt: new Date().toISOString(),
            }
          : previous
      );

      await waitUntilRunnable(payload.sessionId);
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
              updatedAt: new Date().toISOString(),
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
    await unregisterWebhookBestEffort();
    liveEventSourceRef.current?.close();
    liveEventSourceRef.current = null;
    clearWebhookRegistration(accountHash);
    await clearAllWorkspacePersistence();
    clearThreadRoutingStorage();
    onLogout();
  };

  const handleClearWorkspace = async () => {
    stop();
    pendingQuestionRef.current = null;
    await unregisterWebhookBestEffort();
    liveEventSourceRef.current?.close();
    liveEventSourceRef.current = null;
    clearWebhookRegistration(accountHash);
    await clearAllWorkspacePersistence();
    clearThreadRoutingStorage();
    const nextThreadId = createThreadId();
    const nextWorkspace = createWorkspace(nextThreadId, credentials);
    await saveWorkspace(nextWorkspace);
    router.push(`/t/${encodeURIComponent(nextThreadId)}`);
  };

  const handleRefreshNow = async () => {
    if (!workspace?.sessionId || refreshBusy) {
      return;
    }
    setRefreshBusy(true);
    try {
      await refreshDocument(workspace.sessionId);
    } finally {
      setRefreshBusy(false);
    }
  };

  const handleViewerChange = (viewer: string | null) => {
    setWorkspace((previous) => {
      if (!previous) {
        return previous;
      }
      if (previous.viewerChannel === viewer) {
        return previous;
      }
      const next = {
        ...previous,
        viewerChannel: viewer,
      };
      if (!viewer) {
        const meta = deriveThreadMeta(next);
        return {
          ...next,
          ...meta,
          updatedAt: new Date().toISOString(),
        };
      }
      const latestSnapshot = next.documentSnapshots.at(-1);
      const bundle = next.statusTemplatesByViewer[viewer];
      if (!latestSnapshot || !bundle) {
        const meta = deriveThreadMeta(next);
        return {
          ...next,
          ...meta,
          updatedAt: new Date().toISOString(),
        };
      }
      const resolved = resolveStatusMessage({
        bundle,
        viewer,
        document: latestSnapshot.document,
        currencyCode: next.blueprintMetadata?.currencyCode ?? null,
        sourceSnapshotId: latestSnapshot.id,
        previous: next.resolvedStatus,
      });
      if (!resolved.changed) {
        const meta = deriveThreadMeta(next);
        return {
          ...next,
          ...meta,
          updatedAt: new Date().toISOString(),
        };
      }
      const withStatus = {
        ...next,
        resolvedStatus: resolved.resolved,
        statusHistory: [...next.statusHistory, resolved.resolved],
      };
      const meta = deriveThreadMeta(withStatus);
      return {
        ...withStatus,
        ...meta,
        updatedAt: new Date().toISOString(),
      };
    });
  };

  const handleAskDocumentAssistant = async (question: string) => {
    const currentWorkspace = workspace;
    if (!currentWorkspace) {
      return;
    }
    if (assistantBusy) {
      setWorkspace((previous) =>
        previous
          ? {
              ...previous,
              errorMessage: "Document assistant is already answering. Please wait.",
              updatedAt: new Date().toISOString(),
            }
          : previous
      );
      return;
    }
    if (!currentWorkspace.currentBlueprint) {
      setWorkspace((previous) =>
        previous
          ? {
              ...previous,
              errorMessage: "Generate a blueprint before asking the document assistant.",
              updatedAt: new Date().toISOString(),
            }
          : previous
      );
      return;
    }
    const trimmedQuestion = question.trim();
    if (!trimmedQuestion) {
      setWorkspace((previous) =>
        previous
          ? {
              ...previous,
              errorMessage: "Question cannot be empty.",
              updatedAt: new Date().toISOString(),
            }
          : previous
      );
      return;
    }
    const latest = currentWorkspace.documentSnapshots.at(-1);

    setAssistantBusy(true);
    try {
      const response = await fetch("/api/document/qa", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          credentials,
          blueprint: currentWorkspace.currentBlueprint,
          viewer: currentWorkspace.viewerChannel,
          question: trimmedQuestion,
          state: latest?.document ?? null,
          allowedOperations: latest?.allowedOperations ?? [],
        }),
      });
      const payload = (await response.json()) as
        | { ok: true; answer: string; mode: DocumentQaMode }
        | { ok: false; error: string };
      if (!payload.ok) {
        throw new Error(payload.error);
      }
      setWorkspace((previous) => {
        if (!previous) {
          return previous;
        }
        const exchange = {
          id: nowId("docqa"),
          question: trimmedQuestion,
          answer: payload.answer,
          mode: payload.mode,
          createdAt: new Date().toISOString(),
        };
        const next = {
          ...previous,
          documentQaHistory: [...previous.documentQaHistory, exchange],
          activityFeed: [
            ...previous.activityFeed,
            createActivity("document-qa", "Document question", trimmedQuestion),
          ],
          selectedInspectorTab: "assistant" as const,
          errorMessage: null,
          updatedAt: new Date().toISOString(),
        };
        const meta = deriveThreadMeta(next);
        return {
          ...next,
          ...meta,
        };
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to ask document assistant.";
      setWorkspace((previous) =>
        previous
          ? {
              ...previous,
              errorMessage: message,
              activityFeed: [
                ...previous.activityFeed,
                createActivity("error", "Document assistant error", message),
              ],
              updatedAt: new Date().toISOString(),
            }
          : previous
      );
    } finally {
      setAssistantBusy(false);
    }
  };

  const latestSnapshot = workspace?.documentSnapshots.at(-1);
  const selectedViewer = workspace?.viewerChannel ?? null;
  const selectedTemplateBundle =
    selectedViewer && workspace ? workspace.statusTemplatesByViewer[selectedViewer] ?? null : null;
  const assistantMode: DocumentQaMode = latestSnapshot?.document ? "live-state" : "blueprint-only";
  const assistantSubmitBlockedReason =
    !workspace?.currentBlueprint
      ? "Blueprint is required before asking the assistant."
      : assistantBusy
        ? "Document assistant is already answering."
        : null;

  const chatMessages = useMemo(() => messages as UIMessage[], [messages]);

  if (loading || !workspace) {
    return <div className="flex min-h-screen items-center justify-center">Loading workspace…</div>;
  }

  return (
    <div className="grid min-h-screen grid-cols-12 gap-4 bg-background p-4">
      <ThreadSidebar
        activeThreadId={workspaceId}
        threads={threads}
        onSelectThread={(threadId) => {
          router.push(`/t/${encodeURIComponent(threadId)}`);
        }}
        onCreateThread={() => {
          router.push(`/t/${encodeURIComponent(createThreadId())}`);
        }}
      />

      <section className="col-span-6 flex h-[calc(100vh-2rem)] flex-col rounded-xl border">
        <header className="flex items-center justify-between border-b px-4 py-3">
          <div>
            <h1 className="font-semibold text-lg">Blue Studio</h1>
            <p className="text-muted-foreground text-xs">
              Phase: <span className="font-medium">{workspace.phase}</span>
            </p>
            <p className="text-muted-foreground text-xs">Thread: {workspace.threadTitle}</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="secondary" disabled={busy} onClick={() => void handleClearWorkspace()}>
              Clear all threads
            </Button>
            <Button variant="outline" onClick={() => void handleHardLogout()}>
              Log out
            </Button>
          </div>
        </header>

        {workspace.errorMessage && (
          <div className="mx-4 mt-3 rounded-lg border border-destructive/40 bg-destructive/5 px-3 py-2 text-destructive text-sm">
            {workspace.errorMessage}
          </div>
        )}

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
                <p className="text-muted-foreground">Generate JS/TS DSL from the blueprint.</p>
              </div>
              <Button disabled={busy} onClick={handleGenerateDsl}>
                Generate DSL
              </Button>
            </div>
          )}

          {workspace.phase === "dsl-ready" && (
            <div className="mb-3 flex items-center justify-between rounded-lg border p-3 text-sm">
              <div>
                <p className="font-medium">DSL generated.</p>
                <p className="text-muted-foreground">
                  Review the DSL in the inspector, then compile when ready.
                </p>
              </div>
              <Button disabled={busy || !workspace.currentDsl} onClick={handleCompileDsl}>
                Compile DSL
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
              <PromptInputAttachments />
              <PromptInputTextarea placeholder="Send a message..." disabled={busy} />
            </PromptInputBody>
            <PromptInputFooter>
              <AttachSourceMenu
                credentials={credentials}
                currentWorkspaceId={workspace.id}
                disabled={busy}
                onError={(message) =>
                  setWorkspace((previous) =>
                    previous
                      ? {
                          ...previous,
                          errorMessage: message,
                          updatedAt: new Date().toISOString(),
                        }
                      : previous
                  )
                }
              />
              <PromptInputSubmit status={status} disabled={busy} onStop={() => void stop()} />
            </PromptInputFooter>
          </PromptInput>
        </div>
      </section>

      <section className="col-span-4 h-[calc(100vh-2rem)] rounded-xl border">
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
                    <span className="font-medium">Thread:</span> {workspace.threadTitle}
                  </p>
                  <p className="text-muted-foreground">{workspace.threadSummary}</p>
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

              {tab.key === "status" && (
                <DocumentStatusPanel
                  blueprintReady={Boolean(workspace.currentBlueprint)}
                  viewerChannel={selectedViewer}
                  participants={workspace.blueprintMetadata?.participants ?? []}
                  templateBundle={selectedTemplateBundle}
                  resolvedStatus={workspace.resolvedStatus}
                  statusHistory={workspace.statusHistory}
                  autoRefreshEnabled={workspace.autoRefreshEnabled}
                  onViewerChange={(viewer) => handleViewerChange(viewer)}
                  onAutoRefreshChange={(enabled) =>
                    setWorkspace((previous) =>
                      previous
                        ? {
                            ...previous,
                            autoRefreshEnabled: enabled,
                            updatedAt: new Date().toISOString(),
                          }
                        : previous
                    )
                  }
                  onRefreshNow={() => void handleRefreshNow()}
                  refreshing={refreshBusy || templateBusy}
                />
              )}

              {tab.key === "assistant" && (
                <DocumentAssistantPanel
                  enabled={Boolean(workspace.currentBlueprint)}
                  mode={assistantMode}
                  participants={workspace.blueprintMetadata?.participants ?? []}
                  viewerChannel={workspace.viewerChannel}
                  history={workspace.documentQaHistory}
                  submitting={assistantBusy}
                  submitBlockedReason={assistantSubmitBlockedReason}
                  onViewerChange={handleViewerChange}
                  onSubmitQuestion={handleAskDocumentAssistant}
                />
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
                      <p>
                        {workspace.compileStatus
                          ? workspace.compileStatus.ok
                            ? "Success"
                            : "Failed"
                          : "Not compiled"}
                      </p>
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
