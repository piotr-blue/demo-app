import { describe, expect, it } from "vitest";
import { parseBlueprintResponse } from "@/lib/prompt/blueprint-parser";

describe("parseBlueprintResponse", () => {
  it("parses questions state", () => {
    const parsed = parseBlueprintResponse("STATE: questions\nQUESTION: Which currency should be used?");
    expect(parsed.state).toBe("questions");
    expect(parsed.question).toBe("Which currency should be used?");
  });

  it("parses ready state blueprint", () => {
    const raw = "STATE: ready\nTYPE: Document\nBLUEPRINT: Counter";
    const parsed = parseBlueprintResponse(raw);
    expect(parsed.state).toBe("ready");
    expect(parsed.blueprint).toBe(raw);
  });
});
