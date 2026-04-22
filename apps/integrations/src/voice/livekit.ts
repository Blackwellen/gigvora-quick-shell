/**
 * LiveKit adapter — used by Networking + Speed Networking when:
 *   • Room capacity > 50 (Jitsi public is fine for small rooms; LiveKit scales)
 *   • Room is paid (we want better recording + analytics)
 *
 * Contract is identical to Jitsi adapter: `buildLiveKitJoin()` returns a
 * `LiveKitJoin` envelope. Real JWT signing uses `LIVEKIT_API_KEY` +
 * `LIVEKIT_API_SECRET` + `LIVEKIT_URL` env vars (configured per deployment).
 *
 * Falls back to the deterministic envelope when secrets are missing so dev
 * preview never throws — `joinUrl` is still issued and the front-end can
 * surface a "configure LiveKit" warning instead of crashing.
 */
import { register, type Adapter } from '../index';
import crypto from 'node:crypto';

export interface LiveKitRoomOptions {
  roomName: string;
  identityId: string;
  displayName?: string;
  canPublish?: boolean;
  canSubscribe?: boolean;
  ttlSeconds?: number;
  metadata?: Record<string, unknown>;
}

export interface LiveKitJoin {
  url: string;
  roomName: string;
  identity: string;
  token: string;
  expiresAt: string;
  configured: boolean;
}

const sanitise = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '').slice(0, 60);

export const liveKitAdapter: Adapter<{ url?: string; apiKey?: string; apiSecret?: string }> = {
  id: 'livekit',
  category: 'voice',
  configure() {/* env-driven */},
  async healthcheck() {
    const url = process.env.LIVEKIT_URL;
    if (!url) return { ok: false, detail: 'LIVEKIT_URL not set' };
    try {
      const u = new URL(url.replace(/^wss?/, 'https'));
      const res = await fetch(`${u.origin}/`, { method: 'HEAD', signal: AbortSignal.timeout(2500) });
      return { ok: res.ok || res.status < 500, detail: `${u.host} ${res.status}` };
    } catch (e: any) { return { ok: false, detail: e?.message ?? 'unreachable' }; }
  },
};
register(liveKitAdapter);

/**
 * Mint a LiveKit access token (HS256 JWT).
 * Returns a deterministic placeholder when the API secret is missing so the
 * caller can render a "needs configuration" notice without crashing.
 */
export function buildLiveKitJoin(opts: LiveKitRoomOptions): LiveKitJoin {
  const url = process.env.LIVEKIT_URL || 'wss://livekit.example.com';
  const apiKey = process.env.LIVEKIT_API_KEY || '';
  const apiSecret = process.env.LIVEKIT_API_SECRET || '';
  const roomName = `gv-${sanitise(opts.roomName)}`;
  const ttl = Math.max(60, Math.min(opts.ttlSeconds ?? 60 * 60 * 4, 60 * 60 * 12));
  const exp = Math.floor(Date.now() / 1000) + ttl;
  const expiresAt = new Date(exp * 1000).toISOString();
  if (!apiKey || !apiSecret) {
    return { url, roomName, identity: opts.identityId, token: '', expiresAt, configured: false };
  }
  const header = { alg: 'HS256', typ: 'JWT' };
  const payload = {
    iss: apiKey,
    sub: opts.identityId,
    name: opts.displayName ?? opts.identityId,
    nbf: Math.floor(Date.now() / 1000),
    exp,
    video: {
      room: roomName,
      roomJoin: true,
      canPublish: opts.canPublish ?? true,
      canSubscribe: opts.canSubscribe ?? true,
    },
    metadata: opts.metadata ? JSON.stringify(opts.metadata) : undefined,
  };
  const b64 = (o: unknown) =>
    Buffer.from(JSON.stringify(o)).toString('base64url');
  const data = `${b64(header)}.${b64(payload)}`;
  const sig = crypto.createHmac('sha256', apiSecret).update(data).digest('base64url');
  return { url, roomName, identity: opts.identityId, token: `${data}.${sig}`, expiresAt, configured: true };
}
