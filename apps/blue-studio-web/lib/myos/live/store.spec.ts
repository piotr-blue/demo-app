import { beforeEach, describe, expect, it } from "vitest";
import { __resetLiveStoreForTests, getLiveStore } from "@/lib/myos/live/store";

describe("live store", () => {
  beforeEach(() => {
    delete process.env.UPSTASH_REDIS_REST_URL;
    delete process.env.UPSTASH_REDIS_REST_TOKEN;
    __resetLiveStoreForTests();
  });

  it("dedupes delivery ids", async () => {
    const store = getLiveStore();
    expect(await store.markDeliverySeen("delivery-1")).toBe(true);
    expect(await store.markDeliverySeen("delivery-1")).toBe(false);
  });

  it("matches subscriptions by account and keeps heartbeat records", async () => {
    const store = getLiveStore();
    await store.upsertSubscription({
      browserId: "browser-a",
      accountHash: "account-1",
      sessionIds: ["session-1"],
      threadIds: ["thread-1"],
      heartbeatAt: new Date().toISOString(),
    });
    await store.upsertSubscription({
      browserId: "browser-b",
      accountHash: "account-2",
      sessionIds: ["session-2"],
      threadIds: ["thread-2"],
      heartbeatAt: new Date().toISOString(),
    });

    const account1Subscriptions = await store.listSubscriptionsByAccount("account-1");
    expect(account1Subscriptions).toHaveLength(1);
    expect(account1Subscriptions[0]?.sessionIds).toContain("session-1");
  });
});
