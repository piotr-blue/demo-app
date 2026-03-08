import { describe, expect, it } from "vitest";
import { POST as chatPost } from "@/app/api/chat/route";
import { POST as continuePost } from "@/app/api/dsl/continue/route";
import { POST as bootstrapPost } from "@/app/api/myos/bootstrap/route";
import { POST as retrievePost } from "@/app/api/myos/retrieve/route";
import { POST as statusTemplatesPost } from "@/app/api/document/status-templates/route";
import { POST as documentQaPost } from "@/app/api/document/qa/route";

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

function extractStreamText(raw: string): string {
  const matches = [...raw.matchAll(/"delta":"([^"]*)"/g)];
  const decoded = matches
    .map((match) => match[1] ?? "")
    .join("")
    .replace(/\\n/g, "\n")
    .replace(/\\"/g, '"')
    .replace(/\\\\/g, "\\");
  return decoded.trim();
}

suite("live counter flow via app routes", () => {
  it(
    "runs blueprint -> dsl -> bootstrap -> retrieve running document",
    async () => {
      const credentials = buildCredentials();

      let qaPairs: Array<{ question: string; answer: string }> = [];
      let currentBlueprint: string | null = null;

      for (let round = 0; round < 3; round += 1) {
        const promptText =
          round === 0
            ? "Create a counter document with owner channel. It should start at 0 and support increment and reset operations."
            : "ownerChannel should be the only participant allowed to increment or reset.";

        const chatResponse = await chatPost(
          new Request("http://localhost/api/chat", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({
              messages: [
                {
                  id: `u_${round}`,
                  role: "user",
                  parts: [{ type: "text", text: promptText }],
                },
              ],
              credentials,
              attachments: [],
              qaPairs,
              currentBlueprint,
            }),
          })
        );

        expect(chatResponse.status).toBe(200);
        const raw = await chatResponse.text();
        const text = extractStreamText(raw);

        if (/STATE:\s*ready/i.test(text)) {
          currentBlueprint = text;
          break;
        }

        const questionMatch = text.match(/QUESTION:\s*(.*)$/im);
        const question = questionMatch?.[1]?.trim() ?? text.trim();
        qaPairs = [
          ...qaPairs,
          {
            question,
            answer: "Use ownerChannel for all operations.",
          },
        ];
      }

      expect(currentBlueprint).toContain("STATE: ready");

      const continueResponse = await continuePost(
        new Request("http://localhost/api/dsl/continue", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            credentials,
            blueprint: currentBlueprint,
            attachments: [],
          }),
        })
      );
      const continueRaw = await continueResponse.text();
      expect(continueResponse.status, continueRaw).toBe(200);
      const continuePayload = JSON.parse(continueRaw) as {
        ok: boolean;
        documentJson: Record<string, unknown>;
        bindings: Array<{
          channelName: string;
          mode: "email" | "accountId";
          value: string;
          timelineId?: string;
        }>;
      };
      expect(continuePayload.ok).toBe(true);

      const bindings = continuePayload.bindings.map((binding) => ({
        ...binding,
        mode: "accountId" as const,
        value: myOsAccountId!,
      }));

      const bootstrapResponse = await bootstrapPost(
        new Request("http://localhost/api/myos/bootstrap", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            credentials,
            documentJson: continuePayload.documentJson,
            bindings,
          }),
        })
      );

      expect(bootstrapResponse.status).toBe(200);
      const bootstrapPayload = (await bootstrapResponse.json()) as {
        ok: boolean;
        sessionId: string | null;
      };
      expect(bootstrapPayload.ok).toBe(true);
      expect(bootstrapPayload.sessionId).toBeTruthy();

      let running = false;
      let latestRetrieved: Record<string, unknown> | null = null;
      for (let attempt = 0; attempt < 60; attempt += 1) {
        const retrieveResponse = await retrievePost(
          new Request("http://localhost/api/myos/retrieve", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({
              credentials,
              sessionId: bootstrapPayload.sessionId,
            }),
          })
        );

        if (retrieveResponse.status !== 200) {
          await new Promise((resolve) => setTimeout(resolve, 1_000));
          continue;
        }

        const retrievePayload = (await retrieveResponse.json()) as {
          ok: boolean;
          retrieved: Record<string, unknown>;
        };
        const allowedOperations = Array.isArray(retrievePayload.retrieved.allowedOperations)
          ? retrievePayload.retrieved.allowedOperations.map((value) => String(value))
          : [];
        const processingStatus =
          typeof retrievePayload.retrieved.processingStatus === "string"
            ? retrievePayload.retrieved.processingStatus
            : typeof retrievePayload.retrieved.status === "string"
              ? retrievePayload.retrieved.status
              : "";
        const hasDocument =
          typeof retrievePayload.retrieved.document === "object" &&
          retrievePayload.retrieved.document !== null;

        if (
          allowedOperations.includes("increment") ||
          /running/i.test(processingStatus) ||
          hasDocument
        ) {
          running = true;
          latestRetrieved = retrievePayload.retrieved;
          break;
        }

        await new Promise((resolve) => setTimeout(resolve, 1_000));
      }

      expect(running).toBe(true);
      expect(latestRetrieved).toBeTruthy();

      const statusTemplatesResponse = await statusTemplatesPost(
        new Request("http://localhost/api/document/status-templates", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            credentials,
            blueprint: currentBlueprint,
            viewer: "ownerChannel",
          }),
        })
      );
      const statusTemplatesPayload = (await statusTemplatesResponse.json()) as {
        ok: boolean;
        bundle?: { templates: unknown[] };
      };
      expect(statusTemplatesResponse.status).toBe(200);
      expect(statusTemplatesPayload.ok).toBe(true);
      expect((statusTemplatesPayload.bundle?.templates ?? []).length).toBeGreaterThan(0);

      const qaResponse = await documentQaPost(
        new Request("http://localhost/api/document/qa", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            credentials,
            blueprint: currentBlueprint,
            viewer: "ownerChannel",
            question: "What can this document do?",
            state: latestRetrieved?.document ?? null,
            allowedOperations: Array.isArray(latestRetrieved?.allowedOperations)
              ? latestRetrieved?.allowedOperations
              : [],
          }),
        })
      );
      const qaPayload = (await qaResponse.json()) as {
        ok: boolean;
        answer?: string;
        mode?: string;
      };
      expect(qaResponse.status).toBe(200);
      expect(qaPayload.ok).toBe(true);
      expect((qaPayload.answer ?? "").length).toBeGreaterThan(0);
      expect(qaPayload.mode).toBe("live-state");
    },
    180_000
  );
});
