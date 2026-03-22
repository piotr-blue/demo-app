import "fake-indexeddb/auto";
import { beforeEach, describe, expect, it } from "vitest";
import { getDemoSnapshot, clearDemoPersistence } from "@/lib/demo/storage";

describe("demo storage", () => {
  beforeEach(async () => {
    await clearDemoPersistence();
  });

  it("seeds blink scope and root artifacts on first read", async () => {
    const snapshot = await getDemoSnapshot();
    expect(snapshot.scopes.length).toBeGreaterThan(0);
    expect(snapshot.scopes.some((scope) => scope.type === "blink")).toBe(true);
    expect(snapshot.scopes.filter((scope) => scope.type === "workspace")).toHaveLength(3);
    expect(snapshot.threads.length).toBeGreaterThanOrEqual(9);
    expect(snapshot.documents.filter((document) => document.scopeId === null)).toHaveLength(4);
    expect(snapshot.documents.some((document) => document.isService)).toBe(true);
    expect(snapshot.attentionItems.length).toBeGreaterThan(0);
    expect(snapshot.assistantConversations.length).toBe(snapshot.scopes.length);
    expect(snapshot.assistantPlaybooks.length).toBe(snapshot.scopes.length);
    expect(snapshot.assistantExchanges.length).toBeGreaterThanOrEqual(4);
    expect(snapshot.assistantExchangeMessages.length).toBeGreaterThanOrEqual(9);
    expect(
      snapshot.scopes.every(
        (scope) =>
          !!scope.assistantConversationId &&
          snapshot.assistantConversations.some(
            (conversation) => conversation.id === scope.assistantConversationId
          ) &&
          !!scope.assistantPlaybookId &&
          snapshot.assistantPlaybooks.some(
            (playbook) => playbook.id === scope.assistantPlaybookId
          )
      )
    ).toBe(true);
  });
});
