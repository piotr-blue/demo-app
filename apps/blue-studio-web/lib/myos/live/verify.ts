import { createHash, webcrypto } from "node:crypto";

const DEFAULT_TIMESTAMP_TOLERANCE_MS = 5 * 60 * 1000;

export interface ParsedSignatureInput {
  label: string;
  componentsRaw: string;
  components: string[];
  paramsRaw: string;
  keyId: string | null;
  alg: string | null;
}

interface JwksDocument {
  keys?: JsonWebKey[];
}

function decodeBase64(value: string): Uint8Array {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded =
    normalized.length % 4 === 0
      ? normalized
      : normalized.padEnd(normalized.length + (4 - (normalized.length % 4)), "=");
  return new Uint8Array(Buffer.from(padded, "base64"));
}

export function verifyContentDigest(rawBody: Uint8Array, contentDigestHeader: string | null): boolean {
  if (!contentDigestHeader) {
    return false;
  }
  const entries = contentDigestHeader
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);

  for (const entry of entries) {
    const match = entry.match(/^([A-Za-z0-9-]+)=:([^:]+):$/);
    if (!match) {
      continue;
    }
    const [, algorithmRaw, digestBase64] = match;
    const algorithm = algorithmRaw.toLowerCase();
    const nodeAlgorithm = algorithm === "sha-512" ? "sha512" : algorithm === "sha-256" ? "sha256" : null;
    if (!nodeAlgorithm) {
      continue;
    }
    const expected = Buffer.from(digestBase64, "base64").toString("base64");
    const actual = createHash(nodeAlgorithm).update(rawBody).digest("base64");
    if (expected === actual) {
      return true;
    }
  }
  return false;
}

export function verifyTimestampWindow(
  timestampHeader: string | null,
  nowMs: number = Date.now(),
  toleranceMs: number = DEFAULT_TIMESTAMP_TOLERANCE_MS
): boolean {
  if (!timestampHeader) {
    return false;
  }
  const asNumber = Number(timestampHeader);
  const timestampMs = Number.isFinite(asNumber)
    ? asNumber > 10_000_000_000
      ? asNumber
      : asNumber * 1000
    : Date.parse(timestampHeader);
  if (!Number.isFinite(timestampMs)) {
    return false;
  }
  return Math.abs(nowMs - timestampMs) <= toleranceMs;
}

export function parseSignatureInputHeader(value: string | null): ParsedSignatureInput | null {
  if (!value) {
    return null;
  }
  const match = value.match(/^([^=]+)=\(([^)]*)\)(.*)$/);
  if (!match) {
    return null;
  }
  const label = match[1]?.trim();
  const componentsRaw = match[2]?.trim();
  const paramsRaw = match[3]?.trim() ?? "";
  if (!label || !componentsRaw) {
    return null;
  }
  const components = componentsRaw
    .split(/\s+/)
    .map((entry) => entry.replace(/^"|"$/g, "").toLowerCase())
    .filter(Boolean);
  const keyId = paramsRaw.match(/;keyid="([^"]+)"/i)?.[1] ?? null;
  const alg = paramsRaw.match(/;alg="([^"]+)"/i)?.[1] ?? null;
  return {
    label,
    componentsRaw,
    components,
    paramsRaw,
    keyId,
    alg,
  };
}

function resolveComponentValue(request: Request, component: string): string | null {
  if (component === "@method") {
    return request.method.toLowerCase();
  }
  if (component === "@path") {
    const url = new URL(request.url);
    return `${url.pathname}${url.search}`;
  }
  return request.headers.get(component);
}

export function buildSignatureBase(request: Request, parsed: ParsedSignatureInput): string | null {
  const lines: string[] = [];
  for (const component of parsed.components) {
    const value = resolveComponentValue(request, component);
    if (value === null) {
      return null;
    }
    lines.push(`"${component}": ${value}`);
  }
  lines.push(`"@signature-params": (${parsed.componentsRaw})${parsed.paramsRaw}`);
  return lines.join("\n");
}

