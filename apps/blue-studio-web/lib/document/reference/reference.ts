export type DocumentReferenceSourceType =
  | "blueprint"
  | "yaml"
  | "live-json-fallback";

function compact(value: string | null | undefined): string | null {
  if (!value) {
    return null;
  }
  const normalized = value.replace(/\s+/g, " ").trim();
  return normalized.length > 0 ? normalized : null;
}

function slugify(value: string): string {
  const clean = value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
  return clean || "document-reference";
}

export function buildDocumentReferencePromptInput(params: {
  sourceType: DocumentReferenceSourceType;
  content: string;
}): string {
  return ["SOURCE_TYPE:", params.sourceType, "", "CONTENT:", params.content].join("\n");
}

export function inferDocumentReferenceFileName(params: {
  sourceType: DocumentReferenceSourceType;
  threadTitle?: string | null;
  sessionId?: string | null;
}): string {
  const title = compact(params.threadTitle);
  if (title) {
    return `${slugify(title)}.myos.txt`;
  }
  const sessionId = compact(params.sessionId);
  if (sessionId) {
    return `${slugify(sessionId)}.myos.txt`;
  }
  const prefix =
    params.sourceType === "blueprint"
      ? "workspace-document"
      : params.sourceType === "yaml"
        ? "external-session"
        : "external-session-best-effort";
  return `${prefix}.myos.txt`;
}

export function contextLabelForSourceType(
  sourceType: DocumentReferenceSourceType
): string {
  if (sourceType === "blueprint") {
    return "App document reference";
  }
  if (sourceType === "yaml") {
    return "External MyOS session";
  }
  return "External MyOS session (best-effort)";
}

function safeJson(value: unknown): string {
  return JSON.stringify(value ?? null, null, 2);
}

function readRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }
  return value as Record<string, unknown>;
}

function readString(value: unknown): string | null {
  return typeof value === "string" && value.trim().length > 0 ? value : null;
}

const PREFERRED_KEYS = [
  "yaml",
  "schema",
  "blueprint",
  "documentSchema",
  "documentBlueprint",
  "dslSchema",
] as const;

export function chooseExternalReferenceSource(retrieved: unknown): {
  sourceType: DocumentReferenceSourceType;
  content: string;
} {
  const record = readRecord(retrieved);
  if (!record) {
    return {
      sourceType: "live-json-fallback",
      content: safeJson(retrieved),
    };
  }

  for (const key of PREFERRED_KEYS) {
    const value = record[key];
    if (typeof value === "string" && value.trim().length > 0) {
      return {
        sourceType: "yaml",
        content: value,
      };
    }
    if (value && typeof value === "object") {
      return {
        sourceType: "yaml",
        content: safeJson(value),
      };
    }
  }

  const documentJson = record.document;
  if (documentJson !== undefined) {
    return {
      sourceType: "live-json-fallback",
      content: safeJson(documentJson),
    };
  }

  const flattened = readString(record.payload) ?? safeJson(record);
  return {
    sourceType: "live-json-fallback",
    content: flattened,
  };
}
