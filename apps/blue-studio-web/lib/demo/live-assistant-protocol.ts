import { z } from "zod";
import type { LiveAssistantTurn } from "@/lib/demo/types";

const answerTurnSchema = z.object({
  t: z.literal("ans"),
  c: z.string().min(1),
});

const moreTurnSchema = z.object({
  t: z.literal("more"),
  q: z.string().min(1),
});

const docTurnSchema = z.object({
  t: z.literal("doc"),
  summ: z.string().min(1),
  doc: z.object({
    name: z.string().min(1),
    description: z.string().min(1),
  }),
});

export const liveAssistantTurnSchema = z.union([
  answerTurnSchema,
  moreTurnSchema,
  docTurnSchema,
]);

function hasStableKeyOrder(raw: string): boolean {
  const trimmed = raw.trim();
  if (trimmed.startsWith('{"t":"ans"')) {
    return /^\{\s*"t"\s*:\s*"ans"\s*,\s*"c"\s*:/u.test(trimmed);
  }
  if (trimmed.startsWith('{"t":"more"')) {
    return /^\{\s*"t"\s*:\s*"more"\s*,\s*"q"\s*:/u.test(trimmed);
  }
  if (trimmed.startsWith('{"t":"doc"')) {
    return /^\{\s*"t"\s*:\s*"doc"\s*,\s*"summ"\s*:.*"doc"\s*:\s*\{\s*"name"\s*:.*"description"\s*:/u.test(
      trimmed
    );
  }
  return false;
}

export function parseLiveAssistantTurn(raw: string): LiveAssistantTurn {
  const trimmed = raw.trim();
  if (!hasStableKeyOrder(trimmed)) {
    throw new Error("Assistant JSON keys are not in required stable order.");
  }
  const parsed = JSON.parse(trimmed) as unknown;
  return liveAssistantTurnSchema.parse(parsed);
}

export function serializeLiveAssistantTurn(turn: LiveAssistantTurn): string {
  if (turn.t === "ans") {
    return JSON.stringify({
      t: "ans",
      c: turn.c,
    });
  }
  if (turn.t === "more") {
    return JSON.stringify({
      t: "more",
      q: turn.q,
    });
  }
  return JSON.stringify({
    t: "doc",
    summ: turn.summ,
    doc: {
      name: turn.doc.name,
      description: turn.doc.description,
    },
  });
}
