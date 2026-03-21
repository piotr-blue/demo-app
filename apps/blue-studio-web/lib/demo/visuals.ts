import type { ScopeRecord, WorkspaceTemplateKey } from "@/lib/demo/types";

export const MYOS_BRAND_ASSETS = {
  logo: "/myos/brand/myos-logo.svg",
  mark: "/myos/brand/blue-logo.svg",
} as const;

export const MYOS_DEMO_USER = {
  name: "Alice",
  handle: "alice@myos.blue",
  avatar: "/myos/avatars/alice.svg",
  mainAccountLabel: "Main account",
  subAccounts: [
    {
      id: "agent-spongebot",
      name: "Spongebot",
      subtitle: "shop assistant bot",
      avatar: "/myos/avatars/workspace-shop.svg",
    },
    {
      id: "agent-claude",
      name: "Claude",
      subtitle: "workspace archive",
      avatar: "/myos/avatars/workspace-business.svg",
    },
  ],
} as const;

const TEMPLATE_AVATARS: Record<WorkspaceTemplateKey, string> = {
  shop: "/myos/avatars/workspace-shop.svg",
  restaurant: "/myos/avatars/workspace-restaurant.svg",
  "generic-business": "/myos/avatars/workspace-business.svg",
};

export function getTemplateAvatar(templateKey?: WorkspaceTemplateKey | null): string {
  if (!templateKey) {
    return "/myos/avatars/workspace-generic.svg";
  }
  return TEMPLATE_AVATARS[templateKey];
}

export function getScopeAvatar(scope: ScopeRecord): string {
  if (scope.type === "blink") {
    return "/myos/avatars/blink.svg";
  }
  return getTemplateAvatar(scope.templateKey ?? null);
}

export function getScopeVisualLabel(scope: ScopeRecord): string {
  if (scope.type === "blink") {
    return "Home";
  }
  return scope.templateKey === "shop"
    ? "Shop"
    : scope.templateKey === "restaurant"
      ? "Restaurant"
      : "Business";
}

export function getScopeIconGlyph(scope: ScopeRecord): string {
  if (scope.type === "blink") {
    return "H";
  }
  return scope.templateKey === "shop"
    ? "S"
    : scope.templateKey === "restaurant"
      ? "R"
      : "B";
}
