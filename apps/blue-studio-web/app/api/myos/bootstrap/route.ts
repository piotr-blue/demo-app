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

function readRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === "object" && value !== null ? (value as Record<string, unknown>) : null;
}

function readString(value: unknown): string | undefined {
  return typeof value === "string" && value.length > 0 ? value : undefined;
}

function readArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function rewriteCoreChannelTypeForBootstrap(value: unknown): unknown {
  if (value === "Core/Channel") {
    return "MyOS/MyOS Timeline Channel";
  }

  if (Array.isArray(value)) {
    return value.map((entry) => rewriteCoreChannelTypeForBootstrap(entry));
  }

  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    return Object.fromEntries(
      Object.entries(record).map(([key, nested]) => [key, rewriteCoreChannelTypeForBootstrap(nested)])
    );
  }

  return value;
}

function collectUuidCandidates(value: unknown): string[] {
  const uuidPattern =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/iu;
  const queue: unknown[] = [value];
  const found = new Set<string>();

  while (queue.length > 0) {
    const current = queue.shift();
    if (Array.isArray(current)) {
      queue.push(...current);
      continue;
    }
    const record = readRecord(current);
    if (!record) {
      const candidate = readString(current);
      if (candidate && uuidPattern.test(candidate)) {
        found.add(candidate);
      }
      continue;
    }
    for (const nestedValue of Object.values(record)) {
      queue.push(nestedValue);
    }
  }

  return [...found];
}

async function resolveTargetSessionId(
  client: MyOsClient,
  bootstrapSessionId: string,
  bootstrapPayload: Record<string, unknown>
): Promise<string> {
  const retrieved = (await client.documents.retrieve(bootstrapSessionId)) as Record<string, unknown>;
  const retrievedType = readString(retrieved.type);
  if (retrievedType !== "MyOS/Document Session Bootstrap") {
    return bootstrapSessionId;
  }

  const bootstrapDocument = readRecord(retrieved.document);
  const initialized = readRecord(bootstrapDocument?.initialized);
  const documentId = readString(initialized?.documentId);

  if (documentId) {
    const listed = (await client.documents.list({
      documentId,
      itemsPerPage: 20,
    })) as Record<string, unknown>;
    const candidates = readArray(listed.items)
      .map((item) => readString(readRecord(item)?.sessionId))
      .filter((value): value is string => Boolean(value))
      .filter((value) => value !== bootstrapSessionId);
    for (const candidate of candidates) {
      try {
        const candidateRetrieved = (await client.documents.retrieve(
          candidate
        )) as Record<string, unknown>;
        if (readString(candidateRetrieved.type) !== "MyOS/Document Session Bootstrap") {
          return candidate;
        }
      } catch {
        // noop
      }
    }
  }

  const uuidCandidates = collectUuidCandidates({
    bootstrapPayload,
    retrieved,
  }).filter((value) => value !== bootstrapSessionId);

  for (const candidate of uuidCandidates) {
    try {
      const candidateRetrieved = (await client.documents.retrieve(candidate)) as Record<string, unknown>;
      if (readString(candidateRetrieved.type) !== "MyOS/Document Session Bootstrap") {
        return candidate;
      }
    } catch {
      // noop
    }
  }

  return bootstrapSessionId;
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
    // TODO(temporary-dirty-fix): MyOS bootstrap currently misbehaves with Core/Channel.
    // Force canonical timeline channel type right before bootstrap.
    const bootstrapDocumentJson = rewriteCoreChannelTypeForBootstrap(body.documentJson) as Record<
      string,
      unknown
    >;
    const bootstrap = await client.documents.bootstrap(bootstrapDocumentJson, normalizedBindings);
    const bootstrapPayload = bootstrap as Record<string, unknown>;
    const bootstrapSessionId = readString(bootstrapPayload.sessionId);
    const sessionId = bootstrapSessionId
      ? await resolveTargetSessionId(client, bootstrapSessionId, bootstrapPayload)
      : null;

    return NextResponse.json({
      ok: true,
      sessionId,
      bootstrapSessionId,
      bootstrap,
    });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: safeErrorMessage(error) },
      { status: 400 }
    );
  }
}
