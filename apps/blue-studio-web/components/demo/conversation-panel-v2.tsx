"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { DemoAvatar } from "@/components/demo/demo-avatar";
import { useDemoApp } from "@/components/demo/demo-provider";
import { liveAssistantTurnSchema } from "@/lib/demo/live-assistant-protocol";
import {
  getAssistantTimelineItems,
  getConversationExchanges,
  getConversationOpenExchanges,
  getDocumentById,
  getDocumentConversation,
  getExchangeMessages,
  getHomeDocumentsForAccount,
} from "@/lib/demo/selectors";
import type { LiveAssistantTurn } from "@/lib/demo/types";

function formatTimestamp(value: string): string {
  return new Date(value).toLocaleString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatDayLabel(value: string): string {
  const date = new Date(value);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function messageTone(role: "assistant" | "user" | "system") {
  if (role === "assistant") {
    return "border-sky-200 bg-sky-50/80";
  }
  if (role === "user") {
    return "border-primary/15 bg-primary/6";
  }
  return "border-border/80 bg-muted/35";
}

type LiveTurnType = LiveAssistantTurn["t"];

function parseSseChunk(chunk: string): Array<{ event: string; data: Record<string, unknown> }> {
  const blocks = chunk
    .split("\n\n")
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0);
  const events: Array<{ event: string; data: Record<string, unknown> }> = [];
  for (const block of blocks) {
    const lines = block.split("\n");
    const eventName = lines
      .find((line) => line.startsWith("event:"))
      ?.replace("event:", "")
      .trim();
    const dataLine = lines
      .filter((line) => line.startsWith("data:"))
      .map((line) => line.replace("data:", "").trim())
      .join("");
    if (!eventName || !dataLine) {
      continue;
    }
    try {
      const parsed = JSON.parse(dataLine) as Record<string, unknown>;
      events.push({ event: eventName, data: parsed });
    } catch {
      continue;
    }
  }
  return events;
}

function extractPartialJsonString(raw: string, key: "c" | "q" | "summ"): string {
  const token = `"${key}"`;
  const keyIndex = raw.indexOf(token);
  if (keyIndex < 0) {
    return "";
  }
  const colonIndex = raw.indexOf(":", keyIndex);
  if (colonIndex < 0) {
    return "";
  }
  let index = colonIndex + 1;
  while (index < raw.length && /\s/u.test(raw[index] ?? "")) {
    index += 1;
  }
  if ((raw[index] ?? "") !== '"') {
    return "";
  }
  index += 1;

  let result = "";
  let escaped = false;
  while (index < raw.length) {
    const char = raw[index] ?? "";
    if (escaped) {
      if (char === "n") {
        result += "\n";
      } else if (char === "t") {
        result += "\t";
      } else {
        result += char;
      }
      escaped = false;
      index += 1;
      continue;
    }
    if (char === "\\") {
      escaped = true;
      index += 1;
      continue;
    }
    if (char === '"') {
      break;
    }
    result += char;
    index += 1;
  }
  return result;
}

function detectTurnType(raw: string): LiveTurnType | null {
  const match = raw.match(/"t"\s*:\s*"(ans|more|doc)"/u);
  if (!match?.[1]) {
    return null;
  }
  if (match[1] === "ans" || match[1] === "more" || match[1] === "doc") {
    return match[1];
  }
  return null;
}

function previewTextFromRaw(raw: string): { turnType: LiveTurnType | null; text: string } {
  const turnType = detectTurnType(raw);
  if (!turnType) {
    return { turnType: null, text: "Blink is thinking…" };
  }
  if (turnType === "ans") {
    return { turnType, text: extractPartialJsonString(raw, "c") || "Blink is thinking…" };
  }
  if (turnType === "more") {
    return { turnType, text: extractPartialJsonString(raw, "q") || "Blink is thinking…" };
  }
  return { turnType, text: extractPartialJsonString(raw, "summ") || "Blink is thinking…" };
}

async function readLiveAssistantStream(params: {
  response: Response;
  onRawChunk: (raw: string) => void;
}): Promise<{
  finalTurn: LiveAssistantTurn | null;
  streamError: string | null;
}> {
  if (!params.response.body) {
    return {
      finalTurn: null,
      streamError: "Missing streaming body.",
    };
  }
  const reader = params.response.body.getReader();
  const decoder = new TextDecoder();
  let pending = "";
  let finalTurn: LiveAssistantTurn | null = null;
  let streamError: string | null = null;
  let done = false;
  while (!done) {
    const chunk = await reader.read();
    done = chunk.done;
    if (!chunk.value) {
      continue;
    }
    pending += decoder.decode(chunk.value, { stream: true });
    const boundary = pending.lastIndexOf("\n\n");
    if (boundary < 0) {
      continue;
    }
    const consumable = pending.slice(0, boundary + 2);
    pending = pending.slice(boundary + 2);
    const events = parseSseChunk(consumable);
    for (const event of events) {
      if (event.event === "delta" && typeof event.data.delta === "string") {
        params.onRawChunk(event.data.delta);
      } else if (event.event === "final") {
        const parsed = liveAssistantTurnSchema.safeParse(event.data.turn);
        if (parsed.success) {
          finalTurn = parsed.data;
        }
      } else if (event.event === "error" && typeof event.data.error === "string") {
        streamError = event.data.error;
      }
    }
  }
  const remaining = decoder.decode();
  if (remaining.length > 0) {
    pending += remaining;
  }
  if (pending.trim().length > 0) {
    const events = parseSseChunk(pending);
    for (const event of events) {
      if (event.event === "delta" && typeof event.data.delta === "string") {
        params.onRawChunk(event.data.delta);
      } else if (event.event === "final") {
        const parsed = liveAssistantTurnSchema.safeParse(event.data.turn);
        if (parsed.success) {
          finalTurn = parsed.data;
        }
      } else if (event.event === "error" && typeof event.data.error === "string") {
        streamError = event.data.error;
      }
    }
  }
  return { finalTurn, streamError };
}

export function ConversationPanelV2({
  conversationId,
  assistantName,
  title,
  target,
  fullHeight = false,
}: {
  conversationId: string | null;
  assistantName: string;
  title: string;
  target?: {
    type: "home" | "document";
    id: string;
  };
  fullHeight?: boolean;
}) {
  const {
    snapshot,
    activeAccount,
    credentials,
    startAssistantDemoDiscussion,
    startScopeDiscussion,
    startLiveDiscussion,
    continueLiveDiscussion,
    finalizeLiveDiscussion,
    replyToAssistantExchange,
    resolveAssistantExchange,
  } = useDemoApp();
  const [topLevelText, setTopLevelText] = useState("");
  const [busyTopLevel, setBusyTopLevel] = useState(false);
  const [expandedExchangeId, setExpandedExchangeId] = useState<string | null>(null);
  const [replyDrafts, setReplyDrafts] = useState<Record<string, string>>({});
  const [busyExchangeId, setBusyExchangeId] = useState<string | null>(null);
  const [liveStreamingPreview, setLiveStreamingPreview] = useState<
    Record<string, { turnType: LiveTurnType | null; text: string }>
  >({});
  const scrollViewportRef = useRef<HTMLDivElement | null>(null);

  const exchanges = useMemo(
    () => (snapshot && conversationId ? getConversationExchanges(snapshot, conversationId) : []),
    [conversationId, snapshot]
  );
  const timelineItems = useMemo(
    () => (snapshot && conversationId ? getAssistantTimelineItems(snapshot, conversationId) : []),
    [conversationId, snapshot]
  );
  const isLiveAccount = activeAccount?.mode === "live";
  const openAskExchanges = useMemo(
    () =>
      snapshot && conversationId
        ? getConversationOpenExchanges(snapshot, conversationId).filter((exchange) =>
            isLiveAccount ? true : exchange.type === "ask"
          )
        : [],
    [conversationId, isLiveAccount, snapshot]
  );
  const liveDocuments = useMemo(() => {
    if (!snapshot || !activeAccount) {
      return [];
    }
    return getHomeDocumentsForAccount(snapshot, activeAccount.id).map((document) => ({
      id: document.id,
      title: document.title,
      summary: document.summary,
      status: document.status,
    }));
  }, [activeAccount, snapshot]);

  useEffect(() => {
    const node = scrollViewportRef.current;
    if (!node) {
      return;
    }
    const frame = requestAnimationFrame(() => {
      node.scrollTop = node.scrollHeight;
    });
    return () => cancelAnimationFrame(frame);
  }, [timelineItems.length]);

  if (!snapshot || !conversationId) {
    return (
      <Card>
        <CardContent className="pt-5 text-sm text-muted-foreground">
          Conversation is loading…
        </CardContent>
      </Card>
    );
  }

  const inferTarget = (): { type: "home" | "document"; id: string; title: string } => {
    if (target?.id) {
      return {
        type: target.type,
        id: target.id,
        title,
      };
    }
    const firstExchange = exchanges[0];
    if (firstExchange?.targetType && firstExchange?.targetId) {
      return {
        type: firstExchange.targetType,
        id: firstExchange.targetId,
        title,
      };
    }
    return {
      type: "home",
      id: activeAccount?.id ?? conversationId,
      title,
    };
  };

  const runLiveAssistantTurn = async (params: {
    exchangeId: string;
    userInput: string;
    exchangeMessages: Array<{
      role: "assistant" | "user" | "system";
      body: string;
      createdAt: string;
    }>;
  }) => {
    const resolvedTarget = inferTarget();
    let rawJson = "";
    setLiveStreamingPreview((current) => ({
      ...current,
      [params.exchangeId]: { turnType: null, text: "Blink is thinking…" },
    }));
    try {
      const response = await fetch("/api/demo/live-assistant/stream", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          credentials: {
            openAiApiKey: credentials.openAiApiKey,
          },
          account: {
            id: activeAccount?.id ?? "unknown-live-account",
            name: activeAccount?.name ?? "Live account",
            mode: "live",
          },
          target: resolvedTarget,
          conversation: {
            id: conversationId,
            exchangeId: params.exchangeId,
            messages: params.exchangeMessages,
          },
          liveDocuments,
          documentContext:
            resolvedTarget.type === "document" && snapshot
              ? (() => {
                  const currentDocument = getDocumentById(snapshot, resolvedTarget.id);
                  const documentConversation = getDocumentConversation(
                    snapshot,
                    resolvedTarget.id,
                    activeAccount?.id ?? resolvedTarget.id
                  );
                  if (!currentDocument) {
                    return null;
                  }
                  return {
                    currentDocument: {
                      id: currentDocument.id,
                      kind: currentDocument.kind,
                      title: currentDocument.title,
                      summary: currentDocument.summary,
                      fields: Object.fromEntries(
                        currentDocument.coreFields.map((field) => [field.label, field.value])
                      ),
                      anchors: currentDocument.anchorIds
                        .map((anchorId) =>
                          snapshot.documentAnchors.find((anchor) => anchor.id === anchorId)
                        )
                        .filter((anchor): anchor is NonNullable<typeof anchor> => Boolean(anchor))
                        .map((anchor) => ({
                          key: anchor.key,
                          label: anchor.label,
                          purpose: anchor.label,
                        })),
                    },
                    recentMessages: documentConversation
                      ? getExchangeMessages(snapshot, documentConversation.id)
                          .slice(-12)
                          .map((message) => ({
                            role: message.role,
                            body: message.body,
                            createdAt: message.createdAt,
                          }))
                      : [],
                  };
                })()
              : null,
          userInput: params.userInput,
        }),
      });
      if (!response.ok) {
        throw new Error(`Live assistant request failed (${response.status}).`);
      }
      const { finalTurn, streamError } = await readLiveAssistantStream({
        response,
        onRawChunk: (rawChunk) => {
          rawJson += rawChunk;
          const preview = previewTextFromRaw(rawJson);
          setLiveStreamingPreview((current) => ({
            ...current,
            [params.exchangeId]: preview,
          }));
        },
      });

      if (streamError) {
        await finalizeLiveDiscussion({
          exchangeId: params.exchangeId,
          turn: {
            t: "ans",
            c: `I hit an error while responding: ${streamError}`,
          },
        });
        return;
      }
      if (!finalTurn) {
        throw new Error("Live assistant did not return a valid final turn.");
      }

      if (finalTurn.t === "doc") {
        try {
          const createResponse = await fetch("/api/demo/live-documents/create", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({
              credentials,
              doc: finalTurn.doc,
              link: finalTurn.link,
            }),
          });
          const createPayload = (await createResponse.json()) as
            | {
                ok: true;
                sessionId: string | null;
                myosDocumentId: string | null;
                created: {
                  kind: string;
                  name: string;
                  description: string;
                  fields: Record<string, string>;
                  anchors: Array<{ key: string; label: string; purpose: string }>;
                };
                mappedDocument?: Record<string, unknown> | null;
                mappedAnchors?: Array<Record<string, unknown>>;
                linked?: Array<{
                  anchorKey: string;
                  childSessionId: string;
                  childDocumentId: string;
                  linkSessionId: string | null;
                }>;
                link?: {
                  parentDocumentId: string;
                  anchorKey: string;
                } | null;
              }
            | { ok: false; error: string };
          if (!createResponse.ok || !createPayload.ok) {
            await finalizeLiveDiscussion({
              exchangeId: params.exchangeId,
              turn: finalTurn,
              docCreationError:
                "error" in createPayload
                  ? createPayload.error
                  : "Live document creation failed.",
            });
            return;
          }
          await finalizeLiveDiscussion({
            exchangeId: params.exchangeId,
            turn: finalTurn,
            createdDocument: {
              kind: createPayload.created.kind,
              name: createPayload.created.name,
              description: createPayload.created.description,
              fields: createPayload.created.fields,
              anchors: createPayload.created.anchors,
              sessionId: createPayload.sessionId,
              myosDocumentId: createPayload.myosDocumentId,
              mappedDocument:
                createPayload.mappedDocument && typeof createPayload.mappedDocument === "object"
                  ? (createPayload.mappedDocument as unknown as NonNullable<
                      Parameters<typeof finalizeLiveDiscussion>[0]["createdDocument"]
                    >["mappedDocument"])
                  : null,
              mappedAnchors: Array.isArray(createPayload.mappedAnchors)
                ? (createPayload.mappedAnchors as unknown as NonNullable<
                    Parameters<typeof finalizeLiveDiscussion>[0]["createdDocument"]
                  >["mappedAnchors"])
                : [],
              linked: Array.isArray(createPayload.linked) ? createPayload.linked : [],
              link:
                createPayload.link && typeof createPayload.link === "object"
                  ? {
                      parentDocumentId: createPayload.link.parentDocumentId,
                      anchorKey: createPayload.link.anchorKey,
                    }
                  : finalTurn.link,
            },
          });
          return;
        } catch (error) {
          await finalizeLiveDiscussion({
            exchangeId: params.exchangeId,
            turn: finalTurn,
            docCreationError:
              error instanceof Error ? error.message : "Live document creation failed.",
          });
          return;
        }
      }

      await finalizeLiveDiscussion({
        exchangeId: params.exchangeId,
        turn: finalTurn,
      });
    } catch (error) {
      await finalizeLiveDiscussion({
        exchangeId: params.exchangeId,
        turn: {
          t: "ans",
          c: `I hit an error while responding: ${
            error instanceof Error ? error.message : "Unknown error"
          }`,
        },
      });
    } finally {
      setLiveStreamingPreview((current) => {
        const next = { ...current };
        delete next[params.exchangeId];
        return next;
      });
    }
  };

  return (
    <Card className={fullHeight ? "flex h-full flex-col overflow-hidden" : "overflow-hidden"}>
      <div className="flex items-center justify-between border-b px-4 py-3">
        <div>
          <p className="text-sm font-semibold text-foreground">{assistantName}</p>
          <p className="text-xs text-muted-foreground">{title}</p>
        </div>
        {isLiveAccount ? (
          <span className="text-xs text-muted-foreground">Live assistant</span>
        ) : (
          <Button
            size="sm"
            variant="outline"
            disabled={busyTopLevel}
            onClick={async () => {
              setBusyTopLevel(true);
              await startAssistantDemoDiscussion(conversationId);
              setBusyTopLevel(false);
            }}
          >
            Demo ask
          </Button>
        )}
      </div>

      <CardContent
        ref={scrollViewportRef}
        className={`space-y-4 overflow-y-auto px-4 py-4 ${fullHeight ? "min-h-0 flex-1" : "max-h-[460px]"}`}
      >
        {openAskExchanges.length > 0 ? (
          <div className="rounded-lg border bg-muted/30 px-3 py-3">
            <p className="text-sm font-medium text-foreground">
              {openAskExchanges.length} pending item{openAskExchanges.length > 1 ? "s" : ""}
            </p>
            <div className="mt-2 space-y-1.5">
              {openAskExchanges.map((exchange) => (
                <button
                  key={exchange.id}
                  type="button"
                  className="block w-full rounded-md border bg-background px-3 py-2 text-left text-sm hover:bg-muted/50"
                  onClick={() => setExpandedExchangeId(exchange.id)}
                >
                  {exchange.title}
                </button>
              ))}
            </div>
          </div>
        ) : null}

        <div className="space-y-4">
          {timelineItems.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Start a message to begin the conversation.
            </p>
          ) : (
            timelineItems.map((item) => {
              const exchange = exchanges.find((entry) => entry.id === item.exchangeId);
              const messages = getExchangeMessages(snapshot, item.exchangeId);
              const isOpen = exchange?.status === "open" || exchange?.status === "in-progress";
              const isExpanded = expandedExchangeId === item.exchangeId;
              const alignRight = item.role === "user";
              return (
                <div key={item.id} className="space-y-2">
                  <p className="text-center text-[11px] uppercase tracking-wide text-muted-foreground">
                    {formatDayLabel(item.createdAt)}
                  </p>
                  <div className={`flex gap-3 ${alignRight ? "justify-end" : "justify-start"}`}>
                    {!alignRight ? (
                      <DemoAvatar
                        name={item.role === "assistant" ? assistantName : item.role}
                        kind={item.role === "assistant" ? "blink" : "person"}
                        size="md"
                      />
                    ) : null}
                    <button
                      type="button"
                      className={`max-w-[85%] rounded-2xl border px-4 py-3 text-left transition-colors hover:bg-muted/30 ${messageTone(item.role)}`}
                      onClick={() => setExpandedExchangeId(item.exchangeId)}
                    >
                      <p className="text-sm text-foreground">{item.body}</p>
                      <p className={`mt-2 text-xs text-muted-foreground ${alignRight ? "text-left" : "text-right"}`}>
                        {item.role === "assistant" ? assistantName : item.role} · {formatTimestamp(item.createdAt)}
                      </p>
                    </button>
                    {alignRight ? (
                      <DemoAvatar
                        name="You"
                        kind="person"
                        size="md"
                      />
                    ) : null}
                  </div>

                  {isExpanded ? (
                    <div className="rounded-lg border bg-muted/20 p-3">
                      <div className="space-y-2">
                        {messages.map((message) => (
                          <div
                            key={message.id}
                            className={`flex gap-3 ${message.role === "user" ? "justify-end" : "justify-start"}`}
                          >
                            {message.role !== "user" ? (
                              <DemoAvatar
                                name={message.role === "assistant" ? assistantName : "System"}
                                kind={message.role === "assistant" ? "blink" : "person"}
                                size="sm"
                              />
                            ) : null}
                            <div className={`max-w-[85%] rounded-xl border px-3 py-2 ${messageTone(message.role)}`}>
                              <p className="text-sm text-foreground">{message.body}</p>
                              <p className="mt-1 text-xs text-muted-foreground">
                                {message.role === "assistant" ? assistantName : message.role} · {formatTimestamp(message.createdAt)}
                              </p>
                            </div>
                            {message.role === "user" ? <DemoAvatar name="You" kind="person" size="sm" /> : null}
                          </div>
                        ))}
                        {isLiveAccount && liveStreamingPreview[item.exchangeId] ? (
                          <div className="flex gap-3 justify-start">
                            <DemoAvatar name={assistantName} kind="blink" size="sm" />
                            <div className={messageTone("assistant") + " max-w-[85%] rounded-xl border px-3 py-2"}>
                              <p className="text-sm text-foreground">
                                {liveStreamingPreview[item.exchangeId]?.text ?? "Blink is thinking…"}
                              </p>
                              <p className="mt-1 text-xs text-muted-foreground">
                                {assistantName} · streaming
                              </p>
                            </div>
                          </div>
                        ) : null}
                      </div>

                      {isOpen ? (
                        <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                          <Input
                            value={replyDrafts[item.exchangeId] ?? ""}
                            onChange={(event) =>
                              setReplyDrafts((current) => ({
                                ...current,
                                [item.exchangeId]: event.target.value,
                              }))
                            }
                            placeholder="Type a reply..."
                            className="h-10 flex-1"
                          />
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              disabled={
                                busyExchangeId === item.exchangeId ||
                                (replyDrafts[item.exchangeId] ?? "").trim().length === 0
                              }
                              onClick={async () => {
                                const text = (replyDrafts[item.exchangeId] ?? "").trim();
                                if (!text) return;
                                setBusyExchangeId(item.exchangeId);
                                if (isLiveAccount) {
                                  const currentMessages = getExchangeMessages(snapshot, item.exchangeId);
                                  await continueLiveDiscussion(item.exchangeId, text);
                                  const userMessage = {
                                    role: "user" as const,
                                    body: text,
                                    createdAt: new Date().toISOString(),
                                  };
                                  await runLiveAssistantTurn({
                                    exchangeId: item.exchangeId,
                                    userInput: text,
                                    exchangeMessages: [
                                      ...currentMessages.map((message) => ({
                                        role: message.role,
                                        body: message.body,
                                        createdAt: message.createdAt,
                                      })),
                                      userMessage,
                                    ],
                                  });
                                } else {
                                  await replyToAssistantExchange(item.exchangeId, text);
                                }
                                setReplyDrafts((current) => ({ ...current, [item.exchangeId]: "" }));
                                setBusyExchangeId(null);
                              }}
                            >
                              Send
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={busyExchangeId === item.exchangeId}
                              onClick={async () => {
                                setBusyExchangeId(item.exchangeId);
                                if (isLiveAccount) {
                                  await finalizeLiveDiscussion({
                                    exchangeId: item.exchangeId,
                                    turn: {
                                      t: "ans",
                                      c: "Done.",
                                    },
                                  });
                                } else {
                                  await resolveAssistantExchange(item.exchangeId);
                                }
                                setBusyExchangeId(null);
                              }}
                            >
                              Done
                            </Button>
                          </div>
                        </div>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              );
            })
          )}
        </div>
      </CardContent>

      <div className="border-t px-4 py-3">
        <div className="flex flex-col gap-2 sm:flex-row">
          <Input
            value={topLevelText}
            onChange={(event) => setTopLevelText(event.target.value)}
            placeholder={
              isLiveAccount
                ? "Ask me a question or ask me to create a document..."
                : `Type a message to ${assistantName}...`
            }
            className="h-11 flex-1"
          />
          <Button
            size="sm"
            className="h-11 px-5"
            disabled={busyTopLevel || topLevelText.trim().length === 0}
            onClick={async () => {
              const text = topLevelText.trim();
              if (!text) return;
              setBusyTopLevel(true);
              if (isLiveAccount) {
                const exchangeId = await startLiveDiscussion(conversationId, text);
                if (exchangeId) {
                  const baseMessages = [
                    {
                      role: "user" as const,
                      body: text,
                      createdAt: new Date().toISOString(),
                    },
                  ];
                  await runLiveAssistantTurn({
                    exchangeId,
                    userInput: text,
                    exchangeMessages: baseMessages,
                  });
                  setExpandedExchangeId(exchangeId);
                }
              } else {
                await startScopeDiscussion(conversationId, text);
              }
              setTopLevelText("");
              setBusyTopLevel(false);
            }}
          >
            Send
          </Button>
        </div>
      </div>
    </Card>
  );
}
