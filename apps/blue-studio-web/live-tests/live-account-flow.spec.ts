import { describe, expect, it } from "vitest";
import { POST as liveAssistantPost } from "@/app/api/demo/live-assistant/stream/route";
import { POST as liveDocumentCreatePost } from "@/app/api/demo/live-documents/create/route";
import { resolveLiveCredentials } from "@/test-utils/live-credentials";

const resolved = resolveLiveCredentials();
const liveEnabled = Boolean(resolved.credentials);
const suite = liveEnabled ? describe : describe.skip;

function buildCredentials() {
  if (!resolved.credentials) {
    throw new Error(
      `Missing live credentials: ${resolved.missing.join(", ")}. Checked env and optional file ${resolved.filePath}`
    );
  }
  return {
    openAiApiKey: resolved.credentials.openAiApiKey,
    myOsApiKey: resolved.credentials.myOsApiKey,
    myOsAccountId: resolved.credentials.myOsAccountId,
    myOsBaseUrl: resolved.credentials.myOsBaseUrl,
  };
}

async function readSseText(response: Response): Promise<string> {
  const text = await response.text();
  return text;
}

function readFinalTurnFromSse(text: string): Record<string, unknown> | null {
  const lines = text.split("\n");
  let currentEvent = "";
  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index] ?? "";
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

suite("live account assistant + document creation routes", () => {
  it(
    "returns structured assistant answer and creates a real live document",
    async () => {
      const credentials = buildCredentials();

      const assistantResponse = await liveAssistantPost(
        new Request("http://localhost/api/demo/live-assistant/stream", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            credentials: {
              openAiApiKey: credentials.openAiApiKey,
            },
            account: {
              id: "account_piotr_blue",
              name: "piotr-blue",
              mode: "live",
            },
            target: {
              type: "home",
              id: "account_piotr_blue",
              title: "Home",
            },
            conversation: {
              id: "aconv_live_test",
              exchangeId: "aex_live_test_1",
              messages: [
                {
                  role: "user",
                  body: "what is the capital of Poland",
                  createdAt: new Date().toISOString(),
                },
              ],
            },
            liveDocuments: [],
            documentContext: null,
            userInput: "what is the capital of Poland",
          }),
        })
      );
      expect(assistantResponse.status).toBe(200);
      const assistantSse = await readSseText(assistantResponse);
      const finalTurn = readFinalTurnFromSse(assistantSse);
      expect(finalTurn).toBeTruthy();
      expect(finalTurn?.t).toBeTypeOf("string");
      expect(["ans", "more", "doc"]).toContain(finalTurn?.t);

      const createResponse = await liveDocumentCreatePost(
        new Request("http://localhost/api/demo/live-documents/create", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            credentials,
            doc: {
              kind: "note",
              name: `Live Route Test ${Date.now()}`,
              description: "Minimal live document created by live test.",
              fields: {},
              anchors: [],
            },
            link: null,
          }),
        })
      );
      const createPayload = (await createResponse.json()) as
        | {
            ok: true;
            sessionId: string | null;
            myosDocumentId: string | null;
            created: {
              kind: string;
              name: string;
              description: string;
              fields: Record<string, string>;
              anchors: Array<{ key: string; label: string; purpose: string }>;
            };
          }
        | { ok: false; error: string };

      expect(createResponse.status).toBe(200);
      expect(createPayload.ok).toBe(true);
      if (!createPayload.ok) {
        return;
      }
      expect(createPayload.created.name.length).toBeGreaterThan(5);
      expect(createPayload.created.description).toContain("Minimal live document");
      expect(createPayload.sessionId).toBeTruthy();
    },
    180_000
  );
});
