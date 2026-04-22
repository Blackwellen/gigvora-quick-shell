import { register, type Adapter } from '../index';

/**
 * Cloudflare R2 adapter — opt-in promotion target for local-first storage.
 * Activated when STORAGE_BACKEND=r2 and R2_BUCKET / R2_ACCOUNT_ID are configured.
 * Uses the S3-compatible API so call-sites stay identical to ./s3.ts.
 */
export const r2Adapter: Adapter = {
  id: 'r2',
  category: 'storage',
  configure() {},
  async healthcheck() { return { ok: !!process.env.R2_BUCKET, detail: process.env.R2_BUCKET ?? 'not configured' }; },
};
register(r2Adapter);
