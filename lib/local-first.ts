"use client";

export type SyncEntity = "daily_logs" | "goals" | "settings" | "weekly_reviews" | "ai_analyses";
export type SyncAction = "upsert" | "rate" | "delete_all";

export type SyncOperation = {
  id: string;
  entity: SyncEntity;
  action: SyncAction;
  payload?: unknown;
  created_at: string;
  attempts: number;
  last_error?: string;
};

export type SyncSnapshot = {
  pending: number;
  online: boolean;
  lastError: string;
  updatedAt: string;
};

const DB_NAME = "ascensionos.local_first";
const DB_VERSION = 1;
const KV_STORE = "kv";
const QUEUE_STORE = "sync_queue";
const FALLBACK_PREFIX = "ascensionos.indexeddb_fallback.";
const SYNC_STATUS_KEY = "ascensionos.sync_status";

const browser = () => typeof window !== "undefined";

function fallbackKey(key: string) {
  return `${FALLBACK_PREFIX}${key}`;
}

function readFallback<T>(key: string, fallback: T): T {
  if (!browser()) return fallback;
  const raw = window.localStorage.getItem(fallbackKey(key));
  return raw ? (JSON.parse(raw) as T) : fallback;
}

function writeFallback<T>(key: string, value: T) {
  if (browser()) window.localStorage.setItem(fallbackKey(key), JSON.stringify(value));
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (!browser() || !window.indexedDB) {
      reject(new Error("IndexedDB is unavailable."));
      return;
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(KV_STORE)) db.createObjectStore(KV_STORE);
      if (!db.objectStoreNames.contains(QUEUE_STORE)) db.createObjectStore(QUEUE_STORE, { keyPath: "id" });
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("Unable to open local database."));
  });
}

async function withStore<T>(storeName: string, mode: IDBTransactionMode, run: (store: IDBObjectStore) => IDBRequest<T>) {
  const db = await openDb();
  return new Promise<T>((resolve, reject) => {
    const tx = db.transaction(storeName, mode);
    const request = run(tx.objectStore(storeName));
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("Local database request failed."));
    tx.oncomplete = () => db.close();
    tx.onerror = () => {
      db.close();
      reject(tx.error ?? new Error("Local database transaction failed."));
    };
  });
}

export async function readLocalValue<T>(key: string, fallback: T): Promise<T> {
  try {
    const value = await withStore<T | undefined>(KV_STORE, "readonly", (store) => store.get(key));
    return value ?? readFallback(key, fallback);
  } catch {
    return readFallback(key, fallback);
  }
}

export async function writeLocalValue<T>(key: string, value: T): Promise<void> {
  writeFallback(key, value);
  try {
    await withStore<IDBValidKey>(KV_STORE, "readwrite", (store) => store.put(value, key));
  } catch {
    // localStorage fallback has already persisted the value.
  }
}

export async function enqueueSyncOperation(operation: Omit<SyncOperation, "id" | "created_at" | "attempts">) {
  const queued: SyncOperation = {
    ...operation,
    id: crypto.randomUUID(),
    created_at: new Date().toISOString(),
    attempts: 0
  };
  const queue = await getPendingSyncOperations();
  await writeFallbackQueue([...queue, queued]);
  try {
    await withStore<IDBValidKey>(QUEUE_STORE, "readwrite", (store) => store.put(queued));
  } catch {
    // localStorage fallback has already persisted the operation.
  }
  await writeSyncSnapshot({ pending: queue.length + 1, lastError: "Waiting to sync local changes." });
  return queued;
}

async function writeFallbackQueue(queue: SyncOperation[]) {
  writeFallback(QUEUE_STORE, queue);
}

export async function getPendingSyncOperations(): Promise<SyncOperation[]> {
  try {
    const queue = await withStore<SyncOperation[]>(QUEUE_STORE, "readonly", (store) => store.getAll());
    return queue.sort((a, b) => a.created_at.localeCompare(b.created_at));
  } catch {
    return readFallback<SyncOperation[]>(QUEUE_STORE, []).sort((a, b) => a.created_at.localeCompare(b.created_at));
  }
}

export async function removeSyncOperation(id: string) {
  const queue = (await getPendingSyncOperations()).filter((operation) => operation.id !== id);
  await writeFallbackQueue(queue);
  try {
    await withStore<undefined>(QUEUE_STORE, "readwrite", (store) => store.delete(id) as IDBRequest<undefined>);
  } catch {
    // localStorage fallback has already removed the operation.
  }
  await writeSyncSnapshot({ pending: queue.length, lastError: queue.length ? "Sync still has pending changes." : "" });
}

export async function updateSyncOperationError(id: string, message: string) {
  const queue = await getPendingSyncOperations();
  const next = queue.map((operation) =>
    operation.id === id ? { ...operation, attempts: operation.attempts + 1, last_error: message } : operation
  );
  await writeFallbackQueue(next);
  const updated = next.find((operation) => operation.id === id);
  if (updated) {
    try {
      await withStore<IDBValidKey>(QUEUE_STORE, "readwrite", (store) => store.put(updated));
    } catch {
      // localStorage fallback has already persisted the update.
    }
  }
  await writeSyncSnapshot({ pending: next.length, lastError: message });
}

export async function getSyncSnapshot(): Promise<SyncSnapshot> {
  const fallback: SyncSnapshot = {
    pending: 0,
    online: browser() ? window.navigator.onLine : true,
    lastError: "",
    updatedAt: ""
  };
  const snapshot = await readLocalValue(SYNC_STATUS_KEY, fallback);
  const queue = await getPendingSyncOperations();
  return {
    ...fallback,
    ...snapshot,
    pending: queue.length,
    online: browser() ? window.navigator.onLine : true
  };
}

export async function writeSyncSnapshot(patch: Partial<Omit<SyncSnapshot, "online">>) {
  const current = await getSyncSnapshot();
  await writeLocalValue(SYNC_STATUS_KEY, {
    ...current,
    ...patch,
    online: browser() ? window.navigator.onLine : true,
    updatedAt: new Date().toISOString()
  });
}
