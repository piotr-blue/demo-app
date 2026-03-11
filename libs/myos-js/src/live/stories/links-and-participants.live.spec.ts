import { expect } from 'vitest';
import {
  LinkedDocumentsPermissionGrantedSchema,
  SingleDocumentPermissionGrantedSchema,
} from '@blue-repository/types/packages/myos/schemas';
import { describeLive, itLive } from '../../test-harness/live-mode.js';
import { getCoreOrAccountLiveGate } from '../../test-harness/live-env.js';
import {
  bootstrapDslDocument,
  createLiveClient,
  createUniqueName,
  defaultBootstrapBinding,
  extractField,
  findEmittedEventBySchema,
  extractTimelineId,
  latestEpochNumber,
  retrieveDocument,
  waitForAllowedOperation,
  waitForFieldValue,
  waitForLatestEmittedEvent,
  waitForPredicate,
} from '../helpers/index.js';
import {
  buildBaseAnchorDocument,
  buildLinkedDocument,
  buildLinkedGrantWatcherDocument,
  buildProjectBoardDocument,
} from './docs/links.docs.js';

const gate = getCoreOrAccountLiveGate();

describeLive('myos-js live stories: links + participants', gate, () => {
  itLive(
    'story-9 anchors + links are visible via links API',
    gate,
    async () => {
      const client = createLiveClient({}, gate.env);
      const binding = defaultBootstrapBinding(gate.env);

      const base = await bootstrapDslDocument(
        client,
        buildBaseAnchorDocument(
          createUniqueName('Story9 Base Anchor'),
          'orders',
        ),
        {
          ownerChannel: binding,
        },
      );

      await bootstrapDslDocument(
        client,
        buildLinkedDocument(
          createUniqueName('Story9 Linked Order'),
          'orders',
          base.sessionId,
        ),
        {
          ownerChannel: binding,
        },
      );

      const linksResponse = (await client.documents.links.list(base.sessionId, {
        anchor: 'orders',
        itemsPerPage: 50,
      })) as Record<string, unknown>;
      const linkItems = Array.isArray(linksResponse.items)
        ? linksResponse.items
        : [];
      expect(linkItems.length).toBeGreaterThan(0);
    },
  );

  itLive(
    'story-10 linked-doc permission watcher sees grants for linked sessions',
    gate,
    async () => {
      const client = createLiveClient({}, gate.env);
      const binding = defaultBootstrapBinding(gate.env);

      const base = await bootstrapDslDocument(
        client,
        buildBaseAnchorDocument(createUniqueName('Story10 Base Anchor'), 'cvs'),
        {
          ownerChannel: binding,
        },
      );

      await bootstrapDslDocument(
        client,
        buildLinkedDocument(
          createUniqueName('Story10 Linked CV Seed'),
          'cvs',
          base.sessionId,
        ),
        {
          ownerChannel: binding,
        },
      );

      const watcher = await bootstrapDslDocument(
        client,
        buildLinkedGrantWatcherDocument(
          createUniqueName('Story10 Linked Grant Watcher'),
          base.sessionId,
          'cvs',
        ),
        {
          ownerChannel: binding,
          myOsAdminChannel: { accountId: '0' },
        },
      );

      await waitForLatestEmittedEvent(
        client,
        watcher.sessionId,
        (emittedEvents) => hasLinkedGrantEvent(emittedEvents),
        {
          timeoutMs: 120_000,
          intervalMs: 2_000,
        },
      );
      const watcherAfterFirstGrant = await waitForPredicate(
        client,
        watcher.sessionId,
        (latest) => {
          const grantSeenCount = extractField(latest, '/grantSeenCount');
          const lastGrantedTargetSessionId = extractField(
            latest,
            '/lastGrantedTargetSessionId',
          );
          return (
            typeof grantSeenCount === 'number' &&
            grantSeenCount >= 1 &&
            typeof lastGrantedTargetSessionId === 'string'
          );
        },
        {
          timeoutMs: 120_000,
          intervalMs: 2_000,
        },
      );
      const firstGrantCount = extractField(
        watcherAfterFirstGrant,
        '/grantSeenCount',
      ) as number;
      const firstGrantedTargetSessionId = extractField(
        watcherAfterFirstGrant,
        '/lastGrantedTargetSessionId',
      ) as string;
      const beforeLaterLinkedEpoch = await latestEpochNumber(
        client,
        watcher.sessionId,
      );

      await bootstrapDslDocument(
        client,
        buildLinkedDocument(
          createUniqueName('Story10 Linked CV Later'),
          'cvs',
          base.sessionId,
        ),
        {
          ownerChannel: binding,
        },
      );

      await waitForLatestEmittedEvent(
        client,
        watcher.sessionId,
        (emittedEvents) => hasLinkedGrantEvent(emittedEvents),
        {
          afterEpoch: beforeLaterLinkedEpoch,
          timeoutMs: 120_000,
          intervalMs: 2_000,
        },
      );
      await waitForPredicate(
        client,
        watcher.sessionId,
        (latest) => {
          const grantSeenCount = extractField(latest, '/grantSeenCount');
          const lastGrantedTargetSessionId = extractField(
            latest,
            '/lastGrantedTargetSessionId',
          );
          return (
            typeof grantSeenCount === 'number' &&
            grantSeenCount > firstGrantCount &&
            typeof lastGrantedTargetSessionId === 'string' &&
            lastGrantedTargetSessionId !== firstGrantedTargetSessionId
          );
        },
        {
          timeoutMs: 120_000,
          intervalMs: 2_000,
        },
      );
    },
    240_000,
  );

  itLive(
    'story-11 and story-12 participants add/remove orchestration',
    gate,
    async () => {
      const client = createLiveClient({}, gate.env);
      const binding = defaultBootstrapBinding(gate.env);
      const participantEmail = gate.env.bootstrapEmail;
      expect(participantEmail).toBeTruthy();

      const projectBoard = await bootstrapDslDocument(
        client,
        buildProjectBoardDocument(createUniqueName('Story11 Project Board')),
        {
          ownerChannel: binding,
          myOsAdminChannel: { accountId: '0' },
        },
      );

      // Structure proof:
      // participants orchestration marker + reviewerGroup field are persisted.
      const projectRetrieved = await retrieveDocument(
        client,
        projectBoard.sessionId,
      );
      expect(
        extractField(
          projectRetrieved,
          '/contracts/participantsOrchestration/type',
        ),
      ).toBeTruthy();
      expect(extractField(projectRetrieved, '/reviewerGroup')).toBeTruthy();

      await waitForAllowedOperation(
        client,
        projectBoard.sessionId,
        'addReviewer',
      );
      await client.documents.runOperation(
        projectBoard.sessionId,
        'addReviewer',
        {
          channelName: 'reviewerAChannel',
          email: participantEmail,
        },
      );

      await waitForFieldValue(
        client,
        projectBoard.sessionId,
        '/lastResolvedParticipant',
        'reviewerAChannel',
        {
          timeoutMs: 120_000,
          intervalMs: 2_000,
        },
      );
      const afterAdd = await retrieveDocument(client, projectBoard.sessionId);
      const reviewerTimelineId = extractTimelineId(
        afterAdd,
        'reviewerAChannel',
      );
      const ownerTimelineId = extractTimelineId(afterAdd, 'ownerChannel');
      expect(reviewerTimelineId).toBeTruthy();
      expect(ownerTimelineId).toBeTruthy();
      expect(reviewerTimelineId).not.toBe(ownerTimelineId);
      expect(extractField(afterAdd, '/reviewerGroup')).toBeTruthy();

      await waitForAllowedOperation(
        client,
        projectBoard.sessionId,
        'removeReviewer',
      );
      await client.documents.runOperation(
        projectBoard.sessionId,
        'removeReviewer',
        {
          channelName: 'reviewerAChannel',
        },
      );

      await waitForFieldValue(
        client,
        projectBoard.sessionId,
        '/lastRemovedParticipant',
        'reviewerAChannel',
        {
          timeoutMs: 120_000,
          intervalMs: 2_000,
        },
      );
      await waitForPredicate(
        client,
        projectBoard.sessionId,
        (latest) =>
          extractField(latest, '/contracts/reviewerAChannel') === undefined &&
          !reviewerGroupContains(latest, 'reviewerAChannel'),
        {
          timeoutMs: 120_000,
          intervalMs: 2_000,
        },
      );
    },
    300_000,
  );
});

