import type { DocStructureSummary } from "@blue-labs/sdk-dsl";
import type { ChannelBindingDraft } from "@/lib/workspace/types";

function guessOwnerChannel(channelName: string): boolean {
  return /(owner|me|requester|creator|author)/i.test(channelName);
}

export function extractChannelBindingsFromStructure(params: {
  structure: DocStructureSummary;
  accountId: string;
}): ChannelBindingDraft[] {
  const channels = params.structure.contracts.filter((contract) => contract.kind === "channel");

  return channels.map((channel) => {
    const ownerLike = guessOwnerChannel(channel.key);
    return {
      channelName: channel.key,
      mode: ownerLike ? "accountId" : "email",
      value: ownerLike ? params.accountId : "",
      timelineId: undefined,
    };
  });
}
