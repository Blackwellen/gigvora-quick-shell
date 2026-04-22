/**
 * Free, open-source Jitsi Meet adapter — used by:
 *   • Domain 18 calls (1:1 + group voice/video)
 *   • Domain 21 podcasts (live recording rooms)
 *   • Domain 24+ webinars (broadcast rooms)
 *   • Inbox voice-notes (lobby-less p2p)
 *
 * Uses the public meet.jit.si server by default (zero-cost, no API key).
 * For enterprise self-hosting set JITSI_DOMAIN to your own deployment
 * (e.g. jitsi.gigvora.com) — adapter contract is identical.
 *
 * No npm dep required: clients embed via the official IFrame script tag.
 */
import { register, type Adapter } from '../index';

export interface JitsiRoomOptions {
  roomName: string;            // unique slug (sanitised by adapter)
  displayName?: string;
  audioOnly?: boolean;         // voice-note / podcast mode
  startMuted?: boolean;
  password?: string;
  jwt?: string;                // optional JaaS / self-hosted JWT
  contextKind?: 'call' | 'podcast' | 'webinar' | 'voice-note' | 'support';
  contextId?: string;
  recording?: boolean;
}

export interface JitsiJoin {
  domain: string;
  roomName: string;
  joinUrl: string;
  embedScript: string;
  audioOnly: boolean;
  expiresAt: string;
}

const sanitise = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '').slice(0, 60);

export const jitsiAdapter: Adapter<{ domain?: string; appId?: string }> = {
  id: 'jitsi',
  category: 'voice',
  configure() { /* no-op — env-driven */ },
  async healthcheck() {
    const domain = process.env.JITSI_DOMAIN || 'meet.jit.si';
    try {
      const res = await fetch(`https://${domain}/external_api.js`, { method: 'HEAD', signal: AbortSignal.timeout(2500) });
      return { ok: res.ok, detail: `${domain} ${res.status}` };
    } catch (e: any) { return { ok: false, detail: e?.message ?? 'unreachable' }; }
  },
};
register(jitsiAdapter);

export function buildJitsiJoin(opts: JitsiRoomOptions): JitsiJoin {
  const domain = process.env.JITSI_DOMAIN || 'meet.jit.si';
  const room = `gigvora-${opts.contextKind ?? 'call'}-${sanitise(opts.roomName)}`;
  const params = new URLSearchParams();
  if (opts.audioOnly) params.set('config.startAudioOnly', 'true');
  if (opts.startMuted) params.set('config.startWithAudioMuted', 'true');
  if (opts.displayName) params.set('userInfo.displayName', opts.displayName);
  const qs = params.toString() ? `#${params.toString()}` : '';
  const joinUrl = `https://${domain}/${room}${qs}`;
  return {
    domain,
    roomName: room,
    joinUrl,
    embedScript: `https://${domain}/external_api.js`,
    audioOnly: !!opts.audioOnly,
    expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 6).toISOString(),
  };
}
