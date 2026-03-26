import { describe, expect, it, vi } from "vitest";

const streamMock = vi.hoisted(() =>
  vi.fn(async (params: { onDelta?: (delta: string) => void }) => {
    params.onDelta?.('{"t":"ans","c":"Warsaw."}');
    return { text: '{"t":"ans","c":"Warsaw."}', inputTokens: 11 };
  })
);

vi.mock("@/lib/openai/client", () => ({
  OPENAI_TEXT_MODEL: "gpt-5.4",
  streamTextWithResponsesApi: streamMock,
}));

import { POST } from "@/app/api/demo/live-assistant/stream/route";

function buildBody(overrides?: Partial<Record<string, unknown>>) {
  return {
    credentials: {
      openAiApiKey: "sk-test",
    },
    account: {
      id: "account_piotr_blue",
      name: "piotr-blue",
      mode: "live",
    },
    target: {
      type: "home",
      id: "account_piotr_blue",
      title: "Home",
    },
    conversation: {
      id: "aconv_home_piotr",
      exchangeId: "aex_123",
      messages: [],
    },
    liveDocuments: [],
    userInput: "what is the capital of poland",
    ...overrides,
  };
}

describe("POST /api/demo/live-assistant/stream", () => {
  it("returns 400 for invalid payload", async () => {
    const response = await POST(
      new Request("http://localhost/api/demo/live-assistant/stream", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({}),
      })
    );
    expect(response.status).toBe(400);
  });

  it("streams delta and final events for valid assistant turn", async () => {
    streamMock.mockClear();
    const response = await POST(
      new Request("http://localhost/api/demo/live-assistant/stream", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(buildBody()),
      })
    );

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toContain("text/event-stream");
    const text = await response.text();
    expect(text).toContain("event: start");
    expect(text).toContain("event: delta");
    expect(text).toContain("event: final");
    expect(text).toContain('"t":"ans"');
    expect(text).toContain('"c":"Warsaw."');
    expect(streamMock).toHaveBeenCalledTimes(1);
  });

  it("streams error event when model output fails protocol validation", async () => {
    streamMock.mockImplementationOnce(async (params: { onDelta?: (delta: string) => void }) => {
      params.onDelta?.('{"c":"missing type","t":"ans"}');
      return { text: '{"c":"missing type","t":"ans"}', inputTokens: 9 };
    });
    const response = await POST(
      new Request("http://localhost/api/demo/live-assistant/stream", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(buildBody()),
      })
    );
    const text = await response.text();
    expect(text).toContain("event: error");
    expect(text).toContain("stable order");
  });
});
