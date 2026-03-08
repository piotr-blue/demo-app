import { describe, expect, it } from "vitest";
import { evaluateStatusExpression } from "@/lib/document/status-templates/evaluate";

describe("status template evaluator security", () => {
  it("rejects access to globals", () => {
    expect(() =>
      evaluateStatusExpression("globalThis.process", {
        document: {},
        currencyCode: null,
      })
    ).toThrow();
  });

  it("rejects arbitrary identifiers", () => {
    expect(() =>
      evaluateStatusExpression("window", {
        document: {},
        currencyCode: null,
      })
    ).toThrow("Unsupported identifier");
  });

  it("rejects unsupported syntax", () => {
    expect(() =>
      evaluateStatusExpression("doc('/counter') ? 'a' : 'b'", {
        document: { counter: 1 },
        currencyCode: null,
      })
    ).toThrow();
  });

  it("rejects unsupported function calls", () => {
    expect(() =>
      evaluateStatusExpression("fetch('/api')", {
        document: {},
        currencyCode: null,
      })
    ).toThrow("Unsupported function");
  });
});

