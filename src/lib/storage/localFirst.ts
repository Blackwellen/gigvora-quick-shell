/**
 * Local-first browser storage helper.
 * Default backend for ALL uploads (audio, video, images, attachments).
 *
 * Persistence order:
 *   1. IndexedDB blob → instantly available offline + for previews.
 *   2. Background promotion to remote (S3 / R2) once configured.
 *
 * Call-sites import from here regardless of backend choice.
 */
const DB_NAME = 'gigvora-local-storage';
const STORE = 'blobs';

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export interface LocalBlobRef {
  key: string;
  url: string;          // object URL — valid for the page's lifetime
  contentType: string;
  sizeBytes: number;
  createdAt: string;
}

export async function putBlob(key: string, blob: Blob): Promise<LocalBlobRef> {
  const db = await openDb();
  await new Promise<void>((res, rej) => {
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).put(blob, key);
    tx.oncomplete = () => res();
    tx.onerror = () => rej(tx.error);
  });
  return {
    key,
    url: URL.createObjectURL(blob),
    contentType: blob.type || 'application/octet-stream',
    sizeBytes: blob.size,
    createdAt: new Date().toISOString(),
  };
}

export async function getBlob(key: string): Promise<Blob | undefined> {
  const db = await openDb();
  return new Promise((res, rej) => {
    const tx = db.transaction(STORE, 'readonly');
    const req = tx.objectStore(STORE).get(key);
    req.onsuccess = () => res(req.result as Blob | undefined);
    req.onerror = () => rej(req.error);
  });
}

export async function getBlobUrl(key: string): Promise<string | undefined> {
  const blob = await getBlob(key);
  return blob ? URL.createObjectURL(blob) : undefined;
}

export async function listKeys(): Promise<string[]> {
  const db = await openDb();
  return new Promise((res, rej) => {
    const tx = db.transaction(STORE, 'readonly');
    const req = tx.objectStore(STORE).getAllKeys();
    req.onsuccess = () => res(req.result as string[]);
    req.onerror = () => rej(req.error);
  });
}

export async function deleteBlob(key: string) {
  const db = await openDb();
  await new Promise<void>((res, rej) => {
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).delete(key);
    tx.oncomplete = () => res();
    tx.onerror = () => rej(tx.error);
  });
}

/**
 * Promote a local blob to the active remote backend (S3 / R2) by uploading
 * via a signed URL the server returns. Falls back gracefully when offline.
 */
export async function promoteToRemote(key: string, signedPutUrl: string): Promise<boolean> {
  const blob = await getBlob(key);
  if (!blob) return false;
  try {
    const res = await fetch(signedPutUrl, { method: 'PUT', body: blob, headers: { 'content-type': blob.type } });
    return res.ok;
  } catch { return false; }
}
