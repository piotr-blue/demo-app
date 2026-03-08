import "fake-indexeddb/auto";
import { describe, expect, it } from "vitest";
import {
  clearAllWorkspacePersistence,
  listFileBlobs,
  listWorkspaces,
  saveFileBlob,
  saveWorkspace,
} from "@/lib/storage/indexeddb";
import { createWorkspace } from "@/lib/workspace/state";

describe("clearAllWorkspacePersistence", () => {
  it("removes all saved workspaces and file blobs", async () => {
    await clearAllWorkspacePersistence();

    const workspace1 = createWorkspace("w_1", null);
    const workspace2 = createWorkspace("w_2", null);
    await saveWorkspace(workspace1);
    await saveWorkspace(workspace2);

    await saveFileBlob({
      id: "file_1",
      workspaceId: "w_1",
      name: "notes.txt",
      mimeType: "text/plain",
      blob: new Blob(["hello"]),
      createdAt: new Date().toISOString(),
    });
    await saveFileBlob({
      id: "file_2",
      workspaceId: "w_2",
      name: "other.txt",
      mimeType: "text/plain",
      blob: new Blob(["hello"]),
      createdAt: new Date().toISOString(),
    });

    expect((await listWorkspaces()).length).toBeGreaterThanOrEqual(2);
    expect((await listFileBlobs("w_1")).length).toBe(1);

    await clearAllWorkspacePersistence();

    expect(await listWorkspaces()).toEqual([]);
    expect(await listFileBlobs("w_1")).toEqual([]);
    expect(await listFileBlobs("w_2")).toEqual([]);
  });
});
