import { DocBuilder } from '@blue-labs/sdk-dsl';
import { expect } from 'vitest';
import { MyOsClient } from '../lib/client.js';
import type { ChannelBindingsInput } from '../lib/dsl/bootstrap-options.js';
import type { BootstrapDocumentInput } from '../lib/dsl/document-input.js';
import { getAccountCoreLiveGate } from '../test-harness/live-env.js';
import { describeLive, itLive } from '../test-harness/live-mode.js';

const gate = getAccountCoreLiveGate();

describeLive('myos-js live recruitment classifier', gate, () => {
  itLive(
    'bootstraps dependencies then runs recruitment classifier DSL flow',
    gate,
    async () => {
      const client = createLiveClient();
      const accountId = gate.env.accountId!;
      const timestamp = Date.now();

      const provider = await bootstrapAndResolveTargetSession({
        client,
        scenarioName: 'llm-provider',
        document: buildLlmProviderDocument(timestamp),
        channelBindings: {
          providerChannel: { accountId },
        },
      });

      const recruitmentSource = await bootstrapAndResolveTargetSession({
        client,
        scenarioName: 'recruitment-source',
        document: buildRecruitmentSourceDocument(
          timestamp,
          provider.bootstrapSessionId,
        ),
        channelBindings: {
          recruitmentOwnerChannel: { accountId },
        },
      });

      const classifier = await bootstrapAndResolveTargetSession({
        client,
        scenarioName: 'recruitment-classifier',
        document: buildRecruitmentClassifierDocument({
          timestamp,
          recruitmentSessionId: recruitmentSource.targetSessionId,
          llmProviderSessionId: provider.targetSessionId,
        }),
        channelBindings: {
          recruitmentChannel: { accountId },
          myOsAdminChannel: { accountId: '0' },
        },
      });

      const permissionSessionsVisible = await pollUntil(
        async () => {
          const myDocs = await client.me.documents.list({ pageSize: 100 });
          const names = readArray(
            (myDocs as Record<string, unknown>).items,
          ).map((item) => readString((item as Record<string, unknown>).name));
          const hasSingleGrant = names.includes(
            `Single Document Permission Grant for Recruitment Classifier - ${timestamp}`,
          );
          const hasLinkedGrant = names.includes(
            `Linked Documents Permission Grant for Recruitment Classifier - ${timestamp}`,
          );
          return hasSingleGrant && hasLinkedGrant ? true : undefined;
        },
        120_000,
        2_000,
      );
      expect(permissionSessionsVisible).toBe(true);

      const classifierSettled = await pollUntil(
        async () => {
          const latest = await client.documents.retrieve(
            classifier.targetSessionId,
          );
          const document = readRecord(
            (latest as Record<string, unknown>).document,
          );
          if (!document) {
            return undefined;
          }

          const providerReady =
            readBoolean(
              unwrapDocumentValue(document.providerSubscriptionReady),
            ) === true;

          return providerReady ? latest : undefined;
        },
        240_000,
        2_500,
      );

      expect(classifierSettled).toBeTruthy();

      const settledDocument = readRecord(
        (classifierSettled as Record<string, unknown>).document,
      );
      expect(settledDocument).toBeTruthy();
      expect(
        readBoolean(
          unwrapDocumentValue(settledDocument?.providerSubscriptionReady),
        ),
      ).toBe(true);

      const events = await client.myOsEvents.list({
        ref: classifier.targetSessionId,
        itemsPerPage: 20,
      });
      expect(
        readArray((events as Record<string, unknown>).items).length,
      ).toBeGreaterThan(0);
    },
    420_000,
  );
});

interface BootstrapAndResolveArgs {
  readonly client: MyOsClient;
  readonly scenarioName: string;
  readonly document: BootstrapDocumentInput;
  readonly channelBindings: ChannelBindingsInput;
}

interface BootstrapResolution {
  readonly bootstrapSessionId: string;
  readonly targetDocumentId: string;
  readonly targetSessionId: string;
}

