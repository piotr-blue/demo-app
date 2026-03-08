import { openDB } from "idb";
import type { WorkspaceState } from "@/lib/workspace/types";
import { normalizeWorkspaceState } from "@/lib/workspace/state";

const DB_NAME = "blue-studio-web";
const DB_VERSION = 1;
const WORKSPACE_STORE = "workspaces";
const FILE_STORE = "files";

export interface StoredFileBlob {
  id: string;
  workspaceId: string;
  name: string;
  mimeType: string;
  blob: Blob;
  createdAt: string;
}

async function getDb() {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(WORKSPACE_STORE)) {
        db.createObjectStore(WORKSPACE_STORE);
      }
      if (!db.objectStoreNames.contains(FILE_STORE)) {
        const store = db.createObjectStore(FILE_STORE, { keyPath: "id" });
        store.createIndex("workspaceId", "workspaceId");
      }
    },
  });
}

export async function saveWorkspace(workspace: WorkspaceState): Promise<void> {
  const db = await getDb();
  await db.put(WORKSPACE_STORE, workspace, workspace.id);
}

export async function readWorkspace(workspaceId: string): Promise<WorkspaceState | null> {
  const db = await getDb();
  const value = await db.get(WORKSPACE_STORE, workspaceId);
  const workspace = (value as WorkspaceState | undefined) ?? null;
  return workspace ? normalizeWorkspaceState(workspace) : null;
}

export async function listWorkspaces(): Promise<WorkspaceState[]> {
  const db = await getDb();
  const values = (await db.getAll(WORKSPACE_STORE)) as WorkspaceState[];
  return values
    .map((workspace) => normalizeWorkspaceState(workspace))
    .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));
}

export async function saveFileBlob(file: StoredFileBlob): Promise<void> {
  const db = await getDb();
  await db.put(FILE_STORE, file);
}

export async function listFileBlobs(workspaceId: string): Promise<StoredFileBlob[]> {
  const db = await getDb();
  return db.getAllFromIndex(FILE_STORE, "workspaceId", workspaceId);
}

export async function deleteFileBlob(fileId: string): Promise<void> {
  const db = await getDb();
  await db.delete(FILE_STORE, fileId);
}

export async function clearWorkspacePersistence(workspaceId: string): Promise<void> {
  const db = await getDb();
  await db.delete(WORKSPACE_STORE, workspaceId);
  const fileIds = await db.getAllKeysFromIndex(FILE_STORE, "workspaceId", workspaceId);
  await Promise.all(fileIds.map((fileId) => db.delete(FILE_STORE, fileId)));
}

export async function deleteWorkspace(workspaceId: string): Promise<void> {
  await clearWorkspacePersistence(workspaceId);
}

export async function clearAllWorkspacePersistence(): Promise<void> {
  const db = await getDb();
  await db.clear(WORKSPACE_STORE);
  await db.clear(FILE_STORE);
}
