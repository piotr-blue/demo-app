import { expect } from 'vitest';
import { MyOsClient } from '../lib/client.js';
import {
  getSystemLiveGate,
  getWebhookLiveGate,
} from '../test-harness/live-env.js';
import { describeLive, itLive } from '../test-harness/live-mode.js';

const systemGate = getSystemLiveGate();
const webhookGate = getWebhookLiveGate();

describeLive('myos-js maintenance live (system gated)', systemGate, () => {
  itLive(
    'maintenance endpoints work with system api key',
    systemGate,
    async () => {
      const client = new MyOsClient({
        apiKey: systemGate.env.systemApiKey!,
        baseUrl: systemGate.env.baseUrl,
      });

      const expired = await client.maintenance.createExpiredIdempotency({
        key: `sdk-live-${Date.now()}`,
      });
      expect(expired).toBeTruthy();

      const cleanup = await client.maintenance.cleanupIdempotency({
        batchSize: 10,
        maxBatches: 1,
      });
      expect(cleanup).toBeTruthy();

      const outbox = await client.maintenance.flushOutbox({
        batchSize: 10,
        maxBatches: 1,
      });
      expect(outbox).toBeTruthy();
    },
  );
});

describeLive('myos-js webhooks live (url gated)', webhookGate, () => {
  itLive('create/list/update/delete webhook flow', webhookGate, async () => {
    const client = new MyOsClient({
      apiKey: webhookGate.env.apiKey!,
      baseUrl: webhookGate.env.baseUrl,
    });

    const created = await client.webhooks.create({
      type: 'HTTPS',
      status: 'ACTIVE',
      settings: {
        url: webhookGate.env.webhookTestUrl!,
      },
      myOSEventTypes: ['DOCUMENT_CREATED'],
    });
    const webhookId = readString((created as Record<string, unknown>).id);
    expect(webhookId).toBeTruthy();

    try {
      const listed = await client.webhooks.list({ itemsPerPage: 20 });
      const listItems = readArray((listed as Record<string, unknown>).items);
      expect(
        listItems.some(
          (item) =>
            readString((item as Record<string, unknown>).id) === webhookId,
        ),
      ).toBe(true);

      const updated = await client.webhooks.update(webhookId!, {
        type: 'HTTPS',
        status: 'INACTIVE',
        settings: {
          url: webhookGate.env.webhookTestUrl!,
        },
        myOSEventTypes: ['DOCUMENT_CREATED'],
      });
      expect((updated as Record<string, unknown>).id).toBe(webhookId);
    } finally {
      await client.webhooks.del(webhookId!);
    }
  });
});

function readString(value: unknown): string | undefined {
  return typeof value === 'string' && value.length > 0 ? value : undefined;
}

function readArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}
