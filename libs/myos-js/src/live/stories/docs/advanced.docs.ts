import { BasicBlueTypes, DocBuilder } from '@blue-labs/sdk-dsl';

const PERMISSION_REQUEST_IDS = {
  singleGrant: 'REQ_SINGLE_GRANT',
  singleRevoke: 'REQ_SINGLE_REVOKE',
  linkedGrant: 'REQ_LINKED_GRANT',
  linkedRevoke: 'REQ_LINKED_REVOKE',
  workerGrant: 'REQ_WORKER_GRANT',
  workerRevoke: 'REQ_WORKER_REVOKE',
} as const;

const SUBSCRIPTION_IDS = {
  singleGrant: 'SUB_SINGLE_GRANT',
} as const;

export function buildChangeLifecycleDocument(name: string) {
  return DocBuilder.doc()
    .name(name)
    .field('/text', 'Initial')
    .channel('ownerChannel', { type: 'MyOS/MyOS Timeline Channel' })
    .proposeChange('proposeChange', 'ownerChannel')
    .acceptChange('acceptChange', 'ownerChannel')
    .rejectChange('rejectChange', 'ownerChannel')
    .buildDocument();
}

export function buildPermissionLifecycleAgentDocument(
  name: string,
  targetSessionId: string,
  linkedAnchorName: string,
) {
  return DocBuilder.doc()
    .name(name)
    .type('MyOS/Agent')
    .sessionInteraction()
    .field('/targetSessionId', targetSessionId)
    .field('/singleGrantedCount', 0)
    .field('/singleRevokedCount', 0)
    .field('/linkedGrantedCount', 0)
    .field('/linkedRevokedCount', 0)
    .field('/subscriptionInitiatedCount', 0)
    .channel('ownerChannel', { type: 'MyOS/MyOS Timeline Channel' })
    .myOsAdmin('myOsAdminChannel')
    .operation(
      'requestSingleGrant',
      'ownerChannel',
      'Request single-doc permission and subscribe after grant',
      (steps) =>
        steps.myOs('myOsAdminChannel').requestSingleDocPermission(
          'ownerChannel',
          PERMISSION_REQUEST_IDS.singleGrant,
          DocBuilder.expr("document('/targetSessionId')"),
          {
            read: true,
            singleOps: ['increment'],
          },
        ),
    )
    .operation(
      'revokeSingleGrant',
      'ownerChannel',
      'Revoke single-doc permission',
      (steps) =>
        steps
          .myOs('myOsAdminChannel')
          .revokeSingleDocPermission(
            'ownerChannel',
            PERMISSION_REQUEST_IDS.singleRevoke,
            DocBuilder.expr("document('/targetSessionId')"),
          ),
    )
    .operation(
      'requestLinkedGrant',
      'ownerChannel',
      'Request linked-doc permission by anchor',
      (steps) =>
        steps
          .myOs('myOsAdminChannel')
          .requestLinkedDocsPermission(
            'ownerChannel',
            PERMISSION_REQUEST_IDS.linkedGrant,
            DocBuilder.expr("document('/targetSessionId')"),
            {
              [linkedAnchorName]: {
                read: true,
              },
            },
          ),
    )
    .operation(
      'revokeLinkedGrant',
      'ownerChannel',
      'Revoke linked-doc permission',
      (steps) =>
        steps
          .myOs('myOsAdminChannel')
          .revokeLinkedDocsPermission(
            'ownerChannel',
            PERMISSION_REQUEST_IDS.linkedRevoke,
            DocBuilder.expr("document('/targetSessionId')"),
          ),
    )
    .onTriggeredWithMatcher(
      'onSingleGranted',
      'MyOS/Single Document Permission Granted',
      {
        inResponseTo: {
          incomingEvent: {
            requestId: PERMISSION_REQUEST_IDS.singleGrant,
          },
        },
      },
      (steps) =>
        steps.replaceExpression(
          'IncrementSingleGrantedCount',
          '/singleGrantedCount',
          "document('/singleGrantedCount') + 1",
        ).myOs('myOsAdminChannel').subscribeToSession(
          DocBuilder.expr("document('/targetSessionId')"),
          SUBSCRIPTION_IDS.singleGrant,
        ),
    )
    .onTriggeredWithMatcher(
      'onSingleRevoked',
      'MyOS/Single Document Permission Revoked',
      {
        inResponseTo: {
          incomingEvent: {
            requestId: PERMISSION_REQUEST_IDS.singleRevoke,
          },
        },
      },
      (steps) =>
        steps.replaceExpression(
          'IncrementSingleRevokedCount',
          '/singleRevokedCount',
          "document('/singleRevokedCount') + 1",
        ),
    )
    .onTriggeredWithMatcher(
      'onLinkedGranted',
      'MyOS/Linked Documents Permission Granted',
      {
        inResponseTo: {
          incomingEvent: {
            requestId: PERMISSION_REQUEST_IDS.linkedGrant,
          },
        },
      },
      (steps) =>
        steps.replaceExpression(
          'IncrementLinkedGrantedCount',
          '/linkedGrantedCount',
          "document('/linkedGrantedCount') + 1",
        ),
    )
    .onTriggeredWithMatcher(
      'onLinkedRevoked',
      'MyOS/Linked Documents Permission Revoked',
      {
        inResponseTo: {
          incomingEvent: {
            requestId: PERMISSION_REQUEST_IDS.linkedRevoke,
          },
        },
      },
      (steps) =>
        steps.replaceExpression(
          'IncrementLinkedRevokedCount',
          '/linkedRevokedCount',
          "document('/linkedRevokedCount') + 1",
        ),
    )
    .onEvent(
      'onSubscriptionInitiated',
      'MyOS/Subscription to Session Initiated',
      (steps) =>
        steps.replaceExpression(
          'IncrementSubscriptionInitiatedCount',
          '/subscriptionInitiatedCount',
          "document('/subscriptionInitiatedCount') + 1",
        ),
    )
    .buildDocument();
}

