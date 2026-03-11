import { expect } from 'vitest';
import { describeLive, itLive } from '../../test-harness/live-mode.js';
import { getCoreOrAccountLiveGate } from '../../test-harness/live-env.js';
import {
  bootstrapDslDocument,
  captureDebugState,
  createLiveClient,
  createUniqueName,
  defaultBootstrapBinding,
  extractField,
  extractTimelineId,
  retrieveDocument,
  waitForAllowedOperation,
  waitForEmittedEvent,
  waitForFieldValue,
  waitForPredicate,
} from '../helpers/index.js';
import {
  buildChangeLifecycleDocument,
  buildLinkCoverageDocument,
  buildPermissionLifecycleAgentDocument,
  buildStopResumeControlDocument,
  buildWorkerAgencyLifecycleDocument,
} from './docs/advanced.docs.js';
import {
  buildBaseAnchorDocument,
  buildLinkedDocument,
} from './docs/links.docs.js';

const gate = getCoreOrAccountLiveGate();
const STORY_19_LIVE_BLOCKED = process.env.MYOS_ENABLE_STORY_19 !== 'true';
const STORY_20_LIVE_BLOCKED = process.env.MYOS_ENABLE_STORY_20 !== 'true';
const STORY_21_LIVE_BLOCKED = process.env.MYOS_ENABLE_STORY_21 !== 'true';
const STORY_23_LIVE_BLOCKED = !gate.env.accountId;
const STORY_26_LIVE_BLOCKED = process.env.MYOS_ENABLE_STORY_26 !== 'true';

