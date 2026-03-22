import type {
  ActivityRecord,
  AttentionItem,
  BaseChatMessage,
  DemoActionDefinition,
  DemoSettingsBlock,
  DemoSnapshot,
  DocumentRecord,
  DocumentUiCard,
  ScopeRecord,
  ThreadRecord,
} from "@/lib/demo/types";

export const BLINK_SCOPE_ID = "scope_home";

const SCOPE_ALICE = "scope_alice_shop";
const SCOPE_LAKE = "scope_lake_book";
const SCOPE_SUNSET = "scope_sunset_restaurant";

const BASE_TIME = Date.parse("2026-03-20T08:00:00.000Z");

function at(minutes: number): string {
  return new Date(BASE_TIME + minutes * 60_000).toISOString();
}

function settingsBlock(
  id: string,
  title: string,
  items: Array<{ label: string; value: string }>,
  description?: string
): DemoSettingsBlock {
  return {
    id,
    title,
    description,
    items,
  };
}

function activity(params: {
  id: string;
  scopeId: string;
  scopeType: "blink" | "workspace";
  kind: ActivityRecord["kind"];
  title: string;
  detail: string;
  minute: number;
  threadId?: string;
  documentId?: string;
}): ActivityRecord {
  return {
    id: params.id,
    scopeId: params.scopeId,
    scopeType: params.scopeType,
    kind: params.kind,
    title: params.title,
    detail: params.detail,
    createdAt: at(params.minute),
    threadId: params.threadId ?? null,
    documentId: params.documentId ?? null,
  };
}

function message(id: string, role: BaseChatMessage["role"], text: string, minute: number): BaseChatMessage {
  return {
    id,
    role,
    text,
    createdAt: at(minute),
  };
}

function action(
  id: string,
  label: string,
  activityTitle: string,
  activityDetail: string,
  nextStatus?: string,
  assistantNote?: string
): DemoActionDefinition {
  return {
    id,
    label,
    activityTitle,
    activityDetail,
    nextStatus,
    assistantNote,
  };
}

function threadUiCards(prefix: string): DocumentUiCard[] {
  return [
    {
      id: `${prefix}_card_progress`,
      title: "Execution controls",
      body: "Update status as this task moves from active planning into execution.",
      actions: [
        action(
          `${prefix}_advance`,
          "Advance progress",
          "Progress advanced",
          "Progress moved forward and status refreshed.",
          "active",
          "I recorded progress and will include this in the next recap."
        ),
        action(
          `${prefix}_pause`,
          "Pause task",
          "Task paused",
          "Task paused pending a dependency decision.",
          "paused"
        ),
        action(
          `${prefix}_complete`,
          "Mark complete",
          "Task completed",
          "Task completed and ready to archive.",
          "completed",
          "Great — I will remove this from urgent asks."
        ),
      ],
    },
  ];
}

function threadSettings(scopeName: string): DemoSettingsBlock[] {
  return [
    settingsBlock("permissions", "Permissions", [
      { label: "Visibility", value: `${scopeName} operators` },
      { label: "Can update status", value: "Owner + assistant" },
    ]),
    settingsBlock("escalation", "Escalation mode", [
      { label: "Policy", value: "Escalate if blocked > 24h" },
      { label: "Escalation target", value: "Blink summary digest" },
    ]),
    settingsBlock("reporting", "Reporting preferences", [
      { label: "Digest cadence", value: "Daily morning recap" },
      { label: "Include in monthly digest", value: "Yes" },
    ]),
  ];
}

function createThread(params: {
  id: string;
  scopeId: string;
  title: string;
  summary: string;
  owner: string;
  progress: number;
  sectionKey: string | null;
  minute: number;
  status?: ThreadRecord["status"];
  tags: string[];
  messages: BaseChatMessage[];
  activity: ActivityRecord[];
}): ThreadRecord {
  return {
    id: params.id,
    scopeId: params.scopeId,
    title: params.title,
    summary: params.summary,
    status: params.status ?? "active",
    owner: params.owner,
    progress: params.progress,
    tags: params.tags,
    sectionKey: params.sectionKey,
    createdAt: at(params.minute),
    updatedAt: at(params.minute + 15),
    coreDocumentId: null,
    sessionId: null,
    settingsBlocks: threadSettings(params.scopeId === BLINK_SCOPE_ID ? "Home" : "Workspace"),
    uiCards: threadUiCards(params.id),
    messages: params.messages,
    activity: params.activity,
  };
}

function createDocument(params: {
  id: string;
  scopeId: string | null;
  kind: DocumentRecord["kind"];
  category: DocumentRecord["category"];
  sectionKey: string | null;
  title: string;
  summary: string;
  status: string;
  owner: string;
  participants: string[];
  tags: string[];
  minute: number;
  isService?: boolean;
  details: Record<string, unknown>;
  settingsBlocks: DemoSettingsBlock[];
  uiCards: DocumentUiCard[];
  activity: ActivityRecord[];
}): DocumentRecord {
  return {
    id: params.id,
    scopeId: params.scopeId,
    kind: params.kind,
    category: params.category,
    sectionKey: params.sectionKey,
    title: params.title,
    summary: params.summary,
    status: params.status,
    owner: params.owner,
    participants: params.participants,
    tags: params.tags,
    isService: params.isService ?? false,
    createdAt: at(params.minute),
    updatedAt: at(params.minute + 10),
    sessionId: null,
    myosDocumentId: null,
    settingsBlocks: params.settingsBlocks,
    details: params.details,
    uiCards: params.uiCards,
    activity: params.activity,
    searchKeywords: params.tags,
  };
}

function docSettings(scope: string, type: string, status: string, participants: string[]): DemoSettingsBlock[] {
  return [
    settingsBlock("scope", "Linked scope", [
      { label: "Scope", value: scope },
      { label: "Document type", value: type },
      { label: "Status", value: status },
    ]),
    settingsBlock("access", "Access & participants", [
      { label: "Participants", value: participants.join(", ") },
      { label: "Default access", value: "Edit for operators, read for stakeholders" },
    ]),
    settingsBlock("automation", "Automation preferences", [
      { label: "Assistant mode", value: "Suggest changes before applying" },
      { label: "Notifications", value: "Digest + priority alerts" },
    ]),
  ];
}

function documentActions(actions: DemoActionDefinition[]): DocumentUiCard[] {
  return [
    {
      id: `${actions[0]?.id ?? "ui"}_card`,
      title: "Operational controls",
      body: "Use demo actions to mutate local state and generate timeline events.",
      actions,
    },
  ];
}

