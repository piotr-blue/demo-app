import { describe, expect, it } from "vitest";
import {
  parseStatusTemplateBundle,
  parseStatusTemplatePayload,
} from "@/lib/document/status-templates/parser";

describe("parseStatusTemplatePayload", () => {
  it("parses plain JSON payload", () => {
    const payload = parseStatusTemplatePayload(
      JSON.stringify({
        viewer: "ownerChannel",
        templates: [
          { when: "doc('/status') === 'draft'", title: "Draft", body: "Draft body" },
          { when: "true", title: "Fallback", body: "Fallback body" },
        ],
      })
    );
    expect(payload.viewer).toBe("ownerChannel");
    expect(payload.templates).toHaveLength(2);
  });

  it("parses fenced JSON payload", () => {
    const payload = parseStatusTemplatePayload(`\`\`\`json
{
  "viewer": "ownerChannel",
  "templates": [
    { "when": "true", "title": "Any", "body": "Any body" }
  ]
}
\`\`\``);
    expect(payload.viewer).toBe("ownerChannel");
    expect(payload.templates[0]?.when).toBe("true");
  });

  it("rejects missing fallback template", () => {
    expect(() =>
      parseStatusTemplatePayload(
        JSON.stringify({
          viewer: "ownerChannel",
          templates: [{ when: "doc('/status') === 'draft'", title: "Draft", body: "Draft body" }],
        })
      )
    ).toThrow("fallback template");
  });

  it("rejects more than fifteen templates", () => {
    const templates = Array.from({ length: 16 }).map((_, index) => ({
      when: index === 15 ? "true" : `doc('/step') === ${index}`,
      title: `Title ${index}`,
      body: `Body ${index}`,
    }));
    expect(() =>
      parseStatusTemplatePayload(
        JSON.stringify({
          viewer: "ownerChannel",
          templates,
        })
      )
    ).toThrow();
  });

  it("rejects malformed payload shape", () => {
    expect(() =>
      parseStatusTemplatePayload(
        JSON.stringify({
          viewer: "",
          templates: "not-an-array",
        })
      )
    ).toThrow();
  });
});

describe("parseStatusTemplateBundle", () => {
  it("builds bundle with blueprint hash", () => {
    const bundle = parseStatusTemplateBundle({
      raw: JSON.stringify({
        viewer: "ownerChannel",
        templates: [{ when: "true", title: "Ready", body: "Ready body" }],
      }),
      blueprintHash: "hash-1",
      generatedAt: "2026-03-08T00:00:00.000Z",
    });
    expect(bundle).toEqual({
      viewer: "ownerChannel",
      blueprintHash: "hash-1",
      templates: [{ when: "true", title: "Ready", body: "Ready body" }],
      generatedAt: "2026-03-08T00:00:00.000Z",
    });
  });
});

