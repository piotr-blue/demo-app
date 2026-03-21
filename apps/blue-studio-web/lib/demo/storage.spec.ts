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
    expect(snapshot.threads.length).toBeGreaterThan(0);
    expect(snapshot.documents.some((document) => document.scopeId === null)).toBe(true);
    expect(snapshot.attentionItems.length).toBeGreaterThan(0);
  });
});
