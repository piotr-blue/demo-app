import type { DocumentRecord, DocumentAnchorRecord } from "@/lib/demo/types";

export interface LiveMappedAnchorLink {
  anchorKey: string;
  childSessionId: string;
}

function nextId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function readRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === "object" && value !== null ? (value as Record<string, unknown>) : null;
}

function unwrapValue(value: unknown): unknown {
  const record = readRecord(value);
  if (record && Object.prototype.hasOwnProperty.call(record, "value")) {
    return record.value;
  }
  return value;
}

function readString(value: unknown): string | null {
  const unwrapped = unwrapValue(value);
  return typeof unwrapped === "string" && unwrapped.trim().length > 0 ? unwrapped.trim() : null;
}

function readBoolean(value: unknown): boolean | null {
  const unwrapped = unwrapValue(value);
  if (typeof unwrapped === "boolean") {
    return unwrapped;
  }
  return null;
}

function sanitizeText(value: string): string {
  return value.replace(/\s+/gu, " ").trim();
}

function titleFromSession(sessionId: string): string {
  return `Live document ${sessionId.slice(0, 8)}`;
}

function parseTypeLabelFromKind(kind: string): string {
  if (!kind) {
    return "Document";
  }
  const normalized = kind.trim();
  if (!normalized) {
    return "Document";
  }
  return normalized
    .split(/[-_\s]+/u)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function readContracts(value: unknown): Record<string, unknown> {
  return readRecord(unwrapValue(value)) ?? {};
}

function isAnchorContract(record: Record<string, unknown>): boolean {
  const type = readString(record.type);
  return type === "MyOS/Document Anchor";
}

function isAnchorsContract(record: Record<string, unknown>): boolean {
  const type = readString(record.type);
  return type === "MyOS/Document Anchors";
}

function isLinksContract(record: Record<string, unknown>): boolean {
  const type = readString(record.type);
  return type === "MyOS/Document Links";
}

function isSessionLinkContract(record: Record<string, unknown>): boolean {
  const type = readString(record.type);
  return type === "MyOS/MyOS Session Link";
}

function parseFieldsFromDocumentValue(documentValue: Record<string, unknown>): Array<{ label: string; value: string }> {
  const excluded = new Set(["name", "description", "contracts", "type", "status", "source", "isPublic"]);
  const fields: Array<{ label: string; value: string }> = [];
  for (const [key, raw] of Object.entries(documentValue)) {
    if (excluded.has(key)) {
      continue;
    }
    const unwrapped = unwrapValue(raw);
    if (
      typeof unwrapped === "string" ||
      typeof unwrapped === "number" ||
      typeof unwrapped === "boolean"
    ) {
      const value = String(unwrapped).trim();
      if (!value) {
        continue;
      }
      fields.push({
        label: key,
        value,
      });
      continue;
    }
    if (unwrapped && typeof unwrapped === "object") {
      const nestedRecord = readRecord(unwrapped);
      if (nestedRecord) {
        const nestedValue = readString(nestedRecord.value);
        if (nestedValue) {
          fields.push({
            label: key,
            value: nestedValue,
          });
        }
      }
    }
  }
  return fields.slice(0, 12);
}

function parseAnchorContracts(params: {
  liveDocumentId: string;
  contracts: Record<string, unknown>;
}): DocumentAnchorRecord[] {
  const anchorsContractEntry = Object.entries(params.contracts).find(([, value]) => {
    const record = readRecord(unwrapValue(value));
    return record ? isAnchorsContract(record) : false;
  });
  if (!anchorsContractEntry) {
    return [];
  }
  const anchorsRecord = readRecord(unwrapValue(anchorsContractEntry[1]));
  if (!anchorsRecord) {
    return [];
  }

  const anchors: DocumentAnchorRecord[] = [];
  for (const [key, value] of Object.entries(anchorsRecord)) {
    if (key === "type") {
      continue;
    }
    const anchorRecord = readRecord(unwrapValue(value));
    if (!anchorRecord || !isAnchorContract(anchorRecord)) {
      continue;
    }
    const label = readString(anchorRecord.label) ?? key;
    anchors.push({
      id: `anchor_live_${params.liveDocumentId}_${key}`,
      documentId: params.liveDocumentId,
      key,
      label,
      linkedDocumentIds: [],
      searchKeywords: [key.toLowerCase(), label.toLowerCase()],
    });
  }
  return anchors;
}

function parseLinkedSessionLinks(contracts: Record<string, unknown>): Array<{ anchorKey: string; childSessionId: string }> {
  const linksContractEntry = Object.entries(contracts).find(([, value]) => {
    const record = readRecord(unwrapValue(value));
    return record ? isLinksContract(record) : false;
  });
  if (!linksContractEntry) {
    return [];
  }
  const linksRecord = readRecord(unwrapValue(linksContractEntry[1]));
  if (!linksRecord) {
    return [];
  }
  const links: Array<{ anchorKey: string; childSessionId: string }> = [];
  for (const value of Object.values(linksRecord)) {
    const linkRecord = readRecord(unwrapValue(value));
    if (!linkRecord || !isSessionLinkContract(linkRecord)) {
      continue;
    }
    const anchorKey = readString(linkRecord.anchor);
    const childSessionId = readString(linkRecord.sessionId);
    if (!anchorKey || !childSessionId) {
      continue;
    }
    links.push({ anchorKey, childSessionId });
  }
  return links;
}

export function createLiveDocumentIdFromSessionId(sessionId: string): string {
  return `doc_live_${sessionId}`;
}

export function mapMyOsListItemToDocumentRecord(params: {
  item: Record<string, unknown>;
  ownerAccountId: string;
  ownerName: string;
}): DocumentRecord | null {
  const sessionId = readString(params.item.sessionId);
  if (!sessionId) {
    return null;
  }
  const type = readString(params.item.type);
  if (type === "MyOS/Document Session Bootstrap") {
    return null;
  }
  const title = sanitizeText(readString(params.item.name) ?? titleFromSession(sessionId));
  const summary = sanitizeText(
    readString(params.item.description) ?? "Live MyOS document synchronized into Blue Studio."
  );
  const isPublic = readBoolean(params.item.isPublic) ?? false;
  const status = readString(params.item.processingStatus) ?? "active";
  const documentId = createLiveDocumentIdFromSessionId(sessionId);
  const myosDocumentId = readString(params.item.documentId);
  const now = new Date().toISOString();

  return {
    id: documentId,
    scopeId: null,
    kind: "document",
    category: "content",
    sectionKey: null,
    title,
    summary,
    status,
    owner: params.ownerName,
    participants: [params.ownerName],
    tags: ["live", "myos"],
    isService: false,
    ownerAccountId: params.ownerAccountId,
    participantAccountIds: [params.ownerAccountId],
    isPublic,
    visibleToAccountIds: [params.ownerAccountId],
    searchVisibility: isPublic ? "public" : "private",
    starredByAccountIds: [],
    linkedDocumentIds: [],
    anchorIds: [],
    taskIds: [],
    typeLabel: "Document",
    oneLineSummary: summary,
    visibilityLabel: isPublic ? "Public" : "Private",
    coreFields: [
      { label: "Name", value: title },
      { label: "Description", value: summary },
      { label: "Source", value: "MyOS live" },
    ],
    detailBlocks: [
      {
        id: "overview",
        title: "Overview",
        items: [
          { label: "Name", value: title },
          { label: "Session ID", value: sessionId },
          { label: "Document ID", value: myosDocumentId ?? "unknown" },
        ],
      },
    ],
    descriptionText: summary,
    initialMessage: "This document was synchronized from your live MyOS account.",
    currentStateText: `Current processing status: ${status}.`,
    currentStateFields: [{ label: "Processing status", value: status }],
    participantsDetailed: [
      {
        id: params.ownerAccountId,
        accountId: params.ownerAccountId,
        name: params.ownerName,
        subtitle: "Owner",
        roles: ["Owner"],
      },
    ],
    allOperations: [],
    pendingOperations: [],
    embeddedDocuments: [],
    createdAt: now,
    updatedAt: now,
    sessionId,
    myosDocumentId,
    settingsBlocks: [
      {
        id: "settings",
        title: "Document settings",
        items: [
          { label: "Visibility", value: isPublic ? "Public" : "Private" },
          { label: "Session ID", value: sessionId },
        ],
      },
    ],
    shareSettings: {
      shareWithOthers: isPublic,
      makePublic: isPublic,
      entries: [],
    },
    services: [],
    sourceData: params.item,
    details: {
      source: "myos-live-list",
      raw: params.item,
    },
    uiCards: [],
    activity: [],
    searchKeywords: [
      title.toLowerCase(),
      summary.toLowerCase(),
      "live",
      "myos",
      sessionId.toLowerCase(),
    ],
  };
}

export function mapMyOsRetrievedToDocumentRecord(params: {
  retrieved: Record<string, unknown>;
  ownerAccountId: string;
  ownerName: string;
  existingDocument?: DocumentRecord | null;
}): {
  document: DocumentRecord | null;
  anchors: DocumentAnchorRecord[];
  linkedSessionIds: LiveMappedAnchorLink[];
} {
  const sessionId = readString(params.retrieved.sessionId);
  if (!sessionId) {
    return { document: null, anchors: [], linkedSessionIds: [] };
  }
  const type = readString(params.retrieved.type);
  if (type === "MyOS/Document Session Bootstrap") {
    return { document: null, anchors: [], linkedSessionIds: [] };
  }

  const documentValue = readRecord(unwrapValue(params.retrieved.document)) ?? {};
  const rawName = readString(documentValue.name) ?? readString(params.retrieved.name);
  const rawDescription =
    readString(documentValue.description) ?? readString(params.retrieved.description) ?? null;
  const title = sanitizeText(rawName ?? titleFromSession(sessionId));
  const summary = sanitizeText(rawDescription ?? "Live MyOS document synchronized into Blue Studio.");
  const kind = readString(documentValue.kind) ?? params.existingDocument?.kind ?? "document";
  const isPublic =
    readBoolean(params.retrieved.isPublic) ??
    readBoolean(documentValue.isPublic) ??
    params.existingDocument?.isPublic ??
    false;
  const status =
    readString(params.retrieved.processingStatus) ??
    readString(params.retrieved.status) ??
    params.existingDocument?.status ??
    "active";
  const now = new Date().toISOString();
  const documentId = createLiveDocumentIdFromSessionId(sessionId);
  const myosDocumentId =
    readString(params.retrieved.documentId) ??
    readString(documentValue.documentId) ??
    params.existingDocument?.myosDocumentId ??
    null;

  const fieldsFromDocumentValue = parseFieldsFromDocumentValue(documentValue);
  const coreFields =
    fieldsFromDocumentValue.length > 0
      ? fieldsFromDocumentValue.map((field) => ({
          label: parseTypeLabelFromKind(field.label),
          value: field.value,
        }))
      : [
          { label: "Name", value: title },
          { label: "Description", value: summary },
          { label: "Source", value: "MyOS live" },
        ];

  const contracts = readContracts(documentValue.contracts);
  const anchors = parseAnchorContracts({
    liveDocumentId: documentId,
    contracts,
  });
  const linkedSessions = parseLinkedSessionLinks(contracts);

  const linkedDocumentIds = linkedSessions.map((entry) =>
    createLiveDocumentIdFromSessionId(entry.childSessionId)
  );

  const document: DocumentRecord = {
    id: documentId,
    scopeId: null,
    kind,
    category: "content",
    sectionKey: null,
    title,
    summary,
    status,
    owner: params.ownerName,
    participants: [params.ownerName],
    tags: ["live", "myos", kind.toLowerCase()],
    isService: false,
    ownerAccountId: params.ownerAccountId,
    participantAccountIds: [params.ownerAccountId],
    isPublic,
    visibleToAccountIds: [params.ownerAccountId],
    searchVisibility: isPublic ? "public" : "private",
    starredByAccountIds: params.existingDocument?.starredByAccountIds ?? [],
    linkedDocumentIds,
    anchorIds: anchors.map((anchor) => anchor.id),
    taskIds: params.existingDocument?.taskIds ?? [],
    typeLabel: parseTypeLabelFromKind(kind),
    oneLineSummary: summary,
    visibilityLabel: isPublic ? "Public" : "Private",
    coreFields,
    detailBlocks: [
      {
        id: "overview",
        title: "Overview",
        items: [
          { label: "Session ID", value: sessionId },
          { label: "Document ID", value: myosDocumentId ?? "unknown" },
          { label: "Kind", value: parseTypeLabelFromKind(kind) },
        ],
      },
      ...(anchors.length > 0
        ? [
            {
              id: "anchors",
              title: "Anchors",
              items: anchors.map((anchor) => ({
                label: anchor.label,
                value: anchor.key,
              })),
            },
          ]
        : []),
    ],
    descriptionText: summary,
    initialMessage:
      params.existingDocument?.initialMessage ??
      "This document was synchronized from your live MyOS account.",
    currentStateText: `Current processing status: ${status}.`,
    currentStateFields: [{ label: "Processing status", value: status }],
    participantsDetailed: [
      {
        id: params.ownerAccountId,
        accountId: params.ownerAccountId,
        name: params.ownerName,
        subtitle: "Owner",
        roles: ["Owner"],
      },
    ],
    allOperations: params.existingDocument?.allOperations ?? [],
    pendingOperations: params.existingDocument?.pendingOperations ?? [],
    embeddedDocuments: params.existingDocument?.embeddedDocuments ?? [],
    createdAt: params.existingDocument?.createdAt ?? now,
    updatedAt: now,
    sessionId,
    myosDocumentId,
    settingsBlocks: [
      {
        id: "settings",
        title: "Document settings",
        items: [
          { label: "Visibility", value: isPublic ? "Public" : "Private" },
          { label: "Session ID", value: sessionId },
        ],
      },
    ],
    shareSettings: {
      shareWithOthers: isPublic,
      makePublic: isPublic,
      entries: params.existingDocument?.shareSettings?.entries ?? [],
    },
    services: params.existingDocument?.services ?? [],
    sourceData: params.retrieved,
    details: {
      source: "myos-live-retrieve",
      raw: params.retrieved,
      refreshId: nextId("refresh"),
    },
    uiCards: params.existingDocument?.uiCards ?? [],
    activity: params.existingDocument?.activity ?? [],
    searchKeywords: Array.from(
      new Set([
        ...(params.existingDocument?.searchKeywords ?? []),
        title.toLowerCase(),
        summary.toLowerCase(),
        kind.toLowerCase(),
        sessionId.toLowerCase(),
      ])
    ),
  };

  return {
    document,
    anchors,
    linkedSessionIds: linkedSessions,
  };
}
