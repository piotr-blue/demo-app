import { describe, expect, it } from "vitest";
import { POST as liveAssistantPost } from "@/app/api/demo/live-assistant/stream/route";
import { POST as liveDocumentCreatePost } from "@/app/api/demo/live-documents/create/route";
import { POST as liveDocumentRetrievePost } from "@/app/api/demo/live-documents/retrieve/route";
import { POST as liveDocumentsListPost } from "@/app/api/demo/live-documents/list/route";

const openAiApiKey = process.env.OPENAI_API_KEY;
const myOsApiKey = process.env.MYOS_API_KEY;
const myOsAccountId = process.env.MYOS_ACCOUNT_ID;
const myOsBaseUrl = process.env.MYOS_BASE_URL ?? "https://api.dev.myos.blue/";

const liveEnabled = Boolean(openAiApiKey && myOsApiKey && myOsAccountId);
const suite = liveEnabled ? describe : describe.skip;

function buildCredentials() {
  return {
    openAiApiKey: openAiApiKey!,
    myOsApiKey: myOsApiKey!,
    myOsAccountId: myOsAccountId!,
    myOsBaseUrl,
  };
}

type AssistantMessage = {
  role: "assistant" | "user" | "system";
  body: string;
  createdAt: string;
};

type AssistantDocTurn = {
  t: "doc";
  summ: string;
  doc: {
    kind: string;
    name: string;
    description: string;
    fields: Record<string, string>;
    anchors: Array<{ key: string; label: string; purpose: string }>;
  };
  link: { parentDocumentId: string; anchorKey: string } | null;
};

function readFinalTurnFromSse(text: string): Record<string, unknown> | null {
  const lines = text.split("\n");
  let currentEvent = "";
  for (const line of lines) {
    if (line.startsWith("event:")) {
      currentEvent = line.replace("event:", "").trim();
      continue;
    }
    if (currentEvent === "final" && line.startsWith("data:")) {
      try {
        const payload = JSON.parse(line.replace("data:", "").trim()) as {
          turn?: Record<string, unknown>;
        };
        return payload.turn ?? null;
      } catch {
        return null;
      }
    }
  }
  return null;
}

function asDocTurn(value: unknown): AssistantDocTurn | null {
  if (!value || typeof value !== "object") {
    return null;
  }
  const record = value as Record<string, unknown>;
  if (record.t !== "doc" || typeof record.summ !== "string") {
    return null;
  }
  const doc = record.doc;
  if (!doc || typeof doc !== "object") {
    return null;
  }
  const docRecord = doc as Record<string, unknown>;
  if (
    typeof docRecord.kind !== "string" ||
    typeof docRecord.name !== "string" ||
    typeof docRecord.description !== "string" ||
    typeof docRecord.fields !== "object" ||
    !Array.isArray(docRecord.anchors)
  ) {
    return null;
  }
  const fields = docRecord.fields as Record<string, unknown>;
  const anchors = docRecord.anchors
    .filter((entry): entry is Record<string, unknown> => typeof entry === "object" && entry !== null)
    .map((entry) => ({
      key: typeof entry.key === "string" ? entry.key : "",
      label: typeof entry.label === "string" ? entry.label : "",
      purpose: typeof entry.purpose === "string" ? entry.purpose : "",
    }))
    .filter((entry) => entry.key && entry.label && entry.purpose);

  const linkValue = record.link;
  const link =
    linkValue && typeof linkValue === "object"
      ? (() => {
          const linkRecord = linkValue as Record<string, unknown>;
          if (
            typeof linkRecord.parentDocumentId === "string" &&
            typeof linkRecord.anchorKey === "string"
          ) {
            return {
              parentDocumentId: linkRecord.parentDocumentId,
              anchorKey: linkRecord.anchorKey,
            };
          }
          return null;
        })()
      : null;

  return {
    t: "doc",
    summ: record.summ,
    doc: {
      kind: docRecord.kind,
      name: docRecord.name,
      description: docRecord.description,
      fields: Object.fromEntries(
        Object.entries(fields)
          .filter(([, entry]) => typeof entry === "string")
          .map(([key, entry]) => [key, String(entry)])
      ),
      anchors,
    },
    link,
  };
}

function buildReplyForQuestion(question: string): string {
  const normalized = question.toLowerCase();
  if (normalized.includes("name")) {
    return `Morning Brew Shop ${Date.now()}`;
  }
  if (normalized.includes("description")) {
    return "Shop workspace to manage products, opportunities, and orders.";
  }
  if (normalized.includes("anchor")) {
    return "orders";
  }
  if (normalized.includes("customer")) {
    return "Bob Nowak";
  }
  if (normalized.includes("total")) {
    return "18.50 USD";
  }
  return "Proceed with sensible defaults and use the orders anchor.";
}

