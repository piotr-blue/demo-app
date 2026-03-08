export function buildBlueprintReadyStream(blueprint: string): string {
  const chunks = [
    { type: "start" },
    { type: "text-start", id: "txt_1" },
    { type: "text-delta", id: "txt_1", delta: blueprint },
    { type: "text-end", id: "txt_1" },
    { type: "data-blueprint-ready", data: { blueprint, tokenCount: 120 } },
    { type: "finish" },
  ];
  return chunks.map((chunk) => `data: ${JSON.stringify(chunk)}\n\n`).join("");
}

export function uiMessageStreamHeaders(): Record<string, string> {
  return {
    "content-type": "text/event-stream; charset=utf-8",
    "x-vercel-ai-ui-message-stream": "v1",
  };
}

