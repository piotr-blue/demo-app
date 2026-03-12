import { Blue } from '@blue-labs/language';
import { repository as blueRepository } from '@blue-repository/types';
import { CaptureFundsRequestedSchema } from '@blue-repository/types/packages/paynote/schemas';
import { describe, expect, it } from 'vitest';
import type { MyOsClient } from '../../lib/client.js';
import {
  findEmittedEventBySchema,
  latestEmittedEvents,
  waitForLatestEmittedEvent,
  waitForLatestEmittedEventBySchema,
} from './live-document.js';

const blue = new Blue({
  repositories: [blueRepository],
});

function createClient(options: {
  epochsList: (sessionId: string) => Promise<Record<string, unknown>>;
  epochRetrieve: (
    sessionId: string,
    epoch: number | string,
  ) => Promise<Record<string, unknown>>;
  feedEntriesList?: (sessionId: string) => Promise<Record<string, unknown>>;
}): MyOsClient {
  return {
    documents: {
      epochs: {
        list: options.epochsList,
        retrieve: options.epochRetrieve,
      },
      feedEntries: {
        list:
          options.feedEntriesList ??
          (async () => ({
            items: [],
          })),
      },
    },
  } as unknown as MyOsClient;
}

describe('live-document helpers', () => {
  it('reads latest emitted events from the latest epoch snapshot, not feed entries', async () => {
    const client = createClient({
      epochsList: async () => ({
        items: [{ epoch: 3 }, { epoch: 2 }],
      }),
      epochRetrieve: async (_sessionId, epoch) => ({
        epoch,
        emitted: [
          {
            type: 'PayNote/Capture Funds Requested',
          },
        ],
      }),
      feedEntriesList: async () => ({
        items: [
          {
            message: {
              type: 'Conversation/Status Change',
            },
          },
        ],
      }),
    });

    await expect(latestEmittedEvents(client, 'session-1')).resolves.toEqual([
      {
        type: 'PayNote/Capture Funds Requested',
      },
    ]);
  });

  it('waits for a matching emitted event only after the requested epoch boundary', async () => {
    const epochs = [
      {
        epoch: 1,
        emitted: [{ type: 'PayNote/Card Transaction Capture Lock Requested' }],
      },
      {
        epoch: 2,
        emitted: [
          { type: 'PayNote/Card Transaction Capture Unlock Requested' },
        ],
      },
    ];
    let pollCount = 0;

    const client = createClient({
      epochsList: async () => {
        pollCount += 1;
        const latestEpoch = pollCount === 1 ? 1 : 2;
        return {
          items: [{ epoch: latestEpoch }],
        };
      },
      epochRetrieve: async (_sessionId, epoch) => {
        const snapshot = epochs.find((item) => item.epoch === Number(epoch));
        if (!snapshot) {
          throw new Error(`Unexpected epoch ${String(epoch)}`);
        }
        return snapshot;
      },
    });

    const snapshot = await waitForLatestEmittedEvent(
      client,
      'session-1',
      (events) =>
        events.some(
          (event) =>
            (event as Record<string, unknown>).type ===
            'PayNote/Card Transaction Capture Unlock Requested',
        ),
      {
        afterEpoch: 1,
        timeoutMs: 100,
        intervalMs: 0,
      },
    );

    expect(snapshot.epoch).toBe(2);
    expect(pollCount).toBeGreaterThanOrEqual(2);
  });

  it('matches emitted events by schema against raw BlueJson values', async () => {
    const rawEvent = blue.nodeToJson(
      blue.jsonValueToNode({
        type: 'PayNote/Capture Funds Requested',
        requestId: 'capture-1',
      }),
      'official',
    );

    const event = findEmittedEventBySchema<Record<string, unknown>>(
      [rawEvent],
      CaptureFundsRequestedSchema,
    );

    expect(event).toBeDefined();
    expect(event?.requestId).toBe('capture-1');
  });

  it('waits for schema-matched emitted events after an epoch boundary', async () => {
    const epochs = [
      {
        epoch: 1,
        emitted: [
          blue.nodeToJson(
            blue.jsonValueToNode({
              type: 'PayNote/Capture Funds Requested',
              requestId: 'capture-1',
            }),
            'official',
          ),
        ],
      },
      {
        epoch: 2,
        emitted: [
          blue.nodeToJson(
            blue.jsonValueToNode({
              type: 'PayNote/Capture Funds Requested',
              requestId: 'capture-2',
            }),
            'official',
          ),
        ],
      },
    ];
    let pollCount = 0;

    const client = createClient({
      epochsList: async () => {
        pollCount += 1;
        return {
          items: [{ epoch: pollCount === 1 ? 1 : 2 }],
        };
      },
      epochRetrieve: async (_sessionId, epoch) => {
        const snapshot = epochs.find((item) => item.epoch === Number(epoch));
        if (!snapshot) {
          throw new Error(`Unexpected epoch ${String(epoch)}`);
        }
        return snapshot;
      },
    });

    const result = await waitForLatestEmittedEventBySchema(
      client,
      'session-1',
      CaptureFundsRequestedSchema,
      {
        afterEpoch: 1,
        timeoutMs: 100,
        intervalMs: 0,
        predicate: (event) => event.requestId === 'capture-2',
      },
    );

    expect(result.epochSnapshot.epoch).toBe(2);
    expect(result.event.requestId).toBe('capture-2');
  });
});
