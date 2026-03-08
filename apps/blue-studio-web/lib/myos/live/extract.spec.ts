import { describe, expect, it } from "vitest";
import { extractWebhookInvalidation } from "@/lib/myos/live/extract";

describe("extractWebhookInvalidation", () => {
  it("extracts sessionId, eventId, and epoch from nested payloads", () => {
    const payload = {
      id: "event-1",
      object: {
        targetSessionId: "session-123",
        epoch: 8,
      },
    };
    const extracted = extractWebhookInvalidation(payload);
    expect(extracted.sessionId).toBe("session-123");
    expect(extracted.eventId).toBe("event-1");
    expect(extracted.epoch).toBe(8);
  });
});
