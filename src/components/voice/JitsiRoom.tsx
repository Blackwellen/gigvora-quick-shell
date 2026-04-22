import { useEffect, useRef } from 'react';

/**
 * Embeds a Jitsi Meet (free, open-source) room.
 * Used by calls, podcasts, webinars and voice-notes.
 *
 * Loads the IFrame API script on demand (no npm dep).
 * Defaults to meet.jit.si; pass `domain` for self-hosted enterprise.
 */
export interface JitsiRoomProps {
  roomName: string;
  displayName?: string;
  domain?: string;
  audioOnly?: boolean;
  startMuted?: boolean;
  jwt?: string;
  height?: number | string;
  onReady?: (api: any) => void;
  onLeave?: () => void;
}

declare global { interface Window { JitsiMeetExternalAPI?: any } }

export function JitsiRoom({
  roomName, displayName, domain = 'meet.jit.si',
  audioOnly, startMuted, jwt, height = 480, onReady, onLeave,
}: JitsiRoomProps) {
  const ref = useRef<HTMLDivElement>(null);
  const apiRef = useRef<any>(null);

  useEffect(() => {
    let cancelled = false;
    async function mount() {
      if (!window.JitsiMeetExternalAPI) {
        await new Promise<void>((res, rej) => {
          const s = document.createElement('script');
          s.src = `https://${domain}/external_api.js`;
          s.async = true; s.onload = () => res(); s.onerror = () => rej(new Error('jitsi script failed'));
          document.head.appendChild(s);
        });
      }
      if (cancelled || !ref.current) return;
      const api = new window.JitsiMeetExternalAPI(domain, {
        roomName, parentNode: ref.current, jwt,
        userInfo: displayName ? { displayName } : undefined,
        configOverwrite: {
          startAudioOnly: !!audioOnly,
          startWithAudioMuted: !!startMuted,
          prejoinPageEnabled: false,
          disableDeepLinking: true,
        },
        interfaceConfigOverwrite: { MOBILE_APP_PROMO: false, SHOW_JITSI_WATERMARK: false },
      });
      apiRef.current = api;
      api.addListener('readyToClose', () => onLeave?.());
      onReady?.(api);
    }
    mount().catch(console.error);
    return () => { cancelled = true; try { apiRef.current?.dispose?.(); } catch {} };
  }, [roomName, domain, audioOnly, startMuted, jwt, displayName, onReady, onLeave]);

  return <div ref={ref} style={{ width: '100%', height }} className="rounded-2xl overflow-hidden border border-border/40 bg-muted/20" />;
}
