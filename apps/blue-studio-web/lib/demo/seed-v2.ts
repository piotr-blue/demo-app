import type {
  ActivityRecord,
  AssistantConversationRecord,
  AssistantExchangeMessageRecord,
  AssistantExchangeRecord,
  AssistantPlaybookRecord,
  AttentionItem,
  DemoAccountRecord,
  DemoActionDefinition,
  DemoEmbeddedDocumentRecord,
  DemoFieldRecord,
  DemoOperationRecord,
  DemoParticipantRecord,
  DemoServiceConnectionRecord,
  DemoShareRecord,
  DemoShareSettings,
  DemoSettingsBlock,
  DemoSnapshot,
  DocumentAnchorRecord,
  DocumentRecord,
  ThreadRecord,
} from "@/lib/demo/types";

export const DEFAULT_DEMO_ACCOUNT_ID = "account_piotr_blue";
export const BLINK_SCOPE_ID = "home_acc_piotr_blue";

const ACCOUNT_PIOTR = "account_piotr_blue";
const ACCOUNT_ALICE = "account_alice";
const ACCOUNT_BOB = "account_bob";
const ACCOUNT_CELINE = "account_celine";

const ALL_ACCOUNTS = [ACCOUNT_PIOTR, ACCOUNT_ALICE, ACCOUNT_BOB, ACCOUNT_CELINE];
const BASE_TIME = Date.parse("2026-03-24T09:00:00.000Z");

function at(minutes: number): string {
  return new Date(BASE_TIME + minutes * 60_000).toISOString();
}

function field(label: string, value: string, tone?: DemoFieldRecord["tone"]): DemoFieldRecord {
  return { label, value, tone };
}

function block(
  id: string,
  title: string,
  items: Array<{ label: string; value: string }>,
  description?: string
): DemoSettingsBlock {
  return { id, title, description, items };
}

function action(
  id: string,
  label: string,
  activityTitle: string,
  activityDetail: string,
  nextStatus?: string,
  assistantNote?: string,
  metadataPatch?: Record<string, unknown>
): DemoActionDefinition {
  return {
    id,
    label,
    activityTitle,
    activityDetail,
    nextStatus,
    assistantNote,
    metadataPatch,
  };
}

function participant(
  id: string,
  name: string,
  params?: Partial<Omit<DemoParticipantRecord, "id" | "name">>
): DemoParticipantRecord {
  return {
    id,
    name,
    accountId: params?.accountId ?? null,
    email: params?.email ?? null,
    subtitle: params?.subtitle ?? null,
    avatar: params?.avatar ?? null,
    roles: params?.roles ?? [],
  };
}

function operation(
  id: string,
  title: string,
  summary: string,
  status: DemoOperationRecord["status"],
  params?: Partial<Pick<DemoOperationRecord, "kind" | "actionLabel">>
): DemoOperationRecord {
  return {
    id,
    title,
    summary,
    status,
    kind: params?.kind,
    actionLabel: params?.actionLabel ?? null,
  };
}

function embeddedDocument(
  documentId: string,
  title: string,
  summary: string,
  params?: Partial<Pick<DemoEmbeddedDocumentRecord, "subtitle" | "status">>
): DemoEmbeddedDocumentRecord {
  return {
    documentId,
    title,
    summary,
    subtitle: params?.subtitle ?? null,
    status: params?.status ?? null,
  };
}

function serviceConnection(
  id: string,
  name: string,
  provider: string,
  status: DemoServiceConnectionRecord["status"],
  description: string
): DemoServiceConnectionRecord {
  return {
    id,
    name,
    provider,
    status,
    description,
  };
}

function shareEntry(
  id: string,
  type: DemoShareRecord["type"],
  name: string,
  params?: Partial<Omit<DemoShareRecord, "id" | "type" | "name">>
): DemoShareRecord {
  return {
    id,
    type,
    name,
    subtitle: params?.subtitle ?? null,
    agreement: params?.agreement ?? null,
    status: params?.status ?? null,
  };
}

function shareSettings(
  shareWithOthers: boolean,
  makePublic: boolean,
  entries: DemoShareRecord[]
): DemoShareSettings {
  return {
    shareWithOthers,
    makePublic,
    entries,
  };
}

function activity(params: {
  id: string;
  kind: string;
  title: string;
  detail: string;
  minute: number;
  documentId?: string | null;
  threadId?: string | null;
  accountId?: string | null;
  visibleToAccountIds?: string[];
  actorName?: string | null;
  actorEmail?: string | null;
  actorAvatar?: string | null;
  actorSide?: ActivityRecord["actorSide"];
  actorType?: ActivityRecord["actorType"];
  tone?: ActivityRecord["tone"];
  linkedLabel?: string | null;
}) {
  const record: ActivityRecord = {
    id: params.id,
    kind: params.kind,
    title: params.title,
    detail: params.detail,
    createdAt: at(params.minute),
    documentId: params.documentId ?? null,
    threadId: params.threadId ?? null,
    accountId: params.accountId ?? null,
    visibleToAccountIds: params.visibleToAccountIds,
    actorName: params.actorName ?? null,
    actorEmail: params.actorEmail ?? null,
    actorAvatar: params.actorAvatar ?? null,
    actorSide: params.actorSide,
    actorType: params.actorType,
    tone: params.tone,
    linkedLabel: params.linkedLabel ?? null,
  };
  return record;
}

function document(params: {
  id: string;
  kind: string;
  category: string;
  title: string;
  summary: string;
  status: string;
  owner: string;
  ownerAccountId: string;
  participants?: string[];
  participantAccountIds?: string[];
  tags?: string[];
  isService?: boolean;
  isPublic?: boolean;
  visibleToAccountIds?: string[];
  searchVisibility?: DocumentRecord["searchVisibility"];
  starredByAccountIds?: string[];
  linkedDocumentIds?: string[];
  anchorIds?: string[];
  taskIds?: string[];
  parentDocumentId?: string | null;
  sectionKey?: string | null;
  typeLabel?: string;
  oneLineSummary?: string;
  visibilityLabel?: string;
  coreFields?: DemoFieldRecord[];
  detailBlocks?: DemoSettingsBlock[];
  descriptionText?: string;
  initialMessage?: string;
  currentStateText?: string;
  currentStateFields?: DemoFieldRecord[];
  participantsDetailed?: DemoParticipantRecord[];
  allOperations?: DemoOperationRecord[];
  pendingOperations?: DemoOperationRecord[];
  embeddedDocuments?: DemoEmbeddedDocumentRecord[];
  settingsBlocks?: DemoSettingsBlock[];
  shareSettings?: DemoShareSettings;
  services?: DemoServiceConnectionRecord[];
  sourceData?: Record<string, unknown> | string;
  details?: Record<string, unknown>;
  uiCards?: DocumentRecord["uiCards"];
  activity?: ActivityRecord[];
  searchKeywords?: string[];
  minute: number;
}) {
  const visibleTo = params.visibleToAccountIds ?? [params.ownerAccountId];
  const participants = params.participants ?? [params.owner];
  return {
    id: params.id,
    scopeId: null,
    kind: params.kind,
    category: params.category,
    sectionKey: params.sectionKey ?? null,
    title: params.title,
    summary: params.summary,
    status: params.status,
    owner: params.owner,
    participants,
    tags: params.tags ?? [],
    isService: params.isService ?? false,
    ownerAccountId: params.ownerAccountId,
    participantAccountIds: params.participantAccountIds ?? [],
    isPublic: params.isPublic ?? false,
    visibleToAccountIds: visibleTo,
    searchVisibility: params.searchVisibility ?? (params.isPublic ? "public" : "participants"),
    starredByAccountIds: params.starredByAccountIds ?? [],
    linkedDocumentIds: params.linkedDocumentIds ?? [],
    anchorIds: params.anchorIds ?? [],
    taskIds: params.taskIds ?? [],
    parentDocumentId: params.parentDocumentId ?? null,
    typeLabel: params.typeLabel ?? params.kind,
    oneLineSummary: params.oneLineSummary ?? params.summary,
    visibilityLabel:
      params.visibilityLabel ?? (params.isPublic ? "Public" : visibleTo.length > 1 ? "Shared" : "Private"),
    coreFields: params.coreFields ?? [],
    detailBlocks: params.detailBlocks ?? [],
    descriptionText: params.descriptionText,
    initialMessage: params.initialMessage,
    currentStateText: params.currentStateText,
    currentStateFields: params.currentStateFields ?? [],
    participantsDetailed: params.participantsDetailed ?? [],
    allOperations: params.allOperations ?? [],
    pendingOperations: params.pendingOperations ?? [],
    embeddedDocuments: params.embeddedDocuments ?? [],
    createdAt: at(params.minute),
    updatedAt: at(params.minute + 5),
    sessionId: null,
    myosDocumentId: null,
    settingsBlocks: params.settingsBlocks ?? [],
    shareSettings: params.shareSettings,
    services: params.services ?? [],
    sourceData: params.sourceData,
    details: params.details ?? {},
    uiCards: params.uiCards ?? [],
    activity: params.activity ?? [],
    searchKeywords: params.searchKeywords ?? [],
  } satisfies DocumentRecord;
}

function thread(params: {
  id: string;
  title: string;
  summary: string;
  status: ThreadRecord["status"];
  owner: string;
  ownerAccountId: string;
  participantAccountIds: string[];
  visibleToAccountIds: string[];
  parentDocumentId: string;
  tags?: string[];
  progress: number;
  responsibleSummary: string;
  activityLabel: string;
  minute: number;
  messages?: ThreadRecord["messages"];
  participantsDetailed?: DemoParticipantRecord[];
  settingsBlocks?: DemoSettingsBlock[];
  uiCards?: ThreadRecord["uiCards"];
  activity?: ActivityRecord[];
}) {
  return {
    id: params.id,
    title: params.title,
    summary: params.summary,
    status: params.status,
    owner: params.owner,
    ownerAccountId: params.ownerAccountId,
    participantAccountIds: params.participantAccountIds,
    visibleToAccountIds: params.visibleToAccountIds,
    progress: params.progress,
    tags: params.tags ?? [],
    sectionKey: "tasks",
    createdAt: at(params.minute),
    updatedAt: at(params.minute + 10),
    parentDocumentId: params.parentDocumentId,
    coreDocumentId: null,
    sessionId: null,
    responsibleSummary: params.responsibleSummary,
    activityLabel: params.activityLabel,
    participantsDetailed: params.participantsDetailed ?? [],
    settingsBlocks: params.settingsBlocks ?? [],
    uiCards: params.uiCards ?? [],
    messages: params.messages ?? [],
    activity: params.activity ?? [],
  } satisfies ThreadRecord;
}

function anchor(
  id: string,
  documentId: string,
  key: string,
  label: string,
  linkedDocumentIds: string[],
  visibleToAccountIds?: string[]
) {
  return {
    id,
    documentId,
    key,
    label,
    linkedDocumentIds,
    visibleToAccountIds,
    searchKeywords: [label.toLowerCase(), key.toLowerCase()],
  } satisfies DocumentAnchorRecord;
}

function convo(
  id: string,
  targetType: "home" | "document",
  targetId: string,
  viewerAccountId: string,
  assistantName: string,
  minute: number
) {
  return {
    id,
    scopeId: null,
    targetType,
    targetId,
    viewerAccountId,
    assistantName,
    createdAt: at(minute),
    updatedAt: at(minute),
    lastSeenAt: null,
    lastRecapAt: null,
  } satisfies AssistantConversationRecord;
}

function playbook(
  id: string,
  targetType: "home" | "document",
  targetId: string,
  viewerAccountId: string,
  identity: string,
  minute: number
) {
  return {
    id,
    scopeId: null,
    targetType,
    targetId,
    viewerAccountId,
    inheritsFromScopeId: null,
    identityMarkdown: identity,
    defaultsMarkdown:
      "- Keep messages concise.\n- Treat document state as canonical truth.\n- Convert asks into structured next steps.",
    contextMarkdown:
      targetType === "home"
        ? "- You are helping the active account manage their Home."
        : "- You are helping the active viewer work with the currently open document.",
    overridesMarkdown:
      targetType === "home"
        ? "- Prioritize action queues and service relationships."
        : "- Keep the response grounded in this document and current viewer access.",
    updatedAt: at(minute),
  } satisfies AssistantPlaybookRecord;
}

function exchange(
  id: string,
  conversationId: string,
  targetType: "home" | "document",
  targetId: string,
  viewerAccountId: string,
  title: string,
  openerMessageId: string,
  latestMessageId: string,
  minute: number,
  params?: Partial<
    Pick<
      AssistantExchangeRecord,
      | "type"
      | "status"
      | "replyCount"
      | "requiresUserAction"
      | "stickyUntilResolved"
      | "linkedAttentionItemId"
      | "resolutionMessageId"
      | "resolvedAt"
      | "sourceType"
      | "sourceId"
    >
  >
) {
  return {
    id,
    conversationId,
    scopeId: null,
    targetType,
    targetId,
    viewerAccountId,
    type: params?.type ?? "question",
    status: params?.status ?? "resolved",
    title,
    openerMessageId,
    resolutionMessageId: params?.resolutionMessageId ?? null,
    latestMessageId,
    replyCount: params?.replyCount ?? 1,
    requiresUserAction: params?.requiresUserAction ?? false,
    stickyUntilResolved: params?.stickyUntilResolved ?? false,
    linkedAttentionItemId: params?.linkedAttentionItemId ?? null,
    sourceType: params?.sourceType ?? "assistant-demo",
    sourceId: params?.sourceId ?? null,
    canDeliverExternally: false,
    externalThreadKey: null,
    openedAt: at(minute),
    resolvedAt: params?.resolvedAt ?? at(minute + 2),
    updatedAt: at(minute + 2),
  } satisfies AssistantExchangeRecord;
}

function exchangeMessage(
  id: string,
  conversationId: string,
  exchangeId: string,
  role: AssistantExchangeMessageRecord["role"],
  kind: AssistantExchangeMessageRecord["kind"],
  body: string,
  minute: number
) {
  return {
    id,
    conversationId,
    exchangeId,
    scopeId: null,
    role,
    kind,
    body,
    createdAt: at(minute),
    surface: "app",
    externalMessageId: null,
    externalThreadMessageId: null,
  } satisfies AssistantExchangeMessageRecord;
}

