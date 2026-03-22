import { describe, expect, it } from "vitest";
import { createSeedSnapshot, BLINK_SCOPE_ID } from "@/lib/demo/seed";
import {
  getAssistantTimelineItems,
  getExchangeMessages,
  getOpenAssistantExchanges,
  getScopeAssistantConversation,
  getScopeAssistantExchanges,
  getScopeAssistantPlaybook,
} from "@/lib/demo/selectors";

describe("assistant conversation selectors", () => {
  it("returns seeded conversation and playbook per scope", () => {
    const snapshot = createSeedSnapshot();
    const conversation = getScopeAssistantConversation(snapshot, BLINK_SCOPE_ID);
    const playbook = getScopeAssistantPlaybook(snapshot, BLINK_SCOPE_ID);

    expect(conversation).toBeTruthy();
    expect(conversation?.scopeId).toBe(BLINK_SCOPE_ID);
    expect(playbook).toBeTruthy();
    expect(playbook?.scopeId).toBe(BLINK_SCOPE_ID);
  });

  it("builds timeline anchors with opener and resolution only", () => {
    const snapshot = createSeedSnapshot();
    const timeline = getAssistantTimelineItems(snapshot, BLINK_SCOPE_ID);

    expect(timeline.length).toBeGreaterThanOrEqual(3);
    expect(timeline.some((entry) => entry.kind === "opener")).toBe(true);
    expect(timeline.some((entry) => entry.kind === "resolution")).toBe(true);

    for (let index = 1; index < timeline.length; index += 1) {
      expect(timeline[index - 1]?.createdAt <= timeline[index]?.createdAt).toBe(true);
    }
  });

  it("returns open exchanges and full expanded messages", () => {
    const snapshot = createSeedSnapshot();
    const allExchanges = getScopeAssistantExchanges(snapshot, BLINK_SCOPE_ID);
    const openExchanges = getOpenAssistantExchanges(snapshot, BLINK_SCOPE_ID);

    expect(allExchanges.length).toBeGreaterThanOrEqual(2);
    expect(openExchanges.length).toBe(1);
    expect(openExchanges[0]?.status).toBe("open");

    const resolved = allExchanges.find((exchange) => exchange.status === "resolved");
    expect(resolved).toBeTruthy();
    if (!resolved) {
      return;
    }

    const messages = getExchangeMessages(snapshot, resolved.id);
    expect(messages.some((message) => message.kind === "reply")).toBe(true);
    expect(messages.some((message) => message.kind === "resolution")).toBe(true);
  });
});
