"use client";

import { AssistantConversationPanel } from "@/components/demo/assistant-conversation-panel";
import type {
  ActivityRecord,
  AttentionItem,
  DocumentRecord,
  ScopeRecord,
  ThreadRecord,
} from "@/lib/demo/types";

export function ScopeAssistantTab({
  scope,
  threads: _threads,
  documents: _documents,
  recentActivity: _recentActivity,
  attentionItems: _attentionItems,
  onAddThread: _onAddThread,
  onAddDocument: _onAddDocument,
  onSendMessage: _onSendMessage,
}: {
  scope: ScopeRecord;
  threads: ThreadRecord[];
  documents: DocumentRecord[];
  recentActivity: ActivityRecord[];
  attentionItems: AttentionItem[];
  onAddThread: () => Promise<void>;
  onAddDocument: () => Promise<void>;
  onSendMessage: (text: string) => Promise<void>;
}) {
  return <AssistantConversationPanel scope={scope} />;
}
