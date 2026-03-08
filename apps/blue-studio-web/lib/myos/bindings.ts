import type { ChannelBindingsInput } from "@blue-labs/myos-js";
import type { ChannelBindingDraft } from "@/lib/workspace/types";

export function toMyOsBindings(bindings: ChannelBindingDraft[]): ChannelBindingsInput {
  return Object.fromEntries(
    bindings.map((binding) => {
      const payload =
        binding.mode === "email"
          ? {
              email: binding.value,
              timelineId: binding.timelineId || undefined,
            }
          : {
              accountId: binding.value,
              timelineId: binding.timelineId || undefined,
            };

      return [binding.channelName, payload];
    })
  );
}