function hasLinkedGrantEvent(emittedEvents: unknown[]): boolean {
  return findLinkedGrantEvent(emittedEvents) !== undefined;
}

function findLinkedGrantEvent(
  emittedEvents: unknown[],
): CorrelatedLinkedGrantEvent | undefined {
  const linkedDocumentsGrant =
    findEmittedEventBySchema<CorrelatedLinkedGrantEvent>(
      emittedEvents,
      LinkedDocumentsPermissionGrantedSchema,
    );
  if (isCorrelatedLinkedGrantEvent(linkedDocumentsGrant)) {
    return linkedDocumentsGrant;
  }

  const singleDocumentGrant =
    findEmittedEventBySchema<CorrelatedLinkedGrantEvent>(
      emittedEvents,
      SingleDocumentPermissionGrantedSchema,
    );
  if (isCorrelatedLinkedGrantEvent(singleDocumentGrant)) {
    return singleDocumentGrant;
  }

  return undefined;
}

function isCorrelatedLinkedGrantEvent(
  event: CorrelatedLinkedGrantEvent | undefined,
): event is CorrelatedLinkedGrantEvent & {
  readonly targetSessionId: string;
} {
  const requestId =
    event?.inResponseTo?.requestId ??
    event?.inResponseTo?.incomingEvent?.requestId;
  return (
    requestId === 'REQ_LINKED_GRANTS' &&
    typeof event.targetSessionId === 'string'
  );
}

interface CorrelatedLinkedGrantEvent extends Record<string, unknown> {
  readonly inResponseTo?: {
    readonly requestId?: string;
    readonly incomingEvent?: {
      readonly requestId?: string;
    };
  };
  readonly targetSessionId?: string;
}

function reviewerGroupContains(
  retrieved: Record<string, unknown>,
  value: string,
): boolean {
  const reviewerGroup = extractField(retrieved, '/reviewerGroup');
  if (Array.isArray(reviewerGroup)) {
    return reviewerGroup.includes(value);
  }
  if (
    reviewerGroup &&
    typeof reviewerGroup === 'object' &&
    Array.isArray((reviewerGroup as Record<string, unknown>).items)
  ) {
    return ((reviewerGroup as Record<string, unknown>).items as unknown[]).some(
      (entry) =>
        entry === value ||
        (entry &&
          typeof entry === 'object' &&
          (entry as Record<string, unknown>).value === value),
    );
  }
  return false;
}
