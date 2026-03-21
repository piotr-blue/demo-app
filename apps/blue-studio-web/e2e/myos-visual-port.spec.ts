import { expect, test } from "@playwright/test";
import path from "node:path";

const SHOT_DIR = path.resolve(process.cwd(), "test-screenshots", "myos-port");

test("capture MyOS visual port screenshots", async ({ page }) => {
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
          "Here is your recap: 5 new users joined, invoice follow-up is pending, and one thread needs review.",
      }),
    });
  });

  await page.goto("/");
  await expect(page).toHaveURL("/blink");
  await page.setViewportSize({ width: 1510, height: 768 });
  await page.screenshot({ path: path.join(SHOT_DIR, "01-blink-home.png"), fullPage: true });

  await page.getByRole("button", { name: "Collapse navigation" }).click();
  await page.screenshot({ path: path.join(SHOT_DIR, "02-rail-collapsed.png"), fullPage: true });

  await page.getByRole("button", { name: "Expand navigation" }).click();
  await page.screenshot({ path: path.join(SHOT_DIR, "03-rail-expanded.png"), fullPage: true });

  const newWorkspaceButton = page.getByRole("button", { name: "New workspace" }).first();
  await expect(newWorkspaceButton).toBeVisible();
  const workspaceNameInput = page.locator("#workspace-name");
  let opened = false;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    await newWorkspaceButton.click();
    try {
      await expect(workspaceNameInput).toBeVisible({ timeout: 1_500 });
      opened = true;
      break;
    } catch {
      // retry click
    }
  }
  expect(opened).toBeTruthy();
  await page.screenshot({ path: path.join(SHOT_DIR, "04-workspace-dialog.png"), fullPage: true });
  await workspaceNameInput.fill("Alice Shop");
  await page.getByRole("button", { name: "Create workspace" }).click();
  await expect(page).toHaveURL(/\/workspaces\/.+/);
  await page.screenshot({ path: path.join(SHOT_DIR, "05-workspace-assistant.png"), fullPage: true });

  await page.getByRole("tab", { name: "Threads" }).click();
  await page.screenshot({ path: path.join(SHOT_DIR, "06-threads-list.png"), fullPage: true });

  await page.getByRole("button", { name: "Add thread" }).click();
  await expect(page).toHaveURL(/\/threads\/.+/);
  await page.screenshot({ path: path.join(SHOT_DIR, "07-thread-details.png"), fullPage: true });

  await page.goto("/documents");
  await expect(page).toHaveURL("/documents");
  await page.screenshot({ path: path.join(SHOT_DIR, "08-documents-list.png"), fullPage: true });

  await page.getByRole("link", { name: /Ops checklist/i }).click();
  await expect(page).toHaveURL(/\/documents\/.+/);
  await page.screenshot({ path: path.join(SHOT_DIR, "09-document-details.png"), fullPage: true });

  await page.goto("/blink");
  await expect(page).toHaveURL("/blink");
  await page.getByRole("button", { name: "Open account menu" }).click();
  await page.screenshot({ path: path.join(SHOT_DIR, "10-account-dropdown.png"), fullPage: true });
});
