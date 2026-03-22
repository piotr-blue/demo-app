import { createActivityId } from "@/lib/demo/ids";
import type { DocumentUiCard, ScopeRecord, ThreadRecord } from "@/lib/demo/types";

export function buildThreadUiCards(thread: ThreadRecord, scope: ScopeRecord | null): DocumentUiCard[] {
  return [
    {
      id: createActivityId(),
      title: "Thread summary",
      body: thread.summary || "No summary available yet.",
    },
    {
      id: createActivityId(),
      title: "Current status",
      body: `This thread is currently ${thread.status}.`,
    },
    {
      id: createActivityId(),
      title: "Scope",
      body: scope ? `Belongs to ${scope.name}.` : "Scope metadata unavailable.",
    },
  ];
}

export function buildGenericDocumentCards(title: string, status: string): DocumentUiCard[] {
  return [
    {
      id: createActivityId(),
      title: "Document overview",
      body: `${title} is currently marked as ${status}.`,
    },
    {
      id: createActivityId(),
      title: "Suggested next action",
      body: "Review details and decide whether this should spawn a new thread.",
    },
  ];
}
