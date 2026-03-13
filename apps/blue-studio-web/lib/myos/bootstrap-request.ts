import type { ChannelBindingsInput } from "@blue-labs/myos-js";
import { toMyOsBindings } from "@/lib/myos/bindings";
import type { ChannelBindingDraft } from "@/lib/workspace/types";

export interface BootstrapRequestPreview {
  documentJson: unknown;
  bindings: ChannelBindingsInput;
}

export function rewriteCoreChannelTypeForBootstrap(value: unknown): unknown {
  if (value === "Core/Channel") {
    return "MyOS/MyOS Timeline Channel";
  }

  if (Array.isArray(value)) {
    return value.map((entry) => rewriteCoreChannelTypeForBootstrap(entry));
  }

  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    return Object.fromEntries(
      Object.entries(record).map(([key, nested]) => [key, rewriteCoreChannelTypeForBootstrap(nested)])
    );
  }

  return value;
}

export function buildBootstrapRequestPreview(
  documentJson: unknown,
  bindings: ChannelBindingDraft[]
): BootstrapRequestPreview {
  return {
    documentJson: rewriteCoreChannelTypeForBootstrap(documentJson),
    bindings: toMyOsBindings(bindings),
  };
}
