import type { InspectorTab, UserCredentials } from "@/lib/workspace/types";

const STORAGE_KEYS = {
  credentials: "blueStudio.credentials",
  lastVisitedThreadId: "blueStudio.lastVisitedThreadId",
  browserInstallId: "blueStudio.browserInstallId",
  webhookRegistrationPrefix: "blueStudio.webhookRegistration.",
} as const;

export interface StoredWebhookRegistration {
  registrationId: string;
  webhookId: string;
  accountHash: string;
  browserId: string;
  createdAt: string;
  updatedAt: string;
}

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

function nowId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export function getOrCreateBrowserInstallId(): string | null {
  if (typeof window === "undefined") {
    return null;
  }
  const existing = window.localStorage.getItem(STORAGE_KEYS.browserInstallId);
  if (existing && existing.trim().length > 0) {
    return existing;
  }
  const created = nowId("browser");
  window.localStorage.setItem(STORAGE_KEYS.browserInstallId, created);
  return created;
}

export function clearBrowserInstallId(): void {
  if (typeof window === "undefined") {
    return;
  }
  window.localStorage.removeItem(STORAGE_KEYS.browserInstallId);
}

export function buildAccountHash(baseUrl: string, accountId: string): string {
  return `${baseUrl.trim().toLowerCase()}::${accountId.trim().toLowerCase()}`;
}

function webhookRegistrationStorageKey(accountHash: string): string {
  return `${STORAGE_KEYS.webhookRegistrationPrefix}${accountHash}`;
}

export function readWebhookRegistration(accountHash: string): StoredWebhookRegistration | null {
  if (typeof window === "undefined") {
    return null;
  }
  const value = window.localStorage.getItem(webhookRegistrationStorageKey(accountHash));
  if (!value) {
    return null;
  }
  try {
    return JSON.parse(value) as StoredWebhookRegistration;
  } catch {
    return null;
  }
}

export function writeWebhookRegistration(
  accountHash: string,
  registration: StoredWebhookRegistration
): void {
  if (typeof window === "undefined") {
    return;
  }
  window.localStorage.setItem(
    webhookRegistrationStorageKey(accountHash),
    JSON.stringify(registration)
  );
}

export function clearWebhookRegistration(accountHash: string): void {
  if (typeof window === "undefined") {
    return;
  }
  window.localStorage.removeItem(webhookRegistrationStorageKey(accountHash));
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
