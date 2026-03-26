import { openDB } from "idb";
import { createSeedSnapshot } from "@/lib/demo/seed";
import type { DemoSnapshot } from "@/lib/demo/types";

const DB_NAME = "myos-demo-v1";
const DB_VERSION = 3;
const SNAPSHOT_STORE = "snapshot";
const META_STORE = "meta";
const SNAPSHOT_KEY = "current";
const DEMO_SEED_VERSION = "seed-multi-account-myos-v3-live-account";

interface MetaRecord {
  key: string;
  value: string;
}

interface SnapshotRecord {
  id: string;
  snapshot: DemoSnapshot;
}

async function getDemoDb() {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      for (const storeName of Array.from(db.objectStoreNames)) {
        db.deleteObjectStore(storeName);
      }
      db.createObjectStore(SNAPSHOT_STORE, { keyPath: "id" });
      db.createObjectStore(META_STORE, { keyPath: "key" });
    },
  });
}

async function ensureSeeded(): Promise<void> {
  const db = await getDemoDb();
  const seededVersion = (await db.get(META_STORE, "seedVersion")) as MetaRecord | undefined;
  const current = (await db.get(SNAPSHOT_STORE, SNAPSHOT_KEY)) as SnapshotRecord | undefined;

  if (seededVersion?.value === DEMO_SEED_VERSION && current?.snapshot) {
    return;
  }

  const seededSnapshot = createSeedSnapshot();
  const tx = db.transaction([SNAPSHOT_STORE, META_STORE], "readwrite");
  await tx.objectStore(SNAPSHOT_STORE).put({
    id: SNAPSHOT_KEY,
    snapshot: seededSnapshot,
  } satisfies SnapshotRecord);
  await tx.objectStore(META_STORE).put({
    key: "seedVersion",
    value: DEMO_SEED_VERSION,
  } satisfies MetaRecord);
  await tx.objectStore(META_STORE).put({
    key: "seededAt",
    value: new Date().toISOString(),
  } satisfies MetaRecord);
  await tx.done;
}

export async function getDemoSnapshot(): Promise<DemoSnapshot> {
  await ensureSeeded();
  const db = await getDemoDb();
  const record = (await db.get(SNAPSHOT_STORE, SNAPSHOT_KEY)) as SnapshotRecord | undefined;
  return record?.snapshot ?? createSeedSnapshot();
}

export async function saveDemoSnapshot(snapshot: DemoSnapshot): Promise<void> {
  await ensureSeeded();
  const db = await getDemoDb();
  const tx = db.transaction([SNAPSHOT_STORE, META_STORE], "readwrite");
  await tx.objectStore(SNAPSHOT_STORE).put({
    id: SNAPSHOT_KEY,
    snapshot,
  } satisfies SnapshotRecord);
  await tx.objectStore(META_STORE).put({
    key: "updatedAt",
    value: new Date().toISOString(),
  } satisfies MetaRecord);
  await tx.done;
}

export async function clearDemoPersistence(): Promise<void> {
  const db = await getDemoDb();
  const tx = db.transaction([SNAPSHOT_STORE, META_STORE], "readwrite");
  await tx.objectStore(SNAPSHOT_STORE).clear();
  await tx.objectStore(META_STORE).clear();
  await tx.done;
}
