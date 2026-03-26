import OpenAI from "openai";

export const OPENAI_TEXT_MODEL = "gpt-5.4";

export interface OpenAiCredentialsInput {
  apiKey: string;
}

export function createOpenAiClient(credentials: OpenAiCredentialsInput): OpenAI {
  if (!credentials.apiKey?.trim()) {
    throw new Error("Missing OpenAI API key.");
  }
  return new OpenAI({
    apiKey: credentials.apiKey.trim(),
  });
}

export interface GenerateTextParams {
  systemPrompt: string;
  input: string;
  apiKey: string;
  model?: string;
}

export interface GenerateTextResult {
  text: string;
  inputTokens: number;
}

export interface StreamTextParams extends GenerateTextParams {
  onDelta?: (delta: string) => void;
}

export async function countInputTokens(params: {
  apiKey: string;
  systemPrompt: string;
  input: string;
  model?: string;
}): Promise<number> {
  const client = createOpenAiClient({ apiKey: params.apiKey });
  const response = await client.responses.inputTokens.count({
    model: params.model ?? OPENAI_TEXT_MODEL,
    input: [
      {
        role: "system",
        content: params.systemPrompt,
      },
      {
        role: "user",
        content: params.input,
      },
    ],
  });
  return response.input_tokens;
}

export async function generateTextWithResponsesApi(
  params: GenerateTextParams
): Promise<GenerateTextResult> {
  const client = createOpenAiClient({ apiKey: params.apiKey });

  const response = await client.responses.create({
    model: params.model ?? OPENAI_TEXT_MODEL,
    reasoning: {
      effort: "low",
    },
    input: [
      {
        role: "system",
        content: params.systemPrompt,
      },
      {
        role: "user",
        content: params.input,
      },
    ],
  });

  const text = response.output_text?.trim();
  if (!text) {
    throw new Error("OpenAI response did not contain output text.");
  }
  const inputTokens = response.usage?.input_tokens ?? 0;
  return { text, inputTokens };
}

export async function streamTextWithResponsesApi(
  params: StreamTextParams
): Promise<GenerateTextResult> {
  const client = createOpenAiClient({ apiKey: params.apiKey });
  const stream = await client.responses.create({
    model: params.model ?? OPENAI_TEXT_MODEL,
    reasoning: {
      effort: "low",
    },
    input: [
      {
        role: "system",
        content: params.systemPrompt,
      },
      {
        role: "user",
        content: params.input,
      },
    ],
    stream: true,
  });

  let text = "";
  let inputTokens = 0;
  let completedResponse: { output_text?: string; usage?: { input_tokens?: number } } | null = null;

  for await (const event of stream as AsyncIterable<Record<string, unknown>>) {
    if (event.type === "response.output_text.delta" && typeof event.delta === "string") {
      text += event.delta;
      params.onDelta?.(event.delta);
      continue;
    }
    if (
      event.type === "response.completed" &&
      event.response &&
      typeof event.response === "object"
    ) {
      completedResponse = event.response as {
        output_text?: string;
        usage?: { input_tokens?: number };
      };
    }
  }

  if (!text.trim() && completedResponse?.output_text?.trim()) {
    text = completedResponse.output_text.trim();
  }
  if (typeof completedResponse?.usage?.input_tokens === "number") {
    inputTokens = completedResponse.usage.input_tokens;
  }
  if (!text.trim()) {
    throw new Error("OpenAI streaming response did not contain output text.");
  }
  return { text: text.trim(), inputTokens };
}
