import { expect, test } from "@playwright/test";
import { buildBlueprintReadyStream, uiMessageStreamHeaders } from "./utils/chat-stream";

const BLUEPRINT = `STATE: ready
TYPE: Document
BLUEPRINT: Live Counter
SUMMARY: Counter with live status updates.
PARTICIPANTS:
  - ownerChannel — owner`;

test("simulated webhook SSE invalidation refreshes matching thread status", async ({ page }) => {
  await page.route("**/api/chat", async (route) => {
    await route.fulfill({
      status: 200,
      headers: uiMessageStreamHeaders(),
      body: buildBlueprintReadyStream(BLUEPRINT),
    });
  });

  await page.route("**/api/document/status-templates", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        ok: true,
        bundle: {
          viewer: "ownerChannel",
          blueprintHash: "hash-live",
          generatedAt: new Date().toISOString(),
          templates: [
            {
              when: "doc('/status') === 'draft'",
              title: "Counter draft",
              body: "Counter is {{ doc('/counter') }}",
            },
            {
              when: "doc('/status') === 'active'",
              title: "Counter active",
              body: "Counter is {{ doc('/counter') }}",
            },
            {
              when: "true",
              title: "Counter fallback",
              body: "Counter is {{ doc('/counter') }}",
            },
          ],
        },
      }),
    });
  });

  await page.route("**/api/dsl/generate", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        ok: true,
        dsl: "export function buildDocument() { return {}; }",
        inputTokens: 10,
      }),
    });
  });

  await page.route("**/api/dsl/compile", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        ok: true,
        documentJson: { name: "Live Counter" },
        structure: {},
        bindings: [
          {
            channelName: "ownerChannel",
            mode: "accountId",
            value: "acc-1",
          },
        ],
      }),
    });
  });

  await page.route("**/api/myos/bootstrap", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        ok: true,
        sessionId: "session-live-1",
        bootstrap: {},
      }),
    });
  });

  let retrieveCalls = 0;
  await page.route("**/api/myos/retrieve", async (route) => {
    retrieveCalls += 1;
    const retrieved =
      retrieveCalls <= 1
        ? {
            documentId: "doc-live-1",
            processingStatus: "running",
            allowedOperations: ["increment"],
            document: { status: "draft", counter: 0 },
          }
        : {
            documentId: "doc-live-1",
            processingStatus: "running",
            allowedOperations: ["increment"],
            document: { status: "active", counter: 1 },
          };

    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        ok: true,
        retrieved,
      }),
    });
  });

  let registerCalls = 0;
  await page.route("**/api/myos/webhooks/register", async (route) => {
    registerCalls += 1;
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        ok: true,
        reused: false,
        registration: {
          registrationId: "reg-live-1",
          webhookId: "webhook-live-1",
          accountHash: "https://api.dev.myos.blue/::acc-1",
          browserId: "browser-live-1",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      }),
    });
  });

  await page.route("**/api/myos/live/subscriptions", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ ok: true, sessionCount: 1, threadCount: 1 }),
    });
  });

  await page.route("**/api/myos/live*", async (route) => {
    await route.fulfill({
      status: 200,
      headers: {
        "content-type": "text/event-stream; charset=utf-8",
        "cache-control": "no-cache, no-transform",
        connection: "keep-alive",
      },
      body:
        `data: ${JSON.stringify({ type: "connected" })}\n\n` +
        `data: ${JSON.stringify({
          type: "myos-epoch-advanced",
          sessionId: "session-live-1",
          eventId: "event-live-1",
          epoch: 2,
          deliveryId: "delivery-live-1",
        })}\n\n`,
    });
  });

  await page.goto("/");
  await page.getByLabel("OpenAI API key").fill("sk-test");
  await page.getByLabel("MyOS API key").fill("myos-test");
  await page.getByLabel("MyOS accountId").fill("acc-1");
  await page.getByLabel("MyOS base URL").fill("https://api.dev.myos.blue/");
  await page.getByRole("button", { name: "Continue" }).click();

  await page.getByPlaceholder("Send a message...").fill("Create live counter");
  await page.getByRole("button", { name: "Submit" }).click();
  await expect(page.getByText("Thread: Live Counter").first()).toBeVisible();

  await page.getByRole("button", { name: "Generate DSL" }).click();
  await page.getByRole("button", { name: "Compile DSL" }).click();
  await page.getByRole("button", { name: "OK — bootstrap" }).click();

  await page.getByRole("button", { name: "Status", exact: true }).click();
  await expect(page.getByText("Counter active").first()).toBeVisible({ timeout: 20_000 });
  await expect(page.getByText("Counter is 1").first()).toBeVisible();
  await expect(page.getByRole("button", { name: "Counter active" }).first()).toBeVisible();
  expect(retrieveCalls).toBeGreaterThanOrEqual(2);
  expect(registerCalls).toBe(1);
});
