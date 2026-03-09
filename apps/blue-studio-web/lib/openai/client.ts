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
