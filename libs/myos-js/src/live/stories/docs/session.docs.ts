import { BasicBlueTypes, DocBuilder } from '@blue-labs/sdk-dsl';

export function buildSourceCounterDocument(name: string) {
  return DocBuilder.doc()
    .name(name)
    .section(
      'sourceCounterSection',
      'Source Counter',
      'Source document for cross-session orchestration',
    )
    .field('/counter', 0)
    .channel('ownerChannel', { type: 'MyOS/MyOS Timeline Channel' })
    .operation(
      'increment',
      'ownerChannel',
      BasicBlueTypes.Integer,
      'Increment source counter',
      (steps) =>
        steps.replaceExpression(
          'IncrementCounter',
          '/counter',
          "document('/counter') + event.message.request",
        ),
    )
    .endSection()
    .buildDocument();
}

export function buildCounterMirrorAgentDocument(
  name: string,
  targetSessionId: string,
) {
  return DocBuilder.doc()
    .name(name)
    .type('MyOS/Agent')
    .sessionInteraction()
    .field('/targetSessionId', targetSessionId)
    .field('/mirroredCounter', 0)
    .field('/subscriptionState', 'idle')
    .channel('ownerChannel', { type: 'MyOS/MyOS Timeline Channel' })
    .myOsAdmin('myOsAdminChannel')
    .onInit('requestCounterAccess', (steps) =>
      steps
        .myOs('myOsAdminChannel')
        .requestSingleDocPermission(
          'ownerChannel',
          'REQ_COUNTER_ACCESS',
          DocBuilder.expr("document('/targetSessionId')"),
          {
            read: true,
            singleOps: ['increment'],
          },
        ),
    )
    .onTriggeredWithMatcher(
      'subscribeAfterGrant',
      'MyOS/Single Document Permission Granted',
      {
        inResponseTo: {
          incomingEvent: {
            requestId: 'REQ_COUNTER_ACCESS',
          },
        },
      },
      (steps) =>
        steps
          .myOs('myOsAdminChannel')
          .subscribeToSession(
            DocBuilder.expr("document('/targetSessionId')"),
            'SUB_COUNTER_MIRROR',
          ),
    )
    .onTriggeredWithMatcher(
      'handleSubscriptionInitiatedDirect',
      'MyOS/Subscription to Session Initiated',
      {
        subscriptionId: 'SUB_COUNTER_MIRROR',
      },
      (steps) =>
        steps
          .replaceValue(
            'MarkSubscriptionActive',
            '/subscriptionState',
            'active',
          )
          .myOs('myOsAdminChannel')
          .callOperation(
            'ownerChannel',
            DocBuilder.expr("document('/targetSessionId')"),
            'increment',
            2,
          ),
    )
    .onTriggeredWithMatcher(
      'mirrorCounterEpochUpdatesDirect',
      'MyOS/Session Epoch Advanced',
      {
        subscriptionId: 'SUB_COUNTER_MIRROR',
      },
      (steps) =>
        steps
          .jsRaw(
            'PrepareMirrorChanges',
            `
const directCounter = event?.document?.counter;
const updateCounter = event?.update?.document?.counter;
const counterCandidate = directCounter ?? updateCounter;
const mirroredCounter =
  counterCandidate && typeof counterCandidate === 'object' && counterCandidate.value !== undefined
    ? counterCandidate.value
    : counterCandidate;
if (typeof mirroredCounter !== 'number') {
  return { changeset: [] };
}
return {
  changeset: [
    { op: 'replace', path: '/mirroredCounter', val: mirroredCounter },
  ],
};
`,
          )
          .updateDocumentFromExpression(
            'ApplyMirrorChanges',
            'steps.PrepareMirrorChanges.changeset',
          ),
    )
    .buildDocument();
}

