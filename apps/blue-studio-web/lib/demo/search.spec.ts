import { describe, expect, it } from "vitest";
import { createSeedSnapshot } from "@/lib/demo/seed";
import { searchSnapshot } from "@/lib/demo/search";

describe("demo search", () => {
  it("returns grouped public and my-doc search results", () => {
    const snapshot = createSeedSnapshot();

    const freshBites = searchSnapshot(snapshot, "account_piotr_blue", "Fresh Bites");
    expect(
      freshBites.find((group) => group.key === "accounts")?.results.some((entry) => entry.title === "Alice Martinez")
    ).toBe(true);
    expect(
      freshBites.find((group) => group.key === "public-documents")?.results.some((entry) => entry.title === "Fresh Bites")
    ).toBe(true);

    const bi = searchSnapshot(snapshot, "account_piotr_blue", "BI");
    expect(
      bi.find((group) => group.key === "public-services")?.results.some((entry) => entry.title === "Northwind BI")
    ).toBe(true);

    const partnership = searchSnapshot(snapshot, "account_piotr_blue", "Partnership");
    expect(
      partnership
        .find((group) => group.key === "public-services")
        ?.results.some((entry) => entry.title === "Partnership Engine")
    ).toBe(true);

    const myLife = searchSnapshot(snapshot, "account_piotr_blue", "My Life");
    expect(
      myLife.find((group) => group.key === "public-documents")?.results.some((entry) => entry.title === "My Life")
    ).toBe(true);
  });

  it("includes private/shared results in My Documents for the active account", () => {
    const snapshot = createSeedSnapshot();
    const bobResults = searchSnapshot(snapshot, "account_bob", "Fresh Bites order");
    expect(
      bobResults.find((group) => group.key === "my-documents")?.results.some((entry) => entry.title === "Fresh Bites order — Bob")
    ).toBe(true);
  });
});
