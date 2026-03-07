import type { MyOsClientOptions } from '../../lib/client.js';
import { MyOsClient } from '../../lib/client.js';
import type {
  BootstrapOptions,
  ChannelBindingsInput,
} from '../../lib/dsl/bootstrap-options.js';
import type { BootstrapDocumentInput } from '../../lib/dsl/document-input.js';
import { readLiveEnv, type LiveEnv } from '../../test-harness/live-env.js';
import { pollUntil } from './live-polling.js';
import {
  readArray,
  readRecord,
  readString,
  unwrapDocumentValue,
} from './live-debug.js';

export interface BootstrapResult {
  readonly sessionId: string;
  readonly bootstrapSessionId: string;
  readonly bootstrap: Record<string, unknown>;
}

export function defaultBootstrapBinding(env: LiveEnv = readLiveEnv()): {
  email?: string;
  accountId?: string;
} {
  if (env.accountId) {
    return { accountId: env.accountId };
  }
  if (env.bootstrapEmail) {
    return { email: env.bootstrapEmail };
  }
  throw new Error(
    'Missing bootstrap identity. Provide MYOS_BOOTSTRAP_EMAIL or MYOS_ACCOUNT_ID.',
  );
}

export function createLiveClient(
  options: Partial<MyOsClientOptions> = {},
  env: LiveEnv = readLiveEnv(),
): MyOsClient {
  const apiKey = options.apiKey ?? env.apiKey;
  if (!apiKey) {
    throw new Error(
      'Missing MYOS_API_KEY for live client creation. Set env before running live stories.',
    );
  }

  return new MyOsClient({
    apiKey,
    baseUrl: options.baseUrl ?? env.baseUrl,
    timeoutMs: options.timeoutMs ?? 45_000,
    maxRetries: options.maxRetries ?? 2,
    defaultRequestOptions: options.defaultRequestOptions,
    fetch: options.fetch,
  });
}

export function createUniqueName(prefix: string): string {
  const normalizedPrefix = prefix.trim().replace(/\s+/gu, ' ');
  const randomPart = Math.random().toString(36).slice(2, 8);
  return `${normalizedPrefix} ${Date.now()} ${randomPart}`;
}

export async function bootstrapDslDocument(
  client: MyOsClient,
  document: BootstrapDocumentInput,
  channelBindings: ChannelBindingsInput,
  options?: BootstrapOptions,
): Promise<BootstrapResult> {
  const bootstrap = (await client.documents.bootstrap(
    document,
    channelBindings,
    options,
  )) as Record<string, unknown>;
  const sessionId = readString(bootstrap.sessionId);
  if (!sessionId) {
    throw new Error(
      `Bootstrap did not return sessionId. payload=${JSON.stringify(bootstrap)}`,
    );
  }
  const expectedDocumentName = readBootstrapExpectedDocumentName(bootstrap);
  const targetSessionId = await resolveTargetSessionId(
    client,
    sessionId,
    expectedDocumentName,
  );
  return {
    sessionId: targetSessionId,
    bootstrapSessionId: sessionId,
    bootstrap,
  };
}

async function resolveTargetSessionId(
  client: MyOsClient,
  bootstrapSessionId: string,
  expectedDocumentName?: string,
): Promise<string> {
  const retrieved = (await client.documents.retrieve(
    bootstrapSessionId,
  )) as Record<string, unknown>;
  const initializedDocumentId = readBootstrapInitializedDocumentId(retrieved);
  if (!initializedDocumentId) {
    const candidateFromBootstrapDocument =
      await probeBootstrapSessionCandidates(
        client,
        bootstrapSessionId,
        expectedDocumentName,
      );
    return candidateFromBootstrapDocument ?? bootstrapSessionId;
  }

  try {
    return await pollUntil(
      async () => {
        const listed = (await client.documents.list({
          documentId: initializedDocumentId,
          itemsPerPage: 20,
        })) as Record<string, unknown>;
        const candidates = readArray(listed.items)
          .map((item) =>
            readString((item as Record<string, unknown>).sessionId),
          )
          .filter((value): value is string => Boolean(value))
          .filter((value) => value !== bootstrapSessionId);

        if (candidates.length === 0) {
          return undefined;
        }
        const [candidate] = candidates;
        try {
          const candidateRetrieved = (await client.documents.retrieve(
            candidate,
          )) as Record<string, unknown>;
          const type = readString(candidateRetrieved.type);
          const candidateName = readRetrievedDocumentName(candidateRetrieved);
          if (
            expectedDocumentName &&
            candidateName &&
            candidateName !== expectedDocumentName
          ) {
            return undefined;
          }
          return type === 'MyOS/Document Session Bootstrap'
            ? undefined
            : candidate;
        } catch {
          return undefined;
        }
      },
      {
        timeoutMs: 120_000,
        intervalMs: 1_500,
        label: `resolveTargetSessionId(bootstrapSessionId=${bootstrapSessionId})`,
      },
    );
  } catch {
    const candidateFromBootstrapDocument =
      await probeBootstrapSessionCandidates(
        client,
        bootstrapSessionId,
        expectedDocumentName,
      );
    return candidateFromBootstrapDocument ?? bootstrapSessionId;
  }
}

