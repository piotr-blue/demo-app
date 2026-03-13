import { describe, expect, it } from "vitest";
import { buildBootstrapRequestPreview } from "@/lib/myos/bootstrap-request";

describe("buildBootstrapRequestPreview", () => {
  it("rewrites Core/Channel types and normalizes bindings", () => {
    const preview = buildBootstrapRequestPreview(
      {
        contracts: {
          ownerChannel: {
            type: "Core/Channel",
          },
          reviewerChannel: {
            type: "Conversation/Timeline Channel",
          },
        },
      },
      [
        {
          channelName: "ownerChannel",
          mode: "accountId",
          value: "acc_1",
          ignored: false,
        },
        {
          channelName: "reviewerChannel",
          mode: "email",
          value: "reviewer@example.com",
          ignored: false,
          timelineId: "timeline-1",
        },
      ]
    );

    expect(preview).toEqual({
      documentJson: {
        contracts: {
          ownerChannel: {
            type: "MyOS/MyOS Timeline Channel",
          },
          reviewerChannel: {
            type: "Conversation/Timeline Channel",
          },
        },
      },
      bindings: {
        ownerChannel: {
          accountId: "acc_1",
          timelineId: undefined,
        },
        reviewerChannel: {
          email: "reviewer@example.com",
          timelineId: "timeline-1",
        },
      },
    });
  });
});
