import { expect, test } from "@playwright/test";

test("credentials gate hydrates workspace and supports logout", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByText("Connect credentials")).toBeVisible();

  await page.getByLabel("OpenAI API key").fill("sk-test");
  await page.getByLabel("MyOS API key").fill("myos-test");
  await page.getByLabel("MyOS accountId").fill("acc-1");
  await page.getByLabel("MyOS base URL").fill("https://api.dev.myos.blue/");
  await page.getByRole("button", { name: "Continue" }).click();

  await expect(page.getByText("Blue Studio")).toBeVisible();
  await expect(page.getByText("What do you want to create today?")).toBeVisible();

  await page.getByRole("button", { name: "Log out" }).click();
  await expect(page.getByText("Connect credentials")).toBeVisible();
});
