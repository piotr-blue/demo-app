import { expect, test } from "@playwright/test";

test("workspace allows tab switching, file attach, and chat submit", async ({ page }) => {
  let extractRequests = 0;
  let chatRequests = 0;

  await page.route("**/api/files/extract", async (route) => {
    extractRequests += 1;

    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        extractedText: "hello world",
        contextLabel: "Text document",
        fileName: "notes.txt",
        mimeType: "text/plain",
        size: 11,
      }),
    });
  });

  await page.route("**/api/chat", async (route) => {
    chatRequests += 1;

    // Returning an error still verifies prompt submit wiring and prevents external API calls.
    await route.fulfill({
      status: 500,
      contentType: "application/json",
      body: JSON.stringify({ error: "mocked failure" }),
    });
  });

  await page.goto("/");

  await page.getByLabel("OpenAI API key").fill("sk-test");
  await page.getByLabel("MyOS API key").fill("myos-test");
  await page.getByLabel("MyOS accountId").fill("acc-1");
  await page.getByLabel("MyOS base URL").fill("https://api.dev.myos.blue/");
  await page.getByRole("button", { name: "Continue" }).click();

  await expect(page.getByText("Blue Studio")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Threads" })).toBeVisible();

  await page.getByRole("button", { name: "Activity", exact: true }).click();
  await expect(page.getByText("Assistant initialized")).toBeVisible();

  await page.getByRole("button", { name: "Blueprint", exact: true }).click();
  await expect(page.getByText("No blueprint yet.")).toBeVisible();

  await page.locator('input[aria-label="Upload files"]').setInputFiles({
    name: "notes.txt",
    mimeType: "text/plain",
    buffer: Buffer.from("hello world"),
  });
  await expect(page.getByText("notes.txt")).toBeVisible();

  await page.getByPlaceholder("Send a message...").fill("Create a counter app");
  await page.getByRole("button", { name: "Submit" }).click();

  await expect.poll(() => extractRequests).toBe(1);
  await expect.poll(() => chatRequests).toBe(1);

  await expect(page.getByText("Context files")).toBeVisible();
  await expect(page.getByRole("button", { name: /notes\.txt/i })).toBeVisible();

  const firstThreadUrl = page.url();
  await page.getByRole("button", { name: "New thread" }).click();
  await expect.poll(() => page.url()).not.toBe(firstThreadUrl);
  const secondThreadUrl = page.url();

  await page.getByRole("button", { name: "Clear all threads" }).click();
  await expect.poll(() => page.url()).not.toBe(firstThreadUrl);
  await expect.poll(() => page.url()).not.toBe(secondThreadUrl);
  await expect(page.getByText("Blue Studio")).toBeVisible();
  await expect(page.getByText("What do you want to create today?")).toBeVisible();
  await expect(page.getByText("Context files")).toHaveCount(0);
});
