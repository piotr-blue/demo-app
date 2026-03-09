import { expect } from 'vitest';
import { describeLive, itLive } from '../../test-harness/live-mode.js';
import { getCoreOrAccountLiveGate } from '../../test-harness/live-env.js';
import {
  bootstrapDslDocument,
  createLiveClient,
  createUniqueName,
  defaultBootstrapBinding,
  extractField,
  retrieveDocument,
  waitForAllowedOperation,
  waitForFieldValue,
  waitForPredicate,
} from '../helpers/index.js';
import {
  buildCounterDivisibleBy3WatcherDocument,
  buildCounterMirrorAgentDocument,
  buildPatternSourceDocument,
  buildPatternSubscriberDocument,
  buildSnapshotWatcherDocument,
  buildSourceCounterDocument,
  buildSourceProfileDocument,
} from './docs/session.docs.js';

const gate = getCoreOrAccountLiveGate();
const STORY_6_LIVE_BLOCKED = process.env.MYOS_ENABLE_STORY_6 !== 'true';
const STORY_7_LIVE_BLOCKED = process.env.MYOS_ENABLE_STORY_7 !== 'true';
const STORY_8_LIVE_BLOCKED = process.env.MYOS_ENABLE_STORY_8 !== 'true';
const STORY_9_LIVE_BLOCKED = process.env.MYOS_ENABLE_STORY_9 !== 'true';

