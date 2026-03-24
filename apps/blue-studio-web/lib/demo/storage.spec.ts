import "fake-indexeddb/auto";
import { beforeEach, describe, expect, it } from "vitest";
import { getDemoSnapshot, clearDemoPersistence } from "@/lib/demo/storage";

describe("demo storage", () => {
  beforeEach(async () => {
    await clearDemoPersistence();
  });

  it("seeds four demo accounts and shared artifacts on first read", async () => {
    const snapshot = await getDemoSnapshot();
    expect(snapshot.accounts).toHaveLength(4);
    expect(snapshot.accounts.some((account) => account.name === "piotr-blue")).toBe(true);
    expect(snapshot.accounts.some((account) => account.name === "Alice Martinez")).toBe(true);
    expect(snapshot.accounts.some((account) => account.name === "Bob Chen")).toBe(true);
    expect(snapshot.accounts.some((account) => account.name === "Celine Duarte")).toBe(true);
    expect(snapshot.documentAnchors.length).toBeGreaterThanOrEqual(10);
    expect(snapshot.threads.length).toBeGreaterThanOrEqual(3);
    expect(snapshot.documents.some((document) => document.title === "Fresh Bites")).toBe(true);
    expect(snapshot.documents.some((document) => document.title === "Northwind BI")).toBe(true);
    expect(snapshot.documents.some((document) => document.title === "Partnership Engine")).toBe(true);
    expect(snapshot.documents.some((document) => document.title === "My Life")).toBe(true);
    expect(snapshot.documents.some((document) => document.isService)).toBe(true);
    expect(snapshot.attentionItems.length).toBeGreaterThan(0);
    expect(snapshot.assistantConversations.length).toBeGreaterThanOrEqual(10);
    expect(snapshot.assistantPlaybooks.length).toBe(snapshot.assistantConversations.length);
    expect(snapshot.assistantExchanges.length).toBeGreaterThanOrEqual(10);
    expect(snapshot.assistantExchangeMessages.length).toBeGreaterThanOrEqual(20);
    expect(
      snapshot.documents.some(
        (document) =>
          document.id === "doc_fresh_bites" &&
          (document.participantsDetailed?.length ?? 0) > 1 &&
          (document.allOperations?.length ?? 0) > 1 &&
          (document.services?.length ?? 0) > 1
      )
    ).toBe(true);
    const sharedBiAgreement = snapshot.documents.filter(
      (document) => document.title === "Northwind BI Agreement — Bob"
    );
    expect(sharedBiAgreement).toHaveLength(1);
  });
});
