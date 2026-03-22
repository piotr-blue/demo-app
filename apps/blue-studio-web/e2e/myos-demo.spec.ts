import { expect, test } from "@playwright/test";

test("myos demo opens in Home and supports seeded navigation/search/detail interactions", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveURL("/home");

  await expect(page.getByRole("link", { name: "Home" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Search" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Settings" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Alice’s Shop" })).toBeVisible();
  await expect(page.getByRole("heading", { name: /Here’s what happened while you were away/i })).toBeVisible();

  await page.getByRole("tab", { name: "Services" }).click();
  await page.getByRole("link", { name: /SMS Provider Subscription/i }).click();
  await expect(page).toHaveURL(/\/documents\/.+/);
  await expect(page.getByRole("tab", { name: "UI" })).toBeVisible();
  await expect(page.getByRole("tab", { name: "Settings" })).toBeVisible();
  await expect(page.getByRole("tab", { name: "Activity" })).toBeVisible();
  await page.getByRole("button", { name: "Check quota" }).click();
  await page.getByRole("tab", { name: "Activity" }).click();
  await expect(page.getByText("Quota checked")).toBeVisible();

  await page.goto("/home?section=tasks");
  await page.getByRole("link", { name: /Daily operations triage/i }).click();
  await expect(page).toHaveURL(/\/threads\/.+/);
  await expect(page.getByRole("tab", { name: "Chat" })).toBeVisible();
  await expect(page.getByRole("tab", { name: "UI" })).toBeVisible();
  await expect(page.getByRole("tab", { name: "Settings" })).toBeVisible();
  await expect(page.getByRole("tab", { name: "Activity" })).toBeVisible();
  await page.getByPlaceholder("Add an update to this task…").fill("Please track supplier escalation.");
  await page.getByRole("button", { name: "Send" }).click();
  await expect(page.getByText("Please track supplier escalation.")).toBeVisible();

  await page.getByPlaceholder("Search workspaces, documents, threads, services…").fill("northwind");
  await page.getByRole("button", { name: "Search" }).first().click();
  await expect(page).toHaveURL(/\/search\?q=northwind/);
  await expect(page.getByRole("link", { name: /Shared NDA with Northwind Press/i })).toBeVisible();

  await page.goto("/blink");
  await expect(page).toHaveURL("/home");

  await page.goto("/documents");
  await expect(page).toHaveURL("/home?section=documents");
});
