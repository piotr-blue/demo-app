import { expect } from 'vitest';
import type { MyOsClient } from '../../lib/client.js';
import { pollUntil, type PollOptions } from './live-polling.js';
import {
  compactJson,
  readArray,
  readNumber,
  readRecord,
  readString,
  unwrapDocumentValue,
} from './live-debug.js';

export interface DocumentPollOptions extends PollOptions {
  readonly sessionId: string;
}

export async function retrieveDocument(
  client: MyOsClient,
  sessionId: string,
): Promise<Record<string, unknown>> {
  const retrieved = (await client.documents.retrieve(sessionId)) as Record<
    string,
    unknown
  >;
  if (!retrieved || typeof retrieved !== 'object') {
    throw new Error(`Failed to retrieve document for session ${sessionId}`);
  }
  return retrieved;
}

export async function waitForPredicate(
  client: MyOsClient,
  sessionId: string,
  predicate: (
    retrievedDoc: Record<string, unknown>,
  ) => boolean | Promise<boolean>,
  options: PollOptions = {},
): Promise<Record<string, unknown>> {
  return pollUntil(
    async () => {
      const latest = await retrieveDocument(client, sessionId);
      const matched = await predicate(latest);
      return matched ? latest : undefined;
    },
    {
      timeoutMs: options.timeoutMs,
      intervalMs: options.intervalMs,
      label: options.label ?? `waitForPredicate(sessionId=${sessionId})`,
    },
  );
}

export async function waitForAllowedOperation(
  client: MyOsClient,
  sessionId: string,
  opName: string,
  options: PollOptions = {},
): Promise<Record<string, unknown>> {
  return waitForPredicate(
    client,
    sessionId,
    (latest) =>
      readArray(latest.allowedOperations).some(
        (value) => String(value) === opName,
      ),
    {
      timeoutMs: options.timeoutMs,
      intervalMs: options.intervalMs,
      label:
        options.label ??
        `waitForAllowedOperation(sessionId=${sessionId}, op=${opName})`,
    },
  );
}

export async function waitForFieldValue(
  client: MyOsClient,
  sessionId: string,
  jsonPointer: string,
  expected: unknown,
  options: PollOptions = {},
): Promise<Record<string, unknown>> {
  return waitForPredicate(
    client,
    sessionId,
    (latest) => deepEqual(extractField(latest, jsonPointer), expected),
    {
      timeoutMs: options.timeoutMs,
      intervalMs: options.intervalMs,
      label:
        options.label ??
        `waitForFieldValue(sessionId=${sessionId}, pointer=${jsonPointer}, expected=${compactJson(expected)})`,
    },
  );
}

export async function latestEpoch(
  client: MyOsClient,
  sessionId: string,
): Promise<Record<string, unknown>> {
  const response = (await client.documents.epochs.list(sessionId, {
    itemsPerPage: 50,
  })) as Record<string, unknown>;
  const items = readArray(response.items);
  if (items.length === 0) {
    throw new Error(`No epochs found for session ${sessionId}`);
  }

  const newestEpoch = items
    .map((item) => readNumber((item as Record<string, unknown>).epoch))
    .filter((value): value is number => typeof value === 'number')
    .sort((a, b) => b - a)[0];

  if (newestEpoch === undefined) {
    throw new Error(`Epoch list has no numeric epoch values for ${sessionId}`);
  }

  return (await client.documents.epochs.retrieve(
    sessionId,
    newestEpoch,
  )) as Record<string, unknown>;
}

export async function listFeedEntries(
  client: MyOsClient,
  sessionId: string,
): Promise<unknown[]> {
  const response = (await client.documents.feedEntries.list(sessionId, {
    order: 'desc',
    limit: 50,
  })) as Record<string, unknown>;
  return readArray(response.items);
}

export async function latestEmittedEvents(
  client: MyOsClient,
  sessionId: string,
): Promise<unknown[]> {
  const items = await listFeedEntries(client, sessionId);
  return items
    .map((item) => (item as Record<string, unknown>).message)
    .filter((value) => value !== undefined);
}

export function extractField(
  retrievedDoc: Record<string, unknown>,
  jsonPointer: string,
): unknown {
  const document = unwrapDocumentValue(retrievedDoc.document);
  const root = readRecord(document);
  if (!root) {
    return undefined;
  }
  if (jsonPointer === '/') {
    return root;
  }
  const segments = splitPointer(jsonPointer);
  let current: unknown = root;
  for (const segment of segments) {
    const unwrapped = unwrapDocumentValue(current);
    if (Array.isArray(unwrapped)) {
      const index = Number.parseInt(segment, 10);
      current = Number.isNaN(index) ? undefined : unwrapped[index];
      continue;
    }
    const record = readRecord(unwrapped);
    if (!record) {
      return undefined;
    }
    current = record[segment];
  }
  return unwrapDocumentValue(current);
}

export function extractTimelineId(
  retrievedDoc: Record<string, unknown>,
  contractKey: string,
): string | undefined {
  const contracts = extractField(retrievedDoc, '/contracts');
  const contractsRecord = readRecord(contracts);
  if (!contractsRecord) {
    return undefined;
  }
  return findFirstStringByKey(contractsRecord[contractKey], 'timelineId');
}

export function assertDistinctTimelineIds(
  retrievedDoc: Record<string, unknown>,
  ...contractKeys: string[]
): string[] {
  const timelineIds = contractKeys.map((contractKey) => {
    const timelineId = extractTimelineId(retrievedDoc, contractKey);
    expect(
      timelineId,
      `Missing timelineId for contract ${contractKey}`,
    ).toBeTruthy();
    return timelineId as string;
  });
  expect(new Set(timelineIds).size).toBe(timelineIds.length);
  return timelineIds;
}

function splitPointer(pointer: string): string[] {
  if (!pointer.startsWith('/')) {
    throw new Error(`JSON pointer must start with '/': ${pointer}`);
  }
  return pointer
    .split('/')
    .slice(1)
    .map((segment) => segment.replace(/~1/gu, '/').replace(/~0/gu, '~'));
}

function findFirstStringByKey(value: unknown, key: string): string | undefined {
  if (Array.isArray(value)) {
    for (const item of value) {
      const found = findFirstStringByKey(item, key);
      if (found) {
        return found;
      }
    }
    return undefined;
  }
  const record = readRecord(value);
  if (!record) {
    return undefined;
  }
  if (typeof record[key] === 'string') {
    return readString(record[key]);
  }
  const nestedValue = unwrapDocumentValue(record[key]);
  if (typeof nestedValue === 'string') {
    return readString(nestedValue);
  }
  for (const nested of Object.values(record)) {
    const found = findFirstStringByKey(nested, key);
    if (found) {
      return found;
    }
  }
  return undefined;
}

function deepEqual(left: unknown, right: unknown): boolean {
  if (Object.is(left, right)) {
    return true;
  }
  if (Array.isArray(left) && Array.isArray(right)) {
    if (left.length !== right.length) {
      return false;
    }
    for (let index = 0; index < left.length; index += 1) {
      if (!deepEqual(left[index], right[index])) {
        return false;
      }
    }
    return true;
  }
  const leftRecord = readRecord(left);
  const rightRecord = readRecord(right);
  if (leftRecord && rightRecord) {
    const leftKeys = Object.keys(leftRecord).sort();
    const rightKeys = Object.keys(rightRecord).sort();
    if (!deepEqual(leftKeys, rightKeys)) {
      return false;
    }
    return leftKeys.every((key) =>
      deepEqual(leftRecord[key], rightRecord[key]),
    );
  }
  return false;
}