const DOC_PROFILE_PIOTR = "doc_profile_piotr";
const DOC_PROFILE_ALICE = "doc_profile_alice";
const DOC_PROFILE_BOB = "doc_profile_bob";
const DOC_PROFILE_CELINE = "doc_profile_celine";
const DOC_ARCHITECTURE = "doc_demo_architecture_notes";
const DOC_FRESH_BITES = "doc_fresh_bites";
const DOC_BI_OFFERING = "doc_northwind_bi";
const DOC_BI_AGREEMENT = "doc_northwind_bi_agreement_alice";
const DOC_PARTNERFLOW_OFFERING = "doc_partnership_engine";
const DOC_PARTNERFLOW_AGREEMENT = "doc_partnership_engine_agreement_alice";
const DOC_PAYNOTE = "doc_kitchen_renovation_paynote";
const DOC_MY_LIFE = "doc_my_life";
const DOC_ORDER_BOB = "doc_order_fresh_bites_bob";

const THREAD_FIND_CUSTOMERS = "thread_find_customers_for_fresh_bites";
const THREAD_PAYNOTE = "thread_kitchen_milestone_review";
const THREAD_ORDER_BOB = "thread_order_bob_follow_up";

export function createSeedSnapshot(): DemoSnapshot {
  const freshBitesOrderIds = Array.from({ length: 11 }, (_, index) => `doc_order_fresh_bites_${1001 + index}`);
  const freshBitesProductIds = Array.from({ length: 8 }, (_, index) => `doc_product_fresh_bites_${index + 1}`);
  const freshBitesPartnershipIds = [
    "doc_partnership_portland_wellness",
    "doc_partnership_office_lunches",
    "doc_partnership_yoga_collective",
    "doc_partnership_school_snacks",
  ];
  const biReportIds = ["doc_bi_report_daily_sales", "doc_bi_report_weekly_mix"];
  const partnerflowPlaybookIds = ["doc_partnerflow_playbook_local_gym", "doc_partnerflow_playbook_office_park"];
  const myLifeNoteIds = [
    "doc_my_life_note_morning_walk",
    "doc_my_life_note_journal",
    "doc_my_life_note_book_list",
    "doc_my_life_note_weekend_plan",
  ];

  const accounts: DemoAccountRecord[] = [
    {
      id: ACCOUNT_PIOTR,
      accountId: "acc_piotr_blue",
      mode: "live",
      name: "piotr-blue",
      email: "piotr@blue.example",
      subtitle: "Current live account",
      avatar: "/user-avatar.png",
      description: "Live account for real assistant chat and real document creation.",
      isPrimary: true,
      homeScopeId: "home_acc_piotr_blue",
      profileDocumentId: DOC_PROFILE_PIOTR,
      favoriteDocumentIds: [],
      publicDocumentIds: [DOC_ARCHITECTURE],
      searchKeywords: ["piotr", "live", "operator", "builder", "myos"],
      website: "https://blue.example",
      location: "Warsaw",
    },
    {
      id: ACCOUNT_ALICE,
      accountId: "acc_alice",
      mode: "demo",
      name: "Alice Martinez",
      email: "alice@freshbites.example",
      subtitle: "Owner of Fresh Bites",
      avatar: "/user-avatar.png",
      description: "Healthy food restaurant owner in Portland focused on delivery, partnerships, and ops.",
      isPrimary: false,
      homeScopeId: "home_acc_alice",
      profileDocumentId: DOC_PROFILE_ALICE,
      favoriteDocumentIds: [DOC_FRESH_BITES, DOC_PARTNERFLOW_AGREEMENT, DOC_BI_AGREEMENT, DOC_PAYNOTE],
      publicDocumentIds: [DOC_FRESH_BITES],
      searchKeywords: ["alice", "fresh bites", "restaurant", "portland", "healthy food"],
      website: "https://freshbites.example",
      location: "Portland, OR",
      phone: "+1 503 555 0104",
    },
    {
      id: ACCOUNT_BOB,
      accountId: "acc_bob",
      mode: "demo",
      name: "Bob Chen",
      email: "bob@northwind.example",
      subtitle: "Northwind BI",
      avatar: "/user-avatar.png",
      description: "Analytics and reporting provider helping merchants understand orders, sales, and performance.",
      isPrimary: false,
      homeScopeId: "home_acc_bob",
      profileDocumentId: DOC_PROFILE_BOB,
      favoriteDocumentIds: [DOC_BI_OFFERING, DOC_MY_LIFE, DOC_FRESH_BITES, DOC_BI_AGREEMENT],
      publicDocumentIds: [DOC_BI_OFFERING, DOC_MY_LIFE],
      searchKeywords: ["bob", "northwind", "bi", "analytics", "reports"],
      website: "https://northwind.example",
      location: "Seattle, WA",
    },
    {
      id: ACCOUNT_CELINE,
      accountId: "acc_celine",
      mode: "demo",
      name: "Celine Duarte",
      email: "celine@partnerflow.example",
      subtitle: "PartnerFlow / Partnership Engine",
      avatar: "/user-avatar.png",
      description: "Partnership search and customer development service provider for local businesses.",
      isPrimary: false,
      homeScopeId: "home_acc_celine",
      profileDocumentId: DOC_PROFILE_CELINE,
      favoriteDocumentIds: [DOC_PARTNERFLOW_OFFERING, DOC_PARTNERFLOW_AGREEMENT, DOC_FRESH_BITES],
      publicDocumentIds: [DOC_PARTNERFLOW_OFFERING],
      searchKeywords: ["celine", "partnerflow", "partnership", "customer development"],
      website: "https://partnerflow.example",
      location: "Lisbon, PT",
    },
  ];

  const profileDocs: DocumentRecord[] = [
    document({
      id: DOC_PROFILE_PIOTR,
      kind: "profile",
      category: "profile",
      title: "piotr-blue",
      summary: "Builder/operator public profile.",
      status: "public",
      owner: "piotr-blue",
      ownerAccountId: ACCOUNT_PIOTR,
      participants: ["piotr-blue"],
      tags: ["profile", "operator"],
      isPublic: true,
      visibleToAccountIds: ALL_ACCOUNTS,
      searchVisibility: "public",
      typeLabel: "Profile",
      coreFields: [
        field("Account ID", "acc_piotr_blue"),
        field("Email", "piotr@blue.example"),
        field("Role", "MyOS operator"),
        field("Location", "Warsaw"),
      ],
      detailBlocks: [
        block("public", "Public info", [
          { label: "Description", value: "Builder/operator account used for the demo." },
          { label: "Website", value: "blue.example" },
        ]),
      ],
      searchKeywords: ["piotr-blue", "operator", "myos"],
      minute: 1,
    }),
    document({
      id: DOC_PROFILE_ALICE,
      kind: "profile",
      category: "profile",
      title: "Alice Martinez",
      summary: "Public profile for the owner of Fresh Bites.",
      status: "public",
      owner: "Alice Martinez",
      ownerAccountId: ACCOUNT_ALICE,
      participants: ["Alice Martinez"],
      tags: ["profile", "fresh bites"],
      isPublic: true,
      visibleToAccountIds: ALL_ACCOUNTS,
      searchVisibility: "public",
      typeLabel: "Profile",
      coreFields: [
        field("Account ID", "acc_alice"),
        field("Email", "alice@freshbites.example"),
        field("Subtitle", "Owner of Fresh Bites"),
        field("Location", "Portland, OR"),
      ],
      detailBlocks: [
        block("public", "Public info", [
          { label: "Description", value: "Healthy food restaurant owner in Portland." },
          { label: "Website", value: "freshbites.example" },
        ]),
      ],
      searchKeywords: ["alice", "fresh bites", "portland", "restaurant"],
      minute: 2,
    }),
    document({
      id: DOC_PROFILE_BOB,
      kind: "profile",
      category: "profile",
      title: "Bob Chen",
      summary: "Public profile for Northwind BI.",
      status: "public",
      owner: "Bob Chen",
      ownerAccountId: ACCOUNT_BOB,
      participants: ["Bob Chen"],
      tags: ["profile", "northwind", "bi"],
      isPublic: true,
      visibleToAccountIds: ALL_ACCOUNTS,
      searchVisibility: "public",
      typeLabel: "Profile",
      coreFields: [
        field("Account ID", "acc_bob"),
        field("Email", "bob@northwind.example"),
        field("Subtitle", "Northwind BI"),
        field("Location", "Seattle, WA"),
      ],
      detailBlocks: [
        block("public", "Public info", [
          { label: "Description", value: "Analytics and reporting provider." },
          { label: "Website", value: "northwind.example" },
        ]),
      ],
      searchKeywords: ["bob", "northwind bi", "analytics"],
      minute: 3,
    }),
    document({
      id: DOC_PROFILE_CELINE,
      kind: "profile",
      category: "profile",
      title: "Celine Duarte",
      summary: "Public profile for PartnerFlow.",
      status: "public",
      owner: "Celine Duarte",
      ownerAccountId: ACCOUNT_CELINE,
      participants: ["Celine Duarte"],
      tags: ["profile", "partnerflow", "partnership"],
      isPublic: true,
      visibleToAccountIds: ALL_ACCOUNTS,
      searchVisibility: "public",
      typeLabel: "Profile",
      coreFields: [
        field("Account ID", "acc_celine"),
        field("Email", "celine@partnerflow.example"),
        field("Subtitle", "PartnerFlow / Partnership Engine"),
        field("Location", "Lisbon, PT"),
      ],
      detailBlocks: [
        block("public", "Public info", [
          { label: "Description", value: "Partnership search and customer development provider." },
          { label: "Website", value: "partnerflow.example" },
        ]),
      ],
      searchKeywords: ["celine", "partnerflow", "partnership engine"],
      minute: 4,
    }),
  ];

  const architectureDoc = document({
    id: DOC_ARCHITECTURE,
    kind: "note",
    category: "content",
    title: "Demo Architecture Notes",
    summary: "Public note explaining the account-first, document-first shape of the demo.",
    status: "public",
    owner: "piotr-blue",
    ownerAccountId: ACCOUNT_PIOTR,
    participants: ["piotr-blue"],
    tags: ["architecture", "notes", "demo"],
    isPublic: true,
    visibleToAccountIds: ALL_ACCOUNTS,
    searchVisibility: "public",
    starredByAccountIds: [ACCOUNT_PIOTR],
    typeLabel: "Architecture note",
    oneLineSummary: "High-level operating note for the product demo.",
    coreFields: [
      field("Type", "Architecture note"),
      field("Visibility", "Public"),
      field("Audience", "Demo viewers"),
      field("Theme", "Document OS"),
    ],
    detailBlocks: [
      block("summary", "Key ideas", [
        { label: "Model", value: "Accounts + documents + Blink" },
        { label: "Search", value: "Cross-account public discovery" },
        { label: "Truth", value: "Document state, tasks, and activity" },
      ]),
    ],
    uiCards: [
      {
        id: "card_architecture_action",
        title: "Available actions",
        body: "Architecture notes are read-mostly in this iteration.",
        actions: [action("doc_architecture_star", "Star this note", "Starred note", "Added architecture notes to favourites.")],
      },
    ],
    searchKeywords: ["demo architecture notes", "document os", "myos"],
    minute: 6,
  });

  const freshBitesProducts = freshBitesProductIds.map((id, index) =>
    document({
      id,
      kind: "product",
      category: "operational",
      title: [
        "Protein Bowl",
        "Green Power Salad",
        "Citrus Wrap",
        "Roasted Veg Box",
        "Fresh Press Juice",
        "Weekend Family Pack",
        "Office Lunch Tray",
        "Late Dinner Combo",
      ][index]!,
      summary: [
        "Top-selling lunch product with strong repeat demand.",
        "Healthy salad with strong office order uptake.",
        "Public menu staple promoted in seasonal campaigns.",
        "Prepared meal box popular with subscription customers.",
        "High-margin juice item often bundled with bowls.",
        "Family package used in partnership campaigns.",
        "B2B lunch tray sold to local offices.",
        "Combo item used for evening delivery tests.",
      ][index]!,
      status: index < 6 ? "active" : "preview",
      owner: "Alice Martinez",
      ownerAccountId: ACCOUNT_ALICE,
      participants: ["Alice Martinez", "Fresh Bites ops"],
      participantAccountIds: [ACCOUNT_ALICE],
      tags: ["fresh bites", "product", "menu"],
      isPublic: true,
      visibleToAccountIds: ALL_ACCOUNTS,
      searchVisibility: "public",
      parentDocumentId: DOC_FRESH_BITES,
      typeLabel: "Product",
      coreFields: [
        field("Category", index < 5 ? "Menu item" : "Bundle"),
        field("Status", index < 6 ? "Active" : "Preview", index < 6 ? "success" : "warning"),
        field("Visibility", "Public"),
        field("Shop", "Fresh Bites"),
      ],
      detailBlocks: [
        block(`product_${index}`, "Commercial details", [
          { label: "Pricing tier", value: index < 5 ? "Core menu" : "Campaign bundle" },
          { label: "Linked shop", value: "Fresh Bites" },
        ]),
      ],
      searchKeywords: ["fresh bites", "product", "menu", "public"],
      minute: 20 + index,
    })
  );

  const freshBitesOrders = freshBitesOrderIds.map((id, index) =>
    document({
      id,
      kind: "order",
      category: "operational",
      title: `Fresh Bites order #${1001 + index}`,
      summary:
        index === 2
          ? "Payment failed on a same-day order that still needs recovery."
          : index === 6
            ? "Payment failed for a corporate lunch order and needs owner review."
            : "Customer order linked to the Fresh Bites shop.",
      status: index === 2 || index === 6 ? "payment-failed" : index % 3 === 0 ? "preparing" : "completed",
      owner: "Alice Martinez",
      ownerAccountId: ACCOUNT_ALICE,
      participants: ["Alice Martinez", "Fresh Bites ops"],
      participantAccountIds: [ACCOUNT_ALICE],
      tags: ["fresh bites", "order", "shop"],
      isPublic: false,
      visibleToAccountIds: [ACCOUNT_ALICE],
      searchVisibility: "participants",
      parentDocumentId: DOC_FRESH_BITES,
      typeLabel: "Order",
      oneLineSummary: "Shop order visible to the owner and relevant participants.",
      coreFields: [
        field("Customer", `Customer ${index + 1}`),
        field("Amount", `$${(index + 2) * 14}`),
        field("Status", index === 2 || index === 6 ? "Payment failed" : index % 3 === 0 ? "Preparing" : "Completed"),
        field("Linked shop", "Fresh Bites"),
      ],
      detailBlocks: [
        block(`order_${index}`, "Order details", [
          { label: "Visibility", value: "Owner + participants" },
          { label: "Created in", value: "Fresh Bites / Orders" },
        ]),
      ],
      searchKeywords: ["fresh bites", "order", "payment", "shop"],
      minute: 40 + index,
    })
  );

  const bobOrder = document({
    id: DOC_ORDER_BOB,
    kind: "order",
    category: "operational",
    title: "Fresh Bites order — Bob",
    summary: "Bob used the Fresh Bites Blink surface to start this lunch order.",
    status: "awaiting-delivery",
    owner: "Alice Martinez",
    ownerAccountId: ACCOUNT_ALICE,
    participants: ["Alice Martinez", "Bob Chen"],
    participantAccountIds: [ACCOUNT_ALICE, ACCOUNT_BOB],
    tags: ["fresh bites", "order", "bob", "customer"],
    isPublic: false,
    visibleToAccountIds: [ACCOUNT_ALICE, ACCOUNT_BOB],
    searchVisibility: "participants",
    starredByAccountIds: [ACCOUNT_BOB],
    parentDocumentId: DOC_FRESH_BITES,
    typeLabel: "Order",
    oneLineSummary: "Shared customer order visible to the shop owner and Bob.",
    coreFields: [
      field("Customer", "Bob Chen"),
      field("Amount", "$42"),
      field("Status", "Awaiting delivery", "warning"),
      field("Linked shop", "Fresh Bites"),
    ],
    detailBlocks: [
      block("bob_order", "Order details", [
        { label: "Visibility", value: "Alice + Bob" },
        { label: "Delivery window", value: "Today, 12:30–13:00" },
        { label: "Started via", value: "Fresh Bites Blink" },
      ]),
    ],
    uiCards: [
      {
        id: "card_bob_order",
        title: "Available actions",
        body: "Bob can track the order while Alice can coordinate operations from the same document.",
        actions: [
          action(
            "bob_order_track",
            "Track delivery",
            "Tracked delivery",
            "Viewed the current delivery state for Bob’s order.",
            undefined,
            "I checked the courier status and kept this order in view."
          ),
          action(
            "bob_order_update_status",
            "Mark out for delivery",
            "Updated order status",
            "Moved the order into out-for-delivery state.",
            "out-for-delivery"
          ),
        ],
      },
    ],
    activity: [
      activity({
        id: "act_bob_order_started",
        kind: "document-action",
        title: "Order started via shop Blink",
        detail: "Bob used the document chat on Fresh Bites to start a new lunch order.",
        minute: 56,
        documentId: DOC_ORDER_BOB,
        visibleToAccountIds: [ACCOUNT_ALICE, ACCOUNT_BOB],
      }),
    ],
    searchKeywords: ["fresh bites", "bob", "order", "customer"],
    minute: 55,
  });

  const freshBitesPartnershipDocs = [
    {
      id: freshBitesPartnershipIds[0],
      title: "Portland Wellness Co-op",
      summary: "Local wellness partnership created from the PartnerFlow task pipeline.",
      status: "intro-ready",
    },
    {
      id: freshBitesPartnershipIds[1],
      title: "Office lunch pilot",
      summary: "Corporate lunch opportunity seeded for outbound follow-up.",
      status: "in-discovery",
    },
    {
      id: freshBitesPartnershipIds[2],
      title: "Yoga collective promo",
      summary: "Cross-promotional pilot with a local yoga studio.",
      status: "proposal-sent",
    },
    {
      id: freshBitesPartnershipIds[3],
      title: "School snacks program",
      summary: "Potential B2B healthy snack partnership with school admins.",
      status: "needs-review",
    },
  ].map((entry, index) =>
    document({
      id: entry.id,
      kind: "partnership",
      category: "relationship",
      title: entry.title,
      summary: entry.summary,
      status: entry.status,
      owner: "Alice Martinez",
      ownerAccountId: ACCOUNT_ALICE,
      participants: ["Alice Martinez", "Celine Duarte"],
      participantAccountIds: [ACCOUNT_ALICE, ACCOUNT_CELINE],
      tags: ["fresh bites", "partnership", "partnerflow"],
      isPublic: true,
      visibleToAccountIds: ALL_ACCOUNTS,
      searchVisibility: "public",
      parentDocumentId: DOC_FRESH_BITES,
      typeLabel: "Partnership opportunity",
      coreFields: [
        field("Source", "PartnerFlow task"),
        field("Status", entry.status),
        field("Shop", "Fresh Bites"),
        field("Visibility", "Public shortlist"),
      ],
      detailBlocks: [
        block(`partnership_${index}`, "Opportunity details", [
          { label: "Generated by", value: "Find customers for Fresh Bites" },
          { label: "Linked service", value: "Partnership Engine Agreement — Alice" },
        ]),
      ],
      searchKeywords: ["partnership", "fresh bites", entry.title.toLowerCase()],
      minute: 70 + index,
    })
  );

  const biReports = [
    document({
      id: biReportIds[0],
      kind: "report",
      category: "content",
      title: "Daily sales pulse",
      summary: "Most recent sales summary prepared by Northwind BI for Fresh Bites.",
      status: "ready",
      owner: "Bob Chen",
      ownerAccountId: ACCOUNT_BOB,
      participants: ["Bob Chen", "Alice Martinez"],
      participantAccountIds: [ACCOUNT_BOB, ACCOUNT_ALICE],
      tags: ["northwind bi", "report", "sales"],
      visibleToAccountIds: [ACCOUNT_BOB, ACCOUNT_ALICE],
      searchVisibility: "participants",
      typeLabel: "BI report",
      coreFields: [
        field("Provider", "Northwind BI"),
        field("Client", "Fresh Bites"),
        field("Range", "Today"),
        field("Status", "Ready", "success"),
      ],
      detailBlocks: [
        block("sales_report", "Output", [
          { label: "Top line", value: "$4,830" },
          { label: "Best hour", value: "12:00–13:00" },
        ]),
      ],
      searchKeywords: ["daily sales", "northwind", "fresh bites report"],
      minute: 90,
    }),
    document({
      id: biReportIds[1],
      kind: "report",
      category: "content",
      title: "Weekly mix report",
      summary: "Category mix and order composition report shared with Alice.",
      status: "ready",
      owner: "Bob Chen",
      ownerAccountId: ACCOUNT_BOB,
      participants: ["Bob Chen", "Alice Martinez"],
      participantAccountIds: [ACCOUNT_BOB, ACCOUNT_ALICE],
      tags: ["northwind bi", "report", "mix"],
      visibleToAccountIds: [ACCOUNT_BOB, ACCOUNT_ALICE],
      searchVisibility: "participants",
      typeLabel: "BI report",
      coreFields: [
        field("Provider", "Northwind BI"),
        field("Client", "Fresh Bites"),
        field("Range", "Last 7 days"),
        field("Status", "Ready", "success"),
      ],
      detailBlocks: [
        block("mix_report", "Output", [
          { label: "Top category", value: "Protein bowls" },
          { label: "Fastest growth", value: "Office Lunch Tray" },
        ]),
      ],
      searchKeywords: ["weekly mix", "northwind", "report"],
      minute: 91,
    }),
  ];

  const partnerflowPlaybooks = [
    document({
      id: partnerflowPlaybookIds[0],
      kind: "playbook",
      category: "content",
      title: "Local gym intro playbook",
      summary: "PartnerFlow playbook for introducing Fresh Bites to neighborhood gyms.",
      status: "ready",
      owner: "Celine Duarte",
      ownerAccountId: ACCOUNT_CELINE,
      participants: ["Celine Duarte", "Alice Martinez"],
      participantAccountIds: [ACCOUNT_CELINE, ACCOUNT_ALICE],
      tags: ["partnerflow", "playbook", "fresh bites"],
      visibleToAccountIds: [ACCOUNT_CELINE, ACCOUNT_ALICE],
      searchVisibility: "participants",
      typeLabel: "Playbook",
      coreFields: [
        field("Provider", "PartnerFlow"),
        field("Client", "Fresh Bites"),
        field("Theme", "Gyms + wellness"),
        field("Status", "Ready", "success"),
      ],
      detailBlocks: [
        block("gym_playbook", "Guidance", [
          { label: "Tone", value: "Helpful, concrete, local" },
          { label: "Goal", value: "Pilot lunch bundle intros" },
        ]),
      ],
      searchKeywords: ["partnerflow", "playbook", "gym"],
      minute: 92,
    }),
    document({
      id: partnerflowPlaybookIds[1],
      kind: "playbook",
      category: "content",
      title: "Office park outreach playbook",
      summary: "Outreach playbook for turning Fresh Bites into a recurring office lunch option.",
      status: "ready",
      owner: "Celine Duarte",
      ownerAccountId: ACCOUNT_CELINE,
      participants: ["Celine Duarte", "Alice Martinez"],
      participantAccountIds: [ACCOUNT_CELINE, ACCOUNT_ALICE],
      tags: ["partnerflow", "playbook", "office"],
      visibleToAccountIds: [ACCOUNT_CELINE, ACCOUNT_ALICE],
      searchVisibility: "participants",
      typeLabel: "Playbook",
      coreFields: [
        field("Provider", "PartnerFlow"),
        field("Client", "Fresh Bites"),
        field("Theme", "Office lunch"),
        field("Status", "Ready", "success"),
      ],
      detailBlocks: [
        block("office_playbook", "Guidance", [
          { label: "Tone", value: "Professional, ROI-aware" },
          { label: "Goal", value: "Recurring lunch pilot" },
        ]),
      ],
      searchKeywords: ["partnerflow", "playbook", "office"],
      minute: 93,
    }),
  ];

  const myLifeNotes = [
    {
      id: myLifeNoteIds[0],
      title: "Morning walk notes",
      summary: "Public note about routine and energy before work.",
      status: "public",
      minute: 110,
    },
    {
      id: myLifeNoteIds[1],
      title: "Thinking about staying balanced",
      summary: "Public notebook entry with a private comment thread for close context.",
      status: "public",
      minute: 111,
    },
    {
      id: myLifeNoteIds[2],
      title: "Books to revisit",
      summary: "Reading list note that other accounts can browse publicly.",
      status: "public",
      minute: 112,
    },
    {
      id: myLifeNoteIds[3],
      title: "Weekend cooking plan",
      summary: "A lighter personal note in the public notebook.",
      status: "public",
      minute: 113,
    },
  ].map((entry) =>
    document({
      id: entry.id,
      kind: "note",
      category: "content",
      title: entry.title,
      summary: entry.summary,
      status: entry.status,
      owner: "Bob Chen",
      ownerAccountId: ACCOUNT_BOB,
      participants: ["Bob Chen"],
      participantAccountIds: [ACCOUNT_BOB],
      tags: ["my life", "note", "public notebook"],
      isPublic: true,
      visibleToAccountIds: ALL_ACCOUNTS,
      searchVisibility: "public",
      parentDocumentId: DOC_MY_LIFE,
      anchorIds:
        entry.id === myLifeNoteIds[0]
          ? ["anchor_note_walk_comments"]
          : entry.id === myLifeNoteIds[1]
            ? ["anchor_note_balance_comments"]
            : [],
      typeLabel: "Note",
      coreFields: [
        field("Notebook", "My Life"),
        field("Visibility", "Public"),
        field("Note type", "Personal note"),
        field("Date", entry.minute === 110 ? "Mar 21" : entry.minute === 111 ? "Mar 22" : entry.minute === 112 ? "Mar 23" : "Mar 24"),
      ],
      detailBlocks: [
        block(`note_${entry.id}`, "Note details", [
          { label: "Linked notebook", value: "My Life" },
          { label: "Comments", value: entry.id === myLifeNoteIds[0] || entry.id === myLifeNoteIds[1] ? "Available" : "None" },
        ]),
      ],
      searchKeywords: ["my life", "note", entry.title.toLowerCase()],
      minute: entry.minute,
    })
  );

  const commentPublicAlice = document({
    id: "doc_comment_public_alice_on_walk",
    kind: "comment",
    category: "content",
    title: "Alice comment — Morning walk notes",
    summary: "Public comment from Alice visible to everyone who can see the note.",
    status: "public",
    owner: "Alice Martinez",
    ownerAccountId: ACCOUNT_ALICE,
    participants: ["Alice Martinez", "Bob Chen"],
    participantAccountIds: [ACCOUNT_ALICE, ACCOUNT_BOB],
    tags: ["comment", "my life", "public"],
    isPublic: true,
    visibleToAccountIds: ALL_ACCOUNTS,
    searchVisibility: "public",
    parentDocumentId: myLifeNoteIds[0],
    typeLabel: "Comment",
    coreFields: [
      field("Author", "Alice Martinez"),
      field("Visibility", "Public"),
      field("Linked note", "Morning walk notes"),
      field("Tone", "Supportive"),
    ],
    detailBlocks: [
      block("public_comment", "Comment details", [
        { label: "Body", value: "Fresh Bites staff should start every morning like this." },
      ]),
    ],
    searchKeywords: ["comment", "morning walk", "alice"],
    minute: 118,
  });

  const commentPrivateAlice = document({
    id: "doc_comment_private_alice_on_balance",
    kind: "comment",
    category: "content",
    title: "Alice private comment — Thinking about staying balanced",
    summary: "Private comment visible only to Bob and Alice.",
    status: "private",
    owner: "Alice Martinez",
    ownerAccountId: ACCOUNT_ALICE,
    participants: ["Alice Martinez", "Bob Chen"],
    participantAccountIds: [ACCOUNT_ALICE, ACCOUNT_BOB],
    tags: ["comment", "my life", "private"],
    isPublic: false,
    visibleToAccountIds: [ACCOUNT_ALICE, ACCOUNT_BOB],
    searchVisibility: "participants",
    parentDocumentId: myLifeNoteIds[1],
    typeLabel: "Private comment",
    visibilityLabel: "Private to Bob + Alice",
    coreFields: [
      field("Author", "Alice Martinez"),
      field("Visibility", "Private to Bob + Alice"),
      field("Linked note", "Thinking about staying balanced"),
      field("Tone", "Reflective"),
    ],
    detailBlocks: [
      block("private_comment", "Comment details", [
        { label: "Body", value: "You sounded tired this week — take the lighter report schedule if needed." },
      ]),
    ],
    searchKeywords: ["private comment", "alice", "balanced"],
    minute: 119,
  });

  const freshBitesDoc = document({
    id: DOC_FRESH_BITES,
    kind: "shop",
    category: "operational",
    title: "Fresh Bites",
    summary: "Public shop document for Alice’s healthy food restaurant in Portland.",
    status: "active",
    owner: "Alice Martinez",
    ownerAccountId: ACCOUNT_ALICE,
    participants: ["Alice Martinez", "Bob Chen", "Celine Duarte"],
    participantAccountIds: [ACCOUNT_ALICE, ACCOUNT_BOB, ACCOUNT_CELINE],
    tags: ["fresh bites", "shop", "restaurant"],
    isPublic: true,
    visibleToAccountIds: ALL_ACCOUNTS,
    searchVisibility: "public",
    starredByAccountIds: [ACCOUNT_PIOTR, ACCOUNT_ALICE, ACCOUNT_BOB, ACCOUNT_CELINE],
    linkedDocumentIds: [...freshBitesOrderIds, DOC_ORDER_BOB, ...freshBitesProductIds, ...freshBitesPartnershipIds],
    anchorIds: ["anchor_fresh_bites_orders", "anchor_fresh_bites_products", "anchor_fresh_bites_partnerships"],
    taskIds: [THREAD_FIND_CUSTOMERS],
    typeLabel: "Shop document",
    oneLineSummary: "Public operating document for the Fresh Bites shop.",
    coreFields: [
      field("Location", "Portland, OR"),
      field("Category", "Healthy food restaurant"),
      field("Public status", "Public", "success"),
      field("Anchors", "Orders, Products, Partnerships"),
    ],
    detailBlocks: [
      block("shop_access", "Access", [
        { label: "Owner", value: "Alice Martinez" },
        { label: "Viewer filtering", value: "Orders filtered by current viewer" },
      ]),
      block("shop_summary", "Operational summary", [
        { label: "Orders visible to Alice", value: "All shop orders" },
        { label: "Orders visible to Bob", value: "Only Bob’s own order" },
      ]),
    ],
    descriptionText:
      "Fresh Bites is Alice’s public operating document for the restaurant. It combines public shop presentation, private operating context, linked orders and products, and service relationships with BI and partnership providers. The goal of the document is to keep the business readable at a glance while still making the next operations obvious.",
    initialMessage:
      "Alice opened Fresh Bites as the main operating surface for the restaurant: a place to manage orders, browse products, review partnerships, and talk with Blink about the current business state without digging through raw operational data.",
    currentStateText:
      "Fresh Bites is active, publicly discoverable, and currently balancing lunch demand, payment recovery, and new partnership opportunities. Alice sees the full shop, Bob only sees customer-specific order context, and Celine can focus on partnership-related work without exposing raw internal operations.",
    currentStateFields: [
      field("Shop health", "Stable lunch demand", "success"),
      field("Payment exceptions", "2 orders need review", "warning"),
      field("Partnership pipeline", "4 active opportunities"),
      field("Connected services", "Northwind BI + PartnerFlow"),
    ],
    participantsDetailed: [
      participant("freshbites_owner", "Alice Martinez", {
        accountId: ACCOUNT_ALICE,
        email: "alice@freshbites.example",
        subtitle: "Owner of Fresh Bites",
        roles: ["Owner", "Admin"],
      }),
      participant("freshbites_bob", "Bob Chen", {
        accountId: ACCOUNT_BOB,
        email: "bob@northwind.example",
        subtitle: "Northwind BI",
        roles: ["Participant", "Analytics"],
      }),
      participant("freshbites_celine", "Celine Duarte", {
        accountId: ACCOUNT_CELINE,
        email: "celine@partnerflow.example",
        subtitle: "PartnerFlow / Partnership Engine",
        roles: ["Participant", "Partnerships"],
      }),
    ],
    allOperations: [
      operation("fresh_bites_create_order", "Create order", "Start a new customer order from the shop surface.", "available", {
        kind: "user",
        actionLabel: "Create order",
      }),
      operation("fresh_bites_request_service", "Request this service", "Invite another service to work from the shop context.", "available", {
        kind: "service",
        actionLabel: "Request service",
      }),
      operation("fresh_bites_review_payments", "Review payment failures", "Open the orders that still need a payment decision.", "pending", {
        kind: "user",
        actionLabel: "Review",
      }),
      operation("fresh_bites_review_partnerships", "Review partnership queue", "Check the latest shortlist and proposed intros.", "pending", {
        kind: "service",
        actionLabel: "Open queue",
      }),
    ],
    pendingOperations: [
      operation("fresh_bites_review_payments_pending", "Review payment failures", "Two payment-failed orders still need Alice’s decision before service windows expire.", "pending", {
        kind: "user",
        actionLabel: "Review",
      }),
      operation("fresh_bites_review_partnerships_pending", "Approve school snacks proposal", "One partnership proposal is ready for a go / no-go decision.", "pending", {
        kind: "user",
        actionLabel: "Open proposal",
      }),
    ],
    embeddedDocuments: [
      embeddedDocument(DOC_ORDER_BOB, "Fresh Bites order — Bob", "Bob's shared customer order with delivery tracking.", {
        subtitle: "Order",
        status: "awaiting-delivery",
      }),
      embeddedDocument(freshBitesPartnershipIds[3]!, "School snacks program", "Proposed recurring snack partnership that still needs review.", {
        subtitle: "Partnership opportunity",
        status: "needs-review",
      }),
      embeddedDocument(DOC_BI_AGREEMENT, "Northwind BI Agreement — Bob", "Shared analytics agreement attached to the shop.", {
        subtitle: "Service agreement",
        status: "active",
      }),
    ],
    settingsBlocks: [
      block("shop_settings", "Sharing", [
        { label: "Visibility", value: "Public" },
        { label: "Participants", value: "Alice, Bob, Celine" },
      ]),
    ],
    shareSettings: shareSettings(true, true, [
      shareEntry("share_fresh_alice", "account", "Alice Martinez", {
        subtitle: "alice@freshbites.example",
        agreement: "Owner access",
        status: "owner",
      }),
      shareEntry("share_fresh_bob", "account", "Bob Chen", {
        subtitle: "bob@northwind.example",
        agreement: "Northwind BI Agreement — Bob",
        status: "read-only",
      }),
      shareEntry("share_fresh_celine", "account", "Celine Duarte", {
        subtitle: "celine@partnerflow.example",
        agreement: "Partnership Engine Agreement — Celine",
        status: "read-only",
      }),
      shareEntry("share_fresh_orders", "document", "Orders anchor", {
        subtitle: "Document-level access lane",
        agreement: "Fresh Bites / Orders",
        status: "scoped",
      }),
    ]),
    services: [
      serviceConnection("svc_fresh_bi", "BI Analysis", "Northwind BI", "connected", "Daily and weekly performance reporting is already connected to this shop."),
      serviceConnection("svc_fresh_partnerflow", "Partnership Search", "PartnerFlow", "connected", "PartnerFlow is connected for recurring lunch and partnership discovery."),
      serviceConnection("svc_fresh_legal", "Legal Review", "Blue Legal", "available", "Attach a legal review service before signing any new contract-heavy partnership."),
      serviceConnection("svc_fresh_email", "Email Outreach", "Blink Mail", "available", "Send lightweight outbound follow-ups from a connected service."),
    ],
    sourceData: {
      shop_id: "shop_fresh_bites",
      owner_account: "acc_alice",
      visibility: "public",
      active_anchors: ["orders", "products", "partnerships"],
      connected_services: ["northwind-bi", "partnerflow"],
      current_focus: {
        payments: 2,
        partnerships: 4,
        active_task: THREAD_FIND_CUSTOMERS,
      },
    },
    uiCards: [
      {
        id: "card_fresh_bites_actions",
        title: "Available actions",
        body: "Different viewers can act on the same public shop document according to their access.",
        actions: [
          action(
            "fresh_bites_create_order",
            "Create order",
            "Started shop order",
            "Started a new order flow from the Fresh Bites shop.",
            undefined,
            "I started an order flow from Fresh Bites and linked it to the current viewer."
          ),
          action(
            "fresh_bites_request_service",
            "Request this service",
            "Requested service",
            "Requested a service relationship from the Fresh Bites document."
          ),
        ],
      },
    ],
    activity: [
      activity({
        id: "act_fresh_bites_seed",
        kind: "document-created",
        title: "Shop seeded",
        detail: "Fresh Bites was seeded as a public shared shop document.",
        minute: 15,
        documentId: DOC_FRESH_BITES,
        actorName: "Document",
        actorType: "document",
        actorSide: "left",
        tone: "event",
      }),
      activity({
        id: "act_fresh_bites_lunch_rush",
        kind: "status",
        title: "Lunch rush stabilized",
        detail: "Current prep queue is back within service target after the early rush.",
        minute: 126,
        documentId: DOC_FRESH_BITES,
        accountId: ACCOUNT_ALICE,
        actorName: "Alice Martinez",
        actorEmail: "alice@freshbites.example",
        actorSide: "right",
        actorType: "user",
        tone: "info",
      }),
      activity({
        id: "act_fresh_bites_partnerflow_update",
        kind: "operation",
        title: "PartnerFlow posted fresh leads",
        detail: "Two office lunch targets and one wellness intro were added to the shop's opportunity lane.",
        minute: 135,
        documentId: DOC_FRESH_BITES,
        accountId: ACCOUNT_CELINE,
        actorName: "PartnerFlow",
        actorSide: "left",
        actorType: "service",
        tone: "operation",
        linkedLabel: "Open partnerships",
      }),
      activity({
        id: "act_fresh_bites_blink_reply",
        kind: "assistant",
        title: "Blink summarized today’s queue",
        detail: "Blink highlighted payment failures first, then surfaced partnership follow-ups and task progress.",
        minute: 183,
        documentId: DOC_FRESH_BITES,
        accountId: ACCOUNT_BOB,
        actorName: "Blink",
        actorSide: "left",
        actorType: "assistant",
        tone: "info",
      }),
    ],
    searchKeywords: ["fresh bites", "shop", "restaurant", "portland", "public"],
    minute: 15,
  });

  const biOfferingDoc = document({
    id: DOC_BI_OFFERING,
    kind: "service-offering",
    category: "service",
    title: "Northwind BI",
    summary: "Public BI service offering for merchant analytics and reporting.",
    status: "public",
    owner: "Bob Chen",
    ownerAccountId: ACCOUNT_BOB,
    participants: ["Bob Chen"],
    participantAccountIds: [ACCOUNT_BOB],
    tags: ["northwind bi", "service", "analytics"],
    isService: true,
    isPublic: true,
    visibleToAccountIds: ALL_ACCOUNTS,
    searchVisibility: "public",
    starredByAccountIds: [ACCOUNT_PIOTR, ACCOUNT_BOB],
    linkedDocumentIds: [DOC_BI_AGREEMENT, ...biReportIds],
    anchorIds: ["anchor_northwind_clients", "anchor_northwind_contracts", "anchor_northwind_reports"],
    typeLabel: "Service offering",
    oneLineSummary: "Analytics + reporting provider document.",
    coreFields: [
      field("Provider", "Bob / Northwind BI"),
      field("Pricing", "Monthly subscription + report packs"),
      field("Expected access", "Read sales/order data"),
      field("Supported operations", "askQuestion, requestReport"),
    ],
    detailBlocks: [
      block("offering", "Offering", [
        { label: "Ideal client", value: "Merchants with daily order flow" },
        { label: "Outputs", value: "Daily pulse, weekly mix, question answering" },
      ]),
    ],
    uiCards: [
      {
        id: "card_bi_actions",
        title: "Available actions",
        body: "Public service actions for prospective clients.",
        actions: [
          action(
            "northwind_request_service",
            "Request this service",
            "Requested BI service",
            "Requested a Northwind BI service relationship."
          ),
          action(
            "northwind_sample_report",
            "View sample output",
            "Viewed sample report",
            "Opened a sample BI output from the public service offering."
          ),
        ],
      },
    ],
    searchKeywords: ["northwind bi", "bi", "analytics", "public service"],
    minute: 16,
  });

  const biAgreementDoc = document({
    id: DOC_BI_AGREEMENT,
    kind: "agreement",
    category: "service",
    title: "Northwind BI Agreement — Bob",
    summary: "Shared BI agreement between Alice / Fresh Bites and Bob / Northwind BI.",
    status: "active",
    owner: "Bob Chen",
    ownerAccountId: ACCOUNT_BOB,
    participants: ["Bob Chen", "Alice Martinez"],
    participantAccountIds: [ACCOUNT_BOB, ACCOUNT_ALICE],
    tags: ["northwind bi", "agreement", "fresh bites"],
    isService: true,
    isPublic: false,
    visibleToAccountIds: [ACCOUNT_ALICE, ACCOUNT_BOB],
    searchVisibility: "participants",
    linkedDocumentIds: [DOC_FRESH_BITES, ...biReportIds, DOC_BI_OFFERING],
    typeLabel: "Service agreement",
    oneLineSummary: "Shared service relationship for analytics and reporting.",
    coreFields: [
      field("Provider", "Bob / Northwind BI"),
      field("Client", "Alice / Fresh Bites"),
      field("Granted access", "Read sales + order data"),
      field("Current phase", "Active"),
    ],
    detailBlocks: [
      block("relationship", "Relationship", [
        { label: "Available operations", value: "askQuestion, requestReport" },
        { label: "Recent outputs", value: "Daily sales pulse, weekly mix report" },
      ]),
    ],
    descriptionText:
      "This agreement is the shared working surface between Fresh Bites and Northwind BI. It captures the business relationship, the current reporting lane, and the operational context Alice and Bob use to ask questions, request new reporting, and keep analysis tied to the underlying shop document.",
    initialMessage:
      "Alice asked Bob to provide an analytics relationship that would answer day-to-day business questions without forcing her to open raw reports first. The agreement became the place to manage access, request new output, and keep current BI context readable.",
    currentStateText:
      "The analytics relationship is active. Northwind BI can read sales and order data, recent reports are already attached, and Alice can ask for follow-up analysis directly from the agreement surface.",
    currentStateFields: [
      field("Access mode", "Read sales + order data", "success"),
      field("Latest output", "Daily sales pulse"),
      field("Open asks", "1 report request"),
      field("Response cadence", "Daily + ad hoc"),
    ],
    participantsDetailed: [
      participant("bi_agreement_bob", "Bob Chen", {
        accountId: ACCOUNT_BOB,
        email: "bob@northwind.example",
        subtitle: "Northwind BI",
        roles: ["Owner", "Provider"],
      }),
      participant("bi_agreement_alice", "Alice Martinez", {
        accountId: ACCOUNT_ALICE,
        email: "alice@freshbites.example",
        subtitle: "Fresh Bites",
        roles: ["Client", "Admin"],
      }),
    ],
    allOperations: [
      operation("bi_ask_question", "Ask BI question", "Ask about sales, trends, or order performance directly from the agreement.", "available", {
        kind: "user",
        actionLabel: "Ask question",
      }),
      operation("bi_request_report", "Request report", "Queue a new report or refresh an existing deliverable.", "available", {
        kind: "service",
        actionLabel: "Request report",
      }),
      operation("bi_review_access", "Review access scope", "Confirm which data lanes Northwind BI can still read.", "available", {
        kind: "system",
        actionLabel: "Review",
      }),
    ],
    pendingOperations: [
      operation("bi_report_request_pending", "Prepare the next report", "Alice asked for a new report that Bob still needs to prepare.", "pending", {
        kind: "service",
        actionLabel: "Prepare report",
      }),
    ],
    embeddedDocuments: [
      embeddedDocument(DOC_FRESH_BITES, "Fresh Bites", "Primary client document used as the business source of truth.", {
        subtitle: "Shop document",
        status: "active",
      }),
      embeddedDocument(biReportIds[0]!, "Daily sales pulse", "Latest sales summary already attached to this agreement.", {
        subtitle: "BI report",
        status: "ready",
      }),
      embeddedDocument(biReportIds[1]!, "Weekly mix report", "Recent product and order composition report for Fresh Bites.", {
        subtitle: "BI report",
        status: "ready",
      }),
    ],
    settingsBlocks: [
      block("service_settings", "Service relationship", [
        { label: "Participants", value: "Alice, Bob" },
        { label: "Shared truth", value: "Agreement document + reports + activity" },
      ]),
    ],
    shareSettings: shareSettings(true, false, [
      shareEntry("share_bi_owner", "account", "Bob Chen", {
        subtitle: "bob@northwind.example",
        agreement: "Owner access",
        status: "owner",
      }),
      shareEntry("share_bi_client", "account", "Alice Martinez", {
        subtitle: "alice@freshbites.example",
        agreement: "Northwind BI Agreement — Bob",
        status: "editor",
      }),
      shareEntry("share_bi_reports", "document", "Reports lane", {
        subtitle: "Attached report outputs",
        agreement: "Daily sales pulse + weekly mix report",
        status: "scoped",
      }),
    ]),
    services: [
      serviceConnection("svc_bi_analysis", "BI Analysis", "Northwind BI", "connected", "Core analytics relationship used for questions and recurring reports."),
      serviceConnection("svc_bi_alerts", "Alert Monitor", "Blink Ops", "available", "Add threshold-based alerts for payment failures and daily sales dips."),
      serviceConnection("svc_bi_exports", "Data Export", "CSV Relay", "disconnected", "Reconnect export packaging if Alice needs external handoff."),
    ],
    sourceData: {
      agreement_id: "agr_northwind_bi_fresh_bites",
      provider_account: "acc_bob",
      client_account: "acc_alice",
      access_scope: ["sales", "orders"],
      attached_outputs: ["daily_sales_pulse", "weekly_mix_report"],
      current_status: "active",
    },
    uiCards: [
      {
        id: "card_bi_agreement_actions",
        title: "Available actions",
        body: "Alice can ask for analysis and Bob can manage delivery through the same agreement.",
        actions: [
          action(
            "bi_ask_question",
            "Ask BI question",
            "Asked BI question",
            "Asked Northwind BI a question about the latest sales performance."
          ),
          action(
            "bi_request_report",
            "Request report",
            "Requested report",
            "Requested a new BI report from the agreement surface."
          ),
        ],
      },
    ],
    activity: [
      activity({
        id: "act_bi_agreement_active",
        kind: "status",
        title: "Agreement active",
        detail: "Northwind BI has read sales and order data access for Fresh Bites.",
        minute: 94,
        documentId: DOC_BI_AGREEMENT,
        visibleToAccountIds: [ACCOUNT_ALICE, ACCOUNT_BOB],
        actorName: "Northwind BI",
        actorSide: "left",
        actorType: "service",
        tone: "event",
      }),
      activity({
        id: "act_bi_question_alice",
        kind: "question",
        title: "Alice asked for current sales context",
        detail: "Alice asked how sales were trending today before opening any raw report output.",
        minute: 194,
        documentId: DOC_BI_AGREEMENT,
        visibleToAccountIds: [ACCOUNT_ALICE, ACCOUNT_BOB],
        actorName: "Alice Martinez",
        actorEmail: "alice@freshbites.example",
        actorSide: "right",
        actorType: "user",
        tone: "info",
      }),
      activity({
        id: "act_bi_answer_blink",
        kind: "assistant",
        title: "Blink summarized performance",
        detail: "Blink answered that bowls were leading the mix and lunch hours were strongest so far.",
        minute: 196,
        documentId: DOC_BI_AGREEMENT,
        visibleToAccountIds: [ACCOUNT_ALICE, ACCOUNT_BOB],
        actorName: "Blink",
        actorSide: "left",
        actorType: "assistant",
        tone: "operation",
      }),
    ],
    searchKeywords: ["northwind bi agreement", "bob", "alice", "fresh bites"],
    minute: 94,
  });

  const partnerflowOfferingDoc = document({
    id: DOC_PARTNERFLOW_OFFERING,
    kind: "service-offering",
    category: "service",
    title: "Partnership Engine",
    summary: "Public service offering for partnership search and customer development.",
    status: "public",
    owner: "Celine Duarte",
    ownerAccountId: ACCOUNT_CELINE,
    participants: ["Celine Duarte"],
    participantAccountIds: [ACCOUNT_CELINE],
    tags: ["partnership engine", "partnerflow", "service"],
    isService: true,
    isPublic: true,
    visibleToAccountIds: ALL_ACCOUNTS,
    searchVisibility: "public",
    starredByAccountIds: [ACCOUNT_PIOTR, ACCOUNT_CELINE],
    linkedDocumentIds: [DOC_PARTNERFLOW_AGREEMENT, ...partnerflowPlaybookIds],
    anchorIds: [
      "anchor_partnerflow_clients",
      "anchor_partnerflow_contracts",
      "anchor_partnerflow_playbooks",
    ],
    typeLabel: "Service offering",
    oneLineSummary: "Partnership search and customer development provider document.",
    coreFields: [
      field("Provider", "Celine / PartnerFlow"),
      field("Ideal client", "Local business with strong product fit"),
      field("Access needed", "Shop context + approved task access"),
      field("Outputs", "Target lists, intros, playbooks"),
    ],
    detailBlocks: [
      block("offering", "Offering", [
        { label: "Operations", value: "Request service, review playbooks" },
        { label: "Delivery style", value: "Guided intake + task-driven execution" },
      ]),
    ],
    uiCards: [
      {
        id: "card_partnerflow_actions",
        title: "Available actions",
        body: "Prospective clients can request the service from the public offering.",
        actions: [
          action(
            "partnerflow_request_service",
            "Request service",
            "Requested service",
            "Requested the Partnership Engine service."
          ),
        ],
      },
    ],
    searchKeywords: ["partnership engine", "partnerflow", "partnership", "public service"],
    minute: 17,
  });

  const partnerflowAgreementDoc = document({
    id: DOC_PARTNERFLOW_AGREEMENT,
    kind: "agreement",
    category: "service",
    title: "Partnership Engine Agreement — Celine",
    summary: "Shared agreement between Alice and Celine capturing onboarding answers, goals, and permission chain.",
    status: "active",
    owner: "Celine Duarte",
    ownerAccountId: ACCOUNT_CELINE,
    participants: ["Celine Duarte", "Alice Martinez"],
    participantAccountIds: [ACCOUNT_CELINE, ACCOUNT_ALICE],
    tags: ["partnerflow", "agreement", "fresh bites"],
    isService: true,
    isPublic: false,
    visibleToAccountIds: [ACCOUNT_ALICE, ACCOUNT_CELINE],
    searchVisibility: "participants",
    linkedDocumentIds: [DOC_FRESH_BITES, ...freshBitesPartnershipIds, ...partnerflowPlaybookIds],
    taskIds: [THREAD_FIND_CUSTOMERS],
    typeLabel: "Service agreement",
    oneLineSummary: "Onboarding and active relationship document for the partnership service.",
    coreFields: [
      field("Provider", "Celine / PartnerFlow"),
      field("Client", "Alice / Fresh Bites"),
      field("Current phase", "Active"),
      field("Linked task", "Find customers for Fresh Bites"),
    ],
    detailBlocks: [
      block("intake", "Captured intake summary", [
        { label: "Partner criteria", value: "Wellness, offices, recurring lunch buyers" },
        { label: "Exclusions", value: "Coupon-only traffic, low-retention channels" },
        { label: "Geography", value: "Portland metro" },
        { label: "Intro style", value: "Warm, practical, locally grounded" },
        { label: "Business goals", value: "Recurring lunch and partnership revenue" },
      ]),
      block("permissions", "Permission chain", [
        { label: "Task access", value: "Task can read Fresh Bites shop + #partnerships" },
        { label: "External tool access", value: "No raw direct shop access without the task" },
      ]),
    ],
    descriptionText:
      "The Partnership Engine agreement captures Alice’s onboarding answers and the current service operating model. It is the main document for defining target partner profiles, exclusions, delivery style, and the permission boundary between the service provider and the attached task.",
    initialMessage:
      "Alice asked Celine to help Fresh Bites find recurring lunch and wellness-oriented partnership opportunities. The agreement became the onboarding and control-plane document for the service, with the active task handling execution.",
    currentStateText:
      "The service is active, intake is complete, and the linked task is already surfacing new opportunities. The relationship is intentionally task-first: the task sees the scoped data it needs, while the agreement remains the shared human-readable summary.",
    currentStateFields: [
      field("Intake status", "Complete", "success"),
      field("Open opportunities", "4 shortlisted"),
      field("Linked task", "Find customers for Fresh Bites"),
      field("Permission model", "Task-mediated"),
    ],
    participantsDetailed: [
      participant("partner_agreement_celine", "Celine Duarte", {
        accountId: ACCOUNT_CELINE,
        email: "celine@partnerflow.example",
        subtitle: "PartnerFlow / Partnership Engine",
        roles: ["Owner", "Provider"],
      }),
      participant("partner_agreement_alice", "Alice Martinez", {
        accountId: ACCOUNT_ALICE,
        email: "alice@freshbites.example",
        subtitle: "Fresh Bites",
        roles: ["Client", "Admin"],
      }),
    ],
    allOperations: [
      operation("partnerflow_review_intake", "Review intake summary", "Review the captured onboarding goals, exclusions, geography, and intro style.", "available", {
        kind: "user",
        actionLabel: "Review",
      }),
      operation("partnerflow_grant_access", "Grant access", "Confirm the active permission chain for the linked service task.", "available", {
        kind: "system",
        actionLabel: "Grant",
      }),
      operation("partnerflow_open_task", "Open linked task", "Jump into the active task that is finding new customer opportunities.", "available", {
        kind: "service",
        actionLabel: "Open task",
      }),
    ],
    pendingOperations: [
      operation("partnerflow_review_school_program", "Review school snacks proposal", "One shortlisted opportunity still needs Alice’s decision before outreach continues.", "pending", {
        kind: "user",
        actionLabel: "Review proposal",
      }),
      operation("partnerflow_review_leads", "Review fresh office lunch leads", "The active task surfaced two more office lunch leads for Celine to qualify.", "pending", {
        kind: "service",
        actionLabel: "Review leads",
      }),
    ],
    embeddedDocuments: [
      embeddedDocument(DOC_FRESH_BITES, "Fresh Bites", "The client shop document that anchors goals and live business context.", {
        subtitle: "Shop document",
        status: "active",
      }),
      embeddedDocument(THREAD_FIND_CUSTOMERS, "Find customers for Fresh Bites", "Active service task that reads the scoped Fresh Bites context.", {
        subtitle: "Task",
        status: "active",
      }),
      embeddedDocument(freshBitesPartnershipIds[0]!, "Portland Wellness Co-op", "One of the current opportunity documents linked to this agreement.", {
        subtitle: "Partnership opportunity",
        status: "intro-ready",
      }),
    ],
    settingsBlocks: [
      block("agreement_settings", "Relationship", [
        { label: "Participants", value: "Alice, Celine" },
        { label: "Task relationship", value: "Agreement drives Find customers for Fresh Bites" },
      ]),
    ],
    shareSettings: shareSettings(true, false, [
      shareEntry("share_partner_owner", "account", "Celine Duarte", {
        subtitle: "celine@partnerflow.example",
        agreement: "Owner access",
        status: "owner",
      }),
      shareEntry("share_partner_client", "account", "Alice Martinez", {
        subtitle: "alice@freshbites.example",
        agreement: "Partnership Engine Agreement — Celine",
        status: "editor",
      }),
      shareEntry("share_partner_task", "document", "Find customers for Fresh Bites", {
        subtitle: "Task-mediated access lane",
        agreement: "Scoped task visibility",
        status: "scoped",
      }),
    ]),
    services: [
      serviceConnection("svc_partner_search", "Partnership Search", "PartnerFlow", "connected", "Core opportunity search service attached to this agreement."),
      serviceConnection("svc_partner_research", "Legal Review", "Blue Legal", "available", "Add legal review before finalizing a contract-heavy partnership."),
      serviceConnection("svc_partner_outreach", "Email Outreach", "Blink Mail", "available", "Connect outbound follow-up tooling once Alice approves the shortlist."),
    ],
    sourceData: {
      agreement_id: "agr_partner_engine_fresh_bites",
      provider_account: "acc_celine",
      client_account: "acc_alice",
      target_profiles: ["wellness", "office lunch", "recurring buyers"],
      exclusions: ["coupon-only", "low-retention channels"],
      linked_task: THREAD_FIND_CUSTOMERS,
    },
    anchorIds: ["anchor_partnerflow_agreement_tasks"],
    uiCards: [
      {
        id: "card_partnerflow_agreement_actions",
        title: "Available actions",
        body: "Agreement actions reflect onboarding and delivery workflows.",
        actions: [
          action(
            "partnerflow_review_intake",
            "Review intake summary",
            "Reviewed intake summary",
            "Reviewed the captured onboarding answers for the agreement."
          ),
          action(
            "partnerflow_grant_access",
            "Grant access",
            "Granted access",
            "Confirmed the active task permission chain for the partnership service."
          ),
        ],
      },
    ],
    activity: [
      activity({
        id: "act_partnerflow_intake",
        kind: "status",
        title: "Intake completed",
        detail: "The agreement now reflects Alice’s goals, exclusions, geography, and intro style.",
        minute: 95,
        documentId: DOC_PARTNERFLOW_AGREEMENT,
        visibleToAccountIds: [ACCOUNT_ALICE, ACCOUNT_CELINE],
        actorName: "PartnerFlow",
        actorSide: "left",
        actorType: "service",
        tone: "event",
      }),
      activity({
        id: "act_partnerflow_leads",
        kind: "operation",
        title: "Task produced fresh leads",
        detail: "The linked task surfaced two new office lunch opportunities and one wellness intro for review.",
        minute: 135,
        documentId: DOC_PARTNERFLOW_AGREEMENT,
        visibleToAccountIds: [ACCOUNT_ALICE, ACCOUNT_CELINE],
        actorName: "PartnerFlow task",
        actorSide: "left",
        actorType: "service",
        tone: "operation",
        linkedLabel: "Open task",
      }),
      activity({
        id: "act_partnerflow_alice_goal",
        kind: "note",
        title: "Alice reaffirmed recurring lunch goal",
        detail: "Alice asked Celine to keep outreach focused on recurring lunch buyers rather than one-off promo traffic.",
        minute: 189,
        documentId: DOC_PARTNERFLOW_AGREEMENT,
        visibleToAccountIds: [ACCOUNT_ALICE, ACCOUNT_CELINE],
        actorName: "Alice Martinez",
        actorEmail: "alice@freshbites.example",
        actorSide: "right",
        actorType: "user",
        tone: "info",
      }),
      activity({
        id: "act_partnerflow_blink",
        kind: "assistant",
        title: "Blink updated operating expectation",
        detail: "Blink kept the task visible from the agreement while avoiding raw direct shop data exposure.",
        minute: 193,
        documentId: DOC_PARTNERFLOW_AGREEMENT,
        visibleToAccountIds: [ACCOUNT_ALICE, ACCOUNT_CELINE],
        actorName: "Blink",
        actorSide: "left",
        actorType: "assistant",
        tone: "operation",
      }),
    ],
    searchKeywords: ["partnership engine agreement", "celine", "alice", "fresh bites"],
    minute: 95,
  });

  const paynoteDoc = document({
    id: DOC_PAYNOTE,
    kind: "payment",
    category: "operational",
    title: "Kitchen Renovation PayNote",
    summary: "Standalone payment/approval document for Fresh Bites kitchen renovation milestones.",
    status: "milestone-review",
    owner: "Alice Martinez",
    ownerAccountId: ACCOUNT_ALICE,
    participants: ["Alice Martinez", "Renovation contractor"],
    participantAccountIds: [ACCOUNT_ALICE],
    tags: ["paynote", "renovation", "fresh bites"],
    isPublic: false,
    visibleToAccountIds: [ACCOUNT_ALICE],
    searchVisibility: "private",
    starredByAccountIds: [ACCOUNT_ALICE],
    taskIds: [THREAD_PAYNOTE],
    typeLabel: "PayNote",
    oneLineSummary: "Approval and payment document for a renovation milestone.",
    coreFields: [
      field("Milestone", "Kitchen ventilation"),
      field("Amount", "$18,400"),
      field("Status", "Needs approval", "warning"),
      field("Counterparty", "Portland Renovation Co."),
    ],
    detailBlocks: [
      block("payment", "Payment details", [
        { label: "Next action", value: "Approve contractor milestone" },
        { label: "Linked task", value: "Kitchen milestone review" },
      ]),
    ],
    descriptionText:
      "The Kitchen Renovation PayNote is a focused payment-and-approval surface for a contractor milestone. It keeps the decision, the amount, the supporting proof, and the next payment action in one place rather than scattering the conversation across finance and operations tools.",
    initialMessage:
      "Alice started this PayNote to review a kitchen ventilation milestone from Portland Renovation Co. The document should make it easy to decide whether the stage is approved, paused, or needs more clarification.",
    currentStateText:
      "The milestone is in review. The contractor has submitted proof, the linked task is still blocked on Alice’s decision, and the next action is either approving the stage or pausing payment until a clarification comes back.",
    currentStateFields: [
      field("Milestone proof", "Submitted"),
      field("Approval owner", "Alice Martinez"),
      field("Finance state", "Awaiting approval", "warning"),
      field("Linked task", "Kitchen milestone review"),
    ],
    participantsDetailed: [
      participant("paynote_alice", "Alice Martinez", {
        accountId: ACCOUNT_ALICE,
        email: "alice@freshbites.example",
        subtitle: "Fresh Bites",
        roles: ["Owner", "Approver"],
      }),
      participant("paynote_contractor", "Portland Renovation Co.", {
        subtitle: "Renovation contractor",
        roles: ["Counterparty"],
      }),
    ],
    allOperations: [
      operation("paynote_approve_stage", "Approve stage", "Approve the current contractor milestone and release the payment lane.", "available", {
        kind: "user",
        actionLabel: "Approve",
      }),
      operation("paynote_pause_payment", "Pause payment", "Hold the payment and ask for clarification before continuing.", "available", {
        kind: "user",
        actionLabel: "Pause",
      }),
      operation("paynote_review_proof", "Review proof package", "Open the submitted documents and milestone evidence.", "available", {
        kind: "system",
        actionLabel: "Review proof",
      }),
    ],
    pendingOperations: [
      operation("paynote_pending_approval", "Approve contractor milestone", "The contractor milestone is ready for Alice’s decision.", "pending", {
        kind: "user",
        actionLabel: "Approve stage",
      }),
    ],
    embeddedDocuments: [
      embeddedDocument(THREAD_PAYNOTE, "Kitchen milestone review", "Linked task tracking the current contractor approval loop.", {
        subtitle: "Task",
        status: "blocked",
      }),
    ],
    shareSettings: shareSettings(false, false, [
      shareEntry("share_paynote_owner", "account", "Alice Martinez", {
        subtitle: "alice@freshbites.example",
        agreement: "Owner access",
        status: "owner",
      }),
    ]),
    services: [
      serviceConnection("svc_paynote_finance", "Finance Review", "Blink Finance", "available", "Attach a finance review service before releasing the milestone."),
      serviceConnection("svc_paynote_legal", "Legal Review", "Blue Legal", "disconnected", "Reconnect legal review if the contractor terms need another pass."),
    ],
    sourceData: {
      paynote_id: "paynote_kitchen_ventilation_stage",
      counterparty: "Portland Renovation Co.",
      amount_usd: 18400,
      linked_task: THREAD_PAYNOTE,
      current_status: "milestone-review",
    },
    uiCards: [
      {
        id: "card_paynote_actions",
        title: "Available actions",
        body: "This document proves the same document experience works for non-shop operations too.",
        actions: [
          action(
            "paynote_approve_stage",
            "Approve stage",
            "Approved milestone",
            "Approved the current contractor milestone.",
            "approved"
          ),
          action(
            "paynote_pause_payment",
            "Pause payment",
            "Paused payment",
            "Paused payment pending milestone clarification.",
            "paused"
          ),
        ],
      },
    ],
    activity: [
      activity({
        id: "act_paynote_created",
        kind: "document-created",
        title: "PayNote seeded",
        detail: "Kitchen Renovation PayNote added as a non-shop operational document.",
        minute: 96,
        documentId: DOC_PAYNOTE,
        visibleToAccountIds: [ACCOUNT_ALICE],
        actorName: "Document",
        actorSide: "left",
        actorType: "document",
        tone: "event",
      }),
      activity({
        id: "act_paynote_contractor",
        kind: "submission",
        title: "Contractor submitted milestone proof",
        detail: "Portland Renovation Co. added proof for the kitchen ventilation stage.",
        minute: 132,
        documentId: DOC_PAYNOTE,
        visibleToAccountIds: [ACCOUNT_ALICE],
        actorName: "Portland Renovation Co.",
        actorSide: "left",
        actorType: "service",
        tone: "info",
      }),
      activity({
        id: "act_paynote_blink",
        kind: "assistant",
        title: "Blink surfaced the approval decision",
        detail: "Blink highlighted the remaining choice between approving the stage or pausing payment.",
        minute: 175,
        documentId: DOC_PAYNOTE,
        visibleToAccountIds: [ACCOUNT_ALICE],
        actorName: "Blink",
        actorSide: "left",
        actorType: "assistant",
        tone: "operation",
      }),
    ],
    searchKeywords: ["kitchen renovation", "paynote", "fresh bites"],
    minute: 96,
  });

  const myLifeDoc = document({
    id: DOC_MY_LIFE,
    kind: "notebook",
    category: "content",
    title: "My Life",
    summary: "Bob’s public notebook with linked note documents and viewer-filtered comments.",
    status: "public",
    owner: "Bob Chen",
    ownerAccountId: ACCOUNT_BOB,
    participants: ["Bob Chen", "Alice Martinez", "Celine Duarte"],
    participantAccountIds: [ACCOUNT_BOB, ACCOUNT_ALICE, ACCOUNT_CELINE],
    tags: ["my life", "notebook", "public"],
    isPublic: true,
    visibleToAccountIds: ALL_ACCOUNTS,
    searchVisibility: "public",
    starredByAccountIds: [ACCOUNT_BOB],
    linkedDocumentIds: myLifeNoteIds,
    anchorIds: ["anchor_my_life_notes"],
    typeLabel: "Notebook",
    oneLineSummary: "Public notebook owned by Bob.",
    coreFields: [
      field("Owner", "Bob Chen"),
      field("Visibility", "Public", "success"),
      field("Anchor", "Notes"),
      field("Comment model", "Viewer-filtered comments"),
    ],
    detailBlocks: [
      block("notebook", "Notebook details", [
        { label: "Public browsing", value: "Enabled" },
        { label: "Private comments", value: "Visible only to Bob + commenter" },
      ]),
    ],
    descriptionText:
      "My Life is Bob’s public notebook. It is intentionally different from a service or operational document: it is a browsing-oriented personal surface with public notes, viewer-filtered comments, and a simple way for other accounts to understand what is broadly visible versus what remains private.",
    initialMessage:
      "Bob started My Life as a lightweight public notebook for personal notes. The document demonstrates that the same document system can hold public notebook content, private comment lanes, and viewer-aware browsing behavior without changing the overall shell.",
    currentStateText:
      "The notebook is public, notes are grouped under the Notes anchor, and private comments remain visible only to Bob and the original commenter. Alice can see her own private comment thread, while Celine only sees the public lane.",
    currentStateFields: [
      field("Notebook mode", "Public browsing"),
      field("Visible notes", "4 linked notes"),
      field("Private comments", "Viewer-filtered"),
      field("Owner", "Bob Chen"),
    ],
    participantsDetailed: [
      participant("mylife_bob", "Bob Chen", {
        accountId: ACCOUNT_BOB,
        email: "bob@northwind.example",
        subtitle: "Notebook owner",
        roles: ["Owner"],
      }),
      participant("mylife_alice", "Alice Martinez", {
        accountId: ACCOUNT_ALICE,
        email: "alice@freshbites.example",
        subtitle: "Public viewer + commenter",
        roles: ["Viewer"],
      }),
      participant("mylife_celine", "Celine Duarte", {
        accountId: ACCOUNT_CELINE,
        email: "celine@partnerflow.example",
        subtitle: "Public viewer",
        roles: ["Viewer"],
      }),
    ],
    allOperations: [
      operation("mylife_open_notes", "Browse notes", "Open linked notes inside the notebook anchor view.", "available", {
        kind: "user",
        actionLabel: "Open notes",
      }),
      operation("mylife_review_comments", "Review viewer-specific comments", "Check which comment threads are visible for the current viewer.", "available", {
        kind: "system",
        actionLabel: "Review comments",
      }),
    ],
    pendingOperations: [
      operation("mylife_private_comment", "Review Alice’s private comment", "Alice still has a private comment thread attached to one note.", "pending", {
        kind: "user",
        actionLabel: "Open note",
      }),
    ],
    embeddedDocuments: [
      embeddedDocument(myLifeNoteIds[0]!, "Morning walk notes", "Public note with a visible public comment lane.", {
        subtitle: "Note",
        status: "public",
      }),
      embeddedDocument(myLifeNoteIds[1]!, "Thinking about staying balanced", "Public note with a private Alice/Bob comment thread.", {
        subtitle: "Note",
        status: "public",
      }),
    ],
    shareSettings: shareSettings(true, true, [
      shareEntry("share_mylife_owner", "account", "Bob Chen", {
        subtitle: "bob@northwind.example",
        agreement: "Owner access",
        status: "owner",
      }),
      shareEntry("share_mylife_public", "document", "Public notebook access", {
        subtitle: "View-only browsing",
        agreement: "My Life",
        status: "public",
      }),
    ]),
    services: [
      serviceConnection("svc_mylife_summarizer", "Journal Summary", "Blink", "available", "Add a lightweight summarizer for longer notebook threads."),
    ],
    sourceData: {
      notebook_id: "notebook_my_life",
      owner_account: "acc_bob",
      notes_anchor: "notes",
      comment_policy: "private comments visible only to Bob + original commenter",
    },
    activity: [
      activity({
        id: "act_mylife_public",
        kind: "document-created",
        title: "Notebook published",
        detail: "My Life was opened for public browsing with viewer-filtered comments.",
        minute: 100,
        documentId: DOC_MY_LIFE,
        visibleToAccountIds: ALL_ACCOUNTS,
        actorName: "Document",
        actorSide: "left",
        actorType: "document",
        tone: "event",
      }),
      activity({
        id: "act_mylife_blink",
        kind: "assistant",
        title: "Blink explained viewer-specific comments",
        detail: "Blink reminded Alice that she can see her own private comments, while other viewers cannot.",
        minute: 199,
        documentId: DOC_MY_LIFE,
        visibleToAccountIds: [ACCOUNT_ALICE, ACCOUNT_BOB],
        actorName: "Blink",
        actorSide: "left",
        actorType: "assistant",
        tone: "info",
      }),
    ],
    searchKeywords: ["my life", "notebook", "bob", "public"],
    minute: 100,
  });

  const documents: DocumentRecord[] = [
    ...profileDocs,
    architectureDoc,
    freshBitesDoc,
    ...freshBitesOrders,
    bobOrder,
    ...freshBitesProducts,
    ...freshBitesPartnershipDocs,
    biOfferingDoc,
    biAgreementDoc,
    ...biReports,
    partnerflowOfferingDoc,
    partnerflowAgreementDoc,
    ...partnerflowPlaybooks,
    paynoteDoc,
    myLifeDoc,
    ...myLifeNotes,
    commentPublicAlice,
    commentPrivateAlice,
  ];

  const threads: ThreadRecord[] = [
    thread({
      id: THREAD_FIND_CUSTOMERS,
      title: "Find customers for Fresh Bites",
      summary:
        "Active task that has access to the Fresh Bites shop and #partnerships and is called by the Partnership Engine agreement.",
      status: "active",
      owner: "Alice Martinez",
      ownerAccountId: ACCOUNT_ALICE,
      participantAccountIds: [ACCOUNT_ALICE, ACCOUNT_CELINE],
      visibleToAccountIds: [ACCOUNT_ALICE, ACCOUNT_CELINE],
      parentDocumentId: DOC_FRESH_BITES,
      progress: 64,
      responsibleSummary: "PartnerFlow task runner",
      activityLabel: "Permissioned customer search task",
      tags: ["task", "partnerflow", "fresh bites"],
      participantsDetailed: [
        participant("task_find_customers_alice", "Alice Martinez", {
          accountId: ACCOUNT_ALICE,
          email: "alice@freshbites.example",
          subtitle: "Fresh Bites",
          roles: ["Owner"],
        }),
        participant("task_find_customers_celine", "Celine Duarte", {
          accountId: ACCOUNT_CELINE,
          email: "celine@partnerflow.example",
          subtitle: "PartnerFlow",
          roles: ["Provider"],
        }),
      ],
      settingsBlocks: [
        block("task_permissions", "Permissions", [
          { label: "Can read", value: "Fresh Bites shop + #partnerships" },
          { label: "External tool access", value: "Task-mediated only" },
        ]),
      ],
      uiCards: [
        {
          id: "card_task_find_customers",
          title: "Available actions",
          body: "Task actions reflect a permissioned service/task chain rather than direct app access.",
          actions: [
            action(
              "task_find_customers_refresh",
              "Refresh target list",
              "Refreshed target list",
              "Refreshed the target partnership list for Fresh Bites."
            ),
            action(
              "task_find_customers_pause",
              "Pause service",
              "Paused service task",
              "Paused the active customer search task.",
              "paused"
            ),
          ],
        },
      ],
      messages: [
        { id: "msg_task_find_customers_1", role: "assistant", text: "I added two new office lunch leads and one wellness intro.", createdAt: at(101) },
      ],
      activity: [
        activity({
          id: "act_task_find_customers",
          kind: "thread-created",
          title: "Task active",
          detail: "Task is actively producing partnership opportunities for Fresh Bites.",
          minute: 101,
          threadId: THREAD_FIND_CUSTOMERS,
          documentId: DOC_FRESH_BITES,
          visibleToAccountIds: [ACCOUNT_ALICE, ACCOUNT_CELINE],
          actorName: "PartnerFlow task",
          actorSide: "left",
          actorType: "service",
          tone: "event",
        }),
        activity({
          id: "act_task_find_customers_refresh_seed",
          kind: "operation",
          title: "Target list refreshed",
          detail: "The task refreshed the latest office lunch and wellness targets from the scoped partnership lane.",
          minute: 135,
          threadId: THREAD_FIND_CUSTOMERS,
          documentId: DOC_FRESH_BITES,
          visibleToAccountIds: [ACCOUNT_ALICE, ACCOUNT_CELINE],
          actorName: "PartnerFlow task",
          actorSide: "left",
          actorType: "service",
          tone: "operation",
        }),
      ],
      minute: 101,
    }),
    thread({
      id: THREAD_PAYNOTE,
      title: "Kitchen milestone review",
      summary: "Approval task for the current kitchen renovation milestone.",
      status: "blocked",
      owner: "Alice Martinez",
      ownerAccountId: ACCOUNT_ALICE,
      participantAccountIds: [ACCOUNT_ALICE],
      visibleToAccountIds: [ACCOUNT_ALICE],
      parentDocumentId: DOC_PAYNOTE,
      progress: 40,
      responsibleSummary: "Alice / finance review",
      activityLabel: "Milestone approval task",
      tags: ["task", "paynote", "renovation"],
      participantsDetailed: [
        participant("task_paynote_alice", "Alice Martinez", {
          accountId: ACCOUNT_ALICE,
          email: "alice@freshbites.example",
          subtitle: "Finance approver",
          roles: ["Owner"],
        }),
      ],
      messages: [
        { id: "msg_task_paynote_1", role: "assistant", text: "The contractor submitted milestone proof, but approval is still pending.", createdAt: at(102) },
      ],
      uiCards: [
        {
          id: "card_task_paynote",
          title: "Available actions",
          body: "The task stays attached to the payment document rather than becoming a chat thread.",
          actions: [
            action("task_paynote_review", "Review proof", "Reviewed proof", "Reviewed the contractor milestone proof."),
            action("task_paynote_complete", "Mark complete", "Completed milestone task", "Marked the milestone task complete.", "completed"),
          ],
        },
      ],
      activity: [
        activity({
          id: "act_task_paynote_blocked",
          kind: "thread-created",
          title: "Milestone task blocked on approval",
          detail: "The linked task remains blocked until Alice approves or pauses the contractor milestone.",
          minute: 133,
          threadId: THREAD_PAYNOTE,
          documentId: DOC_PAYNOTE,
          visibleToAccountIds: [ACCOUNT_ALICE],
          actorName: "Blink Finance",
          actorSide: "left",
          actorType: "assistant",
          tone: "event",
        }),
      ],
      minute: 102,
    }),
    thread({
      id: THREAD_ORDER_BOB,
      title: "Bob order follow-up",
      summary: "Order follow-up task attached to Bob’s Fresh Bites order.",
      status: "active",
      owner: "Alice Martinez",
      ownerAccountId: ACCOUNT_ALICE,
      participantAccountIds: [ACCOUNT_ALICE, ACCOUNT_BOB],
      visibleToAccountIds: [ACCOUNT_ALICE, ACCOUNT_BOB],
      parentDocumentId: DOC_ORDER_BOB,
      progress: 55,
      responsibleSummary: "Fresh Bites delivery ops",
      activityLabel: "Customer order task",
      tags: ["task", "order", "bob"],
      participantsDetailed: [
        participant("task_order_bob_alice", "Alice Martinez", {
          accountId: ACCOUNT_ALICE,
          email: "alice@freshbites.example",
          subtitle: "Fresh Bites delivery ops",
          roles: ["Owner"],
        }),
        participant("task_order_bob_bob", "Bob Chen", {
          accountId: ACCOUNT_BOB,
          email: "bob@northwind.example",
          subtitle: "Customer",
          roles: ["Participant"],
        }),
      ],
      messages: [
        { id: "msg_task_order_bob_1", role: "assistant", text: "Courier handoff is next. Keep Bob updated from the order document.", createdAt: at(103) },
      ],
      uiCards: [
        {
          id: "card_task_bob_order",
          title: "Available actions",
          body: "Use the task when coordinating the customer-specific order flow.",
          actions: [
            action("task_bob_order_notify", "Notify customer", "Notified customer", "Sent the latest delivery update to Bob."),
          ],
        },
      ],
      activity: [
        activity({
          id: "act_task_bob_order",
          kind: "thread-created",
          title: "Delivery follow-up started",
          detail: "Fresh Bites created a lightweight task to keep Bob updated during delivery handoff.",
          minute: 186,
          threadId: THREAD_ORDER_BOB,
          documentId: DOC_ORDER_BOB,
          visibleToAccountIds: [ACCOUNT_ALICE, ACCOUNT_BOB],
          actorName: "Fresh Bites ops",
          actorSide: "left",
          actorType: "service",
          tone: "event",
        }),
      ],
      minute: 103,
    }),
  ];

  const threadMap = new Map(threads.map((entry) => [entry.id, entry]));
  const documentsWithThreadEmbeds = [freshBitesDoc, partnerflowAgreementDoc, paynoteDoc];
  for (const entry of documentsWithThreadEmbeds) {
    entry.embeddedDocuments = (entry.embeddedDocuments ?? []).map((embedded) => {
      const matchingThread = threadMap.get(embedded.documentId);
      return matchingThread
        ? {
            ...embedded,
            status: matchingThread.status,
          }
        : embedded;
    });
  }

  const documentAnchors: DocumentAnchorRecord[] = [
    anchor("anchor_fresh_bites_orders", DOC_FRESH_BITES, "orders", "Orders", [...freshBitesOrderIds, DOC_ORDER_BOB]),
    anchor("anchor_fresh_bites_products", DOC_FRESH_BITES, "products", "Products", freshBitesProductIds),
    anchor("anchor_fresh_bites_partnerships", DOC_FRESH_BITES, "partnerships", "Partnerships", freshBitesPartnershipIds),
    anchor("anchor_northwind_clients", DOC_BI_OFFERING, "clients", "Clients", [DOC_PROFILE_ALICE]),
    anchor("anchor_northwind_contracts", DOC_BI_OFFERING, "contracts", "Contracts", [DOC_BI_AGREEMENT], [ACCOUNT_BOB, ACCOUNT_ALICE]),
    anchor("anchor_northwind_reports", DOC_BI_OFFERING, "reports", "Reports", biReportIds, [ACCOUNT_BOB, ACCOUNT_ALICE]),
    anchor("anchor_partnerflow_clients", DOC_PARTNERFLOW_OFFERING, "clients", "Clients", [DOC_PROFILE_ALICE]),
    anchor("anchor_partnerflow_contracts", DOC_PARTNERFLOW_OFFERING, "contracts", "Contracts", [DOC_PARTNERFLOW_AGREEMENT], [ACCOUNT_ALICE, ACCOUNT_CELINE]),
    anchor("anchor_partnerflow_playbooks", DOC_PARTNERFLOW_OFFERING, "playbooks", "Playbooks", partnerflowPlaybookIds, [ACCOUNT_ALICE, ACCOUNT_CELINE]),
    anchor("anchor_partnerflow_agreement_tasks", DOC_PARTNERFLOW_AGREEMENT, "linked-tasks", "Linked Tasks", [DOC_FRESH_BITES]),
    anchor("anchor_my_life_notes", DOC_MY_LIFE, "notes", "Notes", myLifeNoteIds),
    anchor("anchor_note_walk_comments", myLifeNoteIds[0], "comments", "Comments", [commentPublicAlice.id]),
    anchor("anchor_note_balance_comments", myLifeNoteIds[1], "comments", "Comments", [commentPrivateAlice.id]),
  ];

  const attentionItems: AttentionItem[] = [
    {
      id: "attn_alice_payment_failed_1003",
      accountId: ACCOUNT_ALICE,
      status: "pending",
      title: "Payment failed — order #1003",
      body: "Retry or follow up with the customer before the prep window closes.",
      priority: "high",
      relatedDocumentId: freshBitesOrderIds[2],
      availableActionLabels: ["Retry payment", "Message customer"],
      sourceLabel: "Fresh Bites / Orders",
      sourceHref: `/documents/${freshBitesOrderIds[2]}`,
      createdAt: at(130),
      resolvedAt: null,
      delivery: { inApp: true, external: "not-sent" },
    },
    {
      id: "attn_alice_payment_failed_1007",
      accountId: ACCOUNT_ALICE,
      status: "pending",
      title: "Payment failed — order #1007",
      body: "Corporate lunch order still needs a payment decision.",
      priority: "high",
      relatedDocumentId: freshBitesOrderIds[6],
      availableActionLabels: ["Retry payment", "Put on hold"],
      sourceLabel: "Fresh Bites / Orders",
      sourceHref: `/documents/${freshBitesOrderIds[6]}`,
      createdAt: at(131),
      resolvedAt: null,
      delivery: { inApp: true, external: "not-sent" },
    },
    {
      id: "attn_alice_partner_review",
      accountId: ACCOUNT_ALICE,
      status: "pending",
      title: "Review partnership proposal",
      body: "School snacks partnership draft still needs Alice’s decision.",
      priority: "medium",
      relatedDocumentId: freshBitesPartnershipIds[3],
      availableActionLabels: ["Review proposal", "Ask Blink"],
      sourceLabel: "Fresh Bites / Partnerships",
      sourceHref: `/documents/${freshBitesPartnershipIds[3]}`,
      createdAt: at(132),
      resolvedAt: null,
      delivery: { inApp: true, external: "queued" },
    },
    {
      id: "attn_alice_partnerflow_agreement",
      accountId: ACCOUNT_ALICE,
      status: "pending",
      title: "Confirm PartnerFlow direction",
      body: "Celine needs a quick decision on whether to keep the current outreach focused on recurring lunch buyers only.",
      priority: "medium",
      relatedDocumentId: DOC_PARTNERFLOW_AGREEMENT,
      relatedThreadId: THREAD_FIND_CUSTOMERS,
      availableActionLabels: ["Review intake summary", "Open task"],
      sourceLabel: "Partnership Engine Agreement — Celine",
      sourceHref: `/documents/${DOC_PARTNERFLOW_AGREEMENT}`,
      createdAt: at(132),
      resolvedAt: null,
      delivery: { inApp: true, external: "queued" },
    },
    {
      id: "attn_alice_paynote",
      accountId: ACCOUNT_ALICE,
      status: "pending",
      title: "Approve kitchen milestone",
      body: "Contractor milestone is ready for review on the renovation PayNote.",
      priority: "medium",
      relatedDocumentId: DOC_PAYNOTE,
      relatedThreadId: THREAD_PAYNOTE,
      availableActionLabels: ["Approve stage", "Pause payment"],
      sourceLabel: "Kitchen Renovation PayNote",
      sourceHref: `/documents/${DOC_PAYNOTE}`,
      createdAt: at(133),
      resolvedAt: null,
      delivery: { inApp: true, external: "not-sent" },
    },
    {
      id: "attn_bob_report_request",
      accountId: ACCOUNT_BOB,
      status: "pending",
      title: "Fresh Bites asked for a new report",
      body: "Alice requested another report from the Northwind BI agreement.",
      priority: "medium",
      relatedDocumentId: DOC_BI_AGREEMENT,
      availableActionLabels: ["Prepare report", "Reply in agreement"],
      sourceLabel: "Northwind BI Agreement — Bob",
      sourceHref: `/documents/${DOC_BI_AGREEMENT}`,
      createdAt: at(134),
      resolvedAt: null,
      delivery: { inApp: true, external: "queued" },
    },
    {
      id: "attn_celine_task_update",
      accountId: ACCOUNT_CELINE,
      status: "pending",
      title: "Fresh Bites task produced new leads",
      body: "The permissioned task surfaced two new office lunch opportunities.",
      priority: "medium",
      relatedDocumentId: DOC_PARTNERFLOW_AGREEMENT,
      relatedThreadId: THREAD_FIND_CUSTOMERS,
      availableActionLabels: ["Review opportunities", "Open task"],
      sourceLabel: "Partnership Engine Agreement — Celine",
      sourceHref: `/documents/${DOC_PARTNERFLOW_AGREEMENT}`,
      createdAt: at(135),
      resolvedAt: null,
      delivery: { inApp: true, external: "not-sent" },
    },
    {
      id: "attn_piotr_demo",
      accountId: ACCOUNT_PIOTR,
      status: "pending",
      title: "Review the public demo surface",
      body: "Fresh Bites, Northwind BI, and Partnership Engine are all discoverable from search.",
      priority: "low",
      relatedDocumentId: DOC_ARCHITECTURE,
      availableActionLabels: ["Open search", "Review notes"],
      sourceLabel: "Demo Architecture Notes",
      sourceHref: `/documents/${DOC_ARCHITECTURE}`,
      createdAt: at(136),
      resolvedAt: null,
      delivery: { inApp: true, external: "not-sent" },
    },
  ];

  const activityFeed: ActivityRecord[] = [
    activity({
      id: "act_global_1",
      kind: "operation",
      title: "Multi-account demo seeded",
      detail: "The document-first demo includes four accounts and shared/public documents.",
      minute: 150,
    }),
    ...documents.flatMap((entry) => entry.activity),
    ...threads.flatMap((entry) => entry.activity),
  ].sort((left, right) => right.createdAt.localeCompare(left.createdAt));

  const assistantConversations: AssistantConversationRecord[] = [
    convo("aconv_home_piotr", "home", ACCOUNT_PIOTR, ACCOUNT_PIOTR, "Blink", 160),
    convo("aconv_home_alice", "home", ACCOUNT_ALICE, ACCOUNT_ALICE, "Blink", 161),
    convo("aconv_home_bob", "home", ACCOUNT_BOB, ACCOUNT_BOB, "Blink", 162),
    convo("aconv_home_celine", "home", ACCOUNT_CELINE, ACCOUNT_CELINE, "Blink", 163),
    convo("aconv_doc_fresh_bites_bob", "document", DOC_FRESH_BITES, ACCOUNT_BOB, "Blink", 164),
    convo("aconv_doc_order_bob", "document", DOC_ORDER_BOB, ACCOUNT_BOB, "Blink", 165),
    convo("aconv_doc_partnerflow_alice", "document", DOC_PARTNERFLOW_AGREEMENT, ACCOUNT_ALICE, "Blink", 166),
    convo("aconv_doc_partnerflow_celine", "document", DOC_PARTNERFLOW_AGREEMENT, ACCOUNT_CELINE, "Blink", 167),
    convo("aconv_doc_bi_alice", "document", DOC_BI_AGREEMENT, ACCOUNT_ALICE, "Blink", 168),
    convo("aconv_doc_my_life_alice", "document", DOC_MY_LIFE, ACCOUNT_ALICE, "Blink", 169),
  ];

  const assistantPlaybooks: AssistantPlaybookRecord[] = [
    playbook("aplay_home_piotr", "home", ACCOUNT_PIOTR, ACCOUNT_PIOTR, "You are Blink for piotr-blue.", 160),
    playbook("aplay_home_alice", "home", ACCOUNT_ALICE, ACCOUNT_ALICE, "You are Blink for Alice / Fresh Bites.", 161),
    playbook("aplay_home_bob", "home", ACCOUNT_BOB, ACCOUNT_BOB, "You are Blink for Bob / Northwind BI.", 162),
    playbook("aplay_home_celine", "home", ACCOUNT_CELINE, ACCOUNT_CELINE, "You are Blink for Celine / PartnerFlow.", 163),
    playbook("aplay_doc_fresh_bites_bob", "document", DOC_FRESH_BITES, ACCOUNT_BOB, "You are Blink helping Bob with Fresh Bites.", 164),
    playbook("aplay_doc_order_bob", "document", DOC_ORDER_BOB, ACCOUNT_BOB, "You are Blink helping Bob with his order document.", 165),
    playbook("aplay_doc_partnerflow_alice", "document", DOC_PARTNERFLOW_AGREEMENT, ACCOUNT_ALICE, "You are Blink helping Alice with the PartnerFlow agreement.", 166),
    playbook("aplay_doc_partnerflow_celine", "document", DOC_PARTNERFLOW_AGREEMENT, ACCOUNT_CELINE, "You are Blink helping Celine with the PartnerFlow agreement.", 167),
    playbook("aplay_doc_bi_alice", "document", DOC_BI_AGREEMENT, ACCOUNT_ALICE, "You are Blink helping Alice with the BI agreement.", 168),
    playbook("aplay_doc_my_life_alice", "document", DOC_MY_LIFE, ACCOUNT_ALICE, "You are Blink helping Alice browse My Life.", 169),
  ];

  const assistantExchangeMessages: AssistantExchangeMessageRecord[] = [
    exchangeMessage("aem_home_piotr_live_1", "aconv_home_piotr", "aex_home_piotr_live_1", "assistant", "opener", "You are on the live account. Ask a question or ask me to create a document with a name and description.", 170),
    exchangeMessage("aem_home_piotr_live_2", "aconv_home_piotr", "aex_home_piotr_live_1", "user", "reply", "Okay, keep this account empty until I create docs.", 171),
    exchangeMessage("aem_home_piotr_live_3", "aconv_home_piotr", "aex_home_piotr_live_1", "assistant", "resolution", "Understood. I’ll wait for your next live request.", 172),

    exchangeMessage("aem_home_alice_1", "aconv_home_alice", "aex_home_alice_1", "assistant", "opener", "Today you have two failed payments, one partnership proposal to review, and one contractor milestone approval waiting.", 173),
    exchangeMessage("aem_home_alice_2", "aconv_home_alice", "aex_home_alice_1", "user", "reply", "Show the service agreements after the payment issues.", 174),
    exchangeMessage("aem_home_alice_3", "aconv_home_alice", "aex_home_alice_1", "assistant", "resolution", "Done — I kept BI and Partnership Engine visible after the payment queue.", 175),

    exchangeMessage("aem_home_bob_1", "aconv_home_bob", "aex_home_bob_1", "assistant", "opener", "Fresh Bites asked for another report, and your public notebook is getting views from Alice and Celine.", 176),
    exchangeMessage("aem_home_bob_2", "aconv_home_bob", "aex_home_bob_1", "user", "reply", "Keep the notebook public but only surface private comments to me and the commenter.", 177),
    exchangeMessage("aem_home_bob_3", "aconv_home_bob", "aex_home_bob_1", "assistant", "resolution", "Done — viewer-specific filtering is active on note comments.", 178),

    exchangeMessage("aem_home_celine_1", "aconv_home_celine", "aex_home_celine_1", "assistant", "opener", "The Fresh Bites task produced new office lunch leads and your agreement already captures Alice’s onboarding answers.", 179),
    exchangeMessage("aem_home_celine_2", "aconv_home_celine", "aex_home_celine_1", "user", "reply", "Keep the task visible from the agreement but not as raw tool access.", 180),
    exchangeMessage("aem_home_celine_3", "aconv_home_celine", "aex_home_celine_1", "assistant", "resolution", "Done — the task is now the permission boundary.", 181),

    exchangeMessage("aem_doc_fresh_bob_1", "aconv_doc_fresh_bites_bob", "aex_doc_fresh_bob_1", "assistant", "opener", "Welcome back to Fresh Bites. I can help you create or track your order from this shop document.", 182),
    exchangeMessage("aem_doc_fresh_bob_2", "aconv_doc_fresh_bites_bob", "aex_doc_fresh_bob_1", "user", "reply", "Start a lunch order for me.", 183),
    exchangeMessage("aem_doc_fresh_bob_3", "aconv_doc_fresh_bites_bob", "aex_doc_fresh_bob_1", "assistant", "resolution", "Started — your order now lives in Fresh Bites order — Bob.", 184),

    exchangeMessage("aem_doc_order_bob_1", "aconv_doc_order_bob", "aex_doc_order_bob_1", "assistant", "opener", "Your order is confirmed and waiting for delivery.", 185),
    exchangeMessage("aem_doc_order_bob_2", "aconv_doc_order_bob", "aex_doc_order_bob_1", "user", "reply", "Keep me posted when it goes out.", 186),
    exchangeMessage("aem_doc_order_bob_3", "aconv_doc_order_bob", "aex_doc_order_bob_1", "assistant", "resolution", "Done — I’ll surface the next delivery update here for you.", 187),

    exchangeMessage("aem_doc_partner_alice_1", "aconv_doc_partnerflow_alice", "aex_doc_partner_alice_1", "assistant", "opener", "This agreement now understands Fresh Bites: Portland, wellness + office lunch targets, warm practical intros, and no coupon-only channels.", 188),
    exchangeMessage("aem_doc_partner_alice_2", "aconv_doc_partnerflow_alice", "aex_doc_partner_alice_1", "user", "reply", "Keep the service focused on recurring lunch buyers.", 189),
    exchangeMessage("aem_doc_partner_alice_3", "aconv_doc_partnerflow_alice", "aex_doc_partner_alice_1", "assistant", "resolution", "Done — I updated the operating expectation and linked it to the active task.", 190),

    exchangeMessage("aem_doc_partner_celine_1", "aconv_doc_partnerflow_celine", "aex_doc_partner_celine_1", "assistant", "opener", "Alice’s goals and exclusions are captured, and the Fresh Bites task has active leads to review.", 191),
    exchangeMessage("aem_doc_partner_celine_2", "aconv_doc_partnerflow_celine", "aex_doc_partner_celine_1", "user", "reply", "Show me the task status instead of raw shop data.", 192),
    exchangeMessage("aem_doc_partner_celine_3", "aconv_doc_partnerflow_celine", "aex_doc_partner_celine_1", "assistant", "resolution", "Done — task visibility stays front and center from the agreement.", 193),

    exchangeMessage("aem_doc_bi_alice_1", "aconv_doc_bi_alice", "aex_doc_bi_alice_1", "assistant", "opener", "You can ask Northwind BI questions about sales today without opening raw reports first.", 194),
    exchangeMessage("aem_doc_bi_alice_2", "aconv_doc_bi_alice", "aex_doc_bi_alice_1", "user", "reply", "How are sales today?", 195),
    exchangeMessage("aem_doc_bi_alice_3", "aconv_doc_bi_alice", "aex_doc_bi_alice_1", "assistant", "resolution", "Today looks healthy — bowls lead the mix and lunch hours are strongest so far.", 196),

    exchangeMessage("aem_doc_life_alice_1", "aconv_doc_my_life_alice", "aex_doc_life_alice_1", "assistant", "opener", "This is Bob’s public notebook. You’ll see public notes and any private comments you personally authored.", 197),
    exchangeMessage("aem_doc_life_alice_2", "aconv_doc_my_life_alice", "aex_doc_life_alice_1", "user", "reply", "Keep my private comment visible only to me and Bob.", 198),
    exchangeMessage("aem_doc_life_alice_3", "aconv_doc_my_life_alice", "aex_doc_life_alice_1", "assistant", "resolution", "Done — Celine will only see the public comment thread.", 199),
  ];

  const assistantExchanges: AssistantExchangeRecord[] = [
    exchange("aex_home_piotr_live_1", "aconv_home_piotr", "home", ACCOUNT_PIOTR, ACCOUNT_PIOTR, "Live account intro", "aem_home_piotr_live_1", "aem_home_piotr_live_3", 170, {
      resolutionMessageId: "aem_home_piotr_live_3",
      sourceType: "system",
    }),
    exchange("aex_home_alice_1", "aconv_home_alice", "home", ACCOUNT_ALICE, ACCOUNT_ALICE, "Prioritize Alice home queue", "aem_home_alice_1", "aem_home_alice_3", 173, {
      resolutionMessageId: "aem_home_alice_3",
      sourceType: "user-demo",
    }),
    exchange("aex_home_bob_1", "aconv_home_bob", "home", ACCOUNT_BOB, ACCOUNT_BOB, "Filter notebook comments by viewer", "aem_home_bob_1", "aem_home_bob_3", 176, {
      resolutionMessageId: "aem_home_bob_3",
      sourceType: "user-demo",
    }),
    exchange("aex_home_celine_1", "aconv_home_celine", "home", ACCOUNT_CELINE, ACCOUNT_CELINE, "Keep task as permission boundary", "aem_home_celine_1", "aem_home_celine_3", 179, {
      resolutionMessageId: "aem_home_celine_3",
      sourceType: "user-demo",
    }),
    exchange("aex_doc_fresh_bob_1", "aconv_doc_fresh_bites_bob", "document", DOC_FRESH_BITES, ACCOUNT_BOB, "Start an order from Fresh Bites", "aem_doc_fresh_bob_1", "aem_doc_fresh_bob_3", 182, {
      resolutionMessageId: "aem_doc_fresh_bob_3",
      sourceType: "user-demo",
    }),
    exchange("aex_doc_order_bob_1", "aconv_doc_order_bob", "document", DOC_ORDER_BOB, ACCOUNT_BOB, "Track Bob’s order", "aem_doc_order_bob_1", "aem_doc_order_bob_3", 185, {
      resolutionMessageId: "aem_doc_order_bob_3",
      sourceType: "user-demo",
    }),
    exchange("aex_doc_partner_alice_1", "aconv_doc_partnerflow_alice", "document", DOC_PARTNERFLOW_AGREEMENT, ACCOUNT_ALICE, "Confirm recurring lunch goal", "aem_doc_partner_alice_1", "aem_doc_partner_alice_3", 188, {
      resolutionMessageId: "aem_doc_partner_alice_3",
      sourceType: "user-demo",
    }),
    exchange("aex_doc_partner_celine_1", "aconv_doc_partnerflow_celine", "document", DOC_PARTNERFLOW_AGREEMENT, ACCOUNT_CELINE, "Task-first provider view", "aem_doc_partner_celine_1", "aem_doc_partner_celine_3", 191, {
      resolutionMessageId: "aem_doc_partner_celine_3",
      sourceType: "user-demo",
    }),
    exchange("aex_doc_bi_alice_1", "aconv_doc_bi_alice", "document", DOC_BI_AGREEMENT, ACCOUNT_ALICE, "Ask Northwind BI a question", "aem_doc_bi_alice_1", "aem_doc_bi_alice_3", 194, {
      resolutionMessageId: "aem_doc_bi_alice_3",
      sourceType: "user-demo",
    }),
    exchange("aex_doc_life_alice_1", "aconv_doc_my_life_alice", "document", DOC_MY_LIFE, ACCOUNT_ALICE, "Viewer-specific private comments", "aem_doc_life_alice_1", "aem_doc_life_alice_3", 197, {
      resolutionMessageId: "aem_doc_life_alice_3",
      sourceType: "user-demo",
    }),
  ];

  return {
    accounts,
    documentAnchors,
    scopes: [],
    threads,
    documents,
    attentionItems,
    activity: activityFeed,
    assistantConversations,
    assistantExchanges,
    assistantExchangeMessages,
    assistantPlaybooks,
  };
}

