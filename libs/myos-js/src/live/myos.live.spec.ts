import { DocBuilder } from '@blue-labs/sdk-dsl';
import { expect } from 'vitest';
import { describeLive, itLive } from '../test-harness/live-mode.js';
import { getCoreLiveGate } from '../test-harness/live-env.js';
import { MyOsClient } from '../lib/client.js';

const gate = getCoreLiveGate();

describeLive('myos-js live integration', gate, () => {
  itLive('auth smoke via user.get and users.getByIds', gate, async () => {
    const client = createLiveClient();
    const me = await client.user.get();
    expect(me).toBeTruthy();
    const currentUserId = readString((me as Record<string, unknown>).id);
    expect(currentUserId).toBeTruthy();

    if (currentUserId) {
      const profiles = await client.users.getByIds([currentUserId]);
      expect(Array.isArray(profiles)).toBe(true);
      const profileMatch = readArray(profiles).find(
        (profile) =>
          readString((profile as Record<string, unknown>).id) === currentUserId,
      );
      expect(profileMatch).toBeTruthy();
    }
  });

  itLive(
    'counter bootstrap via sdk-dsl and runOperation increment',
    gate,
    async () => {
      const client = createLiveClient();
      const document = DocBuilder.doc()
        .name(`Counter Live ${Date.now()}`)
        .field('/counter', 0)
        .channel('ownerChannel', { type: 'MyOS/MyOS Timeline Channel' })
        .operation(
          'increment',
          'ownerChannel',
          Number,
          'Increment counter',
          (steps) =>
            steps.replaceExpression(
              'IncrementCounter',
              '/counter',
              "document('/counter') + event.message.request",
            ),
        )
        .buildDocument();

      const bootstrap = await client.documents.bootstrap(document, {
        ownerChannel: { email: gate.env.bootstrapEmail! },
      });
      const sessionId = readString(
        (bootstrap as Record<string, unknown>).sessionId,
      );
      expect(sessionId).toBeTruthy();

      const retrieved = await client.documents.retrieve(sessionId!);
      expect(retrieved).toBeTruthy();

      const operationReady = await pollUntil(
        async () => {
          const latest = await client.documents.retrieve(sessionId!);
          const allowed = readArray(
            (latest as Record<string, unknown>).allowedOperations,
          ).map((value) => String(value));
          return allowed.includes('increment') ? true : undefined;
        },
        30_000,
        1_000,
      );
      expect(operationReady).toBe(true);

      await client.documents.runOperation(sessionId!, 'increment', 1);

      const updated = await pollUntil(
        async () => {
          const latest = await client.documents.retrieve(sessionId!);
          const counter = extractCounter(latest);
          return counter === 1 ? latest : undefined;
        },
        20_000,
        1_000,
      );
      expect(updated).toBeTruthy();
      expect(extractCounter(updated)).toBe(1);
    },
  );

  itLive(
    'same-email multi-channel bootstrap yields distinct timelines',
    gate,
    async () => {
      const client = createLiveClient();
      const document = DocBuilder.doc()
        .name(`Same Email MultiChannel ${Date.now()}`)
        .field('/status', 'draft')
        .channel('ownerChannel', { type: 'MyOS/MyOS Timeline Channel' })
        .channel('reviewerChannel', { type: 'MyOS/MyOS Timeline Channel' })
        .buildDocument();

      const bootstrap = await client.documents.bootstrap(document, {
        ownerChannel: { email: gate.env.bootstrapEmail! },
        reviewerChannel: { email: gate.env.bootstrapEmail! },
      });

      const bootstrappedDoc = (bootstrap as Record<string, unknown>)
        .document as Record<string, unknown>;
      const contracts = (bootstrappedDoc?.contracts ?? {}) as Record<
        string,
        Record<string, unknown>
      >;

      const ownerTimelineId = extractTimelineId(
        contracts.ownerChannel as Record<string, unknown> | undefined,
      );
      const reviewerTimelineId = extractTimelineId(
        contracts.reviewerChannel as Record<string, unknown> | undefined,
      );

      expect(ownerTimelineId).toBeTruthy();
      expect(reviewerTimelineId).toBeTruthy();
      expect(ownerTimelineId).not.toBe(reviewerTimelineId);

      await Promise.all([
        client.timelines.retrieve(ownerTimelineId!),
        client.timelines.retrieve(reviewerTimelineId!),
      ]);
    },
  );

  itLive(
    'timelines live flow create -> retrieve -> entry -> list',
    gate,
    async () => {
      const client = createLiveClient();
      const timeline = await client.timelines.create({
        name: `myos-js live timeline ${Date.now()}`,
      });
      const timelineId = readString((timeline as Record<string, unknown>).id);
      expect(timelineId).toBeTruthy();

      const retrieved = await client.timelines.retrieve(timelineId!);
      expect((retrieved as Record<string, unknown>).id).toBe(timelineId);

      const createdEntry = await client.timelines.entries.create(timelineId!, {
        message: `entry-${Date.now()}`,
      });
      const createdEntryBlueId = readString(
        (createdEntry as Record<string, unknown>).blueId,
      );

      const listedEntries = await pollUntil(
        async () => {
          const entriesResponse = await client.timelines.entries.list(
            timelineId!,
          );
          const items = readArray(
            (entriesResponse as Record<string, unknown>).items,
          );
          if (items.length === 0) {
            return undefined;
          }
          if (!createdEntryBlueId) {
            return items;
          }
          const found = items.some(
            (item) =>
              readString((item as Record<string, unknown>).blueId) ===
              createdEntryBlueId,
          );
          return found ? items : undefined;
        },
        15_000,
        750,
      );
      expect((listedEntries ?? []).length).toBeGreaterThanOrEqual(1);
    },
  );

  itLive(
    'me/documents and myos-events visibility after bootstrap',
    gate,
    async () => {
      const client = createLiveClient();
      const document = DocBuilder.doc()
        .name(`Visibility ${Date.now()}`)
        .field('/counter', 0)
        .channel('ownerChannel', { type: 'MyOS/MyOS Timeline Channel' })
        .buildDocument();

      const bootstrap = await client.documents.bootstrap(document, {
        ownerChannel: { email: gate.env.bootstrapEmail! },
      });
      const sessionId = readString(
        (bootstrap as Record<string, unknown>).sessionId,
      );
      expect(sessionId).toBeTruthy();

      const visible = await pollUntil(
        async () => {
          const docs = await client.me.documents.list({ pageSize: 50 });
          const items = readArray((docs as Record<string, unknown>).items);
          return items.some(
            (item) =>
              readString((item as Record<string, unknown>).sessionId) ===
              sessionId,
          )
            ? docs
            : undefined;
        },
        20_000,
        1_000,
      );
      expect(visible).toBeTruthy();

      const events = await client.myOsEvents.list({ ref: sessionId! });
      expect(events).toBeTruthy();
    },
  );

  itLive('stop and resume lifecycle for a running document', gate, async () => {
    const client = createLiveClient();
    const document = DocBuilder.doc()
      .name(`Lifecycle ${Date.now()}`)
      .field('/counter', 0)
      .channel('ownerChannel', { type: 'MyOS/MyOS Timeline Channel' })
      .buildDocument();

    const bootstrap = await client.documents.bootstrap(document, {
      ownerChannel: { email: gate.env.bootstrapEmail! },
    });
    const sessionId = readString(
      (bootstrap as Record<string, unknown>).sessionId,
    );
    expect(sessionId).toBeTruthy();

    const stopResult = await client.documents.stop(sessionId!, {
      message: 'pause for lifecycle test',
    });
    expect((stopResult as Record<string, unknown>).status).toBe('PAUSED');

    const resumeResult = await client.documents.resume(sessionId!);
    expect((resumeResult as Record<string, unknown>).status).toBe('RUNNING');
  });
});

