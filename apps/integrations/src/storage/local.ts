/**
 * Local-first storage adapter — DEFAULT for all uploads & persistence.
 *
 * Strategy:
 *   1. Browser uploads land in IndexedDB / Worker virtual FS first (instant).
 *   2. A background sync job promotes blobs to the configured remote backend
 *      (S3 → see ./s3.ts, R2 → see ./r2.ts) when a connection is enabled.
 *   3. Until then, signed URLs are issued from the local namespace so UI
 *      previews (audio waveforms, video thumbs, hover previews) never break.
 *
 * Switching backends is a config change only — no call-site changes needed.
 */
import { register, type Adapter } from '../index';

export type StorageBackend = 'local' | 's3' | 'r2';

export interface StorageObjectRef {
  backend: StorageBackend;
  key: string;
  url: string;
  contentType: string;
  sizeBytes: number;
  createdAt: string;
  promoted?: { backend: StorageBackend; key: string; url: string; promotedAt: string };
}

const NS = 'gigvora-local-storage';
const memory = new Map<string, StorageObjectRef>();

export const localAdapter: Adapter = {
  id: 'storage-local',
  category: 'storage',
  configure() { /* no-op */ },
  async healthcheck() { return { ok: true, detail: `local store · ${memory.size} blobs` }; },
};
register(localAdapter);

/** Server-side: returns a deterministic local URL the client can fetch back. */
export function putLocal(key: string, contentType: string, sizeBytes: number): StorageObjectRef {
  const ref: StorageObjectRef = {
    backend: 'local',
    key,
    url: `/_local/${NS}/${encodeURIComponent(key)}`,
    contentType,
    sizeBytes,
    createdAt: new Date().toISOString(),
  };
  memory.set(key, ref);
  return ref;
}

export function getLocal(key: string) { return memory.get(key); }

/** Promote a local blob to a remote backend; called by the sync worker. */
export function promote(key: string, to: { backend: 's3' | 'r2'; key: string; url: string }) {
  const ref = memory.get(key); if (!ref) return undefined;
  ref.promoted = { ...to, promotedAt: new Date().toISOString() };
  return ref;
}

/** Resolve the *active* URL — promoted backend wins, falls back to local. */
export function resolveUrl(key: string) {
  const ref = memory.get(key); if (!ref) return undefined;
  return ref.promoted?.url ?? ref.url;
}

export function activeBackend(): StorageBackend {
  if (process.env.STORAGE_BACKEND === 's3') return 's3';
  if (process.env.STORAGE_BACKEND === 'r2') return 'r2';
  return 'local';
}
