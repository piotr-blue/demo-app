import "fake-indexeddb/auto";
import { beforeEach, describe, expect, it } from "vitest";
import {
  appendThreadMessage,
  applyDocumentAction,
  applyThreadAction,
  addDocumentShareEntry,
  continueLiveDiscussion,
  finalizeLiveDiscussion,
  getOrCreateDocumentConversation,
  getOrCreateHomeConversation,
  loadDemoSnapshot,
  replyToAssistantExchange,
  resetDemoSnapshot,
  startLiveDiscussion,
  startAssistantDemoDiscussion,
  startUserDiscussion,
  toggleDocumentPublicVisibility,
  toggleDocumentServiceConnection,
  toggleDocumentShareEnabled,
  toggleDocumentFavorite,
  updateAssistantPlaybook,
} from "@/lib/demo/scope-actions";
import {
  getDocumentById,
  getDocumentConversation,
  getExchangeMessages,
  getHomeConversation,
  getThreadById,
} from "@/lib/demo/selectors";
import { clearDemoPersistence } from "@/lib/demo/storage";

describe("demo scope actions", () => {
  beforeEach(async () => {
    await clearDemoPersistence();
  });

  it("returns seeded home and document conversation ids", async () => {
    const home = await getOrCreateHomeConversation("account_alice");
    expect(home.conversationId).toBeTruthy();
    expect(getHomeConversation(home.snapshot, "account_alice")?.id).toBe(home.conversationId);

    const doc = await getOrCreateDocumentConversation("doc_order_fresh_bites_bob", "account_bob");
    expect(doc.conversationId).toBeTruthy();
    expect(
      getDocumentConversation(doc.snapshot, "doc_order_fresh_bites_bob", "account_bob")?.id
    ).toBe(doc.conversationId);
  });

  it("toggles favorites for the active account", async () => {
    const before = await loadDemoSnapshot();
    const account = before.accounts.find((entry) => entry.id === "account_piotr_blue");
    expect(account?.favoriteDocumentIds.includes("doc_fresh_bites")).toBe(false);

    const afterRemove = await toggleDocumentFavorite("account_piotr_blue", "doc_fresh_bites");
    expect(
      afterRemove.accounts
        .find((entry) => entry.id === "account_piotr_blue")
        ?.favoriteDocumentIds.includes("doc_fresh_bites")
    ).toBe(true);

    const afterAdd = await toggleDocumentFavorite("account_piotr_blue", "doc_fresh_bites");
    expect(
      afterAdd.accounts
        .find((entry) => entry.id === "account_piotr_blue")
        ?.favoriteDocumentIds.includes("doc_fresh_bites")
    ).toBe(false);
  });

  it("updates share settings and service connections for documents", async () => {
    const seeded = await loadDemoSnapshot();
    const freshBites = getDocumentById(seeded, "doc_fresh_bites");
    expect(freshBites?.shareSettings?.shareWithOthers).toBe(true);
    expect(freshBites?.isPublic).toBe(true);
    expect(freshBites?.services?.some((service) => service.status === "connected")).toBe(true);

    const sharingOff = await toggleDocumentShareEnabled("doc_fresh_bites", false);
    expect(getDocumentById(sharingOff, "doc_fresh_bites")?.shareSettings?.shareWithOthers).toBe(false);

    const privateDoc = await toggleDocumentPublicVisibility("doc_fresh_bites", false);
    expect(getDocumentById(privateDoc, "doc_fresh_bites")?.isPublic).toBe(false);

    const sharedAgain = await addDocumentShareEntry("doc_fresh_bites", "account", "Bob Chen");
    const sharedDocument = getDocumentById(sharedAgain, "doc_fresh_bites");
    expect(sharedDocument?.shareSettings?.entries.some((entry) => entry.name === "Bob Chen")).toBe(true);
    expect(sharedDocument?.participantAccountIds.includes("account_bob")).toBe(true);

    const toggledService = await toggleDocumentServiceConnection("doc_fresh_bites", "svc_fresh_legal");
    expect(
      getDocumentById(toggledService, "doc_fresh_bites")?.services?.find((entry) => entry.id === "svc_fresh_legal")
        ?.status
    ).toBe("connected");
  });

  it("applies document and thread actions and appends thread chat", async () => {
    const snapshot = await loadDemoSnapshot();
    const document = snapshot.documents.find((entry) => entry.id === "doc_order_fresh_bites_bob");
    const thread = snapshot.threads.find((entry) => entry.id === "thread_find_customers_for_fresh_bites");
    expect(document).toBeTruthy();
    expect(thread).toBeTruthy();
    if (!document || !thread) {
      return;
    }

    const documentActionId = document.uiCards[0]?.actions?.[0]?.id;
    expect(documentActionId).toBeTruthy();
    if (!documentActionId) {
      return;
    }

    const afterDocumentAction = await applyDocumentAction(document.id, documentActionId);
    const updatedDocument = getDocumentById(afterDocumentAction, document.id);
    expect(updatedDocument?.details.lastAction).toBe(document.uiCards[0]?.actions?.[0]?.label);

    const threadActionId = thread.uiCards[0]?.actions?.[0]?.id;
    expect(threadActionId).toBeTruthy();
    if (!threadActionId) {
      return;
    }

    const afterThreadAction = await applyThreadAction(thread.id, threadActionId);
    const updatedThread = getThreadById(afterThreadAction, thread.id);
    expect((updatedThread?.progress ?? 0) >= thread.progress).toBe(true);

    const afterThreadMessage = await appendThreadMessage(thread.id, "user", "Need a supplier follow-up.");
    const threadAfterMessage = getThreadById(afterThreadMessage, thread.id);
    expect(threadAfterMessage?.messages.at(-1)?.text).toContain("supplier follow-up");
  });

  it("runs assistant-started discussion loop and resolves", async () => {
    const seeded = await loadDemoSnapshot();
    const conversation = getHomeConversation(seeded, "account_alice");
    expect(conversation).toBeTruthy();
    if (!conversation) {
      return;
    }

    const started = await startAssistantDemoDiscussion(conversation.id);
    expect(started.exchangeId).toBeTruthy();
    if (!started.exchangeId) {
      return;
    }

    const afterReply = await replyToAssistantExchange(started.exchangeId, "yes");
    const messagesAfterReply = getExchangeMessages(afterReply, started.exchangeId);
    expect(messagesAfterReply.at(-1)?.body).toBe("Reply to: yes");

    const afterDone = await replyToAssistantExchange(started.exchangeId, "DONE");
    const resolvedMessages = getExchangeMessages(afterDone, started.exchangeId);
    expect(resolvedMessages.at(-1)?.kind).toBe("resolution");
  });

  it("runs user-started discussion loop and updates playbooks", async () => {
    const seeded = await loadDemoSnapshot();
    const conversation = getDocumentConversation(
      seeded,
      "doc_partnership_engine_agreement_alice",
      "account_alice"
    );
    expect(conversation).toBeTruthy();
    if (!conversation) {
      return;
    }

    const started = await startUserDiscussion(conversation.id, "What should I track here?");
    expect(started.exchangeId).toBeTruthy();
    if (!started.exchangeId) {
      return;
    }
    const messagesAfterStart = getExchangeMessages(started.snapshot, started.exchangeId);
    expect(messagesAfterStart.at(-1)?.body).toBe("Reply to: What should I track here?");

    const playbook = started.snapshot.assistantPlaybooks.find(
      (entry) =>
        entry.targetType === "document" &&
        entry.targetId === "doc_partnership_engine_agreement_alice" &&
        entry.viewerAccountId === "account_alice"
    );
    expect(playbook).toBeTruthy();
    if (!playbook) {
      return;
    }

    const updated = await updateAssistantPlaybook(playbook.id, {
      identityMarkdown: "Updated identity",
      defaultsMarkdown: "Updated defaults",
      contextMarkdown: "Updated context",
      overridesMarkdown: "Updated overrides",
    });
    const nextPlaybook = updated.assistantPlaybooks.find((entry) => entry.id === playbook.id);
    expect(nextPlaybook?.identityMarkdown).toBe("Updated identity");
    expect(nextPlaybook?.defaultsMarkdown).toBe("Updated defaults");
    expect(nextPlaybook?.contextMarkdown).toBe("Updated context");
    expect(nextPlaybook?.overridesMarkdown).toBe("Updated overrides");
  });

  it("runs live discussion loop with follow-up and document creation", async () => {
    const seeded = await loadDemoSnapshot();
    const conversation = getHomeConversation(seeded, "account_piotr_blue");
    expect(conversation).toBeTruthy();
    if (!conversation) {
      return;
    }

    const started = await startLiveDiscussion(conversation.id, "make me a document");
    expect(started.exchangeId).toBeTruthy();
    if (!started.exchangeId) {
      return;
    }

    const afterMore = await finalizeLiveDiscussion({
      exchangeId: started.exchangeId,
      turn: {
        t: "more",
        c: "Sure — I can do that.",
        q: "What should the document be called?",
      },
    });
    const openExchange = afterMore.assistantExchanges.find((entry) => entry.id === started.exchangeId);
    expect(openExchange?.status).toBe("in-progress");

    const afterReply = await continueLiveDiscussion(started.exchangeId, "Roadmap");
    const afterReplyMessages = getExchangeMessages(afterReply, started.exchangeId);
    expect(afterReplyMessages.at(-1)?.body).toBe("Roadmap");

    const afterDoc = await finalizeLiveDiscussion({
      exchangeId: started.exchangeId,
      turn: {
        t: "doc",
        summ: "I will create the document 'Roadmap'.",
        doc: {
          kind: "plan",
          name: "Roadmap",
          description: "Q4 priorities and milestones",
          fields: {
            owner: "piotr-blue",
          },
          anchors: [
            {
              key: "items",
              label: "Items",
              purpose: "Roadmap item breakdown",
            },
          ],
        },
        link: null,
      },
      createdDocument: {
        kind: "plan",
        name: "Roadmap",
        description: "Q4 priorities and milestones",
        fields: {
          owner: "piotr-blue",
        },
        anchors: [
          {
            key: "items",
            label: "Items",
            purpose: "Roadmap item breakdown",
          },
        ],
        sessionId: "session_live_roadmap",
        myosDocumentId: "myos_live_roadmap",
        mappedDocument: null,
        mappedAnchors: [],
        linked: [
          {
            anchorKey: "items",
            childSessionId: "session_live_sub_item",
            childDocumentId: "doc_live_session_live_sub_item",
            linkSessionId: "session_link_doc",
          },
        ],
        link: {
          parentDocumentId: "doc_live_parent",
          anchorKey: "orders",
        },
      },
    });
    const resolved = afterDoc.assistantExchanges.find((entry) => entry.id === started.exchangeId);
    expect(resolved?.status).toBe("resolved");
    const created = afterDoc.documents.find((document) => document.title === "Roadmap");
    expect(created).toBeTruthy();
    if (!created) {
      return;
    }
    expect(created.anchorIds.length).toBe(1);
    expect(created.linkedDocumentIds).toContain("doc_live_session_live_sub_item");

    const anchor = afterDoc.documentAnchors.find((entry) => entry.id === created.anchorIds[0]);
    expect(anchor?.key).toBe("items");
    expect(anchor?.linkedDocumentIds).toContain("doc_live_session_live_sub_item");
  });

  it("resets snapshot to deterministic seed", async () => {
    const changed = await toggleDocumentFavorite("account_piotr_blue", "doc_fresh_bites");
    expect(
      changed.accounts.find((entry) => entry.id === "account_piotr_blue")?.favoriteDocumentIds.includes(
        "doc_fresh_bites"
      )
    ).toBe(true);

    const reset = await resetDemoSnapshot();
    expect(
      reset.accounts.find((entry) => entry.id === "account_piotr_blue")?.favoriteDocumentIds.includes(
        "doc_fresh_bites"
      )
    ).toBe(false);
  });
});