function createLiveClient(): MyOsClient {
  return new MyOsClient({
    apiKey: gate.env.apiKey!,
    baseUrl: gate.env.baseUrl,
    timeoutMs: 45_000,
    maxRetries: 2,
  });
}

function extractCounter(documentResponse: unknown): number | undefined {
  const record = documentResponse as Record<string, unknown>;
  const document = (record.document ?? {}) as Record<string, unknown>;
  const counter = document.counter;
  return typeof counter === 'number' ? counter : undefined;
}

function readString(value: unknown): string | undefined {
  return typeof value === 'string' && value.length > 0 ? value : undefined;
}

function readArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function extractTimelineId(
  channelContract: Record<string, unknown> | undefined,
): string | undefined {
  if (!channelContract) {
    return undefined;
  }
  return findFirstStringByKey(channelContract, 'timelineId');
}

function findFirstStringByKey(value: unknown, key: string): string | undefined {
  if (Array.isArray(value)) {
    for (const item of value) {
      const found = findFirstStringByKey(item, key);
      if (found) {
        return found;
      }
    }
    return undefined;
  }
  if (typeof value !== 'object' || value === null) {
    return undefined;
  }
  const objectValue = value as Record<string, unknown>;
  if (typeof objectValue[key] === 'string') {
    return objectValue[key] as string;
  }
  for (const nested of Object.values(objectValue)) {
    const found = findFirstStringByKey(nested, key);
    if (found) {
      return found;
    }
  }
  return undefined;
}

async function pollUntil<T>(
  probe: () => Promise<T | undefined>,
  timeoutMs: number,
  intervalMs: number,
): Promise<T | undefined> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const result = await probe();
    if (result !== undefined) {
      return result;
    }
    await sleep(intervalMs);
  }
  return undefined;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}
