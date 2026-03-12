import { toOfficialJson } from '@blue-labs/sdk-dsl';
import { describe, expect, it } from 'vitest';
import {
  buildCounterDivisibleBy3WatcherDocument,
  buildCounterMirrorAgentDocument,
  buildPatternSubscriberDocument,
  buildSnapshotWatcherDocument,
} from './session.docs.js';

describe('session story docs', () => {
  it('maps story-6 mirror subscription grant correlation via inResponseTo.requestId', () => {
    const document = toOfficialJson(
      buildCounterMirrorAgentDocument(
        'Story6 Counter Mirror Agent',
        'target-session-id',
      ),
    ) as {
      contracts: Record<string, unknown>;
    };

    const contracts = document.contracts as Record<string, unknown>;
    const requestCounterAccess = contracts.requestCounterAccess as
      | {
          steps?: Array<{
            event?: unknown;
          }>;
        }
      | undefined;
    const subscribeAfterGrant = contracts.subscribeAfterGrant as
      | Record<string, unknown>
      | undefined;
    const mirrorCounterEpochUpdatesDirect =
      contracts.mirrorCounterEpochUpdatesDirect as
        | Record<string, unknown>
        | undefined;

    expect(requestCounterAccess?.steps?.[0]?.event).toMatchObject({
      type: 'MyOS/Single Document Permission Grant Requested',
      onBehalfOf: 'ownerChannel',
      requestId: 'REQ_COUNTER_ACCESS',
      targetSessionId: "${document('/targetSessionId')}",
    });

    expect(subscribeAfterGrant).toMatchObject({
      type: 'Conversation/Sequential Workflow',
      channel: 'triggeredEventChannel',
      event: {
        type: 'MyOS/Single Document Permission Granted',
        inResponseTo: {
          requestId: 'REQ_COUNTER_ACCESS',
        },
      },
    });

    expect(mirrorCounterEpochUpdatesDirect).toMatchObject({
      type: 'Conversation/Sequential Workflow',
      channel: 'triggeredEventChannel',
      event: {
        type: 'MyOS/Subscription Update',
        subscriptionId: 'SUB_COUNTER_MIRROR',
        update: {
          type: 'MyOS/Session Epoch Advanced',
        },
      },
    });
  });

  it('maps story-7 snapshot watcher grant and epoch updates via subscription update envelopes', () => {
    const document = toOfficialJson(
      buildSnapshotWatcherDocument(
        'Story7 Snapshot Watcher',
        'target-session-id',
      ),
    ) as {
      contracts: Record<string, unknown>;
    };

    const contracts = document.contracts as Record<string, unknown>;
    const requestSnapshotAccess = contracts.requestSnapshotAccess as
      | {
          steps?: Array<{
            event?: unknown;
          }>;
        }
      | undefined;
    const subscribeProfileAfterGrant = contracts.subscribeProfileAfterGrant as
      | Record<string, unknown>
      | undefined;
    const storeEpochAdvancedSnapshotDirect =
      contracts.storeEpochAdvancedSnapshotDirect as
        | Record<string, unknown>
        | undefined;

    expect(requestSnapshotAccess?.steps?.[0]?.event).toMatchObject({
      type: 'MyOS/Single Document Permission Grant Requested',
      onBehalfOf: 'ownerChannel',
      requestId: 'REQ_PROFILE_ACCESS',
      targetSessionId: "${document('/targetSessionId')}",
    });

    expect(subscribeProfileAfterGrant).toMatchObject({
      type: 'Conversation/Sequential Workflow',
      channel: 'triggeredEventChannel',
      event: {
        type: 'MyOS/Single Document Permission Granted',
        inResponseTo: {
          requestId: 'REQ_PROFILE_ACCESS',
        },
      },
    });

    expect(storeEpochAdvancedSnapshotDirect).toMatchObject({
      type: 'Conversation/Sequential Workflow',
      channel: 'triggeredEventChannel',
      event: {
        type: 'MyOS/Subscription Update',
        subscriptionId: 'SUB_PROFILE_SNAPSHOT',
        update: {
          type: 'MyOS/Session Epoch Advanced',
        },
      },
    });
  });

  it('maps story-8 pattern subscriber via grant correlation and subscription update envelopes', () => {
    const document = toOfficialJson(
      buildPatternSubscriberDocument(
        'Story8 Pattern Subscriber',
        'target-session-id',
      ),
    ) as {
      contracts: Record<string, unknown>;
    };

    const contracts = document.contracts as Record<string, unknown>;
    const requestPatternAccess = contracts.requestPatternAccess as
      | {
          steps?: Array<{
            event?: unknown;
          }>;
        }
      | undefined;
    const subscribePatternAfterGrant = contracts.subscribePatternAfterGrant as
      | Record<string, unknown>
      | undefined;
    const onEventPatternMatchedDirect = contracts.onEventPatternMatchedDirect as
      | Record<string, unknown>
      | undefined;
    const onRequestPatternMatchedDirect =
      contracts.onRequestPatternMatchedDirect as
        | Record<string, unknown>
        | undefined;

    expect(requestPatternAccess?.steps?.[0]?.event).toMatchObject({
      type: 'MyOS/Single Document Permission Grant Requested',
      onBehalfOf: 'ownerChannel',
      requestId: 'REQ_PATTERN_ACCESS',
      targetSessionId: "${document('/targetSessionId')}",
    });

    expect(subscribePatternAfterGrant).toMatchObject({
      type: 'Conversation/Sequential Workflow',
      channel: 'triggeredEventChannel',
      event: {
        type: 'MyOS/Single Document Permission Granted',
        inResponseTo: {
          requestId: 'REQ_PATTERN_ACCESS',
        },
      },
    });

    expect(onEventPatternMatchedDirect).toMatchObject({
      type: 'Conversation/Sequential Workflow',
      channel: 'triggeredEventChannel',
      event: {
        type: 'MyOS/Subscription Update',
        subscriptionId: 'SUB_EVENT_PATTERN',
        update: {
          type: 'Conversation/Event',
        },
      },
    });

    expect(onRequestPatternMatchedDirect).toMatchObject({
      type: 'Conversation/Sequential Workflow',
      channel: 'triggeredEventChannel',
      event: {
        type: 'MyOS/Subscription Update',
        subscriptionId: 'SUB_REQUEST_PATTERN',
        update: {
          type: 'Conversation/Request',
        },
      },
    });
  });

  it('maps story-9 divisible watcher epoch handler via subscription update envelope', () => {
    const document = toOfficialJson(
      buildCounterDivisibleBy3WatcherDocument(
        'Story9 Divisible Watcher',
        'target-session-id',
      ),
    ) as {
      contracts: Record<string, unknown>;
    };

    const contracts = document.contracts as Record<string, unknown>;
    const captureDivisibleBy3CounterEpoch =
      contracts.captureDivisibleBy3CounterEpoch as
        | Record<string, unknown>
        | undefined;

    expect(captureDivisibleBy3CounterEpoch).toMatchObject({
      type: 'Conversation/Sequential Workflow',
      channel: 'triggeredEventChannel',
      event: {
        type: 'MyOS/Subscription Update',
        subscriptionId: 'SUB_ACCESS_COUNTERACCESS',
        update: {
          type: 'MyOS/Session Epoch Advanced',
        },
      },
    });
  });
});