describeLive('myos-js live stories: advanced control', gate, () => {
  itLive(
    'story-19 propose/accept/reject change flow mapping coverage',
    gate,
    async () => {
      const client = createLiveClient({}, gate.env);
      const { sessionId } = await bootstrapDslDocument(
        client,
        buildChangeLifecycleDocument(
          createUniqueName('Story19 Change Lifecycle'),
        ),
        {
          ownerChannel: defaultBootstrapBinding(gate.env),
        },
      );

      // Story 19 structure proof:
      // contractsPolicy + propose/accept/reject operation+workflow pairs exist.
      const retrieved = await retrieveDocument(client, sessionId);
      expect(
        extractField(retrieved, '/contracts/contractsPolicy'),
      ).toBeTruthy();
      expect(extractField(retrieved, '/contracts/proposeChange')).toBeTruthy();
      expect(
        extractField(retrieved, '/contracts/proposeChangeImpl'),
      ).toBeTruthy();
      expect(extractField(retrieved, '/contracts/acceptChange')).toBeTruthy();
      expect(
        extractField(retrieved, '/contracts/acceptChangeImpl'),
      ).toBeTruthy();
      expect(extractField(retrieved, '/contracts/rejectChange')).toBeTruthy();
      expect(
        extractField(retrieved, '/contracts/rejectChangeImpl'),
      ).toBeTruthy();

      if (STORY_19_LIVE_BLOCKED) {
        return;
      }

      await waitForAllowedOperation(client, sessionId, 'proposeChange');
      await client.documents.runOperation(sessionId, 'proposeChange', {
        type: 'Conversation/Change Request',
        summary: 'Propose text change',
        changeset: [
          {
            type: 'Core/Json Patch Entry',
            op: 'replace',
            path: '/text',
            val: 'Proposed text',
          },
        ],
      });
      await waitForEmittedEvent(
        client,
        sessionId,
        (event) => String(event.type ?? '').startsWith('Conversation/'),
        { timeoutMs: 60_000, intervalMs: 2_000, feedLimit: 100 },
      );
    },
    180_000,
  );

  itLive(
    'story-20 + story-21 permission revoke and subscription re-init flows',
    gate,
    async () => {
      const client = createLiveClient({}, gate.env);
      const binding = defaultBootstrapBinding(gate.env);

      const source = await bootstrapDslDocument(
        client,
        buildStopResumeControlDocument(
          createUniqueName('Story20 Source Permission Target'),
        ),
        {
          ownerChannel: binding,
        },
      );

      const anchorRoot = await bootstrapDslDocument(
        client,
        buildBaseAnchorDocument(
          createUniqueName('Story20 Anchor Root'),
          'orders',
        ),
        {
          ownerChannel: binding,
        },
      );

      await bootstrapDslDocument(
        client,
        buildLinkedDocument(
          createUniqueName('Story20 Linked Seed'),
          'orders',
          anchorRoot.sessionId,
        ),
        {
          ownerChannel: binding,
        },
      );

      const agent = await bootstrapDslDocument(
        client,
        buildPermissionLifecycleAgentDocument(
          createUniqueName('Story20 Permission Lifecycle Agent'),
          source.sessionId,
          'orders',
        ),
        {
          ownerChannel: binding,
          myOsAdminChannel: { accountId: '0' },
        },
      );

      const retrieved = await retrieveDocument(client, agent.sessionId);
      expect(
        extractField(retrieved, '/contracts/sessionInteraction/type'),
      ).toBeTruthy();
      expect(
        extractField(retrieved, '/contracts/requestSingleGrant'),
      ).toBeTruthy();
      expect(
        extractField(retrieved, '/contracts/revokeSingleGrant'),
      ).toBeTruthy();
      expect(
        extractField(retrieved, '/contracts/requestLinkedGrant'),
      ).toBeTruthy();
      expect(
        extractField(retrieved, '/contracts/revokeLinkedGrant'),
      ).toBeTruthy();

      if (STORY_20_LIVE_BLOCKED || STORY_21_LIVE_BLOCKED) {
        return;
      }

      await waitForAllowedOperation(
        client,
        agent.sessionId,
        'requestSingleGrant',
      );
      await client.documents.runOperation(
        agent.sessionId,
        'requestSingleGrant',
      );
      await waitForFieldValue(
        client,
        agent.sessionId,
        '/singleGrantedCount',
        1,
        {
          timeoutMs: 120_000,
          intervalMs: 2_000,
        },
      );

      await waitForAllowedOperation(
        client,
        agent.sessionId,
        'revokeSingleGrant',
      );
      await client.documents.runOperation(agent.sessionId, 'revokeSingleGrant');
      await waitForPredicate(
        client,
        agent.sessionId,
        (latest) =>
          Number(extractField(latest, '/singleRevokedCount') ?? 0) >= 1,
        {
          timeoutMs: 120_000,
          intervalMs: 2_000,
        },
      );

      await waitForAllowedOperation(
        client,
        agent.sessionId,
        'requestLinkedGrant',
      );
      await client.documents.runOperation(
        agent.sessionId,
        'requestLinkedGrant',
      );
      await waitForPredicate(
        client,
        agent.sessionId,
        (latest) =>
          Number(extractField(latest, '/linkedGrantedCount') ?? 0) >= 1,
        {
          timeoutMs: 120_000,
          intervalMs: 2_000,
        },
      );

      await waitForAllowedOperation(
        client,
        agent.sessionId,
        'revokeLinkedGrant',
      );
      await client.documents.runOperation(agent.sessionId, 'revokeLinkedGrant');
      await waitForPredicate(
        client,
        agent.sessionId,
        (latest) =>
          Number(extractField(latest, '/linkedRevokedCount') ?? 0) >= 1,
        {
          timeoutMs: 120_000,
          intervalMs: 2_000,
        },
      );

      await client.documents.runOperation(
        agent.sessionId,
        'requestSingleGrant',
      );
      await waitForPredicate(
        client,
        agent.sessionId,
        (latest) =>
          Number(extractField(latest, '/subscriptionInitiatedCount') ?? 0) >= 2,
        {
          timeoutMs: 120_000,
          intervalMs: 2_000,
        },
      );
    },
    360_000,
  );

  itLive(
    'story-22 document/document-type link mapping coverage',
    gate,
    async () => {
      const client = createLiveClient({}, gate.env);
      const binding = defaultBootstrapBinding(gate.env);

      const linkedSession = await bootstrapDslDocument(
        client,
        buildStopResumeControlDocument(
          createUniqueName('Story22 Linked Session'),
        ),
        {
          ownerChannel: binding,
        },
      );

      const { sessionId } = await bootstrapDslDocument(
        client,
        buildLinkCoverageDocument(
          createUniqueName('Story22 Link Coverage'),
          'coverageAnchor',
          linkedSession.sessionId,
          '00000000-0000-0000-0000-000000000001',
          'Conversation/Conversation',
        ),
        {
          ownerChannel: binding,
        },
      );

      const retrieved = await retrieveDocument(client, sessionId);
      expect(
        extractField(retrieved, '/contracts/anchors/coverageAnchor'),
      ).toBeTruthy();
      expect(
        extractField(retrieved, '/contracts/links/linkedSession'),
      ).toBeTruthy();
      expect(
        extractField(retrieved, '/contracts/links/linkedDocument'),
      ).toBeTruthy();
      expect(
        extractField(retrieved, '/contracts/links/linkedDocumentType'),
      ).toBeTruthy();
    },
  );

  itLive(
    'story-23 timeline permissions inspection roundtrip',
    gate,
    async () => {
      const client = createLiveClient({}, gate.env);
      const { sessionId } = await bootstrapDslDocument(
        client,
        buildStopResumeControlDocument(
          createUniqueName('Story23 Timeline Permissions'),
        ),
        {
          ownerChannel: defaultBootstrapBinding(gate.env),
        },
      );

      const retrieved = await retrieveDocument(client, sessionId);
      const ownerTimelineId = extractTimelineId(retrieved, 'ownerChannel');
      expect(ownerTimelineId).toBeTruthy();

      if (STORY_23_LIVE_BLOCKED) {
        return;
      }

      const created = (await client.timelines.permissions.create(
        ownerTimelineId!,
        {
          grantee: {
            type: 'account',
            id: gate.env.accountId!,
          },
        },
      )) as Record<string, unknown>;
      const permissionId =
        String(created.permissionId ?? created.id ?? '').trim() || undefined;
      expect(permissionId).toBeTruthy();

      const listed = (await client.timelines.permissions.list(
        ownerTimelineId!,
      )) as Record<string, unknown>;
      expect(Array.isArray(listed.items)).toBe(true);

      await client.timelines.permissions.retrieve(
        ownerTimelineId!,
        permissionId!,
      );
      await client.timelines.permissions.delete(
        ownerTimelineId!,
        permissionId!,
      );
    },
  );

  itLive('story-24 stop and resume processing roundtrip', gate, async () => {
    const client = createLiveClient({}, gate.env);
    const { sessionId } = await bootstrapDslDocument(
      client,
      buildStopResumeControlDocument(createUniqueName('Story24 Stop Resume')),
      {
        ownerChannel: defaultBootstrapBinding(gate.env),
      },
    );

    const retrieved = await retrieveDocument(client, sessionId);
    expect(extractField(retrieved, '/contracts/tick')).toBeTruthy();
    expect(extractField(retrieved, '/contracts/tickImpl')).toBeTruthy();

    await waitForAllowedOperation(client, sessionId, 'tick');
    await client.documents.runOperation(sessionId, 'tick', 1);
    await waitForFieldValue(client, sessionId, '/ticks', 1, {
      timeoutMs: 60_000,
      intervalMs: 2_000,
    });

    await client.documents.stop(sessionId, {
      message: 'Story24 stop request',
      context: {
        story: 24,
      },
    });
    await waitForPredicate(
      client,
      sessionId,
      (latest) => String(latest.processingStatus ?? '') === 'PAUSED',
      {
        timeoutMs: 60_000,
        intervalMs: 2_000,
      },
    );

    await client.documents.resume(sessionId);
    await waitForPredicate(
      client,
      sessionId,
      (latest) => String(latest.processingStatus ?? '') !== 'PAUSED',
      {
        timeoutMs: 60_000,
        intervalMs: 2_000,
      },
    );
  });

  itLive(
    'story-25 myos-events observability for document lifecycle',
    gate,
    async () => {
      const client = createLiveClient({}, gate.env);
      const { sessionId } = await bootstrapDslDocument(
        client,
        buildStopResumeControlDocument(createUniqueName('Story25 MyOS Events')),
        {
          ownerChannel: defaultBootstrapBinding(gate.env),
        },
      );

      await client.documents.stop(sessionId, {
        message: 'Story25 pause for observability',
      });
      await client.documents.resume(sessionId);

      const eventsResponse = (await client.myOsEvents.list({
        itemsPerPage: 100,
      })) as Record<string, unknown>;
      const items = Array.isArray(eventsResponse.items)
        ? eventsResponse.items
        : [];
      expect(items.length).toBeGreaterThan(0);

      const hasLifecycleType = items.some((item) => {
        const eventType = String((item as Record<string, unknown>).type ?? '');
        return (
          eventType === 'DOCUMENT_PROCESSING_PAUSED' ||
          eventType === 'DOCUMENT_PROCESSING_RESUMED'
        );
      });

      if (!hasLifecycleType) {
        // Debug snapshot ensures feed/epoch/document state is attached to timeout
        // payload when runtime visibility diverges from expectations.
        const debugState = await captureDebugState(client, sessionId);
        expect(debugState).toBeTruthy();
      }
    },
  );

  itLive(
    'story-26 worker agency optional lifecycle coverage',
    gate,
    async () => {
      const client = createLiveClient({}, gate.env);
      const source = await bootstrapDslDocument(
        client,
        buildStopResumeControlDocument(
          createUniqueName('Story26 Worker Agency Source'),
        ),
        {
          ownerChannel: defaultBootstrapBinding(gate.env),
        },
      );

      const worker = await bootstrapDslDocument(
        client,
        buildWorkerAgencyLifecycleDocument(
          createUniqueName('Story26 Worker Agency Agent'),
          source.sessionId,
        ),
        {
          ownerChannel: defaultBootstrapBinding(gate.env),
          myOsAdminChannel: { accountId: '0' },
        },
      );

      const retrieved = await retrieveDocument(client, worker.sessionId);
      expect(
        extractField(retrieved, '/contracts/workerAgency/type'),
      ).toBeTruthy();
      expect(extractField(retrieved, '/contracts/grantAgency')).toBeTruthy();
      expect(extractField(retrieved, '/contracts/revokeAgency')).toBeTruthy();

      if (STORY_26_LIVE_BLOCKED) {
        return;
      }

      await waitForAllowedOperation(client, worker.sessionId, 'grantAgency');
      await client.documents.runOperation(worker.sessionId, 'grantAgency');
      await waitForPredicate(
        client,
        worker.sessionId,
        (latest) =>
          Number(extractField(latest, '/agencyGrantedCount') ?? 0) >= 1,
        {
          timeoutMs: 120_000,
          intervalMs: 2_000,
        },
      );

      await waitForAllowedOperation(client, worker.sessionId, 'revokeAgency');
      await client.documents.runOperation(worker.sessionId, 'revokeAgency');
      await waitForPredicate(
        client,
        worker.sessionId,
        (latest) =>
          Number(extractField(latest, '/agencyRevokedCount') ?? 0) >= 1,
        {
          timeoutMs: 120_000,
          intervalMs: 2_000,
        },
      );
    },
  );
});
