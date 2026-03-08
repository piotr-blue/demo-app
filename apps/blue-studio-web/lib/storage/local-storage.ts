import type { InspectorTab, UserCredentials } from "@/lib/workspace/types";

const STORAGE_KEYS = {
  credentials: "blueStudio.credentials",
  lastVisitedThreadId: "blueStudio.lastVisitedThreadId",
} as const;

export function readCredentials(): UserCredentials | null {
  if (typeof window === "undefined") {
    return null;
  }
  const value = window.localStorage.getItem(STORAGE_KEYS.credentials);
  if (!value) {
    return null;
  }
  try {
    return JSON.parse(value) as UserCredentials;
  } catch {
    return null;
  }
}

export function writeCredentials(credentials: UserCredentials): void {
  if (typeof window === "undefined") {
    return;
  }
  window.localStorage.setItem(STORAGE_KEYS.credentials, JSON.stringify(credentials));
}

export function clearCredentials(): void {
  if (typeof window === "undefined") {
    return;
  }
  window.localStorage.removeItem(STORAGE_KEYS.credentials);
}

export function readLastVisitedThreadId(): string | null {
  if (typeof window === "undefined") {
    return null;
  }
  return window.localStorage.getItem(STORAGE_KEYS.lastVisitedThreadId);
}

export function writeLastVisitedThreadId(threadId: string): void {
  if (typeof window === "undefined") {
    return;
  }
  window.localStorage.setItem(STORAGE_KEYS.lastVisitedThreadId, threadId);
}

export function clearThreadRoutingStorage(): void {
  if (typeof window === "undefined") {
    return;
  }
  window.localStorage.removeItem(STORAGE_KEYS.lastVisitedThreadId);
}

export function readSelectedTab(): InspectorTab | null {
  return null;
}

export function writeSelectedTab(tab: InspectorTab): void {
  void tab;
  // selected inspector tab is persisted per-workspace in IndexedDB state
}

// Backward-compatible aliases for in-flight callers.
export const readActiveWorkspaceId = readLastVisitedThreadId;
export const writeActiveWorkspaceId = writeLastVisitedThreadId;
export const clearLocalWorkspaceStorage = clearThreadRoutingStorage;