export function createSeedSnapshot(): DemoSnapshot {
  const threads: ThreadRecord[] = [];
  const documents: DocumentRecord[] = [];
  const attentionItems: AttentionItem[] = [];
  const globalActivity: ActivityRecord[] = [];

  const homeThreads = [
    createThread({
      id: "thread_home_daily_ops",
      scopeId: BLINK_SCOPE_ID,
      title: "Daily operations triage",
      summary: "Triage incoming asks and route them into scoped workspaces.",
      owner: "Blink",
      progress: 62,
      sectionKey: "tasks",
      minute: 30,
      tags: ["daily", "triage", "operations"],
      messages: [
        message("msg_home_triage_1", "assistant", "I triaged overnight asks and grouped them by scope.", 32),
        message("msg_home_triage_2", "user", "Keep supplier risk items at the top of this queue.", 33),
        message("msg_home_triage_3", "assistant", "Done. Supplier renewals are pinned for this morning.", 34),
      ],
      activity: [
        activity({
          id: "act_home_triage_created",
          scopeId: BLINK_SCOPE_ID,
          scopeType: "blink",
          kind: "thread-created",
          title: "Thread seeded",
          detail: "Daily operations triage initialized.",
          minute: 31,
          threadId: "thread_home_daily_ops",
        }),
      ],
    }),
    createThread({
      id: "thread_home_supplier_contracts",
      scopeId: BLINK_SCOPE_ID,
      title: "Watch supplier contract renewals",
      summary: "Track upcoming renewal windows across service and supplier documents.",
      owner: "Blink",
      progress: 45,
      sectionKey: "tasks",
      minute: 36,
      tags: ["supplier", "renewals", "contracts"],
      messages: [
        message("msg_home_contracts_1", "assistant", "Northwind and Harbor SMS have renewals within 21 days.", 37),
        message("msg_home_contracts_2", "user", "Surface any auto-renew clauses in this thread.", 38),
      ],
      activity: [
        activity({
          id: "act_home_contracts_seed",
          scopeId: BLINK_SCOPE_ID,
          scopeType: "blink",
          kind: "operation",
          title: "Renewal watch seeded",
          detail: "Monitoring list created for top supplier contracts.",
          minute: 39,
          threadId: "thread_home_supplier_contracts",
        }),
      ],
    }),
    createThread({
      id: "thread_home_monthly_digest",
      scopeId: BLINK_SCOPE_ID,
      title: "Prepare monthly digest",
      summary: "Collect highlights from workspaces and compile a monthly operator digest.",
      owner: "Blink",
      progress: 28,
      sectionKey: "tasks",
      minute: 42,
      tags: ["digest", "reporting", "recap"],
      messages: [
        message("msg_home_digest_1", "assistant", "I drafted this month’s top wins and open risks.", 43),
      ],
      activity: [
        activity({
          id: "act_home_digest_seed",
          scopeId: BLINK_SCOPE_ID,
          scopeType: "blink",
          kind: "operation",
          title: "Digest draft started",
          detail: "Monthly digest shell prepared with workspace highlights.",
          minute: 44,
          threadId: "thread_home_monthly_digest",
        }),
      ],
    }),
  ];

  threads.push(...homeThreads);
  globalActivity.push(...homeThreads.flatMap((entry) => entry.activity));

  const homeDocuments = [
    createDocument({
      id: "doc_home_sms_provider",
      scopeId: null,
      kind: "service",
      category: "service",
      sectionKey: "services",
      title: "SMS Provider Subscription",
      summary: "Service relationship with Harbor SMS used for transactional notifications.",
      status: "active",
      owner: "Operations",
      participants: ["Ops Team", "Blink"],
      tags: ["sms", "provider", "service", "quota"],
      minute: 50,
      isService: true,
      details: {
        provider: "Harbor SMS",
        plan: "Business 50k",
        monthlyQuota: 50000,
        remainingQuota: 19240,
        renewalDate: "2026-04-02",
      },
      settingsBlocks: docSettings("Home", "Service", "active", ["Ops Team", "Blink"]),
      uiCards: documentActions([
        action(
          "doc_home_sms_send_test",
          "Send test message",
          "Test message sent",
          "Sent a test SMS to verify delivery and routing."
        ),
        action(
          "doc_home_sms_check_quota",
          "Check quota",
          "Quota checked",
          "Quota refreshed from latest provider snapshot."
        ),
        action(
          "doc_home_sms_pause",
          "Pause sending",
          "Sending paused",
          "Outbound SMS paused while reviewing provider limits.",
          "paused",
          "I paused SMS sends and added this to Home activity."
        ),
      ]),
      activity: [
        activity({
          id: "act_doc_home_sms_seed",
          scopeId: BLINK_SCOPE_ID,
          scopeType: "blink",
          kind: "document-created",
          title: "Service document seeded",
          detail: "SMS Provider Subscription loaded into Home services.",
          minute: 51,
          documentId: "doc_home_sms_provider",
        }),
      ],
    }),
    createDocument({
      id: "doc_home_nda_northwind",
      scopeId: null,
      kind: "shared-document",
      category: "relationship",
      sectionKey: "documents",
      title: "Shared NDA with Northwind Press",
      summary: "Participation NDA for editorial and campaign collaboration with Northwind Press.",
      status: "awaiting-participation",
      owner: "Legal Ops",
      participants: ["Northwind Press", "Alice", "Blink"],
      tags: ["northwind", "nda", "shared", "legal"],
      minute: 53,
      details: {
        counterparty: "Northwind Press",
        reviewWindow: "5 business days",
        jurisdiction: "NY",
      },
      settingsBlocks: docSettings("Home", "Shared document", "awaiting-participation", [
        "Northwind Press",
        "Alice",
        "Blink",
      ]),
      uiCards: documentActions([
        action(
          "doc_home_nda_accept",
          "Accept participation",
          "Participation accepted",
          "Accepted participation and enabled editing access.",
          "participating"
        ),
        action(
          "doc_home_nda_request_changes",
          "Request changes",
          "Change request sent",
          "Requested updates to confidentiality carve-outs.",
          "changes-requested"
        ),
        action(
          "doc_home_nda_mark_reviewed",
          "Mark reviewed",
          "Document reviewed",
          "Marked NDA as legally reviewed.",
          "reviewed"
        ),
      ]),
      activity: [
        activity({
          id: "act_doc_home_nda_seed",
          scopeId: BLINK_SCOPE_ID,
          scopeType: "blink",
          kind: "document-created",
          title: "Shared NDA imported",
          detail: "Northwind participation NDA added to Home documents.",
          minute: 54,
          documentId: "doc_home_nda_northwind",
        }),
      ],
    }),
    createDocument({
      id: "doc_home_partnership_draft",
      scopeId: null,
      kind: "draft-document",
      category: "task-artifact",
      sectionKey: "documents",
      title: "Partnership Proposal Draft",
      summary: "Draft proposal that combines shop and publishing partner opportunities.",
      status: "draft",
      owner: "Blink",
      participants: ["Blink", "Alice", "Bob"],
      tags: ["partnership", "proposal", "draft", "alice"],
      minute: 56,
      details: {
        openQuestions: 3,
        targetPartners: ["Northwind Home", "Local Florist Co-op"],
      },
      settingsBlocks: docSettings("Home", "Draft document", "draft", ["Blink", "Alice", "Bob"]),
      uiCards: documentActions([
        action(
          "doc_home_partnership_review",
          "Review draft",
          "Draft reviewed",
          "Completed editorial pass on partnership draft.",
          "in-review"
        ),
        action(
          "doc_home_partnership_share_bob",
          "Share with Bob",
          "Shared with Bob",
          "Shared proposal draft with Bob for pricing notes."
        ),
        action(
          "doc_home_partnership_archive",
          "Archive",
          "Draft archived",
          "Archived this proposal draft from active queue.",
          "archived"
        ),
      ]),
      activity: [
        activity({
          id: "act_doc_home_partnership_seed",
          scopeId: BLINK_SCOPE_ID,
          scopeType: "blink",
          kind: "document-created",
          title: "Proposal draft added",
          detail: "Partnership proposal draft is ready for review.",
          minute: 57,
          documentId: "doc_home_partnership_draft",
        }),
      ],
    }),
    createDocument({
      id: "doc_home_supplier_access",
      scopeId: null,
      kind: "access",
      category: "service",
      sectionKey: "services",
      title: "Supplier Access Grant",
      summary: "Managed access grant for shared supplier ordering systems.",
      status: "active",
      owner: "Security Ops",
      participants: ["Security Ops", "Supplier Ops", "Blink"],
      tags: ["supplier", "access", "token", "service"],
      minute: 59,
      isService: true,
      details: {
        grantType: "API token",
        tokenRotation: "every 30 days",
        lastRotation: "2026-03-08",
      },
      settingsBlocks: docSettings("Home", "Access/service relationship", "active", [
        "Security Ops",
        "Supplier Ops",
        "Blink",
      ]),
      uiCards: documentActions([
        action(
          "doc_home_supplier_view_permissions",
          "View permissions",
          "Permissions reviewed",
          "Reviewed current supplier permission matrix."
        ),
        action(
          "doc_home_supplier_rotate_token",
          "Rotate token",
          "Token rotated",
          "Generated and distributed a new supplier access token."
        ),
        action(
          "doc_home_supplier_suspend",
          "Suspend access",
          "Access suspended",
          "Suspended supplier integration access pending review.",
          "suspended"
        ),
      ]),
      activity: [
        activity({
          id: "act_doc_home_supplier_seed",
          scopeId: BLINK_SCOPE_ID,
          scopeType: "blink",
          kind: "document-created",
          title: "Supplier access grant added",
          detail: "Access relationship doc is now tracked in Home services.",
          minute: 60,
          documentId: "doc_home_supplier_access",
        }),
      ],
    }),
  ];

  documents.push(...homeDocuments);
  globalActivity.push(...homeDocuments.flatMap((entry) => entry.activity));

  const workspaceThreads = [
    createThread({
      id: "thread_alice_partnerships",
      scopeId: SCOPE_ALICE,
      title: "Accept incoming partnerships",
      summary: "Review and accept partnership requests that fit campaign goals.",
      owner: "Alice",
      progress: 54,
      sectionKey: "tasks",
      minute: 70,
      tags: ["alice", "partnerships", "review"],
      messages: [
        message("msg_alice_task_1", "assistant", "Two partnership pitches are waiting for a decision.", 71),
        message("msg_alice_task_2", "user", "Approve only the ones aligned with premium product bundles.", 72),
      ],
      activity: [
        activity({
          id: "act_thread_alice_partner_seed",
          scopeId: SCOPE_ALICE,
          scopeType: "workspace",
          kind: "thread-created",
          title: "Task seeded",
          detail: "Partnership acceptance queue opened.",
          minute: 73,
          threadId: "thread_alice_partnerships",
        }),
      ],
    }),
    createThread({
      id: "thread_alice_abandoned_carts",
      scopeId: SCOPE_ALICE,
      title: "Follow up abandoned carts",
      summary: "Recover at-risk orders with timed outreach and bundle reminders.",
      owner: "Alice",
      progress: 39,
      sectionKey: "tasks",
      minute: 74,
      tags: ["alice", "orders", "carts"],
      messages: [
        message("msg_alice_carts_1", "assistant", "There are 14 carts older than 48 hours.", 75),
      ],
      activity: [
        activity({
          id: "act_thread_alice_carts_seed",
          scopeId: SCOPE_ALICE,
          scopeType: "workspace",
          kind: "operation",
          title: "Recovery workflow seeded",
          detail: "Abandoned cart outreach cadence prepared.",
          minute: 76,
          threadId: "thread_alice_abandoned_carts",
        }),
      ],
    }),
    createThread({
      id: "thread_lake_quotes",
      scopeId: SCOPE_LAKE,
      title: "Collect reviewer quotes",
      summary: "Gather final pull quotes from early reviewers for launch materials.",
      owner: "Mina",
      progress: 66,
      sectionKey: "tasks",
      minute: 82,
      tags: ["review", "quotes", "lake"],
      messages: [message("msg_lake_quotes_1", "assistant", "Three reviewers sent usable quotes.", 83)],
      activity: [
        activity({
          id: "act_thread_lake_quotes_seed",
          scopeId: SCOPE_LAKE,
          scopeType: "workspace",
          kind: "thread-created",
          title: "Quote collection started",
          detail: "Reviewer quote pipeline established.",
          minute: 84,
          threadId: "thread_lake_quotes",
        }),
      ],
    }),
    createThread({
      id: "thread_lake_editor_feedback",
      scopeId: SCOPE_LAKE,
      title: "Coordinate editor feedback",
      summary: "Track line edits and chapter-level structural feedback from editor.",
      owner: "Mina",
      progress: 48,
      sectionKey: "tasks",
      minute: 85,
      tags: ["editor", "manuscript", "review"],
      messages: [message("msg_lake_editor_1", "assistant", "Editor requested tightening Chapter 7 transitions.", 86)],
      activity: [
        activity({
          id: "act_thread_lake_editor_seed",
          scopeId: SCOPE_LAKE,
          scopeType: "workspace",
          kind: "operation",
          title: "Editorial coordination active",
          detail: "Feedback routing assigned to manuscript owners.",
          minute: 87,
          threadId: "thread_lake_editor_feedback",
        }),
      ],
    }),
    createThread({
      id: "thread_sunset_staffing",
      scopeId: SCOPE_SUNSET,
      title: "Weekend staffing check",
      summary: "Confirm front-of-house and kitchen staffing before weekend service.",
      owner: "Marco",
      progress: 52,
      sectionKey: "tasks",
      minute: 92,
      tags: ["staffing", "weekend", "hiring"],
      messages: [message("msg_sunset_staff_1", "assistant", "Two shifts are still uncovered for Saturday evening.", 93)],
      activity: [
        activity({
          id: "act_thread_sunset_staff_seed",
          scopeId: SCOPE_SUNSET,
          scopeType: "workspace",
          kind: "thread-created",
          title: "Staffing check started",
          detail: "Weekend staffing checklist initialized.",
          minute: 94,
          threadId: "thread_sunset_staffing",
        }),
      ],
    }),
    createThread({
      id: "thread_sunset_reorder",
      scopeId: SCOPE_SUNSET,
      title: "Supplier reorder review",
      summary: "Review produce and beverage reorder thresholds for weekend demand.",
      owner: "Marco",
      progress: 41,
      sectionKey: "tasks",
      minute: 95,
      tags: ["supplier", "reorder", "restaurant"],
      messages: [message("msg_sunset_reorder_1", "assistant", "Produce reorder PO-77 is ready for approval.", 96)],
      activity: [
        activity({
          id: "act_thread_sunset_reorder_seed",
          scopeId: SCOPE_SUNSET,
          scopeType: "workspace",
          kind: "operation",
          title: "Reorder review opened",
          detail: "Supplier reorder packet queued for decision.",
          minute: 97,
          threadId: "thread_sunset_reorder",
        }),
      ],
    }),
  ];
  threads.push(...workspaceThreads);
  globalActivity.push(...workspaceThreads.flatMap((entry) => entry.activity));

  const workspaceDocuments = [
    createDocument({
      id: "doc_alice_order_1049",
      scopeId: SCOPE_ALICE,
      kind: "order",
      category: "operational",
      sectionKey: "orders",
      title: "Order #1049",
      summary: "Priority order awaiting shipping label confirmation.",
      status: "ready-to-ship",
      owner: "Alice",
      participants: ["Alice", "Fulfillment"],
      tags: ["alice", "order", "shipping"],
      minute: 100,
      details: { total: "$184.00", customer: "N. Allen", items: 3 },
      settingsBlocks: docSettings("Alice’s Shop", "Order", "ready-to-ship", ["Alice", "Fulfillment"]),
      uiCards: documentActions([
        action("doc_alice_1049_pack", "Confirm packing", "Packing confirmed", "Packing checklist completed."),
        action("doc_alice_1049_label", "Print label", "Label printed", "Shipping label generated."),
      ]),
      activity: [activity({
        id: "act_doc_alice_1049_seed",
        scopeId: SCOPE_ALICE,
        scopeType: "workspace",
        kind: "document-created",
        title: "Order document added",
        detail: "Order #1049 imported from storefront.",
        minute: 101,
        documentId: "doc_alice_order_1049",
      })],
    }),
    createDocument({
      id: "doc_alice_order_1050",
      scopeId: SCOPE_ALICE,
      kind: "order",
      category: "operational",
      sectionKey: "orders",
      title: "Order #1050",
      summary: "Gift bundle order waiting for inventory confirmation.",
      status: "inventory-check",
      owner: "Alice",
      participants: ["Alice", "Inventory"],
      tags: ["alice", "order", "inventory"],
      minute: 102,
      details: { total: "$96.00", customer: "P. Wong", items: 2 },
      settingsBlocks: docSettings("Alice’s Shop", "Order", "inventory-check", ["Alice", "Inventory"]),
      uiCards: documentActions([
        action("doc_alice_1050_verify", "Verify inventory", "Inventory verified", "Inventory availability confirmed."),
        action("doc_alice_1050_hold", "Place hold", "Order put on hold", "Order temporarily held pending stock."),
      ]),
      activity: [],
    }),
    createDocument({
      id: "doc_alice_order_1051",
      scopeId: SCOPE_ALICE,
      kind: "order",
      category: "operational",
      sectionKey: "orders",
      title: "Order #1051",
      summary: "Same-day order flagged for expedited processing.",
      status: "expedite",
      owner: "Alice",
      participants: ["Alice", "Fulfillment"],
      tags: ["alice", "order", "expedite"],
      minute: 103,
      details: { total: "$62.00", customer: "J. Carter", items: 1 },
      settingsBlocks: docSettings("Alice’s Shop", "Order", "expedite", ["Alice", "Fulfillment"]),
      uiCards: documentActions([
        action("doc_alice_1051_assign_runner", "Assign runner", "Runner assigned", "Fulfillment runner assigned."),
      ]),
      activity: [],
    }),
    createDocument({
      id: "doc_alice_product_summer_candle",
      scopeId: SCOPE_ALICE,
      kind: "product",
      category: "operational",
      sectionKey: "products",
      title: "Summer Candle",
      summary: "Seasonal candle line requiring final price confirmation.",
      status: "price-review",
      owner: "Alice",
      participants: ["Alice", "Product Team"],
      tags: ["alice", "product", "price"],
      minute: 104,
      details: { sku: "SC-2026", marginTarget: "54%" },
      settingsBlocks: docSettings("Alice’s Shop", "Product", "price-review", ["Alice", "Product Team"]),
      uiCards: documentActions([
        action("doc_alice_candle_confirm_price", "Confirm price", "Price confirmed", "Summer Candle pricing confirmed."),
        action("doc_alice_candle_publish", "Publish update", "Product update published", "Catalog update published."),
      ]),
      activity: [],
    }),
    createDocument({
      id: "doc_alice_product_bundle_refresh",
      scopeId: SCOPE_ALICE,
      kind: "product",
      category: "operational",
      sectionKey: "products",
      title: "Gift Bundle Refresh",
      summary: "Refresh proposal for best-selling gift bundle assortment.",
      status: "draft",
      owner: "Alice",
      participants: ["Alice", "Merchandising"],
      tags: ["alice", "bundle", "product"],
      minute: 105,
      details: { proposedBundles: 4, launchWindow: "April week 1" },
      settingsBlocks: docSettings("Alice’s Shop", "Product", "draft", ["Alice", "Merchandising"]),
      uiCards: documentActions([
        action("doc_alice_bundle_review", "Review bundle mix", "Bundle mix reviewed", "Bundle assortment reviewed."),
      ]),
      activity: [],
    }),
    createDocument({
      id: "doc_alice_partner_northwind_campaign",
      scopeId: SCOPE_ALICE,
      kind: "partnership",
      category: "relationship",
      sectionKey: "partnerships",
      title: "Northwind Home campaign pitch",
      summary: "Cross-channel campaign pitch with Northwind Home pending approval.",
      status: "awaiting-review",
      owner: "Alice",
      participants: ["Alice", "Northwind Home"],
      tags: ["alice", "northwind", "partnership"],
      minute: 106,
      details: { campaignWindow: "Q2", budgetAsk: "$8,500" },
      settingsBlocks: docSettings("Alice’s Shop", "Partnership", "awaiting-review", ["Alice", "Northwind Home"]),
      uiCards: documentActions([
        action("doc_alice_northwind_accept", "Accept pitch", "Pitch accepted", "Campaign pitch accepted and scheduled."),
        action("doc_alice_northwind_request_changes", "Request changes", "Changes requested", "Requested revisions to timeline."),
      ]),
      activity: [],
    }),
    createDocument({
      id: "doc_alice_partner_florist",
      scopeId: SCOPE_ALICE,
      kind: "partnership",
      category: "relationship",
      sectionKey: "partnerships",
      title: "Local florist cross-promo",
      summary: "Joint local promotion proposal for spring gifting campaign.",
      status: "in-negotiation",
      owner: "Alice",
      participants: ["Alice", "Local Florist Co-op"],
      tags: ["alice", "partnership", "florist"],
      minute: 107,
      details: { revenueSplit: "60/40 draft", launchDate: "2026-04-12" },
      settingsBlocks: docSettings("Alice’s Shop", "Partnership", "in-negotiation", ["Alice", "Local Florist Co-op"]),
      uiCards: documentActions([
        action("doc_alice_florist_finalize", "Finalize terms", "Terms finalized", "Cross-promo terms finalized."),
      ]),
      activity: [],
    }),
    createDocument({
      id: "doc_lake_chapter_7",
      scopeId: SCOPE_LAKE,
      kind: "manuscript",
      category: "content",
      sectionKey: "manuscript",
      title: "Chapter 7 draft",
      summary: "Latest manuscript chapter draft with editor annotations.",
      status: "editing",
      owner: "Mina",
      participants: ["Mina", "Editor"],
      tags: ["lake", "chapter", "review"],
      minute: 110,
      details: { wordCount: 6840, editsPending: 19 },
      settingsBlocks: docSettings("Lake Book Project", "Manuscript", "editing", ["Mina", "Editor"]),
      uiCards: documentActions([action("doc_lake_ch7_apply_edits", "Apply edits", "Edits applied", "Applied latest editor comments.")]),
      activity: [],
    }),
    createDocument({
      id: "doc_lake_structure_outline",
      scopeId: SCOPE_LAKE,
      kind: "manuscript",
      category: "content",
      sectionKey: "manuscript",
      title: "Final structure outline",
      summary: "Book structure outline used for final sequencing decisions.",
      status: "locked",
      owner: "Mina",
      participants: ["Mina", "Editor"],
      tags: ["lake", "outline", "structure"],
      minute: 111,
      details: { sections: 12, appendix: "included" },
      settingsBlocks: docSettings("Lake Book Project", "Manuscript", "locked", ["Mina", "Editor"]),
      uiCards: documentActions([action("doc_lake_outline_unlock", "Unlock for revision", "Outline unlocked", "Outline reopened for updates.", "editing")]),
      activity: [],
    }),
    createDocument({
      id: "doc_lake_review_packet_a",
      scopeId: SCOPE_LAKE,
      kind: "review",
      category: "content",
      sectionKey: "reviews",
      title: "Reviewer packet A",
      summary: "Review packet sent to early readers with guidance prompts.",
      status: "sent",
      owner: "Mina",
      participants: ["Mina", "Review Circle A"],
      tags: ["lake", "review", "packet"],
      minute: 112,
      details: { recipients: 8, dueDate: "2026-03-29" },
      settingsBlocks: docSettings("Lake Book Project", "Review", "sent", ["Mina", "Review Circle A"]),
      uiCards: documentActions([action("doc_lake_packet_remind", "Send reminder", "Reminder sent", "Review reminder sent to packet A.")]),
      activity: [],
    }),
    createDocument({
      id: "doc_lake_early_review_summary",
      scopeId: SCOPE_LAKE,
      kind: "review",
      category: "content",
      sectionKey: "reviews",
      title: "Early review summary",
      summary: "Condensed themes from early reviewer feedback.",
      status: "in-progress",
      owner: "Mina",
      participants: ["Mina", "Editor"],
      tags: ["lake", "review", "summary"],
      minute: 113,
      details: { positiveThemes: 4, concerns: 2 },
      settingsBlocks: docSettings("Lake Book Project", "Review", "in-progress", ["Mina", "Editor"]),
      uiCards: documentActions([action("doc_lake_review_publish", "Publish summary", "Summary published", "Early review summary published.", "published")]),
      activity: [],
    }),
    createDocument({
      id: "doc_lake_podcast_outreach",
      scopeId: SCOPE_LAKE,
      kind: "outreach",
      category: "content",
      sectionKey: "outreach",
      title: "Podcast outreach draft",
      summary: "Outreach copy for podcast guest appearance invitations.",
      status: "draft",
      owner: "Mina",
      participants: ["Mina", "PR"],
      tags: ["lake", "outreach", "podcast"],
      minute: 114,
      details: { targets: 12, personalization: "medium" },
      settingsBlocks: docSettings("Lake Book Project", "Outreach", "draft", ["Mina", "PR"]),
      uiCards: documentActions([action("doc_lake_outreach_send", "Send batch", "Outreach batch sent", "First podcast outreach batch sent.", "sent")]),
      activity: [],
    }),
    createDocument({
      id: "doc_lake_publisher_followup",
      scopeId: SCOPE_LAKE,
      kind: "outreach",
      category: "content",
      sectionKey: "outreach",
      title: "Publisher follow-up",
      summary: "Follow-up notes and timeline alignment with publisher contact.",
      status: "waiting-response",
      owner: "Mina",
      participants: ["Mina", "Publisher contact"],
      tags: ["lake", "publisher", "outreach"],
      minute: 115,
      details: { lastSent: "2026-03-18", responseSla: "3 days" },
      settingsBlocks: docSettings("Lake Book Project", "Outreach", "waiting-response", ["Mina", "Publisher contact"]),
      uiCards: documentActions([action("doc_lake_followup_ping", "Send follow-up", "Follow-up sent", "Publisher follow-up sent with updated timeline.")]),
      activity: [],
    }),
    createDocument({
      id: "doc_sunset_saturday_block",
      scopeId: SCOPE_SUNSET,
      kind: "reservation",
      category: "operational",
      sectionKey: "reservations",
      title: "Saturday reservations block",
      summary: "Reservation load plan for Saturday evening seating.",
      status: "capacity-review",
      owner: "Marco",
      participants: ["Marco", "Host Team"],
      tags: ["sunset", "reservation", "saturday"],
      minute: 118,
      details: { bookedSeats: 84, capacity: 96 },
      settingsBlocks: docSettings("Sunset Restaurant", "Reservation", "capacity-review", ["Marco", "Host Team"]),
      uiCards: documentActions([action("doc_sunset_sat_confirm", "Confirm layout", "Layout confirmed", "Saturday floor layout confirmed.")]),
      activity: [],
    }),
    createDocument({
      id: "doc_sunset_vip_request",
      scopeId: SCOPE_SUNSET,
      kind: "reservation",
      category: "operational",
      sectionKey: "reservations",
      title: "VIP dinner request",
      summary: "High-touch reservation request requiring menu and staffing alignment.",
      status: "pending-approval",
      owner: "Marco",
      participants: ["Marco", "Chef", "Host Lead"],
      tags: ["sunset", "vip", "reservation"],
      minute: 119,
      details: { guests: 12, date: "2026-03-28" },
      settingsBlocks: docSettings("Sunset Restaurant", "Reservation", "pending-approval", ["Marco", "Chef", "Host Lead"]),
      uiCards: documentActions([action("doc_sunset_vip_approve", "Approve request", "VIP request approved", "VIP dinner request approved.", "approved")]),
      activity: [],
    }),
    createDocument({
      id: "doc_sunset_po_77",
      scopeId: SCOPE_SUNSET,
      kind: "supplier",
      category: "operational",
      sectionKey: "suppliers",
      title: "Produce order PO-77",
      summary: "Produce reorder package for weekend inventory replenishment.",
      status: "ready",
      owner: "Marco",
      participants: ["Marco", "Produce Supplier"],
      tags: ["sunset", "supplier", "produce", "order"],
      minute: 120,
      details: { poNumber: "PO-77", total: "$1,420" },
      settingsBlocks: docSettings("Sunset Restaurant", "Supplier order", "ready", ["Marco", "Produce Supplier"]),
      uiCards: documentActions([action("doc_sunset_po77_submit", "Submit PO", "PO submitted", "Produce order PO-77 submitted.", "submitted")]),
      activity: [],
    }),
    createDocument({
      id: "doc_sunset_beverage_reorder",
      scopeId: SCOPE_SUNSET,
      kind: "supplier",
      category: "operational",
      sectionKey: "suppliers",
      title: "Beverage reorder",
      summary: "Beverage stock reorder for high-demand menu pairings.",
      status: "draft",
      owner: "Marco",
      participants: ["Marco", "Beverage Vendor"],
      tags: ["sunset", "supplier", "beverage", "reorder"],
      minute: 121,
      details: { skuCount: 18, reorderCycle: "weekly" },
      settingsBlocks: docSettings("Sunset Restaurant", "Supplier order", "draft", ["Marco", "Beverage Vendor"]),
      uiCards: documentActions([action("doc_sunset_bev_finalize", "Finalize reorder", "Reorder finalized", "Beverage reorder finalized.", "ready")]),
      activity: [],
    }),
    createDocument({
      id: "doc_sunset_chef_candidate",
      scopeId: SCOPE_SUNSET,
      kind: "hiring",
      category: "operational",
      sectionKey: "hiring",
      title: "Chef candidate packet",
      summary: "Candidate notes and trial shift assessment for lead chef role.",
      status: "interviewing",
      owner: "Marco",
      participants: ["Marco", "Hiring Panel"],
      tags: ["sunset", "hiring", "chef"],
      minute: 122,
      details: { candidate: "R. Delgado", stage: "trial shift" },
      settingsBlocks: docSettings("Sunset Restaurant", "Hiring", "interviewing", ["Marco", "Hiring Panel"]),
      uiCards: documentActions([action("doc_sunset_chef_move_offer", "Move to offer", "Candidate moved to offer", "Chef candidate advanced to offer stage.", "offer")]),
      activity: [],
    }),
    createDocument({
      id: "doc_sunset_foh_notes",
      scopeId: SCOPE_SUNSET,
      kind: "hiring",
      category: "operational",
      sectionKey: "hiring",
      title: "Front-of-house interview notes",
      summary: "Interview notes and scoring for front-of-house candidates.",
      status: "screening",
      owner: "Marco",
      participants: ["Marco", "Host Lead"],
      tags: ["sunset", "hiring", "front-of-house"],
      minute: 123,
      details: { candidates: 5, shortlisted: 2 },
      settingsBlocks: docSettings("Sunset Restaurant", "Hiring", "screening", ["Marco", "Host Lead"]),
      uiCards: documentActions([action("doc_sunset_foh_shortlist", "Finalize shortlist", "Shortlist finalized", "Front-of-house shortlist finalized.", "shortlisted")]),
      activity: [],
    }),
  ];

  documents.push(...workspaceDocuments);
  globalActivity.push(...workspaceDocuments.flatMap((entry) => entry.activity));

  const scopes: ScopeRecord[] = [
    {
      id: BLINK_SCOPE_ID,
      type: "blink",
      name: "Home",
      icon: "🏠",
      templateKey: null,
      description: "Account-level operational home. Blink helps you coordinate root work across scopes.",
      createdAt: at(0),
      updatedAt: at(180),
      coreDocumentId: null,
      coreSessionId: null,
      bootstrapStatus: "not-required",
      bootstrapError: null,
      anchors: ["#overview", "#tasks", "#documents", "#services", "#activity", "#settings"],
      assistant: {
        name: "Blink",
        tone: "Proactive, concise, and operations-first.",
        avatar: null,
      },
      recap: {
        headline: "Here’s what happened while you were away",
        updates: [
          "Alice’s Shop received 3 new orders and one partnership pitch needs review.",
          "Lake Book Project collected new reviewer notes on Chapter 7.",
          "Sunset Restaurant flagged a produce reorder and two open weekend shifts.",
          "SMS provider quota dropped below 40% for the month.",
        ],
        asks: [
          "Decide whether to approve Northwind participation terms.",
          "Confirm supplier contract renewal priorities for next week.",
        ],
      },
      sectionDefinitions: [
        { key: "overview", label: "Overview", kind: "overview" },
        { key: "tasks", label: "Tasks", kind: "tasks" },
        { key: "documents", label: "Documents", kind: "documents" },
        { key: "services", label: "Services", kind: "services" },
        { key: "activity", label: "Activity", kind: "activity" },
        { key: "settings", label: "Settings", kind: "settings" },
      ],
      settingsBlocks: [
        settingsBlock("home_playbook", "Home playbook", [
          { label: "Operating mode", value: "Daily recap + focused task follow-up" },
          { label: "Assistant identity", value: "Blink" },
        ]),
        settingsBlock("home_channels", "Channel placeholders", [
          { label: "Daily digest channel", value: "Configured (placeholder)" },
          { label: "Escalation channel", value: "Configured (placeholder)" },
        ]),
      ],
      searchKeywords: ["home", "blink", "operations", "root"],
      threadIds: homeThreads.map((entry) => entry.id),
      documentIds: homeDocuments.map((entry) => entry.id),
      activityIds: globalActivity.filter((entry) => entry.scopeId === BLINK_SCOPE_ID).map((entry) => entry.id),
      attentionItemIds: ["attn_home_northwind", "attn_home_supplier"],
      messages: [
        message("msg_home_chat_1", "assistant", "Welcome back. I summarized updates across Home and your workspaces.", 10),
        message("msg_home_chat_2", "assistant", "Northwind and supplier renewals need attention today.", 11),
        message("msg_home_chat_3", "user", "Keep track of partnership proposals at the root scope.", 12),
        message("msg_home_chat_4", "assistant", "Done — I linked proposal tracking to the Daily operations triage thread.", 13),
        message("msg_home_chat_5", "assistant", "I also flagged the SMS provider subscription because quota usage accelerated.", 14),
      ],
    },
    {
      id: SCOPE_ALICE,
      type: "workspace",
      name: "Alice’s Shop",
      icon: "🛍️",
      templateKey: "shop",
      description: "Retail operations workspace for orders, products, and partnerships.",
      createdAt: at(60),
      updatedAt: at(200),
      coreDocumentId: null,
      coreSessionId: null,
      bootstrapStatus: "ready",
      bootstrapError: null,
      anchors: ["#orders", "#products", "#partnerships", "#tasks"],
      assistant: {
        name: "Blink",
        tone: "Store-ops focused with tight prioritization.",
        avatar: null,
      },
      recap: {
        headline: "Alice’s Shop morning recap",
        updates: [
          "Three new orders arrived in the last cycle.",
          "Northwind Home campaign pitch is waiting for review.",
          "Summer Candle needs final price confirmation before publish.",
        ],
        asks: ["Approve partnership queue order.", "Confirm whether to expedite Order #1051."],
      },
      sectionDefinitions: [
        { key: "overview", label: "Overview", kind: "overview" },
        { key: "tasks", label: "Tasks", kind: "tasks" },
        { key: "orders", label: "Orders", kind: "domain" },
        { key: "products", label: "Products", kind: "domain" },
        { key: "partnerships", label: "Partnerships", kind: "domain" },
        { key: "activity", label: "Activity", kind: "activity" },
        { key: "settings", label: "Settings", kind: "settings" },
      ],
      settingsBlocks: [
        settingsBlock("alice_playbook", "Workspace playbook", [
          { label: "Priority order", value: "Orders → Partnerships → Products" },
          { label: "Escalate if", value: "Order at-risk > 4h" },
        ]),
      ],
      searchKeywords: ["alice", "shop", "orders", "products", "partnerships"],
      threadIds: ["thread_alice_partnerships", "thread_alice_abandoned_carts"],
      documentIds: workspaceDocuments.filter((entry) => entry.scopeId === SCOPE_ALICE).map((entry) => entry.id),
      activityIds: globalActivity.filter((entry) => entry.scopeId === SCOPE_ALICE).map((entry) => entry.id),
      attentionItemIds: ["attn_alice_partnership_review"],
      messages: [
        message("msg_alice_chat_1", "assistant", "Morning recap ready: orders are up and one partnership needs review.", 66),
        message("msg_alice_chat_2", "user", "Prioritize orders first, then partnership replies.", 67),
        message("msg_alice_chat_3", "assistant", "Got it. I reordered tasks and surfaced the pending campaign pitch.", 68),
        message("msg_alice_chat_4", "assistant", "Also, Summer Candle price confirmation is still open.", 69),
      ],
    },
    {
      id: SCOPE_LAKE,
      type: "workspace",
      name: "Lake Book Project",
      icon: "📘",
      templateKey: "generic-business",
      description: "Publishing workspace for manuscript, reviews, and outreach operations.",
      createdAt: at(78),
      updatedAt: at(220),
      coreDocumentId: null,
      coreSessionId: null,
      bootstrapStatus: "ready",
      bootstrapError: null,
      anchors: ["#manuscript", "#reviews", "#outreach", "#tasks"],
      assistant: {
        name: "Blink",
        tone: "Editorial and launch-minded.",
        avatar: null,
      },
      recap: {
        headline: "Lake Book Project recap",
        updates: [
          "Editor feedback arrived on Chapter 7 transitions.",
          "Reviewer packet A has 3 quote-ready responses.",
          "Podcast outreach draft is ready for first send.",
        ],
        asks: ["Approve reviewer quote shortlist.", "Decide if outreach batch should go out today."],
      },
      sectionDefinitions: [
        { key: "overview", label: "Overview", kind: "overview" },
        { key: "tasks", label: "Tasks", kind: "tasks" },
        { key: "manuscript", label: "Manuscript", kind: "domain" },
        { key: "reviews", label: "Reviews", kind: "domain" },
        { key: "outreach", label: "Outreach", kind: "domain" },
        { key: "activity", label: "Activity", kind: "activity" },
        { key: "settings", label: "Settings", kind: "settings" },
      ],
      settingsBlocks: [
        settingsBlock("lake_playbook", "Workspace playbook", [
          { label: "Editorial rhythm", value: "Daily edits, weekly consolidation" },
          { label: "Launch milestone", value: "Publisher handoff in 3 weeks" },
        ]),
      ],
      searchKeywords: ["lake", "book", "manuscript", "review", "outreach"],
      threadIds: ["thread_lake_quotes", "thread_lake_editor_feedback"],
      documentIds: workspaceDocuments.filter((entry) => entry.scopeId === SCOPE_LAKE).map((entry) => entry.id),
      activityIds: globalActivity.filter((entry) => entry.scopeId === SCOPE_LAKE).map((entry) => entry.id),
      attentionItemIds: ["attn_lake_editor_feedback"],
      messages: [
        message("msg_lake_chat_1", "assistant", "Editorial feedback and reviewer quotes are synced.", 80),
        message("msg_lake_chat_2", "assistant", "Chapter 7 flow is the biggest quality risk right now.", 81),
      ],
    },
    {
      id: SCOPE_SUNSET,
      type: "workspace",
      name: "Sunset Restaurant",
      icon: "🍽️",
      templateKey: "restaurant",
      description: "Restaurant workspace for reservations, suppliers, and hiring coordination.",
      createdAt: at(88),
      updatedAt: at(230),
      coreDocumentId: null,
      coreSessionId: null,
      bootstrapStatus: "ready",
      bootstrapError: null,
      anchors: ["#reservations", "#suppliers", "#hiring", "#tasks"],
      assistant: {
        name: "Blink",
        tone: "Hospitality-first and schedule-aware.",
        avatar: null,
      },
      recap: {
        headline: "Sunset Restaurant recap",
        updates: [
          "Saturday reservation block is near capacity.",
          "Produce order PO-77 is ready for submission.",
          "Weekend staffing still has two uncovered shifts.",
        ],
        asks: ["Approve VIP dinner request.", "Finalize staffing shortlist for FOH."],
      },
      sectionDefinitions: [
        { key: "overview", label: "Overview", kind: "overview" },
        { key: "tasks", label: "Tasks", kind: "tasks" },
        { key: "reservations", label: "Reservations", kind: "domain" },
        { key: "suppliers", label: "Suppliers", kind: "domain" },
        { key: "hiring", label: "Hiring", kind: "domain" },
        { key: "activity", label: "Activity", kind: "activity" },
        { key: "settings", label: "Settings", kind: "settings" },
      ],
      settingsBlocks: [
        settingsBlock("sunset_playbook", "Workspace playbook", [
          { label: "Service cadence", value: "Lunch + dinner with weekend surge mode" },
          { label: "Supplier check cadence", value: "Daily at 10:00" },
        ]),
      ],
      searchKeywords: ["sunset", "restaurant", "reservations", "suppliers", "hiring"],
      threadIds: ["thread_sunset_staffing", "thread_sunset_reorder"],
      documentIds: workspaceDocuments.filter((entry) => entry.scopeId === SCOPE_SUNSET).map((entry) => entry.id),
      activityIds: globalActivity.filter((entry) => entry.scopeId === SCOPE_SUNSET).map((entry) => entry.id),
      attentionItemIds: ["attn_sunset_staffing"],
      messages: [
        message("msg_sunset_chat_1", "assistant", "Reservation load and supplier reorder are both time-sensitive today.", 90),
        message("msg_sunset_chat_2", "assistant", "I pinned weekend staffing checks in tasks.", 91),
      ],
    },
  ];

  attentionItems.push(
    {
      id: "attn_home_northwind",
      scopeId: BLINK_SCOPE_ID,
      scopeType: "blink",
      status: "pending",
      title: "Northwind NDA needs a decision",
      body: "Choose accept participation or request changes before end of day.",
      priority: "high",
      relatedThreadId: "thread_home_daily_ops",
      relatedDocumentId: "doc_home_nda_northwind",
      createdAt: at(140),
      resolvedAt: null,
      delivery: { inApp: true, external: "queued" },
    },
    {
      id: "attn_home_supplier",
      scopeId: BLINK_SCOPE_ID,
      scopeType: "blink",
      status: "pending",
      title: "Supplier renewal watchlist updated",
      body: "Two supplier agreements expire within 3 weeks.",
      priority: "medium",
      relatedThreadId: "thread_home_supplier_contracts",
      relatedDocumentId: "doc_home_supplier_access",
      createdAt: at(142),
      resolvedAt: null,
      delivery: { inApp: true, external: "not-sent" },
    },
    {
      id: "attn_alice_partnership_review",
      scopeId: SCOPE_ALICE,
      scopeType: "workspace",
      status: "pending",
      title: "Partnership queue needs review",
      body: "Northwind Home campaign pitch is awaiting response.",
      priority: "medium",
      relatedThreadId: "thread_alice_partnerships",
      relatedDocumentId: "doc_alice_partner_northwind_campaign",
      createdAt: at(150),
      resolvedAt: null,
      delivery: { inApp: true, external: "not-sent" },
    },
    {
      id: "attn_lake_editor_feedback",
      scopeId: SCOPE_LAKE,
      scopeType: "workspace",
      status: "pending",
      title: "Editor feedback unresolved",
      body: "Chapter 7 transitions need an explicit revision plan.",
      priority: "medium",
      relatedThreadId: "thread_lake_editor_feedback",
      relatedDocumentId: "doc_lake_chapter_7",
      createdAt: at(152),
      resolvedAt: null,
      delivery: { inApp: true, external: "not-sent" },
    },
    {
      id: "attn_sunset_staffing",
      scopeId: SCOPE_SUNSET,
      scopeType: "workspace",
      status: "pending",
      title: "Weekend staffing gap",
      body: "Two evening shifts remain unassigned.",
      priority: "high",
      relatedThreadId: "thread_sunset_staffing",
      relatedDocumentId: "doc_sunset_foh_notes",
      createdAt: at(154),
      resolvedAt: null,
      delivery: { inApp: true, external: "queued" },
    }
  );

  globalActivity.push(
    activity({
      id: "act_home_seed_initialized",
      scopeId: BLINK_SCOPE_ID,
      scopeType: "blink",
      kind: "operation",
      title: "Home snapshot initialized",
      detail: "Seeded Home scope with recap, tasks, documents, and services.",
      minute: 20,
    }),
    activity({
      id: "act_alice_seed_initialized",
      scopeId: SCOPE_ALICE,
      scopeType: "workspace",
      kind: "operation",
      title: "Workspace snapshot initialized",
      detail: "Alice’s Shop seeded with orders, products, and partnerships.",
      minute: 79,
    }),
    activity({
      id: "act_lake_seed_initialized",
      scopeId: SCOPE_LAKE,
      scopeType: "workspace",
      kind: "operation",
      title: "Workspace snapshot initialized",
      detail: "Lake Book Project seeded with manuscript, reviews, and outreach.",
      minute: 89,
    }),
    activity({
      id: "act_sunset_seed_initialized",
      scopeId: SCOPE_SUNSET,
      scopeType: "workspace",
      kind: "operation",
      title: "Workspace snapshot initialized",
      detail: "Sunset Restaurant seeded with reservations, suppliers, and hiring.",
      minute: 99,
    })
  );

  const scopeMap = new Map(scopes.map((entry) => [entry.id, entry]));
  const threadsByScope = new Map<string, ThreadRecord[]>();
  const docsByScope = new Map<string, DocumentRecord[]>();
  const activityByScope = new Map<string, ActivityRecord[]>();

  for (const thread of threads) {
    const list = threadsByScope.get(thread.scopeId) ?? [];
    list.push(thread);
    threadsByScope.set(thread.scopeId, list);
  }

  for (const document of documents) {
    const docScope = document.scopeId ?? BLINK_SCOPE_ID;
    const list = docsByScope.get(docScope) ?? [];
    list.push(document);
    docsByScope.set(docScope, list);
  }

  for (const entry of globalActivity) {
    const list = activityByScope.get(entry.scopeId) ?? [];
    list.push(entry);
    activityByScope.set(entry.scopeId, list);
  }

  for (const scope of scopes) {
    const current = scopeMap.get(scope.id);
    if (!current) {
      continue;
    }
    current.threadIds = (threadsByScope.get(scope.id) ?? []).map((entry) => entry.id);
    current.documentIds = (docsByScope.get(scope.id) ?? []).map((entry) => entry.id);
    current.activityIds = (activityByScope.get(scope.id) ?? []).map((entry) => entry.id);
  }

  return {
    scopes,
    threads,
    documents,
    attentionItems,
    activity: globalActivity.sort((left, right) => right.createdAt.localeCompare(left.createdAt)),
  };
}