interface RecruitmentClassifierBuildArgs {
  readonly timestamp: number;
  readonly recruitmentSessionId: string;
  readonly llmProviderSessionId: string;
}

async function bootstrapAndResolveTargetSession(
  args: BootstrapAndResolveArgs,
): Promise<BootstrapResolution> {
  const bootstrap = await args.client.documents.bootstrap(
    args.document,
    args.channelBindings,
  );
  const bootstrapSessionId = readRequiredString(
    (bootstrap as Record<string, unknown>).sessionId,
    `${args.scenarioName} bootstrap sessionId`,
  );

  const bootstrapAdvanced = await pollUntil(
    async () => {
      const events = await args.client.myOsEvents.list({
        ref: bootstrapSessionId,
        itemsPerPage: 50,
      });
      const hasAdvanced = readArray(
        (events as Record<string, unknown>).items,
      ).some(
        (item) =>
          readString((item as Record<string, unknown>).type) ===
          'DOCUMENT_EPOCH_ADVANCED',
      );
      return hasAdvanced ? true : undefined;
    },
    180_000,
    2_000,
  );
  expect(bootstrapAdvanced).toBe(true);

  const targetSessionId = await pollUntil(
    async () =>
      findTargetSessionIdFromBootstrapEvents(args.client, bootstrapSessionId),
    180_000,
    2_000,
  );
  expect(targetSessionId).toBeTruthy();

  const targetDocument = await args.client.documents.retrieve(targetSessionId!);
  const targetDocumentId = readRequiredString(
    (targetDocument as Record<string, unknown>).documentId,
    `${args.scenarioName} target documentId`,
  );

  const searchedTargetSessionId = await pollUntil(
    async () => {
      const listed = await args.client.documents.list({
        documentId: targetDocumentId,
        itemsPerPage: 20,
      });
      const sessions = readArray((listed as Record<string, unknown>).items)
        .map((item) => readString((item as Record<string, unknown>).sessionId))
        .filter((sessionId): sessionId is string => Boolean(sessionId))
        .filter((sessionId) => sessionId !== bootstrapSessionId);

      return sessions[0];
    },
    120_000,
    1_500,
  );

  expect(searchedTargetSessionId).toBeTruthy();
  await args.client.documents.retrieve(searchedTargetSessionId!);

  return {
    bootstrapSessionId,
    targetDocumentId,
    targetSessionId: searchedTargetSessionId!,
  };
}

async function findTargetSessionIdFromBootstrapEvents(
  client: MyOsClient,
  bootstrapSessionId: string,
): Promise<string | undefined> {
  const events = await client.myOsEvents.list({
    ref: bootstrapSessionId,
    itemsPerPage: 50,
  });
  const eventIds = readArray((events as Record<string, unknown>).items)
    .map((item) => readString((item as Record<string, unknown>).id))
    .filter((id): id is string => Boolean(id));

  for (const eventId of eventIds) {
    const event = await client.myOsEvents.retrieve(eventId);
    const candidates = [
      ...new Set(collectSessionCandidates(event, bootstrapSessionId)),
    ];

    for (const candidate of candidates) {
      try {
        await client.documents.retrieve(candidate);
        return candidate;
      } catch {
        // Candidate might be a timelineId or unresolved reference.
      }
    }
  }

  return undefined;
}

function collectSessionCandidates(
  value: unknown,
  bootstrapSessionId: string,
): string[] {
  const candidates: string[] = [];
  const queue: unknown[] = [value];

  while (queue.length > 0) {
    const current = queue.shift();
    if (!current || typeof current !== 'object') {
      continue;
    }

    if (Array.isArray(current)) {
      queue.push(...current);
      continue;
    }

    const record = current as Record<string, unknown>;
    const targetSessionId = readString(record.targetSessionId);
    if (isUuid(targetSessionId) && targetSessionId !== bootstrapSessionId) {
      candidates.push(targetSessionId);
    }

    const initiatorSessionIds = readRecord(record.initiatorSessionIds);
    if (initiatorSessionIds) {
      for (const sessionId of readArray(initiatorSessionIds.items)
        .map((item) => readString((item as Record<string, unknown>).value))
        .filter((sessionId): sessionId is string => isUuid(sessionId))
        .filter((sessionId) => sessionId !== bootstrapSessionId)) {
        candidates.push(sessionId);
      }
    }

    queue.push(...Object.values(record));
  }

  return candidates;
}