export function buildCounterDivisibleBy3WatcherDocument(
  name: string,
  targetSessionId: string,
) {
  return DocBuilder.doc()
    .name(name)
    .type('MyOS/Agent')
    .sessionInteraction()
    .field('/targetSessionId', targetSessionId)
    .field('/lastKnownCounter', 0)
    .field('/divisibleBy3Count', 0)
    .field('/lastDivisibleBy3Counter', 0)
    .field('/subscriptionState', 'idle')
    .channel('ownerChannel', { type: 'MyOS/MyOS Timeline Channel' })
    .access('counterAccess')
    .onBehalfOf('ownerChannel')
    .targetSessionId(DocBuilder.expr("document('/targetSessionId')"))
    .read(true)
    .operations('increment')
    .requestPermissionOnInit()
    .subscribeAfterGranted()
    .subscriptionEvents('MyOS/Session Epoch Advanced')
    .statusPath('/subscriptionState')
    .done()
    .onTriggeredWithMatcher(
      'captureDivisibleBy3CounterEpoch',
      'MyOS/Session Epoch Advanced',
      {
        subscriptionId: 'SUB_ACCESS_COUNTERACCESS',
      },
      (steps) =>
        steps
          .jsRaw(
            'PrepareCounterChanges',
            `
const directCounter = event?.document?.counter;
const updateCounter = event?.update?.document?.counter;
const candidate = directCounter ?? updateCounter;
const normalized =
  candidate && typeof candidate === 'object' && candidate.value !== undefined
    ? candidate.value
    : candidate;
const counter = Number(normalized);
if (!Number.isFinite(counter)) {
  return { changeset: [] };
}
const changeset = [
  { op: 'replace', path: '/lastKnownCounter', val: counter },
];
if (counter % 3 === 0) {
  const current = Number(document('/divisibleBy3Count') ?? 0);
  changeset.push({ op: 'replace', path: '/divisibleBy3Count', val: current + 1 });
  changeset.push({ op: 'replace', path: '/lastDivisibleBy3Counter', val: counter });
}
return { changeset };
`,
          )
          .updateDocumentFromExpression(
            'ApplyCounterChanges',
            'steps.PrepareCounterChanges.changeset',
          ),
    )
    .buildDocument();
}

export function buildSourceProfileDocument(name: string) {
  return DocBuilder.doc()
    .name(name)
    .field('/displayName', 'Initial User')
    .field('/score', 7)
    .channel('ownerChannel', { type: 'MyOS/MyOS Timeline Channel' })
    .operation(
      'updateScore',
      'ownerChannel',
      BasicBlueTypes.Integer,
      'Update profile score',
      (steps) =>
        steps.replaceExpression(
          'ApplyScore',
          '/score',
          'event.message.request',
        ),
    )
    .buildDocument();
}

export function buildSnapshotWatcherDocument(
  name: string,
  targetSessionId: string,
) {
  return DocBuilder.doc()
    .name(name)
    .type('MyOS/Agent')
    .sessionInteraction()
    .field('/targetSessionId', targetSessionId)
    .field('/snapshot/displayName', '')
    .field('/snapshot/score', 0)
    .field('/lastEpoch', -1)
    .channel('ownerChannel', { type: 'MyOS/MyOS Timeline Channel' })
    .myOsAdmin('myOsAdminChannel')
    .onInit('requestSnapshotAccess', (steps) =>
      steps
        .myOs('myOsAdminChannel')
        .requestSingleDocPermission(
          'ownerChannel',
          'REQ_PROFILE_ACCESS',
          DocBuilder.expr("document('/targetSessionId')"),
          {
            read: true,
            singleOps: ['updateScore'],
          },
        ),
    )
    .onTriggeredWithMatcher(
      'subscribeProfileAfterGrant',
      'MyOS/Single Document Permission Granted',
      {
        inResponseTo: {
          incomingEvent: {
            requestId: 'REQ_PROFILE_ACCESS',
          },
        },
      },
      (steps) =>
        steps
          .myOs('myOsAdminChannel')
          .subscribeToSession(
            DocBuilder.expr("document('/targetSessionId')"),
            'SUB_PROFILE_SNAPSHOT',
          ),
    )
    .onTriggeredWithMatcher(
      'storeInitiatedSnapshotDirect',
      'MyOS/Subscription to Session Initiated',
      {
        subscriptionId: 'SUB_PROFILE_SNAPSHOT',
      },
      (steps) =>
        steps
          .replaceExpression(
            'SetSnapshotDisplayName',
            '/snapshot/displayName',
            'event.document.displayName',
          )
          .replaceExpression(
            'SetSnapshotScore',
            '/snapshot/score',
            'event.document.score',
          )
          .replaceExpression('SetSnapshotEpoch', '/lastEpoch', 'event.epoch'),
    )
    .onTriggeredWithMatcher(
      'storeEpochAdvancedSnapshotDirect',
      'MyOS/Session Epoch Advanced',
      {
        subscriptionId: 'SUB_PROFILE_SNAPSHOT',
      },
      (steps) =>
        steps
          .replaceExpression(
            'SetSnapshotDisplayNameFromEpoch',
            '/snapshot/displayName',
            'event.document.displayName',
          )
          .replaceExpression(
            'SetSnapshotScoreFromEpoch',
            '/snapshot/score',
            'event.document.score',
          )
          .replaceExpression(
            'SetSnapshotEpochFromEpoch',
            '/lastEpoch',
            'event.epoch',
          ),
    )
    .buildDocument();
}

