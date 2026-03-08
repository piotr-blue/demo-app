import type {
  ResolvedStatusMessage,
  WorkspaceState,
} from "@/lib/workspace/types";
import {
  deriveThreadFallbackSummary,
  deriveThreadFallbackTitle,
} from "@/lib/blueprint/metadata";

function firstUserPrompt(workspace: Pick<WorkspaceState, "messages">): string | null {
  for (const message of workspace.messages) {
    if (message.role !== "user") {
      continue;
    }
    const text = message.parts
      .filter((part): part is { type: "text"; text: string } => part.type === "text")
      .map((part) => part.text.trim())
      .filter(Boolean)
      .join("\n")
      .trim();
    if (text) {
      return text;
    }
  }
  return null;
}

function compact(value: string | null | undefined): string | null {
  if (!value) {
    return null;
  }
  const collapsed = value.replace(/\s+/g, " ").trim();
  return collapsed.length > 0 ? collapsed : null;
}

function trimForLabel(value: string, maxLength: number): string {
  return value.length <= maxLength ? value : `${value.slice(0, maxLength - 1)}…`;
}

export function deriveThreadMeta(workspace: Pick<
  WorkspaceState,
  "messages" | "blueprintMetadata" | "resolvedStatus"
>): {
  threadTitle: string;
  threadSummary: string;
} {
  const resolved = workspace.resolvedStatus as ResolvedStatusMessage | null;
  if (resolved && compact(resolved.title)) {
    return {
      threadTitle: trimForLabel(compact(resolved.title) ?? "Untitled thread", 80),
      threadSummary: trimForLabel(
        compact(resolved.body) ?? "Status message available.",
        140
      ),
    };
  }

  const promptText = firstUserPrompt(workspace);
  return {
    threadTitle: deriveThreadFallbackTitle(workspace.blueprintMetadata, promptText),
    threadSummary: deriveThreadFallbackSummary(workspace.blueprintMetadata, promptText),
  };
}

