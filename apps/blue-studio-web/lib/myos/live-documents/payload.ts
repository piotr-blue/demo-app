import type { LiveAssistantDocPayload } from "@/lib/demo/types";

function sanitizeText(value: string): string {
  return value.trim();
}

function isTruthyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function normalizeFields(fields: Record<string, string>): Record<string, string> {
  const result: Record<string, string> = {};
  for (const [key, value] of Object.entries(fields)) {
    if (!isTruthyString(key) || !isTruthyString(value)) {
      continue;
    }
    result[key] = sanitizeText(value);
  }
  return result;
}

function normalizeAnchors(anchors: LiveAssistantDocPayload["anchors"]) {
  const result: Record<string, { type: "MyOS/Document Anchor"; label: string; purpose: string }> = {};
  for (const anchor of anchors) {
    const key = sanitizeText(anchor.key);
    if (!key) {
      continue;
    }
    result[key] = {
      type: "MyOS/Document Anchor",
      label: sanitizeText(anchor.label),
      purpose: sanitizeText(anchor.purpose),
    };
  }
  return result;
}

export function buildLiveDocumentJson(doc: LiveAssistantDocPayload): Record<string, unknown> {
  const normalizedFields = normalizeFields(doc.fields);
  const normalizedAnchors = normalizeAnchors(doc.anchors);
  const hasAnchors = Object.keys(normalizedAnchors).length > 0;

  const payload: Record<string, unknown> = {
    name: sanitizeText(doc.name),
    description: sanitizeText(doc.description),
    kind: sanitizeText(doc.kind),
    status: "active",
    source: "live-assistant",
    fields: normalizedFields,
    contracts: {
      ownerChannel: {
        type: "MyOS/MyOS Timeline Channel",
      },
    },
  };

  if (hasAnchors) {
    (payload.contracts as Record<string, unknown>).anchors = {
      type: "MyOS/Document Anchors",
      ...normalizedAnchors,
    };
  }

  return payload;
}

export function buildSessionLinkDocumentJson(params: {
  parentSessionId: string;
  parentDocumentId: string;
  childSessionId: string;
  anchorKey: string;
  childName: string;
}): Record<string, unknown> {
  const anchorKey = sanitizeText(params.anchorKey);
  const childName = sanitizeText(params.childName);
  return {
    name: `Link — ${childName}`,
    description: `Session link attaching ${childName} to anchor "${anchorKey}".`,
    type: "MyOS/Document Session Link",
    status: "active",
    source: "live-assistant-linking",
    parentSessionId: sanitizeText(params.parentSessionId),
    parentDocumentId: sanitizeText(params.parentDocumentId),
    contracts: {
      ownerChannel: {
        type: "MyOS/MyOS Timeline Channel",
      },
      links: {
        type: "MyOS/Document Links",
        [`link_${anchorKey}`]: {
          type: "MyOS/MyOS Session Link",
          anchor: anchorKey,
          sessionId: sanitizeText(params.childSessionId),
        },
      },
    },
  };
}