function readBootstrapInitializedDocumentId(
  retrieved: Record<string, unknown>,
): string | undefined {
  const bootstrapDocument = readRecord(unwrapDocumentValue(retrieved.document));
  if (!bootstrapDocument) {
    return undefined;
  }
  const initialized = readRecord(
    unwrapDocumentValue(bootstrapDocument.initialized),
  );
  if (!initialized) {
    return undefined;
  }
  return readString(unwrapDocumentValue(initialized.documentId));
}

async function probeBootstrapSessionCandidates(
  client: MyOsClient,
  bootstrapSessionId: string,
  expectedDocumentName?: string,
): Promise<string | undefined> {
  return pollUntil(
    async () => {
      const retrieved = (await client.documents.retrieve(
        bootstrapSessionId,
      )) as Record<string, unknown>;
      const accountId = readString(retrieved.accountId);
      const candidates = collectUuidCandidates(retrieved).filter(
        (candidate) =>
          candidate !== bootstrapSessionId &&
          (!accountId || candidate !== accountId),
      );

      for (const candidate of candidates) {
        try {
          const candidateRetrieved = (await client.documents.retrieve(
            candidate,
          )) as Record<string, unknown>;
          const type = readString(candidateRetrieved.type);
          const candidateName = readRetrievedDocumentName(candidateRetrieved);
          if (
            expectedDocumentName &&
            candidateName &&
            candidateName !== expectedDocumentName
          ) {
            continue;
          }
          if (type !== 'MyOS/Document Session Bootstrap') {
            return candidate;
          }
        } catch {
          // ignore UUID candidates that are not sessions
        }
      }
      return undefined;
    },
    {
      timeoutMs: 120_000,
      intervalMs: 1_500,
      label: `probeBootstrapSessionCandidates(${bootstrapSessionId})`,
    },
  ).catch(() => undefined);
}

function collectUuidCandidates(value: unknown): string[] {
  const matches = new Set<string>();
  const uuidPattern =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/iu;
  const queue: unknown[] = [value];

  while (queue.length > 0) {
    const current = queue.shift();
    if (Array.isArray(current)) {
      queue.push(...current);
      continue;
    }
    const record = readRecord(current);
    if (!record) {
      const stringValue = readString(current);
      if (stringValue && uuidPattern.test(stringValue)) {
        matches.add(stringValue);
      }
      continue;
    }
    for (const nested of Object.values(record)) {
      const unwrapped = unwrapDocumentValue(nested);
      const nestedString = readString(unwrapped);
      if (nestedString && uuidPattern.test(nestedString)) {
        matches.add(nestedString);
      }
      queue.push(unwrapped);
    }
  }

  return [...matches];
}

function readBootstrapExpectedDocumentName(
  bootstrap: Record<string, unknown>,
): string | undefined {
  const bootstrapEnvelope = readRecord(unwrapDocumentValue(bootstrap.document));
  const nestedDocument = readRecord(
    unwrapDocumentValue(bootstrapEnvelope?.document),
  );
  return readString(unwrapDocumentValue(nestedDocument?.name));
}

function readRetrievedDocumentName(
  retrieved: Record<string, unknown>,
): string | undefined {
  const document = readRecord(unwrapDocumentValue(retrieved.document));
  return readString(unwrapDocumentValue(document?.name));
}
