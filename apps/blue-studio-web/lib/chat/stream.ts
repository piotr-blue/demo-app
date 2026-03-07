import { createUIMessageStream, createUIMessageStreamResponse } from "ai";

interface DataChunk {
  type: string;
  data: Record<string, unknown>;
}

function randomId(prefix: string): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}

export function respondWithAssistantTextAndData(input: {
  text: string;
  dataChunks?: DataChunk[];
  status?: number;
}): Response {
  const stream = createUIMessageStream({
    async execute({ writer }) {
      writer.write({ type: "start" });
      const textId = randomId("txt");
      writer.write({ type: "text-start", id: textId });
      writer.write({ type: "text-delta", id: textId, delta: input.text });
      writer.write({ type: "text-end", id: textId });

      for (const chunk of input.dataChunks ?? []) {
        writer.write({
          type: chunk.type as `data-${string}`,
          data: chunk.data,
        });
      }

      writer.write({ type: "finish" });
    },
  });

  return createUIMessageStreamResponse({
    stream,
    status: input.status ?? 200,
  });
}
