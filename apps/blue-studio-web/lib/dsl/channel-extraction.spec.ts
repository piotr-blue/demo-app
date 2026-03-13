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

  it("excludes internal runtime channels from bootstrap bindings", () => {
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
            raw: { type: "Triggered Event Channel" },
            fingerprint: "fp_triggered_plain",
            sectionKeys: [],
          },
          {
            key: "Core/Triggered Event Channel",
            kind: "channel",
            raw: { type: "Core/Triggered Event Channel" },
            fingerprint: "fp_triggered_core",
            sectionKeys: [],
          },
          {
            key: "Core/Lifecycle Event Channel",
            kind: "channel",
            raw: { type: "Core/Lifecycle Event Channel" },
            fingerprint: "fp_lifecycle_core",
            sectionKeys: [],
          },
          {
            key: "Embedded Node Channel",
            kind: "channel",
            raw: { type: "Core/Embedded Node Channel" },
            fingerprint: "fp_embedded_plain",
            sectionKeys: [],
          },
          {
            key: "Document Update Channel",
            kind: "channel",
            raw: { type: "Core/Document Update Channel" },
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
      "reviewerChannel",
    ]);
    expect(bindings.every((entry) => entry.ignored === false)).toBe(true);
  });
});
