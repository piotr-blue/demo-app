import { afterEach, describe, expect, it, vi } from "vitest";
import { createHash, generateKeyPairSync, webcrypto } from "node:crypto";
import {
  buildSignatureBase,
  parseSignatureInputHeader,
  verifyContentDigest,
  verifyRfc9421Signature,
  verifyTimestampWindow,
} from "@/lib/myos/live/verify";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("verifyContentDigest", () => {
  it("accepts a valid sha-256 digest", () => {
    const body = "hello webhook";
    const digest = createHash("sha256").update(body).digest("base64");
    const header = `sha-256=:${digest}:`;
    expect(verifyContentDigest(new TextEncoder().encode(body), header)).toBe(true);
  });

  it("rejects mismatched digest", () => {
    const body = "hello webhook";
    const header = "sha-256=:ZmFrZQ==:";
    expect(verifyContentDigest(new TextEncoder().encode(body), header)).toBe(false);
  });
});

describe("verifyTimestampWindow", () => {
  it("rejects timestamps outside skew tolerance", () => {
    const now = Date.parse("2026-03-08T12:00:00.000Z");
    const oldTimestamp = String(Math.floor(Date.parse("2026-03-08T11:40:00.000Z") / 1000));
    expect(verifyTimestampWindow(oldTimestamp, now)).toBe(false);
  });
});

describe("parseSignatureInputHeader", () => {
  it("parses keyId, alg, and component list", () => {
    const parsed = parseSignatureInputHeader(
      'sig1=("@method" "@path" "content-digest");created=1;keyid="k1";alg="rsa-pss-sha512"'
    );
    expect(parsed?.label).toBe("sig1");
    expect(parsed?.components).toEqual(["@method", "@path", "content-digest"]);
    expect(parsed?.keyId).toBe("k1");
    expect(parsed?.alg).toBe("rsa-pss-sha512");
  });
});

describe("verifyRfc9421Signature", () => {
  it("validates signature against JWKS", async () => {
    const { privateKey, publicKey } = generateKeyPairSync("rsa", {
      modulusLength: 2048,
    });
    const publicJwk = publicKey.export({ format: "jwk" }) as JsonWebKey;
    const privateJwk = privateKey.export({ format: "jwk" }) as JsonWebKey;
    (publicJwk as JsonWebKey & { kid?: string }).kid = "test-key";
    (privateJwk as JsonWebKey & { kid?: string }).kid = "test-key";

    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ keys: [publicJwk] }), {
        status: 200,
        headers: { "content-type": "application/json" },
      })
    );

    const signatureInputHeader =
      'sig1=("@method" "@path" "content-digest" "x-myos-timestamp" "x-myos-delivery-id");created=1;keyid="test-key";alg="rsa-pss-sha256"';
    const parsed = parseSignatureInputHeader(signatureInputHeader);
    expect(parsed).not.toBeNull();

    const request = new Request("https://example.test/hooks?x=1", {
      method: "POST",
      headers: {
        "content-digest": "sha-256=:ZmFrZQ==:",
        "x-myos-timestamp": String(Math.floor(Date.now() / 1000)),
        "x-myos-delivery-id": "delivery-1",
      },
    });

    const base = buildSignatureBase(request, parsed!);
    expect(base).toBeTruthy();
    const privateCryptoKey = await webcrypto.subtle.importKey(
      "jwk",
      privateJwk,
      { name: "RSA-PSS", hash: "SHA-256" },
      false,
      ["sign"]
    );
    const signature = await webcrypto.subtle.sign(
      { name: "RSA-PSS", saltLength: 32 },
      privateCryptoKey,
      new TextEncoder().encode(base!)
    );
    const signatureHeader = `sig1=:${Buffer.from(signature).toString("base64")}:`;

    const valid = await verifyRfc9421Signature({
      request,
      signatureInputHeader,
      signatureHeader,
      myOsBaseUrl: "https://api.dev.myos.blue",
    });
    expect(valid).toBe(true);
  });
});
