import { describe, expect, it } from "vitest";
import { compileDslModule } from "@/lib/dsl/compile-harness";

describe("compileDslModule", () => {
  it("compiles generated DSL and returns structure", async () => {
    const code = `
      export function buildDocument() {
        return {
          name: 'Counter',
          counter: 0,
          contracts: {
            ownerChannel: {
              type: 'Conversation/Timeline Channel',
              timelineId: 'owner-timeline',
            },
          },
        };
      }
    `;

    const compiled = await compileDslModule(code);
    expect(compiled.documentJson.name).toBe("Counter");
    expect(compiled.structure.contracts.some((entry) => entry.key === "ownerChannel")).toBe(true);
  });

  it("fails when buildDocument export is missing", async () => {
    await expect(
      compileDslModule("export const notBuildDocument = () => null;")
    ).rejects.toThrow("buildDocument");
  });
});
