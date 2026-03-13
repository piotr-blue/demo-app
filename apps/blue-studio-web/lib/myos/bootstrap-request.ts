import {
  buildBootstrapPayload,
  type ChannelBindingsInput,
} from "@blue-labs/myos-js";
import { toMyOsBindings } from "@/lib/myos/bindings";
import type { ChannelBindingDraft } from "@/lib/workspace/types";

export type BootstrapRequestPreview = Record<string, unknown>;

export function buildBootstrapRequestPreview(
  documentJson: unknown,
  bindings: ChannelBindingDraft[]
): BootstrapRequestPreview {
  return buildBootstrapPayload({
    document: documentJson as Record<string, unknown>,
    channelBindings: toMyOsBindings(bindings) as ChannelBindingsInput,
  });
}