export function buildPatternSourceDocument(name: string) {
  return DocBuilder.doc()
    .name(name)
    .field('/emitted', 0)
    .channel('ownerChannel', { type: 'MyOS/MyOS Timeline Channel' })
    .operation(
      'emitPatternedEvents',
      'ownerChannel',
      'Emit request and event topics for filtered subscriptions',
      (steps) =>
        steps
          .emitType('EmitRequestPattern', 'Conversation/Request', (payload) =>
            payload.put('topic', 'i-want-this-event'),
          )
          .emitType('EmitEventPatternMatch', 'Conversation/Event', (payload) =>
            payload.put('topic', 'i-want-this-event'),
          )
          .emitType('EmitEventPatternOther', 'Conversation/Event', (payload) =>
            payload.put('topic', 'not-this-event'),
          )
          .replaceExpression(
            'MarkPatternEmitted',
            '/emitted',
            "document('/emitted') + 1",
          ),
    )
    .buildDocument();
}

export function buildPatternSubscriberDocument(
  name: string,
  targetSessionId: string,
) {
  return DocBuilder.doc()
    .name(name)
    .type('MyOS/Agent')
    .sessionInteraction()
    .field('/targetSessionId', targetSessionId)
    .field('/subscriptionsReady', 0)
    .field('/eventPatternMatchCount', 0)
    .field('/requestPatternMatchCount', 0)
    .field('/eventPatternTopic', null)
    .field('/requestPatternTopic', null)
    .channel('ownerChannel', { type: 'MyOS/MyOS Timeline Channel' })
    .myOsAdmin('myOsAdminChannel')
    .onInit('requestPatternAccess', (steps) =>
      steps
        .myOs('myOsAdminChannel')
        .requestSingleDocPermission(
          'ownerChannel',
          'REQ_PATTERN_ACCESS',
          DocBuilder.expr("document('/targetSessionId')"),
          {
            read: true,
            singleOps: ['emitPatternedEvents'],
          },
        ),
    )
    .onTriggeredWithMatcher(
      'subscribePatternAfterGrant',
      'MyOS/Single Document Permission Granted',
      {
        inResponseTo: {
          incomingEvent: {
            requestId: 'REQ_PATTERN_ACCESS',
          },
        },
      },
      (steps) =>
        steps
          .myOs('myOsAdminChannel')
          .subscribeToSessionWithMatchers(
            DocBuilder.expr("document('/targetSessionId')"),
            'SUB_EVENT_PATTERN',
            [
              {
                type: 'Conversation/Event',
                topic: 'i-want-this-event',
              },
            ],
          )
          .myOs('myOsAdminChannel')
          .subscribeToSessionWithMatchers(
            DocBuilder.expr("document('/targetSessionId')"),
            'SUB_REQUEST_PATTERN',
            [
              {
                type: 'Conversation/Request',
              },
            ],
          ),
    )
    .onTriggeredWithMatcher(
      'onEventPatternInitiatedDirect',
      'MyOS/Subscription to Session Initiated',
      {
        subscriptionId: 'SUB_EVENT_PATTERN',
      },
      (steps) =>
        steps.replaceExpression(
          'IncrementSubscriptionsReadyFromEvent',
          '/subscriptionsReady',
          "document('/subscriptionsReady') + 1",
        ),
    )
    .onTriggeredWithMatcher(
      'onRequestPatternInitiatedDirect',
      'MyOS/Subscription to Session Initiated',
      {
        subscriptionId: 'SUB_REQUEST_PATTERN',
      },
      (steps) =>
        steps.replaceExpression(
          'IncrementSubscriptionsReadyFromRequest',
          '/subscriptionsReady',
          "document('/subscriptionsReady') + 1",
        ),
    )
    .onTriggeredWithMatcher(
      'onEventPatternMatchedDirect',
      'Conversation/Event',
      {
        subscriptionId: 'SUB_EVENT_PATTERN',
        topic: 'i-want-this-event',
      },
      (steps) =>
        steps
          .replaceExpression(
            'IncrementEventPatternCount',
            '/eventPatternMatchCount',
            "document('/eventPatternMatchCount') + 1",
          )
          .replaceExpression(
            'SetEventPatternTopic',
            '/eventPatternTopic',
            'event.topic',
          ),
    )
    .onTriggeredWithMatcher(
      'onRequestPatternMatchedDirect',
      'Conversation/Request',
      {
        subscriptionId: 'SUB_REQUEST_PATTERN',
      },
      (steps) =>
        steps
          .replaceExpression(
            'IncrementRequestPatternCount',
            '/requestPatternMatchCount',
            "document('/requestPatternMatchCount') + 1",
          )
          .replaceExpression(
            'SetRequestPatternTopic',
            '/requestPatternTopic',
            'event.topic',
          ),
    )
    .buildDocument();
}
