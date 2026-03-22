import { describe, expect, it } from "vitest";
import { createSeedSnapshot } from "@/lib/demo/seed";
import { searchSnapshot } from "@/lib/demo/search";

describe("demo search", () => {
  it("returns mixed results for acceptance queries", () => {
    const snapshot = createSeedSnapshot();
    const alice = searchSnapshot(snapshot, "alice", "all");
    expect(alice.some((entry) => entry.type === "workspace")).toBe(true);
    expect(alice.some((entry) => entry.type === "document")).toBe(true);

    const order = searchSnapshot(snapshot, "order", "all");
    expect(order.some((entry) => entry.title.includes("Order #"))).toBe(true);

    const sms = searchSnapshot(snapshot, "sms", "all");
    expect(sms.some((entry) => entry.type === "service")).toBe(true);

    const northwind = searchSnapshot(snapshot, "northwind", "all");
    expect(northwind.some((entry) => entry.title.includes("Northwind"))).toBe(true);

    const review = searchSnapshot(snapshot, "review", "all");
    expect(review.some((entry) => entry.type === "thread" || entry.type === "document")).toBe(true);

    const supplier = searchSnapshot(snapshot, "supplier", "all");
    expect(supplier.some((entry) => entry.type === "service" || entry.type === "thread")).toBe(true);
  });

  it("honors filter chips", () => {
    const snapshot = createSeedSnapshot();
    const services = searchSnapshot(snapshot, "supplier", "services");
    expect(services.every((entry) => entry.type === "service")).toBe(true);

    const workspaces = searchSnapshot(snapshot, "lake", "workspaces");
    expect(workspaces.every((entry) => entry.type === "workspace")).toBe(true);
  });
});