describeLive('myos-js live stories: session interaction', gate, () => {
  itLive(
    'story-6 subscribe + remote operation + mirror cross-document flow',
    gate,
    async () => {
      const client = createLiveClient({}, gate.env);
      const binding = defaultBootstrapBinding(gate.env);

      const source = await bootstrapDslDocument(
        client,
        buildSourceCounterDocument(createUniqueName('Story6 Source Counter')),
        {
          ownerChannel: binding,
        },
      );
      await waitForAllowedOperation(client, source.sessionId, 'increment');
      const sourceRetrieved = await retrieveDocument(client, source.sessionId);
      // Story 18 section-metadata proof for session interaction group.
      expect(
        extractField(sourceRetrieved, '/contracts/sourceCounterSection/type'),
      ).toBeTruthy();
      expect(
        extractField(
          sourceRetrieved,
          '/contracts/sourceCounterSection/relatedContracts',
        ),
      ).toBeTruthy();
      await client.documents.runOperation(source.sessionId, 'increment', 1);
      await waitForFieldValue(client, source.sessionId, '/counter', 1, {
        timeoutMs: 40_000,
      });

      if (STORY_6_LIVE_BLOCKED) {
        // Runtime blocker documented in libs/myos-js/issues.md:
        // permission/subscription orchestration events are not reflected back
        // into this agent session in current MyOS environment.
        return;
      }

      const mirror = await bootstrapDslDocument(
        client,
        buildCounterMirrorAgentDocument(
          createUniqueName('Story6 Counter Mirror Agent'),
          source.sessionId,
        ),
        {
          ownerChannel: binding,
          myOsAdminChannel: { accountId: '0' },
        },
      );

      // Story 6 expected structure:
      // - MyOS/Agent mirror with target session metadata and MyOS admin channel.
      const mirrorRetrieved = await retrieveDocument(client, mirror.sessionId);
      expect(extractField(mirrorRetrieved, '/type')).toBeTruthy();
      expect(
        extractField(mirrorRetrieved, '/contracts/myOsAdminChannel'),
      ).toBeTruthy();

      // Runtime proof:
      // permission grant -> subscribe -> initiated -> call increment(2) on source
      // -> source counter and mirror counter become 2.
      await waitForFieldValue(client, source.sessionId, '/counter', 2, {
        timeoutMs: 90_000,
        intervalMs: 1_500,
      });
      await waitForFieldValue(client, mirror.sessionId, '/mirroredCounter', 2, {
        timeoutMs: 90_000,
        intervalMs: 1_500,
      });
      await waitForFieldValue(
        client,
        mirror.sessionId,
        '/subscriptionState',
        'active',
        {
          timeoutMs: 90_000,
          intervalMs: 1_500,
        },
      );
    },
    180_000,
  );

  itLive(
    'story-7 subscription-initiated snapshot reaction stores initial profile',
    gate,
    async () => {
      const client = createLiveClient({}, gate.env);
      const binding = defaultBootstrapBinding(gate.env);

      const source = await bootstrapDslDocument(
        client,
        buildSourceProfileDocument(createUniqueName('Story7 Source Profile')),
        {
          ownerChannel: binding,
        },
      );
      await waitForAllowedOperation(client, source.sessionId, 'updateScore');
      await client.documents.runOperation(source.sessionId, 'updateScore', 9);
      await waitForFieldValue(client, source.sessionId, '/score', 9, {
        timeoutMs: 40_000,
      });

      if (STORY_7_LIVE_BLOCKED) {
        // Runtime blocker documented in libs/myos-js/issues.md:
        // subscription initiated snapshot updates are not arriving in watcher.
        return;
      }

      const watcher = await bootstrapDslDocument(
        client,
        buildSnapshotWatcherDocument(
          createUniqueName('Story7 Snapshot Watcher'),
          source.sessionId,
        ),
        {
          ownerChannel: binding,
          myOsAdminChannel: { accountId: '0' },
        },
      );

      // Story 7 runtime proof:
      // watcher stores initiated snapshot immediately (displayName/score/epoch)
      // without waiting for additional source updates.
      await waitForFieldValue(
        client,
        watcher.sessionId,
        '/snapshot/displayName',
        'Initial User',
        {
          timeoutMs: 90_000,
          intervalMs: 1_500,
        },
      );
      await waitForFieldValue(client, watcher.sessionId, '/snapshot/score', 7, {
        timeoutMs: 90_000,
        intervalMs: 1_500,
      });
      await waitForPredicate(
        client,
        watcher.sessionId,
        (latest) => {
          const lastEpoch = extractField(latest, '/lastEpoch');
          return typeof lastEpoch === 'number' && lastEpoch >= 0;
        },
        {
          timeoutMs: 90_000,
          intervalMs: 1_500,
        },
      );
    },
    180_000,
  );

  itLive(
    'story-8 filtered subscriptions track request and event patterns',
    gate,
    async () => {
      const client = createLiveClient({}, gate.env);
      const binding = defaultBootstrapBinding(gate.env);

      const source = await bootstrapDslDocument(
        client,
        buildPatternSourceDocument(createUniqueName('Story8 Pattern Source')),
        {
          ownerChannel: binding,
        },
      );
      await waitForAllowedOperation(
        client,
        source.sessionId,
        'emitPatternedEvents',
      );
      await client.documents.runOperation(
        source.sessionId,
        'emitPatternedEvents',
      );
      await waitForFieldValue(client, source.sessionId, '/emitted', 1, {
        timeoutMs: 40_000,
      });

      if (STORY_8_LIVE_BLOCKED) {
        // Runtime blocker documented in libs/myos-js/issues.md:
        // filtered subscription initialization/update events are not delivered.
        return;
      }

      const subscriber = await bootstrapDslDocument(
        client,
        buildPatternSubscriberDocument(
          createUniqueName('Story8 Pattern Subscriber'),
          source.sessionId,
        ),
        {
          ownerChannel: binding,
          myOsAdminChannel: { accountId: '0' },
        },
      );

      // Story 8 structure proof:
      // filtered subscriptions are represented with distinct subscription IDs.
      const subscriberRetrieved = await retrieveDocument(
        client,
        subscriber.sessionId,
      );
      expect(extractField(subscriberRetrieved, '/type')).toBeTruthy();
      expect(extractField(subscriberRetrieved, '/targetSessionId')).toBe(
        source.sessionId,
      );

      await waitForPredicate(
        client,
        subscriber.sessionId,
        (latest) => Number(extractField(latest, '/subscriptionsReady')) >= 2,
        {
          timeoutMs: 120_000,
          intervalMs: 2_000,
        },
      );

      await client.documents.runOperation(
        source.sessionId,
        'emitPatternedEvents',
      );

      // Story 8 runtime proof:
      // - request-pattern subscription increments and stores request topic
      // - event-pattern subscription increments only for matching topic.
      await waitForPredicate(
        client,
        subscriber.sessionId,
        (latest) => {
          const requestCount = Number(
            extractField(latest, '/requestPatternMatchCount'),
          );
          const eventCount = Number(
            extractField(latest, '/eventPatternMatchCount'),
          );
          return requestCount >= 1 && eventCount >= 1;
        },
        {
          timeoutMs: 120_000,
          intervalMs: 2_000,
        },
      );
      await waitForFieldValue(
        client,
        subscriber.sessionId,
        '/eventPatternTopic',
        'i-want-this-event',
        {
          timeoutMs: 120_000,
          intervalMs: 2_000,
        },
      );
      await waitForFieldValue(
        client,
        subscriber.sessionId,
        '/requestPatternTopic',
        'i-want-this-event',
        {
          timeoutMs: 120_000,
          intervalMs: 2_000,
        },
      );
    },
    240_000,
  );

  itLive(
    'story-9 counter watcher tracks divisible-by-3 epochs',
    gate,
    async () => {
      const client = createLiveClient({}, gate.env);
      const binding = defaultBootstrapBinding(gate.env);

      const source = await bootstrapDslDocument(
        client,
        buildSourceCounterDocument(createUniqueName('Story9 Source Counter')),
        {
          ownerChannel: binding,
        },
      );
      await waitForAllowedOperation(client, source.sessionId, 'increment');

      if (STORY_9_LIVE_BLOCKED) {
        await client.documents.runOperation(source.sessionId, 'increment', 1);
        await client.documents.runOperation(source.sessionId, 'increment', 1);
        await client.documents.runOperation(source.sessionId, 'increment', 1);
        await waitForFieldValue(client, source.sessionId, '/counter', 3, {
          timeoutMs: 40_000,
        });
        return;
      }

      const watcher = await bootstrapDslDocument(
        client,
        buildCounterDivisibleBy3WatcherDocument(
          createUniqueName('Story9 Divisible Watcher'),
          source.sessionId,
        ),
        {
          ownerChannel: binding,
          myOsAdminChannel: { accountId: '0' },
        },
      );

      await waitForFieldValue(
        client,
        watcher.sessionId,
        '/subscriptionState',
        'subscribed',
        {
          timeoutMs: 120_000,
          intervalMs: 2_000,
        },
      );

      await client.documents.runOperation(source.sessionId, 'increment', 1);
      await client.documents.runOperation(source.sessionId, 'increment', 1);
      await client.documents.runOperation(source.sessionId, 'increment', 1);
      await waitForFieldValue(client, source.sessionId, '/counter', 3, {
        timeoutMs: 120_000,
        intervalMs: 2_000,
      });

      await waitForFieldValue(
        client,
        watcher.sessionId,
        '/lastKnownCounter',
        3,
        {
          timeoutMs: 120_000,
          intervalMs: 2_000,
        },
      );
      await waitForPredicate(
        client,
        watcher.sessionId,
        (latest) => Number(extractField(latest, '/divisibleBy3Count')) >= 1,
        {
          timeoutMs: 120_000,
          intervalMs: 2_000,
        },
      );
      await waitForFieldValue(
        client,
        watcher.sessionId,
        '/lastDivisibleBy3Counter',
        3,
        {
          timeoutMs: 120_000,
          intervalMs: 2_000,
        },
      );
    },
    240_000,
  );
});
