import { NextResponse } from "next/server";
import { z } from "zod";
import { MyOsClient } from "@blue-labs/myos-js";
import { parseRouteCredentials } from "@/lib/api/credentials";
import { toMyOsBindings } from "@/lib/myos/bindings";
import { safeErrorMessage } from "@/lib/security/redact";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const bindingSchema = z.object({
  channelName: z.string().min(1),
  mode: z.enum(["email", "accountId"]),
  value: z.string().min(1),
  timelineId: z.string().optional(),
});

const requestSchema = z.object({
  credentials: z.unknown(),
  documentJson: z.record(z.string(), z.any()),
  bindings: z.array(bindingSchema),
});

const BOOTSTRAP_SESSION_TYPE = "MyOS/Document Session Bootstrap";
const BOOTSTRAP_FAILURE_EVENT_TYPE = "MyOS/Bootstrap Failed";
const POLL_INTERVAL_MS = 1_500;
const MAX_POLL_ATTEMPTS = 80;

function readRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === "object" && value !== null ? (value as Record<string, unknown>) : null;
}

function readString(value: unknown): string | undefined {
  return typeof value === "string" && value.length > 0 ? value : undefined;
}

function readArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function unwrapDocumentValue(value: unknown): unknown {
  const record = readRecord(value);
  if (record && Object.prototype.hasOwnProperty.call(record, "value")) {
    return record.value;
  }
  return value;
}

function isUuid(value: string | undefined): value is string {
  return Boolean(value?.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/iu));
}

function readAllowedOperations(value: unknown): string[] {
  return readArray(unwrapDocumentValue(value))
    .map((entry) => readString(unwrapDocumentValue(entry)))
    .filter((entry): entry is string => Boolean(entry));
}

function readBootstrapState(retrieved: Record<string, unknown>): string | null {
  const document = readRecord(unwrapDocumentValue(retrieved.document));
  return (
    readString(unwrapDocumentValue(retrieved.processingStatus)) ??
    readString(unwrapDocumentValue(retrieved.status)) ??
    readString(unwrapDocumentValue(document?.processingStatus)) ??
    readString(unwrapDocumentValue(document?.status)) ??
    readString(unwrapDocumentValue(document?.state)) ??
    null
  );
}

function looksLikeBootstrapFailureState(state: string | null): boolean {
  if (!state) {
    return false;
  }
  return /(fail|error|cancel|reject|abort)/iu.test(state);
}

function containsEventType(value: unknown, eventType: string): boolean {
  const queue: unknown[] = [value];
  while (queue.length > 0) {
    const current = unwrapDocumentValue(queue.shift());
    if (Array.isArray(current)) {
      queue.push(...current);
      continue;
    }
    const record = readRecord(current);
    if (!record) {
      continue;
    }
    if (readString(unwrapDocumentValue(record.type)) === eventType) {
      return true;
    }
    queue.push(...Object.values(record));
  }
  return false;
}

function collectInitiatorSessionIds(value: unknown, bootstrapSessionId: string): string[] {
  const queue: unknown[] = [value];
  const found = new Set<string>();

  const pushIfCandidate = (candidate: string | undefined) => {
    if (!isUuid(candidate) || candidate === bootstrapSessionId) {
      return;
    }
    found.add(candidate);
  };

  while (queue.length > 0) {
    const current = unwrapDocumentValue(queue.shift());
    if (Array.isArray(current)) {
      queue.push(...current);
      continue;
    }

    const record = readRecord(current);
    if (!record) {
      continue;
    }

    pushIfCandidate(readString(unwrapDocumentValue(record.initiatorSessionId)));
    pushIfCandidate(readString(unwrapDocumentValue(record.targetSessionId)));

    const initiatorSet = readRecord(unwrapDocumentValue(record.initiatorSessionIds));
    if (initiatorSet) {
      for (const item of readArray(unwrapDocumentValue(initiatorSet.items))) {
        const itemRecord = readRecord(unwrapDocumentValue(item));
        if (itemRecord) {
          pushIfCandidate(readString(unwrapDocumentValue(itemRecord.value)));
        } else {
          pushIfCandidate(readString(unwrapDocumentValue(item)));
        }
      }
    }

    queue.push(...Object.values(record));
  }

  return [...found];
}

