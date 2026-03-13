import type { DocStructureSummary } from "@blue-labs/sdk-dsl";
import type { ChannelBindingDraft } from "@/lib/workspace/types";

const INTERNAL_CHANNEL_TYPES = new Set([
  "Lifecycle Event Channel",
  "Core/Lifecycle Event Channel",
  "Triggered Event Channel",
  "Core/Triggered Event Channel",
  "Document Update Channel",
  "Core/Document Update Channel",
  "Embedded Node Channel",
  "Core/Embedded Node Channel",
]);

function guessOwnerChannel(channelName: string): boolean {
  return /(owner|me|requester|creator|author)/i.test(channelName);
}

function channelType(contract: DocStructureSummary["contracts"][number]): string | undefined {
  const rawType = contract.raw.type;
  return typeof contract.type === "string"
    ? contract.type
    : typeof rawType === "string"
      ? rawType
      : undefined;
}

export function extractChannelBindingsFromStructure(params: {
  structure: DocStructureSummary;
  accountId: string;
}): ChannelBindingDraft[] {
  const channels = params.structure.contracts.filter(
    (contract) =>
      contract.kind === "channel" &&
      !INTERNAL_CHANNEL_TYPES.has(channelType(contract) ?? "")
  );

  return channels.map((channel) => {
    const ownerLike = guessOwnerChannel(channel.key);
    return {
      channelName: channel.key,
      mode: ownerLike ? "accountId" : "email",
      value: ownerLike ? params.accountId : "",
      timelineId: undefined,
      ignored: false,
    };
  });
}