async function requestAssistantTurn(params: {
  credentials: ReturnType<typeof buildCredentials>;
  target: { type: "home" | "document"; id: string; title: string };
  exchangeId: string;
  userInput: string;
  messages: AssistantMessage[];
  liveDocuments: Array<{ id: string; title: string; summary: string; status: string }>;
  documentContext?: {
    currentDocument: {
      id: string;
      kind: string;
      title: string;
      summary: string;
      fields: Record<string, string>;
      anchors: Array<{ key: string; label: string; purpose: string }>;
    };
    recentMessages: AssistantMessage[];
  } | null;
}): Promise<Record<string, unknown>> {
  const response = await liveAssistantPost(
    new Request("http://localhost/api/demo/live-assistant/stream", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        credentials: {
          openAiApiKey: params.credentials.openAiApiKey,
        },
        account: {
          id: "account_piotr_blue",
          name: "piotr-blue",
          mode: "live",
        },
        target: params.target,
        conversation: {
          id: `live-proof-${params.exchangeId}`,
          exchangeId: params.exchangeId,
          messages: params.messages,
        },
        liveDocuments: params.liveDocuments,
        documentContext: params.documentContext ?? null,
        userInput: params.userInput,
      }),
    })
  );
  expect(response.status).toBe(200);
  const raw = await response.text();
  const turn = readFinalTurnFromSse(raw);
  expect(turn).toBeTruthy();
  if (!turn) {
    throw new Error("Expected assistant turn in SSE response.");
  }
  return turn;
}

async function runAssistantUntilDoc(params: {
  credentials: ReturnType<typeof buildCredentials>;
  target: { type: "home" | "document"; id: string; title: string };
  exchangeIdPrefix: string;
  firstInput: string;
  liveDocuments: Array<{ id: string; title: string; summary: string; status: string }>;
  documentContext?: {
    currentDocument: {
      id: string;
      kind: string;
      title: string;
      summary: string;
      fields: Record<string, string>;
      anchors: Array<{ key: string; label: string; purpose: string }>;
    };
    recentMessages: AssistantMessage[];
  } | null;
}): Promise<AssistantDocTurn> {
  const messages: AssistantMessage[] = [];
  let userInput = params.firstInput;
  for (let step = 0; step < 5; step += 1) {
    messages.push({
      role: "user",
      body: userInput,
      createdAt: new Date().toISOString(),
    });
    const turn = await requestAssistantTurn({
      credentials: params.credentials,
      target: params.target,
      exchangeId: `${params.exchangeIdPrefix}_${step + 1}`,
      userInput,
      messages,
      liveDocuments: params.liveDocuments,
      documentContext: params.documentContext ?? null,
    });
    const parsedDocTurn = asDocTurn(turn);
    if (parsedDocTurn) {
      return parsedDocTurn;
    }
    if (turn.t !== "more" || typeof turn.q !== "string") {
      throw new Error(`Expected 'more' or 'doc' turn, received ${JSON.stringify(turn)}.`);
    }
    messages.push({
      role: "assistant",
      body: turn.q,
      createdAt: new Date().toISOString(),
    });
    userInput = buildReplyForQuestion(turn.q);
  }
  throw new Error("Assistant did not produce doc turn within follow-up budget.");
}

