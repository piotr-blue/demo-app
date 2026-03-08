import { expect, test } from "@playwright/test";
import { buildBlueprintReadyStream, uiMessageStreamHeaders } from "./utils/chat-stream";

const BLUEPRINT = `STATE: ready
TYPE: Document
BLUEPRINT: Counter Thread
SUMMARY: Counter for thread routing test.
PARTICIPANTS:
  - ownerChannel — owner of the counter`;

test("root redirect and multi-thread routing keep independent state", async ({ page }) => {
  await page.route("**/api/chat", async (route) => {
    await route.fulfill({
      status: 200,
      headers: uiMessageStreamHeaders(),
      body: buildBlueprintReadyStream(BLUEPRINT),
    });
  });

  await page.goto("/");

  await page.getByLabel("OpenAI API key").fill("sk-test");
  await page.getByLabel("MyOS API key").fill("myos-test");
  await page.getByLabel("MyOS accountId").fill("acc-1");
  await page.getByLabel("MyOS base URL").fill("https://api.dev.myos.blue/");
  await page.getByRole("button", { name: "Continue" }).click();
  await expect(page).toHaveURL(/\/t\/.+/);

  const threadAUrl = page.url();

  await page.getByPlaceholder("Send a message...").fill("Create counter thread");
  await page.getByRole("button", { name: "Submit" }).click();
  await expect(page.getByText("Thread: Counter Thread").first()).toBeVisible();

  await page.getByRole("button", { name: "New thread" }).click();
  await expect.poll(() => page.url()).not.toBe(threadAUrl);
  const threadBUrl = page.url();
  expect(threadBUrl).not.toBe(threadAUrl);

  await page.getByRole("button", { name: /Counter Thread/ }).first().click();
  await expect(page).toHaveURL(threadAUrl);

  await page.getByRole("button", { name: "Blueprint", exact: true }).click();
  await expect(
    page.locator("pre").filter({ hasText: "BLUEPRINT: Counter Thread" }).first()
  ).toBeVisible();
});

