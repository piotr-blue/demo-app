import { NextResponse } from "next/server";
import { extractWebhookInvalidation } from "@/lib/myos/live/extract";
import { getLiveEventHub } from "@/lib/myos/live/hub";
import { getLiveStore } from "@/lib/myos/live/store";
import { verifyIncomingWebhookRequest } from "@/lib/myos/live/verify";
import type { LiveInvalidationEvent } from "@/lib/myos/live/types";
import { safeErrorMessage } from "@/lib/security/redact";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function channelKey(browserId: string, accountHash: string): string {
  return `${browserId}:${accountHash}`;
}

export async function POST(
  request: Request,
  context: { params: Promise<{ registrationId: string }> }
) {
  try {
    const { registrationId } = await context.params;
    const store = getLiveStore();
    const registration = await store.getRegistrationById(registrationId);
    if (!registration) {
      return NextResponse.json(
        { ok: false, error: "Unknown webhook registration." },
        { status: 404 }
      );
    }

    const rawBody = await request.text();
    const verification = await verifyIncomingWebhookRequest({
      request,
      rawBody,
      myOsBaseUrl: registration.myOsBaseUrl,
    });
    if (!verification.ok) {
      return NextResponse.json(
        { ok: false, error: verification.error },
        { status: 401 }
      );
    }

    const deliveryId = request.headers.get("x-myos-delivery-id");
    if (!deliveryId || deliveryId.trim().length === 0) {
      return NextResponse.json(
        { ok: false, error: "Missing delivery id." },
        { status: 400 }
      );
    }

    const firstSeen = await store.markDeliverySeen(deliveryId);
    if (!firstSeen) {
      return NextResponse.json(
        { ok: false, error: "Duplicate delivery id." },
        { status: 409 }
      );
    }

    const payload = rawBody.length > 0 ? (JSON.parse(rawBody) as unknown) : {};
    const extracted = extractWebhookInvalidation(payload);
    if (!extracted.sessionId) {
      return NextResponse.json({
        ok: true,
        delivered: false,
        reason: "No sessionId present in webhook payload.",
      });
    }

    const event: LiveInvalidationEvent = {
      type: "myos-epoch-advanced",
      sessionId: extracted.sessionId,
      eventId: extracted.eventId,
      epoch: extracted.epoch,
      deliveryId,
      registrationId,
    };

    const subscriptions = await store.listSubscriptionsByAccount(registration.accountHash);
    const matching = subscriptions.filter((subscription) =>
      subscription.sessionIds.includes(extracted.sessionId as string)
    );

    const hub = getLiveEventHub();
    let deliveredCount = 0;
    for (const subscription of matching) {
      deliveredCount += hub.publish(
        channelKey(subscription.browserId, subscription.accountHash),
        event
      );
    }

    return NextResponse.json({
      ok: true,
      delivered: deliveredCount > 0,
      matchingSubscriptions: matching.length,
      deliveredConnections: deliveredCount,
    });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: safeErrorMessage(error) },
      { status: 400 }
    );
  }
}
