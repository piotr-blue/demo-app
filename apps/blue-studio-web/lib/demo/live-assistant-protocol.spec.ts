import { describe, expect, it } from "vitest";
import {
  parseLiveAssistantTurn,
  serializeLiveAssistantTurn,
} from "@/lib/demo/live-assistant-protocol";

describe("live assistant protocol", () => {
  it("parses ans turn", () => {
    const turn = parseLiveAssistantTurn('{"t":"ans","c":"Warsaw."}');
    expect(turn).toEqual({
      t: "ans",
      c: "Warsaw.",
    });
  });

  it("parses more turn with lead-in", () => {
    const turn = parseLiveAssistantTurn(
      '{"t":"more","c":"Sure — I can do that.","q":"What should the document be called?"}'
    );
    expect(turn).toEqual({
      t: "more",
      c: "Sure — I can do that.",
      q: "What should the document be called?",
    });
  });

  it("parses doc turn with kind, fields, anchors and link", () => {
    const turn = parseLiveAssistantTurn(
      '{"t":"doc","summ":"I will create the document.","doc":{"kind":"shop","name":"Morning Brew","description":"Business space","fields":{"website":"https://example.com"},"anchors":[{"key":"orders","label":"Orders","purpose":"Track orders"}]},"link":{"parentDocumentId":"doc_live_parent","anchorKey":"orders"}}'
    );
    expect(turn).toEqual({
      t: "doc",
      summ: "I will create the document.",
      doc: {
        kind: "shop",
        name: "Morning Brew",
        description: "Business space",
        fields: {
          website: "https://example.com",
        },
        anchors: [
          {
            key: "orders",
            label: "Orders",
            purpose: "Track orders",
          },
        ],
      },
      link: {
        parentDocumentId: "doc_live_parent",
        anchorKey: "orders",
      },
    });
  });

  it("rejects out-of-order keys", () => {
    expect(() =>
      parseLiveAssistantTurn('{"c":"Warsaw.","t":"ans"}')
    ).toThrow(/stable order/i);
  });

  it("serializes rich doc turn in required stable order", () => {
    const serialized = serializeLiveAssistantTurn({
      t: "doc",
      summ: "I will create this.",
      doc: {
        kind: "order",
        name: "Order — Bob",
        description: "Order record",
        fields: {
          customerName: "Bob",
        },
        anchors: [],
      },
      link: null,
    });
    expect(serialized).toBe(
      '{"t":"doc","summ":"I will create this.","doc":{"kind":"order","name":"Order — Bob","description":"Order record","fields":{"customerName":"Bob"},"anchors":[]},"link":null}'
    );
  });
});
