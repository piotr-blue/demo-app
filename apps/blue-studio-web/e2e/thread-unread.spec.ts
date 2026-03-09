import { expect, test } from "@playwright/test";
import { buildBlueprintReadyStream, uiMessageStreamHeaders } from "./utils/chat-stream";

const BLUEPRINT = `STATE: ready
TYPE: Document
BLUEPRINT: Unread Counter
SUMMARY: Counter for unread thread marker tests.
PARTICIPANTS:
  - ownerChannel — owner`;

test("incoming thread update moves thread to top and marks it unread", async ({ page }) => {
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
          blueprintHash: "hash-unread",
          generatedAt: new Date().toISOString(),
          templates: [
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
        documentJson: { name: "Unread Counter" },
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
        sessionId: "session-unread-a",
        initiatorSessionId: "session-unread-a",
        bootstrapSessionId: "session-unread-a",
        bootstrapSucceeded: true,
        bootstrapState: "BOOTSTRAP_SUCCEEDED",
        bootstrapStartOperation: "start",
        bootstrap: {},
      }),
    });
  });

  let retrieveCalls = 0;
  await page.route("**/api/myos/retrieve", async (route) => {
    retrieveCalls += 1;
    const body = route.request().postDataJSON() as { sessionId?: string };
    const isTargetSession = body.sessionId === "session-unread-a";
    const retrieved = isTargetSession
      ? retrieveCalls < 2
        ? {
            documentId: "doc-a",
            processingStatus: "running",
            allowedOperations: ["increment"],
            document: { status: "draft", counter: 0 },
          }
        : {
            documentId: "doc-a",
            processingStatus: "running",
            allowedOperations: ["increment"],
            document: { status: "active", counter: 2 },
          }
      : {
          documentId: "doc-b",
          processingStatus: "running",
          allowedOperations: ["increment"],
          document: { status: "draft", counter: 0 },
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

  await page.route("**/api/myos/webhooks/register", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        ok: true,
        reused: false,
        registration: {
          registrationId: "reg-unread-1",
          webhookId: "webhook-unread-1",
          accountHash: "https://api.dev.myos.blue/::acc-1",
          browserId: "browser-unread-1",
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
      body: JSON.stringify({ ok: true, sessionCount: 1, threadCount: 2 }),
    });
  });

  await page.route("**/api/myos/live*", async (route) => {
    const body =
      `data: ${JSON.stringify({ type: "connected" })}\n\n` +
      `data: ${JSON.stringify({
        type: "myos-epoch-advanced",
        sessionId: "session-unread-a",
        eventId: "event-unread-1",
        epoch: 3,
        deliveryId: "delivery-unread-1",
      })}\n\n`;

    await route.fulfill({
      status: 200,
      headers: {
        "content-type": "text/event-stream; charset=utf-8",
        "cache-control": "no-cache, no-transform",
        connection: "keep-alive",
      },
      body,
    });
  });

  await page.goto("/");
  await page.getByLabel("OpenAI API key").fill("sk-test");
  await page.getByLabel("MyOS API key").fill("myos-test");
  await page.getByLabel("MyOS accountId").fill("acc-1");
  await page.getByLabel("MyOS base URL").fill("https://api.dev.myos.blue/");
  await page.getByRole("button", { name: "Continue" }).click();

  await page.getByPlaceholder("Send a message...").fill("Create thread A");
  await page.getByRole("button", { name: "Submit" }).click();
  await page.getByRole("button", { name: "Generate DSL" }).click();
  await page.getByRole("button", { name: "Compile DSL" }).click();
  await page.getByRole("button", { name: "OK — bootstrap" }).click();

  const previousUrl = page.url();
  await page.getByRole("button", { name: "New thread" }).click();
  await expect.poll(() => page.url()).not.toBe(previousUrl);
  await expect(page.getByPlaceholder("Send a message...")).toBeVisible();
  await page.getByPlaceholder("Send a message...").fill("Create thread B");
  await page.getByRole("button", { name: "Submit" }).click();
  await expect(page.getByText("Thread: Unread Counter").first()).toBeVisible();

  const firstThreadButton = page.locator("aside button").nth(1);
  await expect(firstThreadButton.getByLabel("Unread thread updates")).toBeVisible({
    timeout: 20_000,
  });
});
