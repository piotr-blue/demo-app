import { z } from "zod";
import type { StatusTemplateBundle } from "@/lib/workspace/types";

const templateSchema = z.object({
  when: z.string().min(1),
  title: z.string().min(1),
  body: z.string().min(1),
});

const payloadSchema = z.object({
  viewer: z.string().min(1),
  templates: z.array(templateSchema).min(1).max(15),
});

function stripJsonFence(raw: string): string {
  const trimmed = raw.trim();
  const fenced = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  return fenced?.[1]?.trim() ?? trimmed;
}

export function parseStatusTemplatePayload(raw: string): z.infer<typeof payloadSchema> {
  const normalized = stripJsonFence(raw);
  const parsed = JSON.parse(normalized) as unknown;
  const payload = payloadSchema.parse(parsed);
  const last = payload.templates[payload.templates.length - 1];
  if (!last || last.when.trim() !== "true") {
    throw new Error("Status templates must end with a fallback template where when === \"true\".");
  }
  return payload;
}

export function parseStatusTemplateBundle(params: {
  raw: string;
  blueprintHash: string;
  generatedAt?: string;
}): StatusTemplateBundle {
  const payload = parseStatusTemplatePayload(params.raw);
  return {
    viewer: payload.viewer,
    blueprintHash: params.blueprintHash,
    templates: payload.templates,
    generatedAt: params.generatedAt ?? new Date().toISOString(),
  };
}

