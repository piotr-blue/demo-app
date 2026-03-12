import { afterEach, describe, expect, it, vi } from "vitest";

const readFileMock = vi.fn();

async function importLoadPrompts(nodeEnv: string) {
  vi.resetModules();
  readFileMock.mockReset();
  vi.doMock("node:fs/promises", () => ({
    readFile: readFileMock,
  }));
  vi.stubEnv("NODE_ENV", nodeEnv);
  return import("./load-prompts");
}

afterEach(() => {
  vi.resetModules();
  vi.doUnmock("node:fs/promises");
  vi.unstubAllEnvs();
});

describe("load-prompts", () => {
  it("re-reads prompts on every call in development", async () => {
    readFileMock.mockResolvedValue("fresh prompt");
    const promptsModule = await importLoadPrompts("development");

    await promptsModule.getBlueprintToJsDslPrompt();
    const readsAfterFirstCall = readFileMock.mock.calls.length;
    await promptsModule.getBlueprintToJsDslPrompt();

    expect(readFileMock.mock.calls.length).toBeGreaterThan(readsAfterFirstCall);
  });
});
