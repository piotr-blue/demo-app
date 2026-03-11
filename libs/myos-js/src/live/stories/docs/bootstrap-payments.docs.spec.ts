import { toOfficialJson } from '@blue-labs/sdk-dsl';
import { describe, expect, it } from 'vitest';
import { buildParentVoucherOrchestratorDocument } from './bootstrap-payments.docs.js';

describe('bootstrap payment story docs', () => {
  it('maps story-13 child bootstrap request with onBehalfOf correlation', () => {
    const document = toOfficialJson(
      buildParentVoucherOrchestratorDocument('Story13 Parent Orchestrator'),
    ) as {
      contracts: Record<string, unknown>;
    };

    const contracts = document.contracts as Record<string, any>;
    const bootstrapStep = contracts.issueVoucherImpl?.steps?.[0];
    expect(bootstrapStep).toMatchObject({
      name: 'BootstrapChildVoucher',
      type: 'Conversation/Trigger Event',
      event: {
        type: 'Conversation/Document Bootstrap Requested',
        bootstrapAssignee: 'myOsAdminChannel',
        onBehalfOf: 'ownerChannel',
        requestId: 'REQ_CHILD_VOUCHER_BOOTSTRAP',
      },
    });
    expect(bootstrapStep?.event?.channelBindings?.ownerChannel).toEqual({
      accountId: '${document("/contracts/ownerChannel/accountId")}',
    });

    const sessionStartedWorkflow = contracts.onTargetSessionStarted;
    expect(sessionStartedWorkflow).toMatchObject({
      type: 'Conversation/Sequential Workflow',
      channel: 'triggeredEventChannel',
      event: {
        type: 'MyOS/Target Document Session Started',
        inResponseTo: {
          requestId: 'REQ_CHILD_VOUCHER_BOOTSTRAP',
        },
      },
    });
    expect(
      sessionStartedWorkflow?.steps?.[0]?.changeset?.[0]?.val,
    ).toBe('${event.initiatorSessionIds[0]}');
    expect(
      sessionStartedWorkflow?.steps?.[1]?.changeset?.[0]?.val,
    ).toBe('ready');
  });
});
