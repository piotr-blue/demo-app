import { describe, expect, it } from "vitest";
import { extractChannelBindingsFromStructure } from "@/lib/dsl/channel-extraction";

describe("extractChannelBindingsFromStructure", () => {
  it("prefills owner-like channels with accountId", () => {
    const bindings = extractChannelBindingsFromStructure({
      accountId: "acc_1",
      structure: {
        name: "Counter",
        description: undefined,
        type: "Document",
        fields: [],
        contracts: [
          {
            key: "ownerChannel",
            kind: "channel",
            raw: {},
            fingerprint: "fp",
            sectionKeys: [],
          },
          {
            key: "reviewerChannel",
            kind: "channel",
            raw: {},
            fingerprint: "fp2",
            sectionKeys: [],
          },
        ],
        sections: [],
        policies: [],
        unclassifiedContracts: [],
      },
    });

    expect(bindings).toEqual([
      {
        channelName: "ownerChannel",
        mode: "accountId",
        value: "acc_1",
        timelineId: undefined,
      },
      {
        channelName: "reviewerChannel",
        mode: "email",
        value: "",
        timelineId: undefined,
      },
    ]);
  });
});
