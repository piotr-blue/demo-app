import { toOfficialJson } from '@blue-labs/sdk-dsl';
import { describe, expect, it } from 'vitest';
import { buildLinkedGrantWatcherDocument } from './links.docs.js';

describe('links story docs', () => {
  it('maps story-10 watcher grant workflows with correlated linked-doc events', () => {
    const document = toOfficialJson(
      buildLinkedGrantWatcherDocument(
        'Story10 Linked Grant Watcher',
        'base-session-id',
        'cvs',
      ),
    ) as {
      contracts: Record<string, unknown>;
    };

    const contracts = document.contracts as Record<string, unknown>;
    const requestLinkedDocAccess = contracts.requestLinkedDocAccess as
      | {
          steps?: Array<{
            event?: unknown;
          }>;
        }
      | undefined;
    const onLinkedGrant = contracts.onLinkedGrant as
      | {
          steps?: Array<{
            changeset?: Array<{
              val?: unknown;
            }>;
          }>;
        }
      | undefined;
    const onLinkedGrantSingleDocFallback =
      contracts.onLinkedGrantSingleDocFallback as
        | {
            steps?: Array<{
              changeset?: Array<{
                val?: unknown;
              }>;
            }>;
          }
        | undefined;

    expect(requestLinkedDocAccess?.steps?.[0]?.event).toMatchObject({
      type: 'MyOS/Linked Documents Permission Grant Requested',
      onBehalfOf: 'ownerChannel',
      requestId: 'REQ_LINKED_GRANTS',
      targetSessionId: "${document('/baseSessionId')}",
    });

    expect(onLinkedGrant).toMatchObject({
      type: 'Conversation/Sequential Workflow',
      channel: 'triggeredEventChannel',
      event: {
        type: 'MyOS/Linked Documents Permission Granted',
        inResponseTo: {
          incomingEvent: {
            requestId: 'REQ_LINKED_GRANTS',
          },
        },
      },
    });
    expect(onLinkedGrant?.steps?.[1]?.changeset?.[0]?.val).toBe(
      '${event.targetSessionId}',
    );

    expect(onLinkedGrantSingleDocFallback).toMatchObject({
      type: 'Conversation/Sequential Workflow',
      channel: 'triggeredEventChannel',
      event: {
        type: 'MyOS/Single Document Permission Granted',
        inResponseTo: {
          incomingEvent: {
            requestId: 'REQ_LINKED_GRANTS',
          },
        },
      },
    });
    expect(
      onLinkedGrantSingleDocFallback?.steps?.[1]?.changeset?.[0]?.val,
    ).toBe('${event.targetSessionId}');
  });
});
