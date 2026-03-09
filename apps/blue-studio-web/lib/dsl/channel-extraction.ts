import type { DocStructureSummary } from "@blue-labs/sdk-dsl";
import type { ChannelBindingDraft } from "@/lib/workspace/types";

const NON_BINDING_CHANNELS = new Set([
  "document update channel",
  "embedded node channel",
  "lifecycle event channel",
  "triggered event channel",
]);

function guessOwnerChannel(channelName: string): boolean {
  return /(owner|me|requester|creator|author)/i.test(channelName);
}

function normalizeChannelName(channelName: string): string {
  const withoutCorePrefix = channelName.trim().replace(/^core\//i, "");
  return withoutCorePrefix
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/[^a-zA-Z0-9]+/g, " ")
    .trim()
    .toLowerCase();
}

export function requiresUserBinding(channelName: string): boolean {
  return !NON_BINDING_CHANNELS.has(normalizeChannelName(channelName));
}

export function extractChannelBindingsFromStructure(params: {
  structure: DocStructureSummary;
  accountId: string;
}): ChannelBindingDraft[] {
  const channels = params.structure.contracts.filter(
    (contract) => contract.kind === "channel" && requiresUserBinding(contract.key)
  );

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
