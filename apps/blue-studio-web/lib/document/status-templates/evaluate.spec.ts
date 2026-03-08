import { describe, expect, it } from "vitest";
import {
  evaluateStatusExpression,
  interpolateTemplateText,
  resolveStatusMessage,
} from "@/lib/document/status-templates/evaluate";
import type { StatusTemplateBundle } from "@/lib/workspace/types";

const baseBundle: StatusTemplateBundle = {
  viewer: "ownerChannel",
  blueprintHash: "hash",
  generatedAt: "2026-03-08T00:00:00.000Z",
  templates: [
    {
      when: "doc('/status') === 'draft'",
      title: "Draft",
      body: "Counter is {{ doc('/counter') }}",
    },
    {
      when: "doc('/status') === 'active'",
      title: "Active",
      body: "Balance {{ money(doc('/amount')) }}",
    },
    {
      when: "true",
      title: "Fallback",
      body: "Items: {{ doc('/count') }} {{ plural(doc('/count'), 'item', 'items') }}",
    },
  ],
};

describe("evaluateStatusExpression", () => {
  it("resolves doc helper values", () => {
    const result = evaluateStatusExpression("doc('/counter') > 3", {
      document: { counter: 5 },
      currencyCode: null,
    });
    expect(result).toBe(true);
  });
});

describe("interpolateTemplateText", () => {
  it("interpolates expressions in template text", () => {
    const text = interpolateTemplateText("Count: {{ doc('/counter') }}", {
      document: { counter: 7 },
      currencyCode: null,
    });
    expect(text).toBe("Count: 7");
  });
});

describe("resolveStatusMessage", () => {
  it("uses first-match-wins and supports interpolation", () => {
    const resolved = resolveStatusMessage({
      bundle: baseBundle,
      viewer: "ownerChannel",
      document: { status: "draft", counter: 2 },
      currencyCode: "USD",
      sourceSnapshotId: "snap-1",
      previous: null,
    });
    expect(resolved.resolved.title).toBe("Draft");
    expect(resolved.resolved.body).toBe("Counter is 2");
    expect(resolved.changed).toBe(true);
  });

  it("formats money for matching template", () => {
    const resolved = resolveStatusMessage({
      bundle: baseBundle,
      viewer: "ownerChannel",
      document: { status: "active", amount: 1200 },
      currencyCode: "USD",
      sourceSnapshotId: "snap-2",
      previous: null,
    });
    expect(resolved.resolved.title).toBe("Active");
    expect(resolved.resolved.body).toContain("$12.00");
  });

  it("treats money() values as minor units", () => {
    const result = evaluateStatusExpression("money(45000)", {
      document: {},
      currencyCode: "USD",
    });
    expect(result).toBe("$450.00");
  });

  it("handles non-USD currencies and fallback formatting", () => {
    const eur = evaluateStatusExpression("money(doc('/amount/total'))", {
      document: { amount: { total: 45000 } },
      currencyCode: "EUR",
    });
    expect(eur).toContain("450.00");

    const fallback = evaluateStatusExpression("money(45000)", {
      document: {},
      currencyCode: "INVALID_CURRENCY",
    });
    expect(fallback).toBe("450.00");
  });

  it("falls back to true template when others do not match", () => {
    const resolved = resolveStatusMessage({
      bundle: baseBundle,
      viewer: "ownerChannel",
      document: { status: "unknown", count: 2 },
      currencyCode: "USD",
      sourceSnapshotId: "snap-3",
      previous: null,
    });
    expect(resolved.resolved.title).toBe("Fallback");
    expect(resolved.resolved.body).toBe("Items: 2 items");
  });

  it("dedupes unchanged status text for same viewer", () => {
    const first = resolveStatusMessage({
      bundle: baseBundle,
      viewer: "ownerChannel",
      document: { status: "draft", counter: 1 },
      currencyCode: "USD",
      sourceSnapshotId: "snap-4",
      previous: null,
    });
    const second = resolveStatusMessage({
      bundle: baseBundle,
      viewer: "ownerChannel",
      document: { status: "draft", counter: 1 },
      currencyCode: "USD",
      sourceSnapshotId: "snap-5",
      previous: first.resolved,
    });
    expect(second.changed).toBe(false);
  });
});

