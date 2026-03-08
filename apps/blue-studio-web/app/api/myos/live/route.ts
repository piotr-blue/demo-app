import { getLiveEventHub } from "@/lib/myos/live/hub";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function channelKey(browserId: string, accountHash: string): string {
  return `${browserId}:${accountHash}`;
}

function nextId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const browserId = url.searchParams.get("browserId")?.trim();
  const accountHash = url.searchParams.get("accountHash")?.trim();
  if (!browserId || !accountHash) {
    return new Response("Missing browserId/accountHash.", { status: 400 });
  }

  const hub = getLiveEventHub();
  const encoder = new TextEncoder();
  const clientId = nextId("sse");
  const key = channelKey(browserId, accountHash);

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      const send = (event: unknown) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
      };
      const unsubscribe = hub.addClient(key, {
        id: clientId,
        send: (event) => send(event),
        close: () => {
          try {
            controller.close();
          } catch {
            // noop
          }
        },
      });

      send({ type: "connected", browserId, accountHash });
      const pingInterval = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(": ping\n\n"));
        } catch {
          clearInterval(pingInterval);
          unsubscribe();
        }
      }, 15_000);

      request.signal.addEventListener("abort", () => {
        clearInterval(pingInterval);
        unsubscribe();
        try {
          controller.close();
        } catch {
          // noop
        }
      });
    },
  });

  return new Response(stream, {
    headers: {
      "content-type": "text/event-stream; charset=utf-8",
      "cache-control": "no-cache, no-transform",
      connection: "keep-alive",
    },
  });
}