function pickBootstrapStartOperation(allowedOperations: string[]): string | null {
  const byNormalized = new Map(
    allowedOperations.map((operation) => [operation.trim().toLowerCase(), operation] as const)
  );

  const direct =
    byNormalized.get("start") ??
    byNormalized.get("resume") ??
    byNormalized.get("initialize") ??
    byNormalized.get("bootstrap");
  if (direct) {
    return direct;
  }

  if (allowedOperations.length === 1) {
    return allowedOperations[0] ?? null;
  }

  return null;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function resolveBootstrapOutcome(
  client: MyOsClient,
  bootstrapSessionId: string,
  bootstrapPayload: Record<string, unknown>
): Promise<{
  sessionId: string;
  initiatorSessionId: string | null;
  bootstrapState: string | null;
  startedOperation: string | null;
}> {
  let startedOperation: string | null = null;
  let latestState: string | null = null;

  for (let attempt = 0; attempt < MAX_POLL_ATTEMPTS; attempt += 1) {
    const retrieved = (await client.documents.retrieve(bootstrapSessionId)) as Record<string, unknown>;
    const retrievedType = readString(unwrapDocumentValue(retrieved.type));
    latestState = readBootstrapState(retrieved);

    if (retrievedType && retrievedType !== BOOTSTRAP_SESSION_TYPE) {
      return {
        sessionId: bootstrapSessionId,
        initiatorSessionId: null,
        bootstrapState: latestState,
        startedOperation,
      };
    }

    if (
      looksLikeBootstrapFailureState(latestState) ||
      containsEventType(retrieved, BOOTSTRAP_FAILURE_EVENT_TYPE)
    ) {
      throw new Error(
        `Bootstrap failed before target session started. state=${latestState ?? "unknown"}`
      );
    }

    const initiatorSessionIds = collectInitiatorSessionIds(
      {
        bootstrapPayload,
        retrieved,
      },
      bootstrapSessionId
    );
    for (const initiatorSessionId of initiatorSessionIds) {
      try {
        const targetRetrieved = (await client.documents.retrieve(
          initiatorSessionId
        )) as Record<string, unknown>;
        if (readString(unwrapDocumentValue(targetRetrieved.type)) !== BOOTSTRAP_SESSION_TYPE) {
          return {
            sessionId: initiatorSessionId,
            initiatorSessionId,
            bootstrapState: latestState,
            startedOperation,
          };
        }
      } catch {
        // wait for next poll
      }
    }

    if (!startedOperation) {
      const allowedOperations = readAllowedOperations(retrieved.allowedOperations);
      const startOperation = pickBootstrapStartOperation(allowedOperations);
      if (startOperation) {
        await client.documents.runOperation(bootstrapSessionId, startOperation);
        startedOperation = startOperation;
      }
    }

    await sleep(POLL_INTERVAL_MS);
  }

  throw new Error(
    `Bootstrap did not produce initiatorSessionId in time. bootstrapSessionId=${bootstrapSessionId} state=${latestState ?? "unknown"}`
  );
}

export async function POST(request: Request) {
  try {
    const body = requestSchema.parse(await request.json());
    const credentials = parseRouteCredentials(body.credentials);
    const client = new MyOsClient({
      apiKey: credentials.myOsApiKey,
      baseUrl: credentials.myOsBaseUrl,
      timeoutMs: 45_000,
      maxRetries: 2,
    });

    const normalizedBindings = toMyOsBindings(body.bindings);
    const bootstrap = await client.documents.bootstrap(body.documentJson, normalizedBindings);
    const bootstrapPayload = bootstrap as Record<string, unknown>;
    const bootstrapSessionId = readString(bootstrapPayload.sessionId);
    if (!bootstrapSessionId) {
      throw new Error("Bootstrap response did not include a bootstrap sessionId.");
    }

    const resolved = await resolveBootstrapOutcome(client, bootstrapSessionId, bootstrapPayload);

    return NextResponse.json({
      ok: true,
      sessionId: resolved.sessionId,
      initiatorSessionId: resolved.initiatorSessionId,
      bootstrapSessionId,
      bootstrapSucceeded: true,
      bootstrapState: resolved.bootstrapState,
      bootstrapStartOperation: resolved.startedOperation,
      bootstrap,
    });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: safeErrorMessage(error) },
      { status: 400 }
    );
  }
}
