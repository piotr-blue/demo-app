import { describe, expect, it } from "vitest";
import {
  chooseDefaultViewer,
  deriveThreadFallbackSummary,
  deriveThreadFallbackTitle,
  parseBlueprintMetadata,
} from "@/lib/blueprint/metadata";

describe("parseBlueprintMetadata", () => {
  it("parses title, summary, participants, and currency", () => {
    const blueprint = `
STATE: ready
TYPE: PayNote
BLUEPRINT: Camera Sale Escrow
SUMMARY: Holds payment until buyer confirms.

PARTICIPANTS:
  - payerChannel — buyer
  - payeeChannel — seller
  - guarantorChannel — payment processor

PAYMENT:
  Currency: USD. Amount: 45000
`;
    const metadata = parseBlueprintMetadata(blueprint);
    expect(metadata.documentName).toBe("Camera Sale Escrow");
    expect(metadata.summary).toBe("Holds payment until buyer confirms.");
    expect(metadata.currencyCode).toBe("USD");
    expect(metadata.participants.map((entry) => entry.channelName)).toEqual([
      "payerChannel",
      "payeeChannel",
      "guarantorChannel",
    ]);
    expect(metadata.participants[2]?.systemLike).toBe(true);
  });

  it("handles regular dash and em dash participant separators", () => {
    const blueprint = `
PARTICIPANTS:
  - ownerChannel - owner
  - watcherChannel — watcher
`;
    const metadata = parseBlueprintMetadata(blueprint);
    expect(metadata.participants).toHaveLength(2);
    expect(metadata.participants[0]).toMatchObject({
      channelName: "ownerChannel",
      description: "owner",
    });
    expect(metadata.participants[1]).toMatchObject({
      channelName: "watcherChannel",
      description: "watcher",
    });
  });

  it("returns safe defaults when sections are missing", () => {
    const metadata = parseBlueprintMetadata("STATE: ready\nTYPE: Document");
    expect(metadata.documentName).toBeNull();
    expect(metadata.summary).toBeNull();
    expect(metadata.currencyCode).toBeNull();
    expect(metadata.participants).toEqual([]);
  });
});

describe("chooseDefaultViewer", () => {
  it("chooses first non-system participant first", () => {
    const viewer = chooseDefaultViewer([
      { channelName: "guarantorChannel", description: "processor", systemLike: true },
      { channelName: "ownerChannel", description: "owner", systemLike: false },
    ]);
    expect(viewer).toBe("ownerChannel");
  });
});

describe("thread fallback helpers", () => {
  it("derives title and summary from metadata or prompt", () => {
    expect(
      deriveThreadFallbackTitle(
        { documentName: "Counter", summary: null, currencyCode: null, participants: [] },
        "prompt title"
      )
    ).toBe("Counter");
    expect(deriveThreadFallbackTitle(null, "Prompt only")).toBe("Prompt only");

    expect(
      deriveThreadFallbackSummary(
        { documentName: null, summary: "Blueprint summary", currencyCode: null, participants: [] },
        "prompt summary"
      )
    ).toBe("Blueprint summary");
    expect(deriveThreadFallbackSummary(null, "Prompt summary")).toBe("Prompt summary");
  });
});

