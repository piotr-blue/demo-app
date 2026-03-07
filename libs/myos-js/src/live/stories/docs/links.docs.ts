import { BasicBlueTypes, DocBuilder } from '@blue-labs/sdk-dsl';

export function buildBaseAnchorDocument(name: string, anchorName: string) {
  return DocBuilder.doc()
    .name(name)
    .field('/anchorName', anchorName)
    .channel('ownerChannel', { type: 'MyOS/MyOS Timeline Channel' })
    .documentAnchors([anchorName])
    .buildDocument();
}

export function buildLinkedDocument(
  name: string,
  anchorName: string,
  baseSessionId: string,
) {
  return DocBuilder.doc()
    .name(name)
    .field('/linkedTo', baseSessionId)
    .channel('ownerChannel', { type: 'MyOS/MyOS Timeline Channel' })
    .sessionLink('targetBaseSession', anchorName, baseSessionId)
    .buildDocument();
}

export function buildLinkedGrantWatcherDocument(
  name: string,
  baseSessionId: string,
  anchorName: string,
) {
  return DocBuilder.doc()
    .name(name)
    .type('MyOS/Agent')
    .sessionInteraction()
    .field('/baseSessionId', baseSessionId)
    .field('/grantSeenCount', 0)
    .field('/lastGrantedTargetSessionId', null)
    .channel('ownerChannel', { type: 'MyOS/MyOS Timeline Channel' })
    .myOsAdmin('myOsAdminChannel')
    .onInit('requestLinkedDocAccess', (steps) =>
      steps
        .myOs('myOsAdminChannel')
        .requestLinkedDocsPermission(
          'ownerChannel',
          'REQ_LINKED_GRANTS',
          DocBuilder.expr("document('/baseSessionId')"),
          {
            [anchorName]: {
              read: true,
            },
          },
        ),
    )
    .onTriggeredWithMatcher(
      'onLinkedGrant',
      'MyOS/Linked Documents Permission Granted',
      {
        inResponseTo: {
          incomingEvent: {
            requestId: 'REQ_LINKED_GRANTS',
          },
        },
      },
      (steps) =>
        steps
          .replaceExpression(
            'IncrementGrantCount',
            '/grantSeenCount',
            "document('/grantSeenCount') + 1",
          )
          .replaceExpression(
            'StoreLastGrantedTargetSessionId',
            '/lastGrantedTargetSessionId',
            'event.targetSessionId',
          ),
    )
    .onTriggeredWithMatcher(
      'onLinkedGrantSingleDocFallback',
      'MyOS/Single Document Permission Granted',
      {
        inResponseTo: {
          incomingEvent: {
            requestId: 'REQ_LINKED_GRANTS',
          },
        },
      },
      (steps) =>
        steps
          .replaceExpression(
            'IncrementGrantCountSingleDoc',
            '/grantSeenCount',
            "document('/grantSeenCount') + 1",
          )
          .replaceExpression(
            'StoreLastGrantedTargetSessionIdSingleDoc',
            '/lastGrantedTargetSessionId',
            'event.targetSessionId',
          ),
    )
    .buildDocument();
}

