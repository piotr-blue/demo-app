import { expect, test } from "@playwright/test";
import { resolveLiveCredentials } from "@/test-utils/live-credentials";

const resolved = resolveLiveCredentials();
const liveEnabled = Boolean(resolved.credentials);

function buildCredentials() {
  if (!resolved.credentials) {
    throw new Error(
      `Missing live credentials: ${resolved.missing.join(", ")}. Checked env and optional file ${resolved.filePath}`
    );
  }
  return {
    openAiApiKey: resolved.credentials.openAiApiKey,
    myOsApiKey: resolved.credentials.myOsApiKey,
    myOsAccountId: resolved.credentials.myOsAccountId,
    myOsBaseUrl: resolved.credentials.myOsBaseUrl,
  };
}

test.skip(!liveEnabled, "Live credentials are required for this spec.");

test.setTimeout(180_000);

interface LiveCreatePayload {
  ok?: boolean;
  sessionId?: string | null;
  myosDocumentId?: string | null;
  created?: {
    kind?: string;
    name?: string;
    description?: string;
    fields?: Record<string, string>;
    anchors?: Array<{ key: string; label: string; purpose: string }>;
  };
  link?: { parentDocumentId: string; anchorKey: string } | null;
  linked?: Array<{
    anchorKey: string;
    childSessionId: string;
    childDocumentId: string;
    linkSessionId: string | null;
  }>;
}

test("live account runs real assistant and creates real MyOS doc", async ({ page }) => {
  const credentials = buildCredentials();
  const documentName = `Live QA ${Date.now()}`;
  const documentDescription = "Created from real UI live-account test";
  const liveCreateResult: { payload?: LiveCreatePayload } = {};

  page.on("response", async (response) => {
    if (!response.url().includes("/api/demo/live-documents/create")) {
      return;
    }
    try {
      liveCreateResult.payload = (await response.json()) as LiveCreatePayload;
    } catch {
      // ignore parse errors in listener
    }
  });

  await page.addInitScript(
    (credentials) => {
      window.localStorage.setItem("myosDemo.credentials", JSON.stringify(credentials));
      window.localStorage.setItem("myosDemo.activeAccountId", "account_piotr_blue");
    },
    {
      openAiApiKey: credentials.openAiApiKey,
      myOsApiKey: credentials.myOsApiKey,
      myOsAccountId: credentials.myOsAccountId,
      myOsBaseUrl: credentials.myOsBaseUrl,
    }
  );

  await page.goto("/home");
  await expect(page.getByRole("heading", { name: "piotr-blue" })).toBeVisible();

  await page.getByPlaceholder("Ask me a question or ask me to create a document...").fill(
    "hey, what is the capital of Poland"
  );
  await page.getByRole("button", { name: "Send" }).click();
  await expect(page.getByText(/Warsaw|Warszawa/i).first()).toBeVisible({ timeout: 30_000 });

  await page.getByPlaceholder("Ask me a question or ask me to create a document...").fill(
    `create a doc named ${documentName} with description ${documentDescription}`
  );
  await page.getByRole("button", { name: "Send" }).click();
  await expect(
    page.getByText(`Created document "${documentName}" successfully.`).first()
  ).toBeVisible({ timeout: 60_000 });

  await page.goto("/home?section=documents");
  await expect(page.getByRole("link", { name: new RegExp(documentName) }).first()).toBeVisible();

  const confirmedPayload = liveCreateResult.payload;
  expect(confirmedPayload).toBeTruthy();
  if (!confirmedPayload) {
    return;
  }
  expect(confirmedPayload.ok).toBe(true);
  expect(confirmedPayload.sessionId).toBeTruthy();
  expect(confirmedPayload.created?.name).toBe(documentName);
  expect(confirmedPayload.created?.description).toBe(documentDescription);
});
