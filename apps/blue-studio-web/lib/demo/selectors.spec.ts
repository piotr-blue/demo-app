import { describe, expect, it } from "vitest";
import { createSeedSnapshot, DEFAULT_DEMO_ACCOUNT_ID } from "@/lib/demo/seed";
import {
  getAccessibleDocumentsForAccount,
  getAssistantTimelineItems,
  getConversationExchanges,
  getDocumentActivity,
  getDocumentAllOperations,
  getDocumentConversation,
  getDocumentCurrentStateFields,
  getDocumentDescription,
  getDocumentEmbeddedDocuments,
  getDocumentParticipants,
  getDocumentPendingOperations,
  getDocumentServices,
  getDocumentShareSettings,
  getExchangeMessages,
  getFavoriteDocumentsForAccount,
  getHomeDocumentsForAccount,
  getHomeConversation,
  getPublicAccounts,
  getThreadActivity,
  getVisibleDocumentsForAnchor,
  getViewerSpecificCommentDocuments,
} from "@/lib/demo/selectors";

describe("multi-account selectors", () => {
  it("returns seeded home and document conversations", () => {
    const snapshot = createSeedSnapshot();
    const homeConversation = getHomeConversation(snapshot, DEFAULT_DEMO_ACCOUNT_ID);
    const documentConversation = getDocumentConversation(
      snapshot,
      "doc_order_fresh_bites_bob",
      "account_bob"
    );

    expect(homeConversation).toBeTruthy();
    expect(homeConversation?.targetType).toBe("home");
    expect(homeConversation?.targetId).toBe(DEFAULT_DEMO_ACCOUNT_ID);

    expect(documentConversation).toBeTruthy();
    expect(documentConversation?.targetType).toBe("document");
    expect(documentConversation?.viewerAccountId).toBe("account_bob");
  });

  it("keeps public account list as demo-only and live home mostly empty", () => {
    const snapshot = createSeedSnapshot();
    const publicAccounts = getPublicAccounts(snapshot);
    const liveAccount = snapshot.accounts.find((account) => account.id === "account_piotr_blue");
    expect(liveAccount?.mode).toBe("live");
    expect(publicAccounts.some((account) => account.id === "account_piotr_blue")).toBe(false);
    expect(getHomeDocumentsForAccount(snapshot, "account_piotr_blue")).toHaveLength(0);
  });

  it("filters Fresh Bites orders by viewer", () => {
    const snapshot = createSeedSnapshot();
    const orderAnchor = snapshot.documentAnchors.find(
      (anchor) => anchor.id === "anchor_fresh_bites_orders"
    );
    expect(orderAnchor).toBeTruthy();
    if (!orderAnchor) {
      return;
    }

    const aliceOrders = getVisibleDocumentsForAnchor(
      snapshot,
      "doc_fresh_bites",
      orderAnchor.id,
      "account_alice"
    );
    const bobOrders = getVisibleDocumentsForAnchor(
      snapshot,
      "doc_fresh_bites",
      orderAnchor.id,
      "account_bob"
    );

    expect(aliceOrders.length).toBeGreaterThan(5);
    expect(bobOrders).toHaveLength(1);
    expect(bobOrders[0]?.title).toBe("Fresh Bites order — Bob");
  });

  it("shows viewer-specific comments on Bob's public notebook notes", () => {
    const snapshot = createSeedSnapshot();
    const aliceComments = getViewerSpecificCommentDocuments(
      snapshot,
      "doc_my_life_note_morning_walk",
      "account_alice"
    );
    const alicePrivateComments = getViewerSpecificCommentDocuments(
      snapshot,
      "doc_my_life_note_journal",
      "account_alice"
    );
    const celinePrivateComments = getViewerSpecificCommentDocuments(
      snapshot,
      "doc_my_life_note_journal",
      "account_celine"
    );

    expect(aliceComments.some((document) => document.title.includes("Alice comment"))).toBe(true);
    expect(alicePrivateComments.some((document) => document.title.includes("private comment"))).toBe(
      true
    );
    expect(celinePrivateComments).toHaveLength(0);
  });

  it("builds assistant timeline items and exchange messages by conversation", () => {
    const snapshot = createSeedSnapshot();
    const conversation = getHomeConversation(snapshot, "account_alice");
    expect(conversation).toBeTruthy();
    if (!conversation) {
      return;
    }

    const exchanges = getConversationExchanges(snapshot, conversation.id);
    expect(exchanges.length).toBeGreaterThan(0);
    const timeline = getAssistantTimelineItems(snapshot, conversation.id);
    expect(timeline.some((entry) => entry.kind === "opener")).toBe(true);
    expect(timeline.some((entry) => entry.kind === "resolution")).toBe(true);

    const messages = getExchangeMessages(snapshot, exchanges[0]!.id);
    expect(messages.some((message) => message.kind === "reply")).toBe(true);
    expect(messages.some((message) => message.kind === "resolution")).toBe(true);
  });

  it("returns account favourites and accessible documents", () => {
    const snapshot = createSeedSnapshot();
    const piotrFavorites = getFavoriteDocumentsForAccount(snapshot, "account_piotr_blue");
    const bobFavorites = getFavoriteDocumentsForAccount(snapshot, "account_bob");
    const bobAccessible = getAccessibleDocumentsForAccount(snapshot, "account_bob");

    expect(piotrFavorites).toHaveLength(0);
    expect(bobFavorites.some((document) => document.title === "Fresh Bites")).toBe(true);
    expect(bobFavorites.some((document) => document.title === "Northwind BI")).toBe(true);
    expect(bobAccessible.some((document) => document.title === "Fresh Bites")).toBe(true);
    expect(bobAccessible.some((document) => document.title === "Northwind BI Agreement — Bob")).toBe(
      true
    );
  });

  it("returns enriched document details for primary demo surfaces", () => {
    const snapshot = createSeedSnapshot();

    const description = getDocumentDescription(snapshot, "doc_partnership_engine_agreement_alice");
    const participants = getDocumentParticipants(snapshot, "doc_partnership_engine_agreement_alice");
    const allOperations = getDocumentAllOperations(snapshot, "doc_partnership_engine_agreement_alice");
    const pendingOperations = getDocumentPendingOperations(
      snapshot,
      "doc_partnership_engine_agreement_alice",
      "account_alice"
    );
    const embeddedDocuments = getDocumentEmbeddedDocuments(
      snapshot,
      "doc_partnership_engine_agreement_alice",
      "account_alice"
    );
    const shareSettings = getDocumentShareSettings(snapshot, "doc_partnership_engine_agreement_alice");
    const services = getDocumentServices(snapshot, "doc_partnership_engine_agreement_alice");
    const currentStateFields = getDocumentCurrentStateFields(
      snapshot,
      "doc_partnership_engine_agreement_alice"
    );

    expect(description).toContain("onboarding answers");
    expect(participants.length).toBeGreaterThanOrEqual(2);
    expect(allOperations.length).toBeGreaterThanOrEqual(3);
    expect(pendingOperations.length).toBeGreaterThanOrEqual(1);
    expect(embeddedDocuments.length).toBeGreaterThanOrEqual(2);
    expect(
      embeddedDocuments.some((entry) => entry.title === "Find customers for Fresh Bites")
    ).toBe(true);
    expect(shareSettings?.entries.length).toBeGreaterThanOrEqual(2);
    expect(services.length).toBeGreaterThanOrEqual(2);
    expect(currentStateFields.length).toBeGreaterThanOrEqual(3);
  });

  it("builds document and thread activity feeds from seeded and runtime-aware records", () => {
    const snapshot = createSeedSnapshot();

    const documentActivity = getDocumentActivity(snapshot, "doc_fresh_bites", "account_alice");
    const threadActivity = getThreadActivity(snapshot, "thread_find_customers_for_fresh_bites", "account_alice");

    expect(documentActivity.length).toBeGreaterThanOrEqual(3);
    expect(documentActivity.some((entry) => entry.actorType === "assistant")).toBe(true);
    expect(threadActivity.length).toBeGreaterThanOrEqual(2);
    expect(threadActivity.some((entry) => entry.tone === "operation")).toBe(true);
  });
});
