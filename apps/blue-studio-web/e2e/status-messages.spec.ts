import { expect, test } from "@playwright/test";
import { buildBlueprintReadyStream, uiMessageStreamHeaders } from "./utils/chat-stream";

const BLUEPRINT = `STATE: ready
TYPE: Document
BLUEPRINT: Status Counter
SUMMARY: Counter with draft and active statuses.
PARTICIPANTS:
  - ownerChannel — owner

STATE:
  /status = "draft"
  /counter = 0`;

test("status messages resolve and thread labels update after refresh", async ({ page }) => {
  await page.route("**/api/chat", async (route) => {
    await route.fulfill({
      status: 200,
      headers: uiMessageStreamHeaders(),
      body: buildBlueprintReadyStream(BLUEPRINT),
    });
  });

  await page.route("**/api/document/status-templates", async (route) => {
    const body = route.request().postDataJSON() as Record<string, unknown>;
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        ok: true,
        bundle: {
          viewer: body.viewer ?? "ownerChannel",
          blueprintHash: "hash-status",
          generatedAt: "2026-03-08T00:00:00.000Z",
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
        documentJson: { name: "Status Counter" },
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
        sessionId: "session-status-1",
        bootstrap: {},
      }),
    });
  });

  let retrieveCall = 0;
  await page.route("**/api/myos/retrieve", async (route) => {
    retrieveCall += 1;
    const retrieved =
      retrieveCall === 1
        ? {
            documentId: "doc-1",
            processingStatus: "running",
            allowedOperations: ["increment"],
            document: { status: "draft", counter: 0 },
          }
        : {
            documentId: "doc-1",
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

  await page.goto("/t/status_messages_legacy");
  await page.getByLabel("OpenAI API key").fill("sk-test");
  await page.getByLabel("MyOS API key").fill("myos-test");
  await page.getByLabel("MyOS accountId").fill("acc-1");
  await page.getByLabel("MyOS base URL").fill("https://api.dev.myos.blue/");
  await page.getByRole("button", { name: "Continue" }).click();

  await page.getByPlaceholder("Send a message...").fill("Create status counter");
  await page.getByRole("button", { name: "Submit" }).click();
  await expect(page.getByText("Thread: Status Counter").first()).toBeVisible();

  await page.getByRole("button", { name: "Generate DSL" }).click();
  await page.getByRole("button", { name: "Compile DSL" }).click();
  await page.getByRole("button", { name: "OK — bootstrap" }).click();

  await page.getByRole("button", { name: "Status", exact: true }).click();
  await expect(page.getByText("Counter draft").first()).toBeVisible();
  await expect(page.getByText("Counter is 0").first()).toBeVisible();

  const refreshButton = page.getByRole("button", { name: "Refresh now" });
  await expect(refreshButton).toBeEnabled();
  await refreshButton.click({ force: true });
  await expect(page.getByText("Counter active").first()).toBeVisible();
  await expect(page.getByText("Counter is 1").first()).toBeVisible();

  await expect(page.getByRole("button", { name: "Counter active" }).first()).toBeVisible();
});