function signatureAlgorithmForImport(alg: string | null, jwk: JsonWebKey): AlgorithmIdentifier | RsaHashedImportParams {
  const normalized = (alg ?? "").toLowerCase();
  if (jwk.kty === "OKP" && jwk.crv === "Ed25519") {
    return { name: "Ed25519" };
  }
  if (normalized.includes("rsa-v1_5") || normalized.includes("rsassa")) {
    return {
      name: "RSASSA-PKCS1-v1_5",
      hash: normalized.includes("sha512") ? "SHA-512" : "SHA-256",
    };
  }
  return {
    name: "RSA-PSS",
    hash: normalized.includes("sha512") ? "SHA-512" : "SHA-256",
  };
}

function signatureAlgorithmForVerify(alg: string | null, jwk: JsonWebKey): AlgorithmIdentifier | RsaPssParams {
  const normalized = (alg ?? "").toLowerCase();
  if (jwk.kty === "OKP" && jwk.crv === "Ed25519") {
    return { name: "Ed25519" };
  }
  if (normalized.includes("rsa-v1_5") || normalized.includes("rsassa")) {
    return { name: "RSASSA-PKCS1-v1_5" };
  }
  return {
    name: "RSA-PSS",
    saltLength: normalized.includes("sha512") ? 64 : 32,
  };
}

async function loadJwks(baseUrl: string): Promise<JsonWebKey[]> {
  const normalizedBase = baseUrl.replace(/\/+$/, "");
  const response = await fetch(`${normalizedBase}/.well-known/jwks.json`, {
    method: "GET",
    headers: { accept: "application/json" },
  });
  if (!response.ok) {
    throw new Error("Failed to fetch MyOS JWKS.");
  }
  const payload = (await response.json()) as JwksDocument;
  if (!Array.isArray(payload.keys) || payload.keys.length === 0) {
    throw new Error("MyOS JWKS response did not include keys.");
  }
  return payload.keys;
}

export async function verifyRfc9421Signature(params: {
  request: Request;
  signatureInputHeader: string | null;
  signatureHeader: string | null;
  myOsBaseUrl: string;
}): Promise<boolean> {
  const parsed = parseSignatureInputHeader(params.signatureInputHeader);
  if (!parsed) {
    return false;
  }
  if (!params.signatureHeader) {
    return false;
  }
  const signatureMatch = params.signatureHeader.match(
    new RegExp(`${parsed.label}=:([^:]+):`)
  );
  if (!signatureMatch?.[1]) {
    return false;
  }
  const signature = decodeBase64(signatureMatch[1]);
  const base = buildSignatureBase(params.request, parsed);
  if (!base) {
    return false;
  }

  const jwks = await loadJwks(params.myOsBaseUrl);
  const candidateKeys =
    parsed.keyId && parsed.keyId.length > 0
      ? jwks.filter((entry) => {
          const kid = (entry as Record<string, unknown>).kid;
          return typeof kid === "string" && kid === parsed.keyId;
        })
      : jwks;
  if (candidateKeys.length === 0) {
    return false;
  }

  const data = new TextEncoder().encode(base);
  for (const jwk of candidateKeys) {
    try {
      const imported = await webcrypto.subtle.importKey(
        "jwk",
        jwk,
        signatureAlgorithmForImport(parsed.alg, jwk),
        false,
        ["verify"]
      );
      const verified = await webcrypto.subtle.verify(
        signatureAlgorithmForVerify(parsed.alg, jwk),
        imported,
        signature,
        data
      );
      if (verified) {
        return true;
      }
    } catch {
      // try next key
    }
  }
  return false;
}

export async function verifyIncomingWebhookRequest(params: {
  request: Request;
  rawBody: string;
  myOsBaseUrl: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const contentDigest = params.request.headers.get("content-digest");
  if (!verifyContentDigest(new TextEncoder().encode(params.rawBody), contentDigest)) {
    return { ok: false, error: "Invalid Content-Digest." };
  }
  const timestamp = params.request.headers.get("x-myos-timestamp");
  if (!verifyTimestampWindow(timestamp)) {
    return { ok: false, error: "Webhook timestamp outside accepted window." };
  }
  const signatureInput = params.request.headers.get("signature-input");
  const signature = params.request.headers.get("signature");
  const signatureValid = await verifyRfc9421Signature({
    request: params.request,
    signatureInputHeader: signatureInput,
    signatureHeader: signature,
    myOsBaseUrl: params.myOsBaseUrl,
  });
  if (!signatureValid) {
    return { ok: false, error: "Invalid webhook signature." };
  }
  return { ok: true };
}
