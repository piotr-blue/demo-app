import type { InspectorTab, UserCredentials } from "@/lib/workspace/types";

const STORAGE_KEYS = {
  credentials: "blueStudio.credentials",
  activeWorkspaceId: "blueStudio.activeWorkspaceId",
  selectedTab: "blueStudio.selectedTab",
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

export function readActiveWorkspaceId(): string | null {
  if (typeof window === "undefined") {
    return null;
  }
  return window.localStorage.getItem(STORAGE_KEYS.activeWorkspaceId);
}

export function writeActiveWorkspaceId(workspaceId: string): void {
  if (typeof window === "undefined") {
    return;
  }
  window.localStorage.setItem(STORAGE_KEYS.activeWorkspaceId, workspaceId);
}

export function readSelectedTab(): InspectorTab | null {
  if (typeof window === "undefined") {
    return null;
  }
  const value = window.localStorage.getItem(STORAGE_KEYS.selectedTab);
  if (!value) {
    return null;
  }
  return value as InspectorTab;
}

export function writeSelectedTab(tab: InspectorTab): void {
  if (typeof window === "undefined") {
    return;
  }
  window.localStorage.setItem(STORAGE_KEYS.selectedTab, tab);
}

export function clearLocalWorkspaceStorage(): void {
  if (typeof window === "undefined") {
    return;
  }
  window.localStorage.removeItem(STORAGE_KEYS.activeWorkspaceId);
  window.localStorage.removeItem(STORAGE_KEYS.selectedTab);
}
