import { BLINK_SCOPE_ID } from "@/lib/demo/seed";
import type { DemoSnapshot } from "@/lib/demo/types";

export type DemoSearchFilter = "all" | "workspaces" | "documents" | "threads" | "services";

export interface DemoSearchResult {
  id: string;
  type: "workspace" | "document" | "thread" | "service";
  title: string;
  subtitle: string;
  scope: string;
  status: string | null;
  href: string;
  icon: string;
  score: number;
}

function normalize(text: string): string {
  return text.toLowerCase().trim();
}

function scoreText(haystack: string, query: string): number {
  if (!query) {
    return 1;
  }
  const normalizedHaystack = normalize(haystack);
  if (normalizedHaystack === query) {
    return 100;
  }
  if (normalizedHaystack.startsWith(query)) {
    return 70;
  }
  if (normalizedHaystack.includes(query)) {
    return 40;
  }
  return 0;
}

function scopeNameFromScopeId(snapshot: DemoSnapshot, scopeId: string | null): string {
  if (scopeId === null || scopeId === BLINK_SCOPE_ID) {
    return "Home";
  }
  return snapshot.scopes.find((scope) => scope.id === scopeId)?.name ?? "Workspace";
}

export function searchSnapshot(
  snapshot: DemoSnapshot,
  queryRaw: string,
  filter: DemoSearchFilter = "all"
): DemoSearchResult[] {
  const query = normalize(queryRaw);
  const results: DemoSearchResult[] = [];

  if (filter === "all" || filter === "workspaces") {
    for (const workspace of snapshot.scopes.filter((scope) => scope.type === "workspace")) {
      const haystack = [workspace.name, workspace.description, workspace.searchKeywords.join(" ")].join(" ");
      const score = scoreText(haystack, query);
      if (query && score === 0) {
        continue;
      }
      results.push({
        id: workspace.id,
        type: "workspace",
        title: workspace.name,
        subtitle: workspace.description,
        scope: "Workspace",
        status: workspace.bootstrapStatus,
        href: `/workspaces/${encodeURIComponent(workspace.id)}`,
        icon: workspace.icon ?? "🧩",
        score: score + 20,
      });
    }
  }

  if (filter === "all" || filter === "threads") {
    for (const thread of snapshot.threads) {
      const scopeName = scopeNameFromScopeId(snapshot, thread.scopeId);
      const haystack = [thread.title, thread.summary, thread.tags.join(" "), scopeName].join(" ");
      const score = scoreText(haystack, query);
      if (query && score === 0) {
        continue;
      }
      results.push({
        id: thread.id,
        type: "thread",
        title: thread.title,
        subtitle: thread.summary,
        scope: scopeName,
        status: thread.status,
        href: `/threads/${encodeURIComponent(thread.id)}`,
        icon: "🧵",
        score: score + 12,
      });
    }
  }

  if (filter === "all" || filter === "documents" || filter === "services") {
    for (const document of snapshot.documents) {
      const isService = document.isService;
      if (filter === "services" && !isService) {
        continue;
      }
      if (filter === "documents" && isService) {
        continue;
      }
      const scopeName = scopeNameFromScopeId(snapshot, document.scopeId);
      const haystack = [
        document.title,
        document.summary,
        document.tags.join(" "),
        document.searchKeywords.join(" "),
        scopeName,
      ].join(" ");
      const score = scoreText(haystack, query);
      if (query && score === 0) {
        continue;
      }
      results.push({
        id: document.id,
        type: isService ? "service" : "document",
        title: document.title,
        subtitle: document.summary,
        scope: scopeName,
        status: document.status,
        href: `/documents/${encodeURIComponent(document.id)}`,
        icon: isService ? "🔌" : "📄",
        score: score + (isService ? 10 : 8),
      });
    }
  }

  return results
    .sort((left, right) => {
      if (right.score !== left.score) {
        return right.score - left.score;
      }
      return left.title.localeCompare(right.title);
    })
    .slice(0, 60);
}
