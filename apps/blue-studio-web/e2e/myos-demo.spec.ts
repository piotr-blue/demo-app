import { expect, test } from "@playwright/test";

test.setTimeout(60000);

test("myos demo supports multi-account document-first stories", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveURL("/home");

  await expect(page.getByRole("link", { name: "Home" })).toBeVisible();
  await expect(page.getByRole("link", { name: "My Profile" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Fresh Bites" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "piotr-blue" })).toBeVisible();

  await page.getByPlaceholder("Search accounts, services, and documents...").fill("Fresh Bites");
  await page.getByRole("button", { name: "Search" }).first().click();
  await expect(page).toHaveURL(/\/search\?q=Fresh%20Bites/);
  await expect(page.getByText("Accounts", { exact: true }).first()).toBeVisible();
  await expect(page.getByRole("link", { name: /Alice Martinez account/i })).toBeVisible();
  await expect(page.getByRole("link", { name: /Fresh Bites/i }).first()).toBeVisible();

  await page.goto("/documents/doc_fresh_bites");
  await expect(page.getByRole("button", { name: "Chat / UI" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Orders" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Products" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Partnerships" })).toBeVisible();

  await page.getByRole("button", { name: "Account switcher" }).first().click();
  await page.getByText("Switch to Bob Chen").click();
  await expect(page.getByRole("heading", { name: "Bob Chen" })).toBeVisible();

  await page.getByPlaceholder("Search accounts, services, and documents...").fill("Fresh Bites");
  await page.getByRole("button", { name: "Search" }).first().click();
  await page.getByRole("link", { name: /Fresh Bites/i }).first().click();
  await page.getByRole("button", { name: "Orders" }).click();
  await expect(page.getByText("Fresh Bites order — Bob")).toBeVisible();
  await expect(page.getByText("Fresh Bites order #1001")).toHaveCount(0);

  await page.getByRole("link", { name: /Fresh Bites order — Bob/i }).click();
  await expect(page.getByText("Awaiting delivery")).toBeVisible();
  await expect(page.getByText("Chat history")).toBeVisible();

  await page.getByRole("button", { name: "Account switcher" }).first().click();
  await page.getByText("Switch to Alice Martinez").click();
  await expect(page.getByRole("heading", { name: "Alice Martinez" })).toBeVisible();

  await page.goto("/documents/doc_partnership_engine_agreement_alice");
  await page.getByRole("button", { name: "Details" }).click();
  await expect(page.getByText("Captured intake summary")).toBeVisible();
  await expect(page.getByText("Partner criteria")).toBeVisible();
  await expect(page.getByRole("button", { name: "Linked Tasks" })).toBeVisible();

  await page.getByRole("button", { name: "Account switcher" }).first().click();
  await page.getByText("Switch to Celine Duarte").click();
  await expect(page.getByRole("heading", { name: "Celine Duarte" })).toBeVisible();

  await page.getByPlaceholder("Search accounts, services, and documents...").fill("My Life");
  await page.getByRole("button", { name: "Search" }).first().click();
  await page.getByRole("link", { name: /My Life/i }).first().click();
  await page.getByRole("button", { name: "Notes" }).click();
  await expect(page.getByText("Morning walk notes")).toBeVisible();
  await expect(page.getByText("Thinking about staying balanced")).toBeVisible();

  await page.goto("/documents/doc_my_life_note_journal");
  await page.getByRole("button", { name: "Comments" }).click();
  await expect(page.getByText("Alice private comment")).toHaveCount(0);
});
