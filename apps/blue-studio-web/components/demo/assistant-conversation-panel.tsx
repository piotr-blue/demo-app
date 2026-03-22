"use client";

import { useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useDemoApp } from "@/components/demo/demo-provider";
import {
  getAssistantTimelineItems,
  getExchangeMessages,
  getOpenAssistantExchanges,
  getScopeAssistantConversation,
  getScopeAssistantExchanges,
} from "@/lib/demo/selectors";
import type { ScopeRecord } from "@/lib/demo/types";

function formatTimestamp(value: string): string {
  return new Date(value).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function statusVariant(status: string): "default" | "secondary" | "destructive" | "outline" {
  if (status === "resolved") {
    return "secondary";
  }
  if (status === "dismissed") {
    return "outline";
  }
  if (status === "open") {
    return "default";
  }
  return "outline";
}

export function AssistantConversationPanel({ scope }: { scope: ScopeRecord }) {
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

  if (!snapshot || !conversation) {
    return (
      <Card>
        <CardContent className="pt-5 text-sm text-text-muted">
          Assistant conversation is initializing…
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-5">
      <Card>
        <CardContent className="space-y-4 pt-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="demo-page-eyebrow">Assistant conversation</p>
              <h2 className="mt-1 text-section-title">{scope.assistant.name}</h2>
              <p className="mt-1 text-caption">
                Canonical conversation for {scope.name} · updated {formatTimestamp(conversation.updatedAt)}
              </p>
            </div>
            <Button
              size="sm"
              disabled={busyTopLevel}
              onClick={async () => {
                setBusyTopLevel(true);
                const exchangeId = await startAssistantDemoDiscussion(scope.id);
                if (exchangeId) {
                  setExpandedExchangeId(exchangeId);
                  setExpandedAnchorId(null);
                }
                setBusyTopLevel(false);
              }}
            >
              Start demo discussion
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-3 pt-5">
          <div className="flex items-center justify-between">
            <h3 className="text-section-title">Needs you</h3>
            <Badge variant={openAskExchanges.length > 0 ? "destructive" : "secondary"}>
              {openAskExchanges.length}
            </Badge>
          </div>
          {openAskExchanges.length === 0 ? (
            <div className="demo-empty-state">
              <p className="text-body">No open asks right now.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {openAskExchanges.map((exchange) => (
                <button
                  key={exchange.id}
                  type="button"
                  className="w-full rounded-[16px] border border-destructive/20 bg-destructive/5 px-4 py-3 text-left transition hover:border-destructive/35"
                  onClick={() => {
                    setExpandedExchangeId(exchange.id);
                    setExpandedAnchorId(null);
                  }}
                >
                  <p className="text-sm font-semibold text-foreground">{exchange.title}</p>
                  <p className="mt-1 text-caption">
                    {attentionByExchangeId.get(exchange.id) ?? "Pending decision"}
                  </p>
                </button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-4 pt-5">
          <h3 className="text-section-title">Timeline</h3>
          {timelineItems.length === 0 ? (
            <div className="demo-empty-state">
              <p className="text-body">No discussions yet. Start one above.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {timelineItems.map((item) => {
                const exchange = exchanges.find((entry) => entry.id === item.exchangeId);
                const messages = getExchangeMessages(snapshot, item.exchangeId);
                const resolutionPreview =
                  exchange?.resolutionMessageId && item.kind === "opener"
                    ? messages.find((message) => message.id === exchange.resolutionMessageId)?.body
                    : null;
                const isExpanded = item.id === activeExpandedAnchorId;

                return (
                  <div key={item.id} className="rounded-[18px] border border-border-soft bg-card">
                    <button
                      type="button"
                      className={`w-full rounded-[18px] px-4 py-3 text-left transition ${
                        isExpanded ? "bg-accent-soft/50" : "hover:bg-bg-subtle/80"
                      }`}
                      onClick={() => {
                        setExpandedExchangeId(item.exchangeId);
                        setExpandedAnchorId(item.id);
                      }}
                    >
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="outline">{item.role}</Badge>
                        <Badge variant="outline">{item.exchangeType}</Badge>
                        <Badge variant={statusVariant(item.exchangeStatus)}>{item.exchangeStatus}</Badge>
                        <Badge variant="secondary">{item.kind}</Badge>
                        {item.requiresUserAction ? <Badge variant="destructive">Needs action</Badge> : null}
                      </div>
                      <p className="mt-3 text-sm font-medium text-foreground">{item.body}</p>
                      {resolutionPreview ? (
                        <p className="mt-1 text-caption">Final: {resolutionPreview}</p>
                      ) : null}
                      <p className="mt-2 text-caption">
                        Replies: {item.replyCount} · {formatTimestamp(item.createdAt)}
                      </p>
                    </button>

                    {isExpanded && exchange ? (
                      <div className="border-t border-border-soft px-4 py-4">
                        <div className="space-y-2">
                          {messages.map((message) => (
                            <div
                              key={message.id}
                              className={`rounded-xl border px-3 py-2.5 ${
                                message.role === "assistant"
                                  ? "border-border-soft bg-bg-subtle/70"
                                  : message.role === "user"
                                    ? "border-accent-base/25 bg-accent-soft/55"
                                    : "border-border-soft bg-card"
                              }`}
                            >
                              <div className="flex items-center gap-2">
                                <Badge variant="outline">{message.role}</Badge>
                                <Badge variant="secondary">{message.kind}</Badge>
                              </div>
                              <p className="mt-2 text-sm text-foreground">{message.body}</p>
                              <p className="mt-2 text-caption">{formatTimestamp(message.createdAt)}</p>
                            </div>
                          ))}
                        </div>
                        {exchange.status === "open" || exchange.status === "in-progress" ? (
                          <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                            <Input
                              value={replyDrafts[exchange.id] ?? ""}
                              onChange={(event) =>
                                setReplyDrafts((current) => ({
                                  ...current,
                                  [exchange.id]: event.target.value,
                                }))
                              }
                              placeholder="Reply in this discussion…"
                              className="h-10 flex-1"
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
                                Reply
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
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-3 pt-5">
          <h3 className="text-section-title">New discussion</h3>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Input
              value={topLevelText}
              onChange={(event) => setTopLevelText(event.target.value)}
              placeholder={`Start a new discussion with ${scope.assistant.name}...`}
              className="h-11 flex-1"
            />
            <Button
              size="sm"
              className="h-11 px-4"
              disabled={busyTopLevel || topLevelText.trim().length === 0}
              onClick={async () => {
                const text = topLevelText.trim();
                if (!text) {
                  return;
                }
                setBusyTopLevel(true);
                const exchangeId = await startScopeDiscussion(scope.id, text);
                if (exchangeId) {
                  setExpandedExchangeId(exchangeId);
                  setExpandedAnchorId(null);
                }
                setTopLevelText("");
                setBusyTopLevel(false);
              }}
            >
              Start discussion
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
