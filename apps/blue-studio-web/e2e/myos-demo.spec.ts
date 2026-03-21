import { expect, test } from "@playwright/test";

test("myos demo default flow covers blink workspace thread and documents", async ({ page }) => {
  await page.route("**/api/demo/workspaces/bootstrap", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        ok: true,
        sessionId: "session_demo_workspace",
        coreDocumentId: null,
        myosDocumentId: "myos_doc_workspace",
      }),
    });
  });

  await page.route("**/api/demo/assistant/chat", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        ok: true,
        message:
          "This sounds like ongoing work. Create a thread for execution, and create a document for final artifacts.",
      }),
    });
  });

  await page.goto("/");
  await expect(page).toHaveURL("/blink");

  await expect(page.getByRole("link", { name: "Blink" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Documents" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Settings" })).toBeVisible();

  await page.getByRole("button", { name: "New workspace" }).first().click();
  await page.getByLabel("Workspace name").fill("Acme Shop");
  await page.getByRole("button", { name: "Create workspace" }).click();

  await expect(page).toHaveURL(/\/workspaces\/.+/);
  await expect(page.getByRole("heading", { name: /Acme Shop/ })).toBeVisible();

  await page.getByRole("tab", { name: "Threads" }).click();
  await page.getByRole("button", { name: "Add thread" }).click();

  await expect(page).toHaveURL(/\/threads\/.+/);
  await expect(page.getByRole("tab", { name: "UI" })).toBeVisible();
  await page.getByRole("tab", { name: "Details" }).click();
  await expect(page.getByText("Details").first()).toBeVisible();
  await page.getByRole("tab", { name: "Activity" }).click();

  await page.getByRole("link", { name: "Documents" }).click();
  await expect(page).toHaveURL("/documents");
  await page.getByRole("button", { name: "New document" }).click();
  await expect(page).toHaveURL(/\/documents\/.+/);
  await expect(page.getByRole("tab", { name: "UI" })).toBeVisible();
});
