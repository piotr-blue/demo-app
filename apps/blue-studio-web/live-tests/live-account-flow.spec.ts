import { describe, expect, it } from "vitest";
import { POST as liveAssistantPost } from "@/app/api/demo/live-assistant/stream/route";
import { POST as liveDocumentCreatePost } from "@/app/api/demo/live-documents/create/route";

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
              name: `Live Route Test ${Date.now()}`,
              description: "Minimal live document created by live test.",
            },
          }),
        })
      );
      const createPayload = (await createResponse.json()) as
        | {
            ok: true;
            sessionId: string | null;
            myosDocumentId: string | null;
            created: { name: string; description: string };
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