export function buildProjectBoardDocument(name: string) {
  return DocBuilder.doc()
    .name(name)
    .type('MyOS/Agent')
    .participantsOrchestration()
    .field('/reviewerGroup', ['ownerChannel'])
    .field('/lastResolvedParticipant', null)
    .field('/lastRemovedParticipant', null)
    .channel('ownerChannel', { type: 'MyOS/MyOS Timeline Channel' })
    .myOsAdmin('myOsAdminChannel')
    .operation('addReviewer')
    .channel('ownerChannel')
    .description('Request adding reviewer participant')
    .request({
      type: BasicBlueTypes.Dictionary,
      entries: {
        channelName: { type: BasicBlueTypes.Text },
        email: { type: BasicBlueTypes.Text },
      },
    })
    .steps((steps) =>
      steps.emitType(
        'EmitAddParticipantRequested',
        'MyOS/Adding Participant Requested',
        (payload) => {
          payload.putExpression(
            'channelName',
            'event.message.request.channelName',
          );
          payload.put(
            'participantBinding',
            DocBuilder.expr('{ email: event.message.request.email }'),
          );
        },
      ),
    )
    .done()
    .operation('removeReviewer')
    .channel('ownerChannel')
    .description('Request removing reviewer participant')
    .request({
      type: BasicBlueTypes.Dictionary,
      entries: {
        channelName: { type: BasicBlueTypes.Text },
      },
    })
    .steps((steps) =>
      steps
        .emitType(
          'EmitRemoveParticipantRequested',
          'MyOS/Removing Participant Requested',
          (payload) => {
            payload.putExpression(
              'channelName',
              'event.message.request.channelName',
            );
          },
        )
        .jsRaw(
          'PrepareRemoveReviewerChanges',
          `
const channelName = event?.message?.request?.channelName;
if (!channelName || typeof channelName !== 'string') {
  return { changeset: [] };
}
const reviewerGroup = document('/reviewerGroup');
const nextReviewerGroup = Array.isArray(reviewerGroup)
  ? reviewerGroup.filter((item) => item !== channelName)
  : [];
return {
  changeset: [
    { op: 'remove', path: '/contracts/' + channelName },
    { op: 'replace', path: '/reviewerGroup', val: nextReviewerGroup },
    { op: 'replace', path: '/lastRemovedParticipant', val: channelName },
  ],
};
`,
        )
        .updateDocumentFromExpression(
          'ApplyRemoveReviewerChanges',
          'steps.PrepareRemoveReviewerChanges.changeset',
        ),
    )
    .done()
    .onParticipantResolved('onParticipantResolved', (steps) =>
      steps
        .jsRaw(
          'PrepareParticipantResolvedChanges',
          `
const channelName =
  event?.channelName ??
  event?.participant?.channelName ??
  event?.inResponseTo?.incomingEvent?.channelKey;
if (!channelName || typeof channelName !== 'string') {
  return { changeset: [] };
}
const timelineId =
  event?.participant?.timelineId ??
  event?.timelineId ??
  null;
const accountId = event?.participant?.accountId ?? null;
const reviewerGroup = document('/reviewerGroup');
const nextReviewerGroup = Array.isArray(reviewerGroup)
  ? [...reviewerGroup]
  : [];
if (!nextReviewerGroup.includes(channelName)) {
  nextReviewerGroup.push(channelName);
}
const changeset = [
  {
    op: 'add',
    path: '/contracts/' + channelName,
    val: {
      type: 'MyOS/MyOS Timeline Channel',
      timelineId,
      ...(accountId ? { accountId } : {}),
    },
  },
  {
    op: 'replace',
    path: '/reviewerGroup',
    val: nextReviewerGroup,
  },
  {
    op: 'replace',
    path: '/lastResolvedParticipant',
    val: channelName,
  },
];
return { changeset };
`,
        )
        .updateDocumentFromExpression(
          'ApplyParticipantResolvedChanges',
          'steps.PrepareParticipantResolvedChanges.changeset',
        ),
    )
    .onEvent(
      'onParticipantRemoved',
      'MyOS/Removing Participant Responded',
      (steps) =>
        steps
          .jsRaw(
            'PrepareParticipantRemovedChanges',
            `
const channelName =
  event?.channelName ??
  event?.inResponseTo?.incomingEvent?.channelName;
if (!channelName || typeof channelName !== 'string') {
  return { changeset: [] };
}
const reviewerGroup = document('/reviewerGroup');
const nextReviewerGroup = Array.isArray(reviewerGroup)
  ? reviewerGroup.filter((item) => item !== channelName)
  : [];
const changeset = [
  {
    op: 'remove',
    path: '/contracts/' + channelName,
  },
  {
    op: 'replace',
    path: '/reviewerGroup',
    val: nextReviewerGroup,
  },
  {
    op: 'replace',
    path: '/lastRemovedParticipant',
    val: channelName,
  },
];
return { changeset };
`,
          )
          .updateDocumentFromExpression(
            'ApplyParticipantRemovedChanges',
            'steps.PrepareParticipantRemovedChanges.changeset',
          ),
    )
    .buildDocument();
}
