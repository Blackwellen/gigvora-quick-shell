/**
 * Media upload helper.
 *
 * Strategy:
 * 1. If the api-nest backend is reachable AND a file-storage signing endpoint
 *    is configured (VITE_GIGVORA_API_URL + bearer token), POST to
 *    `/api/v1/file-storage/sign-upload` to get a presigned PUT URL, upload the
 *    file directly to the storage bucket, and return the canonical asset URL.
 * 2. Otherwise return an `objectURL` that previews locally so the editor still
 *    works in demo mode. Callers can detect this via `result.local === true`
 *    and avoid persisting the throwaway URL.
 */
import { sdkReady } from './gigvora-sdk';

export type UploadKind = 'avatar' | 'cover' | 'portfolio' | 'attachment' | 'document' | 'video';

export interface UploadResult {
  url: string;
  /** True when no backend was available; URL is a blob/object URL only valid in this tab. */
  local: boolean;
  /** Server-issued asset id when the file was actually uploaded. */
  assetId?: string;
  contentType: string;
  bytes: number;
}

interface SignedUploadResponse {
  uploadUrl: string;
  publicUrl: string;
  assetId: string;
  expiresIn?: number;
}

const baseUrl =
  (import.meta as { env?: Record<string, string | undefined> }).env?.VITE_GIGVORA_API_URL?.replace(/\/$/, '') || '';

const MAX_BYTES: Record<UploadKind, number> = {
  avatar: 8 * 1024 * 1024,
  cover: 16 * 1024 * 1024,
  portfolio: 32 * 1024 * 1024,
  attachment: 64 * 1024 * 1024,
  document: 64 * 1024 * 1024,
  video: 8 * 1024 * 1024 * 1024, // 8 GB — upstream pipeline enforces hard limits
};

const ALLOWED: Record<UploadKind, RegExp> = {
  avatar: /^image\//,
  cover: /^image\//,
  portfolio: /^(image|video)\//,
  attachment: /.*/,
  document: /^(application|text)\//,
  video: /^video\//,
};

export async function uploadMedia(file: File, kind: UploadKind): Promise<UploadResult> {
  if (!file) throw new Error('No file provided');
  const limit = MAX_BYTES[kind];
  if (file.size > limit) {
    throw new Error(`File too large — max ${(limit / 1024 / 1024).toFixed(0)} MB`);
  }
  if (!ALLOWED[kind].test(file.type || '')) {
    throw new Error(`Unsupported file type for ${kind}: ${file.type || 'unknown'}`);
  }

  // Demo mode — no backend wired, return blob URL.
  if (!baseUrl || !sdkReady()) {
    return {
      url: URL.createObjectURL(file),
      local: true,
      contentType: file.type,
      bytes: file.size,
    };
  }

  let token = '';
  try { token = localStorage.getItem('gigvora.token') || ''; } catch { /* ignore */ }

  const signRes = await fetch(`${baseUrl}/api/v1/file-storage/sign-upload`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({
      kind,
      filename: file.name,
      contentType: file.type,
      bytes: file.size,
    }),
  });

  if (!signRes.ok) {
    // Backend doesn't expose this endpoint yet — fall back to local preview.
    console.warn('[uploadMedia] sign-upload failed, falling back to local preview', signRes.status);
    return {
      url: URL.createObjectURL(file),
      local: true,
      contentType: file.type,
      bytes: file.size,
    };
  }

  const signed = (await signRes.json()) as SignedUploadResponse;

  const putRes = await fetch(signed.uploadUrl, {
    method: 'PUT',
    headers: { 'Content-Type': file.type },
    body: file,
  });
  if (!putRes.ok) {
    throw new Error(`Upload failed: ${putRes.status}`);
  }

  return {
    url: signed.publicUrl,
    local: false,
    assetId: signed.assetId,
    contentType: file.type,
    bytes: file.size,
  };
}
