import type {
  BlueprintMetadata,
  BlueprintParticipant,
} from "@/lib/workspace/types";

const SECTION_HEADER_PATTERN = /^[A-Z][A-Z0-9 /\-()]+:\s*$/;
const PARTICIPANT_LINE_PATTERN = /^-\s*([^—–-]+?)\s*(?:—|–|-)\s*(.+)$/;
const SYSTEM_LIKE_PATTERN = /(guarantor|system|processor|admin|daemon|bot)/i;

function compact(value: string | null | undefined): string | null {
  if (!value) {
    return null;
  }
  const normalized = value.replace(/\s+/g, " ").trim();
  return normalized.length > 0 ? normalized : null;
}

function parseLineValue(blueprint: string, label: string): string | null {
  const expression = new RegExp(`^${label}:\\s*(.+)$`, "im");
  const match = blueprint.match(expression);
  return compact(match?.[1] ?? null);
}

function parseCurrencyCode(blueprint: string): string | null {
  const explicitCurrency = blueprint.match(/^\s*Currency:\s*([A-Z]{3})\b/im)?.[1];
  if (explicitCurrency) {
    return explicitCurrency;
  }
  const genericCurrency = blueprint.match(/currency[^A-Z]*([A-Z]{3})\b/i)?.[1];
  return genericCurrency ?? null;
}

function parseParticipants(blueprint: string): BlueprintParticipant[] {
  const lines = blueprint.split(/\r?\n/);
  const startIndex = lines.findIndex((line) => /^\s*PARTICIPANTS:\s*$/i.test(line));
  if (startIndex === -1) {
    return [];
  }

  const participants: BlueprintParticipant[] = [];
  for (let index = startIndex + 1; index < lines.length; index += 1) {
    const rawLine = lines[index]?.trim() ?? "";
    if (!rawLine) {
      continue;
    }
    if (SECTION_HEADER_PATTERN.test(rawLine)) {
      break;
    }
    const parsed = rawLine.match(PARTICIPANT_LINE_PATTERN);
    if (!parsed) {
      continue;
    }

    const channelName = compact(parsed[1]);
    const description = compact(parsed[2]) ?? "";
    if (!channelName) {
      continue;
    }
    participants.push({
      channelName,
      description,
      systemLike: SYSTEM_LIKE_PATTERN.test(channelName) || SYSTEM_LIKE_PATTERN.test(description),
    });
  }
  return participants;
}

export function parseBlueprintMetadata(blueprint: string): BlueprintMetadata {
  return {
    documentName: parseLineValue(blueprint, "BLUEPRINT"),
    summary: parseLineValue(blueprint, "SUMMARY"),
    currencyCode: parseCurrencyCode(blueprint),
    participants: parseParticipants(blueprint),
  };
}

export function chooseDefaultViewer(participants: BlueprintParticipant[]): string | null {
  const nonSystem = participants.find((participant) => !participant.systemLike);
  if (nonSystem) {
    return nonSystem.channelName;
  }
  return participants[0]?.channelName ?? null;
}

function trimForLabel(value: string, maxLength: number): string {
  return value.length <= maxLength ? value : `${value.slice(0, maxLength - 1)}…`;
}

export function deriveThreadFallbackTitle(
  metadata: BlueprintMetadata | null,
  promptText: string | null
): string {
  const fromBlueprint = compact(metadata?.documentName);
  if (fromBlueprint) {
    return trimForLabel(fromBlueprint, 80);
  }
  const fromPrompt = compact(promptText);
  if (fromPrompt) {
    return trimForLabel(fromPrompt, 80);
  }
  return "Untitled thread";
}

export function deriveThreadFallbackSummary(
  metadata: BlueprintMetadata | null,
  promptText: string | null
): string {
  const fromBlueprint = compact(metadata?.summary);
  if (fromBlueprint) {
    return trimForLabel(fromBlueprint, 140);
  }
  const fromPrompt = compact(promptText);
  if (fromPrompt) {
    return trimForLabel(fromPrompt, 140);
  }
  return "No summary yet.";
}

