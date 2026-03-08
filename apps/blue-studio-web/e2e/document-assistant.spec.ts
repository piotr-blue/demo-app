import { expect, test } from "@playwright/test";
import { buildBlueprintReadyStream, uiMessageStreamHeaders } from "./utils/chat-stream";

const BLUEPRINT = `STATE: ready
TYPE: Document
BLUEPRINT: Assistant Counter
SUMMARY: Counter document for assistant tests.
PARTICIPANTS:
  - ownerChannel — owner who can increment`;

const BLUEPRINT_NO_PARTICIPANTS = `STATE: ready
TYPE: Document
BLUEPRINT: Assistant Neutral
SUMMARY: Counter document without participants.`;

test("assistant works right after blueprint-ready using blueprint-only mode", async ({
  page,
}) => {
  await page.route("**/api/chat", async (route) => {
    await route.fulfill({
      status: 200,
      headers: uiMessageStreamHeaders(),
      body: buildBlueprintReadyStream(BLUEPRINT),
    });
  });

  let qaRequestState: unknown = undefined;
  await page.route("**/api/document/qa", async (route) => {
    const body = route.request().postDataJSON() as Record<string, unknown>;
    qaRequestState = body.state;
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        ok: true,
        answer: "It supports increment by the owner channel.",
        mode: "blueprint-only",
      }),
    });
  });

  await page.goto("/");
  await page.getByLabel("OpenAI API key").fill("sk-test");
  await page.getByLabel("MyOS API key").fill("myos-test");
  await page.getByLabel("MyOS accountId").fill("acc-1");
  await page.getByLabel("MyOS base URL").fill("https://api.dev.myos.blue/");
  await page.getByRole("button", { name: "Continue" }).click();

  await page.getByPlaceholder("Send a message...").fill("Create assistant counter");
  await page.getByRole("button", { name: "Submit" }).click();
  await expect(page.getByText("Thread: Assistant Counter").first()).toBeVisible();

  await page.getByRole("button", { name: "Assistant" }).click();
  await expect(page.getByText("Using blueprint only")).toBeVisible();

  await page.getByPlaceholder("What can this document do?").fill("what this document can do?");
  await page.getByRole("button", { name: "Ask" }).click();

  await expect(page.getByText("supports increment by the owner channel", { exact: false })).toBeVisible();
  expect(qaRequestState).toBeNull();
});

test("assistant shows fallback guidance when participants are missing", async ({ page }) => {
  await page.route("**/api/chat", async (route) => {
    await route.fulfill({
      status: 200,
      headers: uiMessageStreamHeaders(),
      body: buildBlueprintReadyStream(BLUEPRINT_NO_PARTICIPANTS),
    });
  });

  let qaViewer: unknown = "unset";
  await page.route("**/api/document/qa", async (route) => {
    const body = route.request().postDataJSON() as Record<string, unknown>;
    qaViewer = body.viewer;
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        ok: true,
        answer: "From a neutral perspective, this document can be discussed before bootstrap.",
        mode: "blueprint-only",
      }),
    });
  });

  await page.goto("/");
  await page.getByLabel("OpenAI API key").fill("sk-test");
  await page.getByLabel("MyOS API key").fill("myos-test");
  await page.getByLabel("MyOS accountId").fill("acc-1");
  await page.getByLabel("MyOS base URL").fill("https://api.dev.myos.blue/");
  await page.getByRole("button", { name: "Continue" }).click();

  await page.getByPlaceholder("Send a message...").fill("Create assistant neutral doc");
  await page.getByRole("button", { name: "Submit" }).click();
  await expect(page.getByText("Thread: Assistant Neutral").first()).toBeVisible();

  await page.getByRole("button", { name: "Assistant" }).click();
  await expect(
    page.getByText("Participants could not be parsed from the blueprint", { exact: false })
  ).toBeVisible();

  await page.getByPlaceholder("What can this document do?").fill("What can this document do?");
  await page.getByRole("button", { name: "Ask" }).click();

  await expect(page.getByText("neutral perspective", { exact: false })).toBeVisible();
  expect(qaViewer).toBeNull();
});

