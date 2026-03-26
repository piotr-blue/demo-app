import { z } from "zod";

export const liveDocAnchorInputSchema = z.object({
  key: z.string().min(1).trim(),
  label: z.string().min(1).trim(),
  purpose: z.string().min(1).trim(),
});

export const liveDocLinkInputSchema = z.object({
  parentDocumentId: z.string().min(1).trim(),
  anchorKey: z.string().min(1).trim(),
});

export const liveDocInputSchema = z.object({
  kind: z.string().min(1).trim(),
  name: z.string().min(1).trim(),
  description: z.string().min(1).trim(),
  fields: z.record(z.string(), z.string()).default({}),
  anchors: z.array(liveDocAnchorInputSchema).default([]),
});

export const liveDocCreateBodySchema = z.object({
  doc: liveDocInputSchema,
  link: liveDocLinkInputSchema.nullable().default(null),
});

export type LiveDocAnchorInput = z.infer<typeof liveDocAnchorInputSchema>;
export type LiveDocLinkInput = z.infer<typeof liveDocLinkInputSchema>;
export type LiveDocInput = z.infer<typeof liveDocInputSchema>;