suite("mandatory live proof flow (shop -> linked order)", () => {
  it(
    "creates shop with orders anchor then linked order and prints order details with sessionId",
    async () => {
      const credentials = buildCredentials();

      // 1) Root Blink creates shop-like document with orders anchor.
      const rootDocTurn = await runAssistantUntilDoc({
        credentials,
        target: {
          type: "home",
          id: "account_piotr_blue",
          title: "Home",
        },
        exchangeIdPrefix: "proof_root",
        firstInput:
          "Create a shop document for Morning Brew with anchors including orders and opportunities.",
        liveDocuments: [],
      });

      expect(rootDocTurn.doc.kind.toLowerCase()).toContain("shop");
      expect(rootDocTurn.link).toBeNull();
      expect(
        rootDocTurn.doc.anchors.some(
          (anchor) => anchor.key.toLowerCase() === "orders" || anchor.label.toLowerCase() === "orders"
        )
      ).toBe(true);

      const shopCreateResponse = await liveDocumentCreatePost(
        new Request("http://localhost/api/demo/live-documents/create", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            credentials,
            doc: rootDocTurn.doc,
            link: rootDocTurn.link,
          }),
        })
      );
      expect(shopCreateResponse.status).toBe(200);
      const shopPayload = (await shopCreateResponse.json()) as {
        ok: boolean;
        sessionId: string | null;
        created: {
          kind: string;
          name: string;
          description: string;
          fields: Record<string, string>;
          anchors: Array<{ key: string; label: string; purpose: string }>;
        };
        mappedDocument: { id: string; title: string; summary: string; status: string } | null;
      };
      expect(shopPayload.ok).toBe(true);
      expect(shopPayload.sessionId).toBeTruthy();
      expect(shopPayload.created.anchors.some((anchor) => anchor.key === "orders")).toBe(true);
      expect(shopPayload.mappedDocument?.id).toBeTruthy();
      if (!shopPayload.sessionId || !shopPayload.mappedDocument) {
        throw new Error("Expected created shop sessionId and mapped document.");
      }

      // 2) Document Blink creates linked order child in orders anchor.
      const orderDocTurn = await runAssistantUntilDoc({
        credentials,
        target: {
          type: "document",
          id: shopPayload.mappedDocument.id,
          title: shopPayload.created.name,
        },
        exchangeIdPrefix: "proof_doc",
        firstInput:
          "Create an order for Bob Nowak and link it to the orders anchor of this shop.",
        liveDocuments: [
          {
            id: shopPayload.mappedDocument.id,
            title: shopPayload.mappedDocument.title,
            summary: shopPayload.mappedDocument.summary,
            status: shopPayload.mappedDocument.status,
          },
        ],
        documentContext: {
          currentDocument: {
            id: shopPayload.mappedDocument.id,
            kind: shopPayload.created.kind,
            title: shopPayload.created.name,
            summary: shopPayload.created.description,
            fields: shopPayload.created.fields,
            anchors: shopPayload.created.anchors,
          },
          recentMessages: [],
        },
      });

      expect(orderDocTurn.doc.kind.toLowerCase()).toContain("order");
      expect(orderDocTurn.link).toBeTruthy();
      expect(orderDocTurn.link?.anchorKey.toLowerCase()).toBe("orders");

      const orderCreateResponse = await liveDocumentCreatePost(
        new Request("http://localhost/api/demo/live-documents/create", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            credentials,
            doc: orderDocTurn.doc,
            link:
              orderDocTurn.link ??
              ({
                parentDocumentId: shopPayload.mappedDocument.id,
                anchorKey: "orders",
              } as const),
          }),
        })
      );
      expect(orderCreateResponse.status).toBe(200);
      const orderPayload = (await orderCreateResponse.json()) as {
        ok: boolean;
        sessionId: string | null;
        created: {
          kind: string;
          name: string;
          description: string;
          fields: Record<string, string>;
        };
        linked: Array<{
          anchorKey: string;
          childSessionId: string;
          childDocumentId: string;
          linkSessionId: string | null;
        }>;
      };
      expect(orderPayload.ok).toBe(true);
      expect(orderPayload.sessionId).toBeTruthy();
      expect(orderPayload.linked.some((entry) => entry.anchorKey === "orders")).toBe(true);
      if (!orderPayload.sessionId) {
        throw new Error("Expected child order sessionId.");
      }

      // 3) Retrieve parent and verify order appears in orders anchor links.
      const parentRetrieveResponse = await liveDocumentRetrievePost(
        new Request("http://localhost/api/demo/live-documents/retrieve", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            credentials,
            sessionId: shopPayload.sessionId,
            accountId: "account_piotr_blue",
            accountName: "piotr-blue",
          }),
        })
      );
      expect(parentRetrieveResponse.status).toBe(200);
      const parentRetrievePayload = (await parentRetrieveResponse.json()) as {
        ok: boolean;
        linked: Array<{ anchorKey: string; childSessionId: string }>;
      };
      expect(parentRetrievePayload.ok).toBe(true);
      expect(
        parentRetrievePayload.linked.some(
          (entry) => entry.anchorKey === "orders" && entry.childSessionId === orderPayload.sessionId
        )
      ).toBe(true);

      const orderRetrieveResponse = await liveDocumentRetrievePost(
        new Request("http://localhost/api/demo/live-documents/retrieve", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            credentials,
            sessionId: orderPayload.sessionId,
            accountId: "account_piotr_blue",
            accountName: "piotr-blue",
          }),
        })
      );
      expect(orderRetrieveResponse.status).toBe(200);
      const orderRetrievePayload = (await orderRetrieveResponse.json()) as {
        ok: boolean;
        sessionId: string;
        mappedDocument: {
          id: string;
          title: string;
          kind: string;
          summary: string;
          coreFields: Array<{ label: string; value: string }>;
        } | null;
      };
      expect(orderRetrievePayload.ok).toBe(true);
      expect(orderRetrievePayload.mappedDocument).toBeTruthy();

      const listResponse = await liveDocumentsListPost(
        new Request("http://localhost/api/demo/live-documents/list", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            credentials,
            ownerAccountId: "account_piotr_blue",
            ownerName: "piotr-blue",
            pageSize: 100,
          }),
        })
      );
      expect(listResponse.status).toBe(200);
      const listPayload = (await listResponse.json()) as {
        ok: boolean;
        documents: Array<{ id: string; sessionId?: string | null }>;
      };
      expect(listPayload.ok).toBe(true);
      expect(
        listPayload.documents.some((entry) => (entry.sessionId ?? null) === orderPayload.sessionId)
      ).toBe(true);

      console.log(
        "MANDATORY_PROOF_ORDER_DETAILS",
        JSON.stringify(
          {
            sessionId: orderRetrievePayload.sessionId,
            document: orderRetrievePayload.mappedDocument,
          },
          null,
          2
        )
      );
    },
    300_000
  );
});
