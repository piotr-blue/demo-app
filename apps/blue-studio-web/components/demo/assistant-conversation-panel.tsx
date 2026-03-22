"use client";
/* eslint-disable react-hooks/set-state-in-effect */

import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useDemoApp } from "@/components/demo/demo-provider";
import {
  type AssistantTimelineItem,
  getAssistantTimelineItems,
  getExchangeMessages,
  getOpenAssistantExchanges,
  getScopeAssistantConversation,
  getScopeAssistantExchanges,
} from "@/lib/demo/selectors";
import type { ScopeRecord } from "@/lib/demo/types";

function formatTimestamp(value: string): string {
  return new Date(value).toLocaleString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatDayLabel(value: string): string {
  const date = new Date(value);
  const today = new Date();
  const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const startOfDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const diffDays = Math.floor((startOfToday.getTime() - startOfDate.getTime()) / 86_400_000);
  if (diffDays === 0) {
    return "Today";
  }
  if (diffDays === 1) {
    return "Yesterday";
  }
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function roleLabel(role: "assistant" | "user" | "system"): string {
  if (role === "assistant") {
    return "🤖";
  }
  if (role === "user") {
    return "You";
  }
  return "System";
}

export function AssistantConversationPanel({
  scope,
  fullHeight = false,
}: {
  scope: ScopeRecord;
  fullHeight?: boolean;
}) {
  const {
    snapshot,
    startAssistantDemoDiscussion,
    startScopeDiscussion,
    replyToAssistantExchange,
    resolveAssistantExchange,
  } = useDemoApp();
  const [topLevelText, setTopLevelText] = useState("");
  const [busyTopLevel, setBusyTopLevel] = useState(false);
  const [expandedExchangeId, setExpandedExchangeId] = useState<string | null>(null);
  const [expandedAnchorId, setExpandedAnchorId] = useState<string | null>(null);
  const [replyDrafts, setReplyDrafts] = useState<Record<string, string>>({});
  const [busyExchangeId, setBusyExchangeId] = useState<string | null>(null);
  const anchorRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const scrollViewportRef = useRef<HTMLDivElement | null>(null);

  const conversation = useMemo(
    () => (snapshot ? getScopeAssistantConversation(snapshot, scope.id) : null),
    [scope.id, snapshot]
  );
  const exchanges = useMemo(
    () => (snapshot ? getScopeAssistantExchanges(snapshot, scope.id) : []),
    [scope.id, snapshot]
  );
  const timelineItems = useMemo(
    () => (snapshot ? getAssistantTimelineItems(snapshot, scope.id) : []),
    [scope.id, snapshot]
  );
  const openAskExchanges = useMemo(
    () =>
      snapshot
        ? getOpenAssistantExchanges(snapshot, scope.id).filter((exchange) => exchange.type === "ask")
        : [],
    [scope.id, snapshot]
  );

  const attentionByExchangeId = useMemo(() => {
    if (!snapshot) {
      return new Map<string, string>();
    }
    return new Map(
      snapshot.attentionItems
        .filter((item) => item.status === "pending" && item.relatedExchangeId)
        .map((item) => [item.relatedExchangeId as string, item.title])
    );
  }, [snapshot]);

  const activeExpandedAnchorId = useMemo(() => {
    if (!expandedExchangeId) {
      return null;
    }
    if (
      expandedAnchorId &&
      timelineItems.some(
        (item) => item.id === expandedAnchorId && item.exchangeId === expandedExchangeId
      )
    ) {
      return expandedAnchorId;
    }
    const openerAnchor = timelineItems.find(
      (item) => item.exchangeId === expandedExchangeId && item.kind === "opener"
    );
    if (openerAnchor) {
      return openerAnchor.id;
    }
    return timelineItems.find((item) => item.exchangeId === expandedExchangeId)?.id ?? null;
  }, [expandedAnchorId, expandedExchangeId, timelineItems]);

  const timelineItemsForHistory = useMemo(() => {
    const resolutionByExchange = new Map(
      timelineItems
        .filter((item) => item.kind === "resolution")
        .map((item) => [item.exchangeId, item])
    );
    const baseItems = timelineItems.filter((item) => {
      const hasResolution = resolutionByExchange.has(item.exchangeId);
      if (!hasResolution) {
        return item.kind === "opener";
      }
      return item.kind === "resolution";
    });
    const representedExchangeIds = new Set(baseItems.map((item) => item.exchangeId));
    const synthesizedOpenAskItems: AssistantTimelineItem[] = openAskExchanges
      .filter((exchange) => !representedExchangeIds.has(exchange.id))
      .map((exchange) => ({
        id: `${exchange.id}_synthetic_opener`,
        exchangeId: exchange.id,
        messageId: exchange.openerMessageId,
        kind: "opener",
        role: "assistant",
        body: attentionByExchangeId.get(exchange.id) ?? exchange.title,
        createdAt: exchange.openedAt,
        exchangeStatus: exchange.status,
        exchangeType: exchange.type,
        exchangeTitle: exchange.title,
        replyCount: exchange.replyCount,
        requiresUserAction: exchange.requiresUserAction,
      }));

    return [...baseItems, ...synthesizedOpenAskItems].sort((left, right) =>
      left.createdAt.localeCompare(right.createdAt)
    );
  }, [attentionByExchangeId, openAskExchanges, timelineItems]);

  useEffect(() => {
    if (!expandedExchangeId) {
      return;
    }
    const stillExists = exchanges.some((exchange) => exchange.id === expandedExchangeId);
    if (!stillExists) {
      setExpandedExchangeId(null);
      setExpandedAnchorId(null);
    }
  }, [expandedExchangeId, exchanges]);

  useEffect(() => {
    const node = scrollViewportRef.current;
    if (!node) {
      return;
    }
    const frame = requestAnimationFrame(() => {
      node.scrollTop = node.scrollHeight;
    });
    return () => cancelAnimationFrame(frame);
  }, [scope.id, timelineItemsForHistory.length, openAskExchanges.length]);

  const focusExchange = (exchangeId: string) => {
    const opener = timelineItems.find(
      (item) => item.exchangeId === exchangeId && item.kind === "opener"
    );
    const targetAnchor = opener ?? timelineItems.find((item) => item.exchangeId === exchangeId) ?? null;
    setExpandedExchangeId(exchangeId);
    setExpandedAnchorId(targetAnchor?.id ?? null);
    if (targetAnchor) {
      setTimeout(() => {
        anchorRefs.current[targetAnchor.id]?.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      }, 10);
    }
  };

  const sendTopLevelMessage = async () => {
    const text = topLevelText.trim();
    if (!text || busyTopLevel) {
      return;
    }
    setBusyTopLevel(true);
    const exchangeId = await startScopeDiscussion(scope.id, text);
    if (exchangeId) {
      focusExchange(exchangeId);
    }
    setTopLevelText("");
    setBusyTopLevel(false);
  };

  if (!snapshot || !conversation) {
    return (
      <Card>
        <CardContent className="pt-5 text-sm text-text-muted">
          Assistant conversation is initializing…
        </CardContent>
      </Card>
    );
  }

  const recapCreatedAt = conversation.createdAt;
  let lastDay: string | null = null;

  return (
    <Card className={fullHeight ? "flex h-full flex-col overflow-hidden" : "overflow-hidden"}>
      <div className="flex items-center justify-between border-b px-4 py-3">
        <div>
          <p className="text-sm font-semibold text-foreground">🤖 {scope.assistant.name} · Active</p>
          <p className="text-caption">Canonical conversation · {scope.name}</p>
        </div>
        <Button
          size="sm"
          variant="outline"
          disabled={busyTopLevel}
          onClick={async () => {
            setBusyTopLevel(true);
            const exchangeId = await startAssistantDemoDiscussion(scope.id);
            if (exchangeId) {
              focusExchange(exchangeId);
            }
            setBusyTopLevel(false);
          }}
        >
          🎲 Demo ask
        </Button>
      </div>

      <CardContent
        ref={scrollViewportRef}
        className={`space-y-3 overflow-y-auto px-4 py-4 ${fullHeight ? "min-h-0 flex-1" : "max-h-[460px]"}`}
      >
        {openAskExchanges.length > 0 ? (
          <div className="sticky top-0 z-10 rounded-lg border border-destructive/25 bg-background px-3 py-2.5 shadow-xs">
            <p className="text-sm font-medium text-foreground">
              🔴 {openAskExchanges.length} item{openAskExchanges.length > 1 ? "s" : ""} need you
            </p>
            <div className="mt-2 space-y-1.5">
              {openAskExchanges.map((exchange) => (
                <div
                  key={exchange.id}
                  className="flex items-center justify-between gap-2 rounded-lg bg-card px-2.5 py-1.5"
                >
                  <p className="line-clamp-1 text-sm text-foreground">
                    {attentionByExchangeId.get(exchange.id) ?? exchange.title}
                  </p>
                  <button
                    type="button"
                    className="text-xs font-medium text-accent-base hover:text-accent-base/80"
                    onClick={() => focusExchange(exchange.id)}
                  >
                    Reply →
                  </button>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        <div className="space-y-4">
          {(() => {
            const recapDay = formatDayLabel(recapCreatedAt);
            lastDay = recapDay;
            return (
              <>
                <p className="text-center text-xs font-medium uppercase tracking-[0.08em] text-text-muted">
                  {recapDay}
                </p>
                <div className="flex justify-start">
                  <div className="max-w-[85%] rounded-2xl bg-bg-subtle px-4 py-3">
                    <p className="text-sm text-foreground">🤖 Here&apos;s what happened while you were away:</p>
                    <ul className="mt-2 space-y-1 text-sm text-foreground">
                      {scope.recap.updates.map((entry) => (
                        <li key={entry} className="leading-6">
                          • {entry}
                        </li>
                      ))}
                    </ul>
                    {scope.recap.asks.length > 0 ? (
                      <>
                        <p className="mt-3 text-sm font-medium text-foreground">Needs attention:</p>
                        <ul className="mt-1 space-y-1 text-sm text-foreground">
                          {scope.recap.asks.map((ask) => (
                            <li key={ask} className="leading-6">
                              • {ask}
                            </li>
                          ))}
                        </ul>
                      </>
                    ) : null}
                    <p className="mt-2 text-right text-xs text-text-muted">
                      {formatTimestamp(recapCreatedAt)}
                    </p>
                  </div>
                </div>
              </>
            );
          })()}

          {timelineItemsForHistory.length === 0 ? (
            <p className="py-8 text-center text-sm text-text-muted">Start a message to begin the conversation.</p>
          ) : (
            timelineItemsForHistory.map((item) => {
              const dayLabel = formatDayLabel(item.createdAt);
              const dayBreak = dayLabel !== lastDay;
              lastDay = dayLabel;
              const exchange = exchanges.find((entry) => entry.id === item.exchangeId);
              const messages = getExchangeMessages(snapshot, item.exchangeId);
              const isOpen = exchange?.status === "open" || exchange?.status === "in-progress";
              const isAskWaiting = exchange?.type === "ask" && isOpen;
              const isResolved = exchange?.status === "resolved";
              const alignRight = item.role === "user";
              const isExpanded = item.id === activeExpandedAnchorId;

              return (
                <div
                  key={item.id}
                  ref={(node) => {
                    anchorRefs.current[item.id] = node;
                  }}
                >
                  {dayBreak ? (
                    <p className="mb-2 text-center text-xs font-medium uppercase tracking-[0.08em] text-text-muted">
                      {dayLabel}
                    </p>
                  ) : null}
                  <div className={`flex ${alignRight ? "justify-end" : "justify-start"}`}>
                    <div className="max-w-[85%] space-y-2">
                      <button
                        type="button"
                  className={`w-full rounded-lg px-4 py-3 text-left transition ${
                          alignRight ? "bg-accent-soft/65" : "bg-bg-subtle"
                        } ${isAskWaiting ? "border border-destructive/30" : "border border-transparent"} ${
                          isResolved ? "opacity-85" : ""
                        }`}
                        onClick={() => {
                          setExpandedExchangeId(item.exchangeId);
                          setExpandedAnchorId(item.id);
                        }}
                      >
                        <p className="text-sm leading-6 text-foreground">
                          {isAskWaiting ? "🔴 " : ""}
                          {item.kind === "resolution" || isResolved ? "Final: " : ""}
                          {alignRight ? "You: " : `${roleLabel(item.role)} `}
                          {item.body}
                          {item.kind === "resolution" || isResolved ? " ✅" : ""}
                        </p>
                        {item.kind === "opener" && !isResolved ? (
                          <p className="mt-1 text-xs text-text-muted">
                            {isAskWaiting
                              ? "waiting for you"
                              : isResolved
                                ? `resolved · ${item.replyCount} ${item.replyCount === 1 ? "reply" : "replies"}`
                                : `${item.replyCount} ${item.replyCount === 1 ? "reply" : "replies"}`}
                          </p>
                        ) : null}
                        <p className="mt-2 text-right text-xs text-text-muted">{formatTimestamp(item.createdAt)}</p>
                      </button>

                      {isAskWaiting && !isExpanded ? (
                        <div className="flex gap-2 pl-2">
                          <Button size="sm" variant="outline" onClick={() => focusExchange(item.exchangeId)}>
                            Reply
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={async () => {
                              await resolveAssistantExchange(item.exchangeId);
                            }}
                          >
                            Dismiss
                          </Button>
                        </div>
                      ) : null}

                      {isExpanded && exchange ? (
                        <div className="ml-3 rounded-lg border border-border-soft/90 bg-card/70 p-3">
                          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                            Conversation history
                          </p>
                          <div className="space-y-2">
                            {messages.map((message, idx) => {
                              const isLastMessage = idx === messages.length - 1;
                              return (
                              <div key={message.id} className="py-0.5">
                                <p className="text-sm leading-6 text-foreground">
                                  {message.role === "assistant"
                                    ? "🤖"
                                    : message.role === "user"
                                      ? "You:"
                                      : "System:"}{" "}
                                  {message.kind === "resolution" ? "Final: " : ""}
                                  {message.body}
                                  {message.kind === "resolution" ? " ✅" : ""}
                                </p>
                                <div className="flex items-center gap-2 text-xs text-text-muted">
                                  <span>{formatTimestamp(message.createdAt)}</span>
                                  {isLastMessage ? (
                                    <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide">
                                      latest
                                    </span>
                                  ) : null}
                                </div>
                              </div>
                            )})}
                          </div>

                          {isOpen ? (
                            <div className="mt-2 flex flex-col gap-2 sm:flex-row">
                              <Input
                                value={replyDrafts[exchange.id] ?? ""}
                                onChange={(event) =>
                                  setReplyDrafts((current) => ({
                                    ...current,
                                    [exchange.id]: event.target.value,
                                  }))
                                }
                                placeholder="Type a reply..."
                                className="h-10 flex-1"
                                onKeyDown={(event) => {
                                  if (event.key !== "Enter") {
                                    return;
                                  }
                                  event.preventDefault();
                                  const text = (replyDrafts[exchange.id] ?? "").trim();
                                  if (!text || busyExchangeId === exchange.id) {
                                    return;
                                  }
                                  void (async () => {
                                    setBusyExchangeId(exchange.id);
                                    await replyToAssistantExchange(exchange.id, text);
                                    setReplyDrafts((current) => ({ ...current, [exchange.id]: "" }));
                                    setBusyExchangeId(null);
                                  })();
                                }}
                              />
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  disabled={
                                    busyExchangeId === exchange.id ||
                                    (replyDrafts[exchange.id] ?? "").trim().length === 0
                                  }
                                  onClick={async () => {
                                    const text = (replyDrafts[exchange.id] ?? "").trim();
                                    if (!text) {
                                      return;
                                    }
                                    setBusyExchangeId(exchange.id);
                                    await replyToAssistantExchange(exchange.id, text);
                                    setReplyDrafts((current) => ({ ...current, [exchange.id]: "" }));
                                    setBusyExchangeId(null);
                                  }}
                                >
                                  Send
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  disabled={busyExchangeId === exchange.id}
                                  onClick={async () => {
                                    setBusyExchangeId(exchange.id);
                                    await resolveAssistantExchange(exchange.id);
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
                  </div>
                </div>
              );
            })
          )}
        </div>
      </CardContent>

      <div className="border-t border-border-soft px-4 py-3">
        <div className="flex flex-col gap-2 sm:flex-row">
          <Input
            value={topLevelText}
            onChange={(event) => setTopLevelText(event.target.value)}
            placeholder={`Type a message to ${scope.assistant.name}...`}
            className="h-11 flex-1"
            onKeyDown={(event) => {
              if (event.key !== "Enter") {
                return;
              }
              event.preventDefault();
              void sendTopLevelMessage();
            }}
          />
          <Button
            size="sm"
            className="h-11 px-5"
            disabled={busyTopLevel || topLevelText.trim().length === 0}
            onClick={() => void sendTopLevelMessage()}
          >
            Send
          </Button>
        </div>
      </div>
    </Card>
  );
}