function buildLlmProviderDocument(timestamp: number): BootstrapDocumentInput {
  return DocBuilder.doc()
    .name(`Recruitment LLM Provider ${timestamp}`)
    .type('MyOS/Agent')
    .description('Test provider that responds to provideInstructions.')
    .channel('providerChannel', { type: 'MyOS/MyOS Timeline Channel' })
    .operation(
      'provideInstructions',
      'providerChannel',
      'Return deterministic classification payload',
      (steps) => {
        steps.jsRaw(
          'EmitClassificationResponse',
          `
const request = event?.message?.request ?? {};
const requestId = request.requestId ?? 'REQ_MISSING';
return {
  events: [
    {
      type: 'Conversation/Response',
      inResponseTo: {
        requestId,
        incomingEvent: {
          requester: request.requester ?? 'RECRUITMENT_CV_CLASSIFIER',
        },
      },
      result: {
        candidateName: 'Senior Candidate',
        yearsExperience: 9,
        experienceSummary: '9 years of backend engineering',
        seniority: 'senior',
        isSenior: true,
      },
    },
  ],
};
          `,
        );
      },
    )
    .buildDocument();
}

function buildRecruitmentSourceDocument(
  timestamp: number,
  cvLinkedSessionId: string,
): BootstrapDocumentInput {
  return DocBuilder.doc()
    .name(`Recruitment Source ${timestamp}`)
    .type('MyOS/Agent')
    .description('Source session exposing cvs link used by classifier.')
    .field('/source', 'recruitment')
    .channel('recruitmentOwnerChannel', { type: 'MyOS/MyOS Timeline Channel' })
    .documentLinks({
      cvs: {
        type: 'MyOS/MyOS Session Link',
        anchor: '/cvs',
        sessionId: cvLinkedSessionId,
      },
    })
    .buildDocument();
}

