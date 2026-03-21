import { BLINK_SCOPE_ID } from "@/lib/demo/seed";
import type { DemoSnapshot, DocumentRecord, ScopeRecord, ThreadRecord } from "@/lib/demo/types";

export function getBlinkScope(snapshot: DemoSnapshot): ScopeRecord | null {
  return snapshot.scopes.find((scope) => scope.id === BLINK_SCOPE_ID || scope.type === "blink") ?? null;
}

export function getScopeById(snapshot: DemoSnapshot, scopeId: string): ScopeRecord | null {
  return snapshot.scopes.find((scope) => scope.id === scopeId) ?? null;
}

export function getThreadById(snapshot: DemoSnapshot, threadId: string): ThreadRecord | null {
  return snapshot.threads.find((thread) => thread.id === threadId) ?? null;
}

export function getDocumentById(snapshot: DemoSnapshot, documentId: string): DocumentRecord | null {
  return snapshot.documents.find((document) => document.id === documentId) ?? null;
}

export function getWorkspaceScopes(snapshot: DemoSnapshot): ScopeRecord[] {
  return snapshot.scopes
    .filter((scope) => scope.type === "workspace")
    .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));
}

export function getScopeThreads(snapshot: DemoSnapshot, scopeId: string): ThreadRecord[] {
  return snapshot.threads
    .filter((thread) => thread.scopeId === scopeId)
    .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));
}

export function getScopeDocuments(snapshot: DemoSnapshot, scopeId: string): DocumentRecord[] {
  return snapshot.documents
    .filter((document) => document.scopeId === scopeId)
    .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));
}

export function getRootDocuments(snapshot: DemoSnapshot): DocumentRecord[] {
  return snapshot.documents
    .filter((document) => document.scopeId === null)
    .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));
}

export function getScopeAttention(snapshot: DemoSnapshot, scopeId: string) {
  return snapshot.attentionItems
    .filter((item) => item.scopeId === scopeId && item.status === "pending")
    .sort((left, right) => right.createdAt.localeCompare(left.createdAt));
}

export function getScopeActivity(snapshot: DemoSnapshot, scopeId: string) {
  return snapshot.activity
    .filter((entry) => entry.scopeId === scopeId)
    .sort((left, right) => right.createdAt.localeCompare(left.createdAt));
}
