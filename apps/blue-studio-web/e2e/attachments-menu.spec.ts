import { expect, test } from "@playwright/test";
import { buildBlueprintReadyStream, uiMessageStreamHeaders } from "./utils/chat-stream";

const BLUEPRINT = `STATE: ready
TYPE: Document
BLUEPRINT: Attachment Counter
SUMMARY: Counter for attachment source menu tests.
PARTICIPANTS:
  - ownerChannel — owner`;

test("plus menu supports upload, app document, and external MyOS session", async ({ page }) => {
  await page.route("**/api/chat", async (route) => {
    await route.fulfill({
      status: 200,
      headers: uiMessageStreamHeaders(),
      body: buildBlueprintReadyStream(BLUEPRINT),
    });
  });

  await page.route("**/api/files/extract", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        extractedText: "synthetic context",
        contextLabel: "Text document",
        fileName: "synthetic.txt",
        mimeType: "text/plain",
        size: 16,
      }),
    });
  });

  await page.route("**/api/document/reference/fetch-external", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        ok: true,
        sourceType: "yaml",
        content: "name: External Session",
        contextLabel: "External MyOS session",
        sourceMeta: { sessionId: "external-session-1" },
      }),
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
          blueprintHash: "hash",
          generatedAt: new Date().toISOString(),
          templates: [
            { when: "true", title: "Ready", body: "Ready" },
          ],
        },
      }),
    });
  });

  let renderCalls = 0;
  await page.route("**/api/document/reference/render", async (route) => {
    renderCalls += 1;
    const body = route.request().postDataJSON() as {
      sourceType: string;
      threadTitle?: string;
      sessionId?: string;
    };
    const fileName =
      body.sourceType === "blueprint"
        ? "from-thread.myos.txt"
        : body.sourceType === "yaml"
          ? "external-session.myos.txt"
          : "external-best-effort.myos.txt";
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        ok: true,
        fileName,
        text: `name: ${body.threadTitle ?? body.sessionId ?? "Reference"}`,
        contextLabel: "Reference",
        sourceMeta: { sourceType: body.sourceType },
      }),
    });
  });

  await page.goto("/");
  await page.getByLabel("OpenAI API key").fill("sk-test");
  await page.getByLabel("MyOS API key").fill("myos-test");
  await page.getByLabel("MyOS accountId").fill("acc-1");
  await page.getByLabel("MyOS base URL").fill("https://api.dev.myos.blue/");
  await page.getByRole("button", { name: "Continue" }).click();

  await page.getByPlaceholder("Send a message...").fill("Create attachment test doc");
  await page.getByRole("button", { name: "Submit" }).click();
  await expect(page.getByText("Thread: Attachment Counter").first()).toBeVisible();

  await page.evaluate(async () => {
    const openRequest = indexedDB.open("blue-studio-web", 1);
    const db = await new Promise<IDBDatabase>((resolve, reject) => {
      openRequest.onsuccess = () => resolve(openRequest.result);
      openRequest.onerror = () => reject(openRequest.error);
    });
    const tx = db.transaction("workspaces", "readwrite");
    const store = tx.objectStore("workspaces");
    const all = await new Promise<Record<string, unknown>[]>((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => resolve((request.result as Record<string, unknown>[]) ?? []);
      request.onerror = () => reject(request.error);
    });
    const base = all[0] ?? {};
    const cloned = {
      ...base,
      id: "thread_from_another_session",
      threadTitle: "Attached source thread",
      threadSummary: "Has blueprint and session for attachment",
      sessionId: "session-from-another-thread",
      currentBlueprint:
        typeof base.currentBlueprint === "string" && base.currentBlueprint.length > 0
          ? base.currentBlueprint
          : "STATE: ready\nTYPE: Document\nBLUEPRINT: Source",
      updatedAt: new Date().toISOString(),
    };
    store.put(cloned, "thread_from_another_session");
    await new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
    db.close();
  });

  await page.getByRole("button", { name: "Attachment sources" }).click();
  await page.getByRole("menuitem", { name: "Upload file" }).click();
  await page.locator('input[aria-label="Upload files"]').setInputFiles({
    name: "upload.txt",
    mimeType: "text/plain",
    buffer: Buffer.from("upload data"),
  });
  await expect(page.getByText("upload.txt")).toBeVisible();

  await page.getByRole("button", { name: "Attachment sources" }).click();
  await page.getByRole("menuitem", { name: "Attach app document from another thread" }).click();
  const appDialog = page.getByRole("dialog", { name: "Attach app document" });
  await expect(appDialog).toBeVisible();
  await expect(appDialog.getByText("Attached source thread")).toBeVisible();
  await appDialog.getByRole("button", { name: "Attach" }).first().click();
  await expect(page.getByText("from-thread.myos.txt")).toBeVisible();

  await page.getByRole("button", { name: "Attachment sources" }).click();
  await page.getByRole("menuitem", { name: "Attach external MyOS session by sessionId" }).click();
  await page.getByPlaceholder("sessionId").fill("external-session-1");
  await page.getByRole("button", { name: "Attach" }).last().click();
  await expect(page.getByText("external-session.myos.txt")).toBeVisible();
  expect(renderCalls).toBeGreaterThanOrEqual(2);
});

test("drag-and-drop attachment behavior still works", async ({ page }) => {
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

  const dropTarget = page.locator("form").first();
  const dataTransfer = await page.evaluateHandle(() => new DataTransfer());
  await dataTransfer.evaluate((dt) => {
    dt.items.add(new File(["dnd content"], "dragged.txt", { type: "text/plain" }));
  });

  await dropTarget.dispatchEvent("drop", { dataTransfer });
  await expect(page.getByText("dragged.txt")).toBeVisible();
});
