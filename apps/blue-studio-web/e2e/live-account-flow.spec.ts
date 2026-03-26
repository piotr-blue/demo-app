import { expect, test } from "@playwright/test";
import { uiMessageStreamHeaders } from "./utils/chat-stream";

function buildLiveAssistantStream(turn: unknown): string {
  const payload = JSON.stringify(turn);
  const chunks = [
    { event: "start", data: { ok: true } },
    { event: "delta", data: { delta: payload } },
    { event: "final", data: { turn, raw: payload } },
    { event: "done", data: { ok: true } },
  ];
  return chunks
    .map(
      (chunk) =>
        `event: ${chunk.event}\n` +
        `data: ${JSON.stringify(chunk.data)}\n\n`
    )
    .join("");
}

test("live account supports answer, follow-up doc flow, one-shot doc flow, and account switching", async ({
  page,
}) => {
  const assistantResponses = [
    { t: "ans", c: "Warsaw." },
    { t: "more", c: "Sure — I can create one.", q: "What should the document be called?" },
    { t: "more", c: "Great.", q: "What description should I use for this document?" },
    {
      t: "doc",
      summ: "I will create the document 'Roadmap'.",
      doc: {
        kind: "plan",
        name: "Roadmap",
        description: "Q4 priorities and milestones",
        fields: {
          owner: "piotr-blue",
        },
        anchors: [],
      },
      link: null,
    },
    {
      t: "doc",
      summ: "I will create the document 'Alpha'.",
      doc: {
        kind: "note",
        name: "Alpha",
        description: "Beta",
        fields: {},
        anchors: [],
      },
      link: null,
    },
  ];

  await page.route("**/api/demo/live-assistant/stream", async (route) => {
    const turn = assistantResponses.shift() ?? { t: "ans", c: "Fallback answer." };
    await route.fulfill({
      status: 200,
      headers: {
        ...uiMessageStreamHeaders(),
        "content-type": "text/event-stream; charset=utf-8",
      },
      body: buildLiveAssistantStream(turn),
    });
  });

  let createdCount = 0;
  await page.route("**/api/demo/live-documents/create", async (route) => {
    const body = route.request().postDataJSON() as {
      doc: { kind: string; name: string; description: string; fields: Record<string, string>; anchors: unknown[] };
      link: { parentDocumentId: string; anchorKey: string } | null;
    };
    createdCount += 1;
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        ok: true,
        sessionId: `session_live_${createdCount}`,
        myosDocumentId: `myos_live_${createdCount}`,
        created: {
          kind: body.doc.kind,
          name: body.doc.name,
          description: body.doc.description,
          fields: body.doc.fields,
          anchors: body.doc.anchors ?? [],
        },
        link: body.link,
        linked: [],
      }),
    });
  });

  await page.goto("/home");
  await expect(page.getByRole("heading", { name: "piotr-blue" })).toBeVisible();
  await expect(page.getByText("Live account for real assistant chat")).toBeVisible();

  // A. General answer
  await page.getByPlaceholder("Ask me a question or ask me to create a document...").fill(
    "what is the capital of Poland"
  );
  await page.getByRole("button", { name: "Send" }).click();
  await expect(page.getByText("Warsaw.").first()).toBeVisible();

  // B. Missing info flow
  await page.getByPlaceholder("Ask me a question or ask me to create a document...").fill(
    "make me a document"
  );
  await page.getByRole("button", { name: "Send" }).click();
  await expect(page.getByText("What should the document be called?")).toBeVisible();

  await page.getByPlaceholder("Type a reply...").first().fill("Roadmap");
  await page.getByRole("button", { name: "Send" }).first().click();
  await expect(page.getByText("What description should I use for this document?")).toBeVisible();

  await page.getByPlaceholder("Type a reply...").first().fill("Q4 priorities and milestones");
  await page.getByRole("button", { name: "Send" }).first().click();
  await expect(page.getByText("I will create the document 'Roadmap'.").first()).toBeVisible();
  await expect(page.getByText("Created document \"Roadmap\" successfully.").first()).toBeVisible();

  // C. One-shot document creation
  await page.getByPlaceholder("Ask me a question or ask me to create a document...").fill(
    "create a doc named Alpha with description Beta"
  );
  await page.getByRole("button", { name: "Send" }).click();
  await expect(page.getByText("I will create the document 'Alpha'.").first()).toBeVisible();
  await expect(page.getByText("Created document \"Alpha\" successfully.").first()).toBeVisible();

  // Verify docs in Home > Documents
  await page.goto("/home?section=documents");
  await expect(page.getByRole("link", { name: /Roadmap/i }).first()).toBeVisible();
  await expect(page.getByRole("link", { name: /Alpha/i }).first()).toBeVisible();

  // D. Account switching safety
  await page.getByRole("button", { name: "Account switcher" }).first().click();
  await page.getByText("Switch to Alice Martinez").click();
  await expect(page.getByRole("heading", { name: "Alice Martinez" })).toBeVisible();
  await expect(page.getByText("Healthy food restaurant owner")).toBeVisible();

  await page.getByRole("button", { name: "Account switcher" }).first().click();
  await page.getByText("Switch to piotr-blue").click();
  await expect(page.getByRole("heading", { name: "piotr-blue" })).toBeVisible();
  await page.goto("/home?section=documents");
  await expect(page.getByRole("link", { name: /Roadmap/i }).first()).toBeVisible();
  await expect(page.getByRole("link", { name: /Alpha/i }).first()).toBeVisible();
});
