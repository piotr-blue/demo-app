import type { DemoCredentials } from "@/lib/demo/types";

const DEMO_STORAGE_KEYS = {
  credentials: "myosDemo.credentials",
  lastRoute: "myosDemo.lastRoute",
  leftRailCollapsed: "myosDemo.leftRailCollapsed",
} as const;

const DEFAULT_MYOS_BASE_URL = "https://api.dev.myos.blue/";

export function readDemoCredentials(): DemoCredentials | null {
  if (typeof window === "undefined") {
    return null;
  }
  const stored = window.localStorage.getItem(DEMO_STORAGE_KEYS.credentials);
  if (!stored) {
    return null;
  }
  try {
    const parsed = JSON.parse(stored) as Partial<DemoCredentials>;
    if (
      typeof parsed.openAiApiKey !== "string" ||
      typeof parsed.myOsApiKey !== "string" ||
      typeof parsed.myOsAccountId !== "string" ||
      typeof parsed.myOsBaseUrl !== "string"
    ) {
      return null;
    }
    return parsed as DemoCredentials;
  } catch {
    return null;
  }
}

export function writeDemoCredentials(credentials: DemoCredentials): void {
  if (typeof window === "undefined") {
    return;
  }
  window.localStorage.setItem(DEMO_STORAGE_KEYS.credentials, JSON.stringify(credentials));
}

export function clearDemoCredentials(): void {
  if (typeof window === "undefined") {
    return;
  }
  window.localStorage.removeItem(DEMO_STORAGE_KEYS.credentials);
}

export function emptyDemoCredentials(): DemoCredentials {
  return {
    openAiApiKey: "",
    myOsApiKey: "",
    myOsAccountId: "",
    myOsBaseUrl: DEFAULT_MYOS_BASE_URL,
  };
}

export function readDemoLastRoute(): string | null {
  if (typeof window === "undefined") {
    return null;
  }
  return window.localStorage.getItem(DEMO_STORAGE_KEYS.lastRoute);
}

export function writeDemoLastRoute(route: string): void {
  if (typeof window === "undefined") {
    return;
  }
  window.localStorage.setItem(DEMO_STORAGE_KEYS.lastRoute, route);
}

export function clearDemoLastRoute(): void {
  if (typeof window === "undefined") {
    return;
  }
  window.localStorage.removeItem(DEMO_STORAGE_KEYS.lastRoute);
}

export function readDemoLeftRailCollapsed(): boolean {
  if (typeof window === "undefined") {
    return false;
  }
  return window.localStorage.getItem(DEMO_STORAGE_KEYS.leftRailCollapsed) === "true";
}

export function writeDemoLeftRailCollapsed(collapsed: boolean): void {
  if (typeof window === "undefined") {
    return;
  }
  window.localStorage.setItem(DEMO_STORAGE_KEYS.leftRailCollapsed, collapsed ? "true" : "false");
}
