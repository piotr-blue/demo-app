"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { DemoAvatar } from "@/components/demo/demo-avatar";
import { useDemoApp } from "@/components/demo/demo-provider";
import {
  getAssistantTimelineItems,
  getConversationExchanges,
  getConversationOpenExchanges,
  getExchangeMessages,
} from "@/lib/demo/selectors";

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

export function ConversationPanelV2({
  conversationId,
  assistantName,
  title,
  fullHeight = false,
}: {
  conversationId: string | null;
  assistantName: string;
  title: string;
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
  const [replyDrafts, setReplyDrafts] = useState<Record<string, string>>({});
  const [busyExchangeId, setBusyExchangeId] = useState<string | null>(null);
  const scrollViewportRef = useRef<HTMLDivElement | null>(null);

  const exchanges = useMemo(
    () => (snapshot && conversationId ? getConversationExchanges(snapshot, conversationId) : []),
    [conversationId, snapshot]
  );
  const timelineItems = useMemo(
    () => (snapshot && conversationId ? getAssistantTimelineItems(snapshot, conversationId) : []),
    [conversationId, snapshot]
  );
  const openAskExchanges = useMemo(
    () =>
      snapshot && conversationId
        ? getConversationOpenExchanges(snapshot, conversationId).filter((exchange) => exchange.type === "ask")
        : [],
    [conversationId, snapshot]
  );

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

  return (
    <Card className={fullHeight ? "flex h-full flex-col overflow-hidden" : "overflow-hidden"}>
      <div className="flex items-center justify-between border-b px-4 py-3">
        <div>
          <p className="text-sm font-semibold text-foreground">{assistantName}</p>
          <p className="text-xs text-muted-foreground">{title}</p>
        </div>
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
                                await replyToAssistantExchange(item.exchangeId, text);
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
                                await resolveAssistantExchange(item.exchangeId);
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
            placeholder={`Type a message to ${assistantName}...`}
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
              await startScopeDiscussion(conversationId, text);
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
