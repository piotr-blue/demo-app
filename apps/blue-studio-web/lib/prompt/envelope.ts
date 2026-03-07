import type { UIMessage } from "ai";
import type { QaPair, StoredAttachment } from "@/lib/workspace/types";

function textFromParts(message: UIMessage): string {
  const textParts = message.parts
    .filter((part): part is { type: "text"; text: string } => part.type === "text")
    .map((part) => part.text.trim())
    .filter(Boolean);
  return textParts.join("\n");
}

export function collectUserPrompts(messages: UIMessage[]): string[] {
  return messages
    .filter((message) => message.role === "user")
    .map((message) => textFromParts(message))
    .filter(Boolean);
}

export function buildBlueprintEnvelope(params: {
  messages: UIMessage[];
  attachments: StoredAttachment[];
  qaPairs: QaPair[];
  currentBlueprint?: string | null;
}): string {
  const promptSection = collectUserPrompts(params.messages).join("\n\n");

  const contextSection =
    params.attachments.length === 0
      ? "No file context provided."
      : params.attachments
          .map((attachment) => {
            const prefix = attachment.contextLabel
              ? `=== FILE: ${attachment.name} (${attachment.contextLabel}) ===`
              : `=== FILE: ${attachment.name} ===`;
            return `${prefix}\n${attachment.extractedText}`;
          })
          .join("\n\n");

  const qaSection =
    params.qaPairs.length === 0
      ? "No prior questions."
      : params.qaPairs
          .map((pair, index) => `Q${index + 1}: ${pair.question}\nA${index + 1}: ${pair.answer}`)
          .join("\n\n");

  const sections = [
    "PROMPT:",
    promptSection || "No user prompt provided.",
    "",
    "CONTEXT:",
    contextSection,
    "",
    "QA:",
    qaSection,
  ];

  if (params.currentBlueprint) {
    sections.push("", "CURRENT_BLUEPRINT:", params.currentBlueprint);
  }

  return sections.join("\n");
}
