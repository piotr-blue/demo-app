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
        ignored: false,
      },
      {
        channelName: "reviewerChannel",
        mode: "email",
        value: "",
        timelineId: undefined,
        ignored: false,
      },
    ]);
  });

  it("includes runtime channels by default so user can choose to ignore them", () => {
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
            fingerprint: "fp_owner",
            sectionKeys: [],
          },
          {
            key: "Triggered Event Channel",
            kind: "channel",
            raw: {},
            fingerprint: "fp_triggered_plain",
            sectionKeys: [],
          },
          {
            key: "Core/Triggered Event Channel",
            kind: "channel",
            raw: {},
            fingerprint: "fp_triggered_core",
            sectionKeys: [],
          },
          {
            key: "Core/Lifecycle Event Channel",
            kind: "channel",
            raw: {},
            fingerprint: "fp_lifecycle_core",
            sectionKeys: [],
          },
          {
            key: "Embedded Node Channel",
            kind: "channel",
            raw: {},
            fingerprint: "fp_embedded_plain",
            sectionKeys: [],
          },
          {
            key: "Document Update Channel",
            kind: "channel",
            raw: {},
            fingerprint: "fp_doc_update_plain",
            sectionKeys: [],
          },
          {
            key: "reviewerChannel",
            kind: "channel",
            raw: {},
            fingerprint: "fp_reviewer",
            sectionKeys: [],
          },
        ],
        sections: [],
        policies: [],
        unclassifiedContracts: [],
      },
    });

    expect(bindings.map((entry) => entry.channelName)).toEqual([
      "ownerChannel",
      "Triggered Event Channel",
      "Core/Triggered Event Channel",
      "Core/Lifecycle Event Channel",
      "Embedded Node Channel",
      "Document Update Channel",
      "reviewerChannel",
    ]);
    expect(bindings.every((entry) => entry.ignored === false)).toBe(true);
  });
});