function buildRecruitmentClassifierDocument(
  args: RecruitmentClassifierBuildArgs,
): BootstrapDocumentInput {
  return DocBuilder.doc()
    .name(`Recruitment Classifier - ${args.timestamp}`)
    .type('MyOS/Agent')
    .description(
      'Classifies linked CVs via llm-provider and emits message for new senior candidates.',
    )
    .field('/recruitmentSessionId', args.recruitmentSessionId)
    .field('/llmProviderSessionId', args.llmProviderSessionId)
    .field('/cvSubscriptionId', 'SUB_RECRUITMENT_CVS')
    .field('/providerSubscriptionId', 'SUB_RECRUITMENT_PROVIDER')
    .field('/providerSubscriptionReady', false)
    .field('/cvMeta', {})
    .field('/pendingClassification', {})
    .field('/alertedSeniorCv', {})
    .field('/classificationByCv', {})
    .channel('recruitmentChannel', { type: 'MyOS/MyOS Timeline Channel' })
    .myOsAdmin('myOsAdminChannel')
    .canEmit('myOsAdminChannel')
    .onInit('requestAccess', (steps) => {
      steps
        .myOs()
        .requestSingleDocPermission(
          'recruitmentChannel',
          'REQ_RECRUITMENT_PROVIDER',
          DocBuilder.expr("document('/llmProviderSessionId')"),
          {
            read: true,
            singleOps: ['provideInstructions'],
          },
        );

      steps
        .myOs()
        .requestLinkedDocsPermission(
          'recruitmentChannel',
          'REQ_RECRUITMENT_CVS',
          DocBuilder.expr("document('/recruitmentSessionId')"),
          {
            cvs: {
              read: true,
              allOps: true,
            },
          },
        );
    })
    .onTriggeredWithMatcher(
      'onCvAccessGranted',
      'MyOS/Single Document Permission Granted',
      {
        inResponseTo: {
          requestId: 'REQ_RECRUITMENT_CVS',
        },
      },
      (steps) => {
        steps.jsRaw(
          'SubscribeToCvUpdates',
          `
const cvSessionId = event.targetSessionId;
if (!cvSessionId) {
  return { events: [] };
}
if (cvSessionId === document('/llmProviderSessionId')) {
  return { events: [] };
}
if (cvSessionId === document('/recruitmentSessionId')) {
  return { events: [] };
}

return {
  events: [
    {
      type: 'MyOS/Subscribe to Session Requested',
      targetSessionId: cvSessionId,
      subscription: {
        id: document('/cvSubscriptionId'),
        events: [],
      },
    },
  ],
};
          `,
        );
      },
    )
    .onTriggeredWithMatcher(
      'onLlmProviderAccessGranted',
      'MyOS/Single Document Permission Granted',
      {
        inResponseTo: {
          requestId: 'REQ_RECRUITMENT_PROVIDER',
        },
      },
      (steps) => {
        steps
          .myOs()
          .subscribeToSession(
            DocBuilder.expr("document('/llmProviderSessionId')"),
            'SUB_RECRUITMENT_PROVIDER',
          );
      },
    )
    .onTriggeredWithMatcher(
      'onCvSubscriptionInitiated',
      'MyOS/Subscription to Session Initiated',
      {
        subscriptionId: 'SUB_RECRUITMENT_CVS',
      },
      (steps) => {
        steps.jsRaw(
          'RequestClassification',
          `
const cvSessionId = event.targetSessionId;
const cvDoc = event.document ?? {};
const cvEpoch = event.epoch ?? 0;
if (!cvSessionId) {
  return { events: [], changeset: [] };
}

const cvRoot = cvDoc.cv ?? {};
const cvSnapshot = {
  cvSessionId,
  cvEpoch,
  name: cvRoot.name ?? cvDoc.name ?? '',
  experience: cvRoot.experience ?? cvDoc.experience ?? '',
};

const requestId = 'REQ_CV_CLASSIFY_' + cvSessionId + '_' + cvEpoch;
const instructions = [
  'Return raw JSON only. No markdown and no prose. First character must be { and last character must be }.',
  'Use EXACT schema: {"candidateName":"string","yearsExperience":0,"experienceSummary":"string","seniority":"junior","isSenior":false}.',
  'Read only experience text from payload.',
  'Parse yearsExperience from experience text as a number.',
  'Set seniority to one of: junior, mid, senior.',
  'Set isSenior based on parsed experience and seniority.',
  'CV payload: cvSessionId=' +
    cvSessionId +
    ' | cvEpoch=' +
    cvEpoch +
    ' | experience=' +
    cvSnapshot.experience,
].join(' ');

return {
  changeset: [
    { op: 'replace', path: '/cvMeta/' + cvSessionId, val: cvSnapshot },
    {
      op: 'replace',
      path: '/pendingClassification/' + requestId,
      val: { cvSessionId, cvEpoch },
    },
  ],
  events: [
    {
      type: 'MyOS/Call Operation Requested',
      onBehalfOf: 'recruitmentChannel',
      targetSessionId: document('/llmProviderSessionId'),
      operation: 'provideInstructions',
      request: {
        requestId,
        requester: 'RECRUITMENT_CV_CLASSIFIER',
        instructions,
      },
    },
  ],
};
          `,
        );

        steps.updateDocumentFromExpression(
          'PersistClassificationRequest',
          'steps.RequestClassification.changeset',
        );
      },
    )
    .onTriggeredWithMatcher(
      'onProviderSubscriptionInitiated',
      'MyOS/Subscription to Session Initiated',
      {
        subscriptionId: 'SUB_RECRUITMENT_PROVIDER',
      },
      (steps) => {
        steps.replaceValue(
          'MarkProviderSubscriptionReady',
          '/providerSubscriptionReady',
          true,
        );
      },
    )
    .onTriggeredWithMatcher(
      'onProviderResponse',
      'MyOS/Subscription Update',
      {
        subscriptionId: 'SUB_RECRUITMENT_PROVIDER',
        update: {
          type: 'Conversation/Response',
          inResponseTo: {
            incomingEvent: {
              requester: 'RECRUITMENT_CV_CLASSIFIER',
            },
          },
        },
      },
      (steps) => {
        steps.jsRaw(
          'ApplyClassificationResult',
          `
const response = event.update ?? {};
const inResponseTo = response.inResponseTo ?? {};
const requestId = inResponseTo.requestId;
if (!requestId) {
  return { events: [], changeset: [] };
}

const pending = document('/pendingClassification/' + requestId);
if (!pending || !pending.cvSessionId) {
  return { events: [], changeset: [] };
}

const cvSessionId = pending.cvSessionId;
const cvMeta = document('/cvMeta/' + cvSessionId) ?? {};
const result = response.result ?? {};

const candidateName = result.candidateName || cvMeta.name || 'Unknown candidate';
const yearsExperienceRaw = result.yearsExperience ?? 0;
const yearsExperienceNumber = Number(yearsExperienceRaw);
const yearsExperience = Number.isFinite(yearsExperienceNumber) ? yearsExperienceNumber : 0;
const experienceSummary =
  result.experienceSummary ||
  cvMeta.experience ||
  'No experience summary';
const seniorityRaw = result.seniority || 'unknown';
const seniority = String(seniorityRaw).toLowerCase();
const isSeniorRaw = result.isSenior;
const isSenior =
  isSeniorRaw === true ||
  isSeniorRaw === 'true' ||
  seniority === 'senior' ||
  yearsExperience >= 5;

const normalized = {
  candidateName,
  yearsExperience,
  experienceSummary,
  seniority,
  isSenior,
};

const alreadyAlerted = document('/alertedSeniorCv/' + cvSessionId) === true;
const shouldAlert = isSenior && !alreadyAlerted;

const events = shouldAlert
  ? [
      {
        type: 'Conversation/Chat Message',
        message:
          'New senior CV to review: ' +
          candidateName +
          ' (' +
          experienceSummary +
          '). CV sessionId: ' +
          cvSessionId +
          '.',
      },
    ]
  : [];

const changeset = [
  { op: 'replace', path: '/classificationByCv/' + cvSessionId, val: normalized },
  { op: 'remove', path: '/pendingClassification/' + requestId },
  ...(shouldAlert
    ? [{ op: 'replace', path: '/alertedSeniorCv/' + cvSessionId, val: true }]
    : []),
];

return { events, changeset };
          `,
        );

        steps.updateDocumentFromExpression(
          'PersistClassificationResult',
          'steps.ApplyClassificationResult.changeset',
        );
      },
    )
    .buildDocument();
}

function createLiveClient(): MyOsClient {
  return new MyOsClient({
    apiKey: gate.env.apiKey!,
    baseUrl: gate.env.baseUrl,
    timeoutMs: 45_000,
    maxRetries: 2,
  });
}

function readString(value: unknown): string | undefined {
  return typeof value === 'string' && value.length > 0 ? value : undefined;
}

function readBoolean(value: unknown): boolean | undefined {
  return typeof value === 'boolean' ? value : undefined;
}

function readArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function readRecord(value: unknown): Record<string, unknown> | undefined {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : undefined;
}

function unwrapDocumentValue(value: unknown): unknown {
  const record = readRecord(value);
  if (record && Object.prototype.hasOwnProperty.call(record, 'value')) {
    return record.value;
  }
  return value;
}

function readRequiredString(value: unknown, label: string): string {
  const parsed = readString(value);
  expect(parsed, `${label} should be present`).toBeTruthy();
  return parsed!;
}

function isUuid(value: string | undefined): value is string {
  if (!value) {
    return false;
  }
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/iu.test(
    value,
  );
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
