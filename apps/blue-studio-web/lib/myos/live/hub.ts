import type { LiveInvalidationEvent } from "@/lib/myos/live/types";

type Client = {
  id: string;
  send: (event: LiveInvalidationEvent) => void;
  close: () => void;
};

class LiveEventHub {
  private readonly clientsByChannel = new Map<string, Map<string, Client>>();

  addClient(channelKey: string, client: Client) {
    const existing = this.clientsByChannel.get(channelKey) ?? new Map<string, Client>();
    existing.set(client.id, client);
    this.clientsByChannel.set(channelKey, existing);
    return () => {
      const current = this.clientsByChannel.get(channelKey);
      if (!current) {
        return;
      }
      current.delete(client.id);
      if (current.size === 0) {
        this.clientsByChannel.delete(channelKey);
      }
    };
  }

  publish(channelKey: string, event: LiveInvalidationEvent) {
    const clients = this.clientsByChannel.get(channelKey);
    if (!clients) {
      return 0;
    }
    for (const client of clients.values()) {
      client.send(event);
    }
    return clients.size;
  }
}

declare global {
  var __blueStudioLiveHub: LiveEventHub | undefined;
}

export function getLiveEventHub(): LiveEventHub {
  if (!globalThis.__blueStudioLiveHub) {
    globalThis.__blueStudioLiveHub = new LiveEventHub();
  }
  return globalThis.__blueStudioLiveHub;
}
