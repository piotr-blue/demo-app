import { NextResponse } from "next/server";
import { z } from "zod";
import { getLiveStore } from "@/lib/myos/live/store";
import { safeErrorMessage } from "@/lib/security/redact";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const requestSchema = z.object({
  browserId: z.string().min(1),
  accountHash: z.string().min(1),
  sessionIds: z.array(z.string()).default([]),
  threadIds: z.array(z.string()).default([]),
});

export async function POST(request: Request) {
  try {
    const body = requestSchema.parse(await request.json());
    const sessionIds = [...new Set(body.sessionIds.map((entry) => entry.trim()).filter(Boolean))];
    const threadIds = [...new Set(body.threadIds.map((entry) => entry.trim()).filter(Boolean))];
    const store = getLiveStore();
    await store.upsertSubscription({
      browserId: body.browserId,
      accountHash: body.accountHash,
      sessionIds,
      threadIds,
      heartbeatAt: new Date().toISOString(),
    });
    return NextResponse.json({
      ok: true,
      sessionCount: sessionIds.length,
      threadCount: threadIds.length,
    });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: safeErrorMessage(error) },
      { status: 400 }
    );
  }
}