export function buildLinkCoverageDocument(
  name: string,
  anchorName: string,
  linkedSessionId: string,
  linkedDocumentId: string,
  linkedDocumentTypeBlueId: string,
) {
  return DocBuilder.doc()
    .name(name)
    .field('/linkCoverageReady', true)
    .channel('ownerChannel', { type: 'MyOS/MyOS Timeline Channel' })
    .documentAnchors([anchorName])
    .documentLinks({
      linkedSession: {
        type: 'MyOS/MyOS Session Link',
        anchor: anchorName,
        sessionId: linkedSessionId,
      },
      linkedDocument: {
        type: 'MyOS/Document Link',
        anchor: anchorName,
        documentId: linkedDocumentId,
      },
      linkedDocumentType: {
        type: 'MyOS/Document Type Link',
        anchor: anchorName,
        documentType: {
          blueId: linkedDocumentTypeBlueId,
        },
      },
    })
    .buildDocument();
}

export function buildStopResumeControlDocument(name: string) {
  return DocBuilder.doc()
    .name(name)
    .field('/ticks', 0)
    .channel('ownerChannel', { type: 'MyOS/MyOS Timeline Channel' })
    .operation(
      'tick',
      'ownerChannel',
      BasicBlueTypes.Integer,
      'Advance ticks',
      (steps) =>
        steps.replaceExpression(
          'ApplyTick',
          '/ticks',
          "document('/ticks') + event.message.request",
        ),
    )
    .buildDocument();
}

export function buildWorkerAgencyLifecycleDocument(
  name: string,
  targetSessionId: string,
) {
  return DocBuilder.doc()
    .name(name)
    .type('MyOS/Agent')
    .workerAgency()
    .field('/targetSessionId', targetSessionId)
    .field('/agencyGrantedCount', 0)
    .field('/agencyRevokedCount', 0)
    .channel('ownerChannel', { type: 'MyOS/MyOS Timeline Channel' })
    .myOsAdmin('myOsAdminChannel')
    .operation(
      'grantAgency',
      'ownerChannel',
      'Grant worker agency permission',
      (steps) =>
        steps.myOs('myOsAdminChannel').grantWorkerAgencyPermission(
          'ownerChannel',
          PERMISSION_REQUEST_IDS.workerGrant,
          {
            read: true,
            singleOps: ['tick'],
          },
          DocBuilder.expr("document('/targetSessionId')"),
        ),
    )
    .operation(
      'revokeAgency',
      'ownerChannel',
      'Revoke worker agency permission',
      (steps) =>
        steps
          .myOs('myOsAdminChannel')
          .revokeWorkerAgencyPermission(
            'ownerChannel',
            PERMISSION_REQUEST_IDS.workerRevoke,
            DocBuilder.expr("document('/targetSessionId')"),
          ),
    )
    .onTriggeredWithMatcher(
      'onAgencyGranted',
      'MyOS/Worker Agency Permission Granted',
      {
        inResponseTo: {
          incomingEvent: {
            requestId: PERMISSION_REQUEST_IDS.workerGrant,
          },
        },
      },
      (steps) =>
        steps.replaceExpression(
          'IncrementAgencyGrantedCount',
          '/agencyGrantedCount',
          "document('/agencyGrantedCount') + 1",
        ),
    )
    .onTriggeredWithMatcher(
      'onAgencyRevoked',
      'MyOS/Worker Agency Permission Revoked',
      {
        inResponseTo: {
          incomingEvent: {
            requestId: PERMISSION_REQUEST_IDS.workerRevoke,
          },
        },
      },
      (steps) =>
        steps.replaceExpression(
          'IncrementAgencyRevokedCount',
          '/agencyRevokedCount',
          "document('/agencyRevokedCount') + 1",
        ),
    )
    .buildDocument();
}
