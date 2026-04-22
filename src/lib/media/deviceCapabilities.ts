/**
 * Device + codec + bandwidth detection for the VideoViewer SDK.
 *
 * The detector returns the highest playback rung the current device/network
 * can sustain (up to 8K) plus the codec list the browser can decode. This
 * powers adaptive bitrate selection in HLS / DASH and informs the manual
 * quality picker in the player UI.
 *
 * SSR-safe: every browser-only call is guarded; on the server we fall back
 * to the most conservative profile.
 */

export type ResolutionTier = '480p' | '720p' | '1080p' | '1440p' | '4k' | '8k';

export interface CodecSupport {
  h264: boolean;
  h265: boolean;
  vp9: boolean;
  av1: boolean;
}

export interface DeviceCapabilities {
  maxTier: ResolutionTier;
  maxHeight: number; // pixels
  codecs: CodecSupport;
  hardwareConcurrency: number;
  deviceMemoryGb: number; // best-effort, 4 if unknown
  pixelRatio: number;
  effectiveType: 'slow-2g' | '2g' | '3g' | '4g' | '5g' | 'unknown';
  downlinkMbps: number;
  saveData: boolean;
  hdrCapable: boolean;
  prefersReducedMotion: boolean;
  isMobile: boolean;
  supportsHls: boolean; // native (Safari/iOS)
  supportsMse: boolean; // for hls.js / dashjs
}

const TIERS: Array<[ResolutionTier, number]> = [
  ['480p', 480],
  ['720p', 720],
  ['1080p', 1080],
  ['1440p', 1440],
  ['4k', 2160],
  ['8k', 4320],
];

export function tierToHeight(tier: ResolutionTier): number {
  const found = TIERS.find(([t]) => t === tier);
  return found ? found[1] : 1080;
}

export function heightToTier(height: number): ResolutionTier {
  let pick: ResolutionTier = '480p';
  for (const [t, h] of TIERS) if (height >= h) pick = t;
  return pick;
}

function safeCanPlay(video: HTMLVideoElement | null, mime: string): boolean {
  if (!video) return false;
  try { return video.canPlayType(mime) !== ''; } catch { return false; }
}

export function detectCapabilities(): DeviceCapabilities {
  if (typeof window === 'undefined') {
    return {
      maxTier: '1080p', maxHeight: 1080,
      codecs: { h264: true, h265: false, vp9: false, av1: false },
      hardwareConcurrency: 4, deviceMemoryGb: 4, pixelRatio: 1,
      effectiveType: 'unknown', downlinkMbps: 10, saveData: false,
      hdrCapable: false, prefersReducedMotion: false, isMobile: false,
      supportsHls: false, supportsMse: false,
    };
  }

  const probe = document.createElement('video');
  const codecs: CodecSupport = {
    h264: safeCanPlay(probe, 'video/mp4; codecs="avc1.42E01E"'),
    h265: safeCanPlay(probe, 'video/mp4; codecs="hev1.1.6.L93.B0"') ||
          safeCanPlay(probe, 'video/mp4; codecs="hvc1.1.6.L93.B0"'),
    vp9:  safeCanPlay(probe, 'video/webm; codecs="vp9"'),
    av1:  safeCanPlay(probe, 'video/mp4; codecs="av01.0.05M.08"'),
  };

  const nav = navigator as Navigator & {
    deviceMemory?: number;
    connection?: { effectiveType?: string; downlink?: number; saveData?: boolean };
  };
  const conn = nav.connection ?? {};
  const downlink = typeof conn.downlink === 'number' ? conn.downlink : 10;
  const effectiveType = (conn.effectiveType as DeviceCapabilities['effectiveType']) ?? 'unknown';
  const saveData = !!conn.saveData;

  const hardwareConcurrency = nav.hardwareConcurrency ?? 4;
  const deviceMemoryGb = nav.deviceMemory ?? 4;
  const pixelRatio = window.devicePixelRatio ?? 1;
  const isMobile = /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

  // HDR detection — color-gamut + dynamic-range media queries.
  let hdrCapable = false;
  try {
    hdrCapable = window.matchMedia('(dynamic-range: high)').matches ||
                 window.matchMedia('(color-gamut: rec2020)').matches;
  } catch { /* noop */ }

  let prefersReducedMotion = false;
  try { prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch { /* noop */ }

  const supportsMse = typeof (window as any).MediaSource !== 'undefined';
  const supportsHls = safeCanPlay(probe, 'application/vnd.apple.mpegurl');

  // Pick the highest tier we believe the device + network can sustain.
  // Bandwidth thresholds (Mbps) are conservative streaming minimums.
  const screenH = Math.max(window.screen?.height ?? 1080, window.screen?.width ?? 1920);
  const screenCapHeight = Math.round(screenH * pixelRatio);

  const bandwidthCapHeight =
    saveData             ? 480  :
    downlink >= 80       ? 4320 : // 8K needs ~80Mbps+
    downlink >= 25       ? 2160 : // 4K
    downlink >= 12       ? 1440 :
    downlink >=  6       ? 1080 :
    downlink >=  3       ?  720 :
                            480;

  const codecCapHeight =
    codecs.av1 || codecs.h265 ? 4320 :
    codecs.vp9                ? 2160 :
    codecs.h264               ? 1080 :
                                 480;

  const cpuCapHeight =
    hardwareConcurrency >= 8 && deviceMemoryGb >= 8 ? 4320 :
    hardwareConcurrency >= 6 && deviceMemoryGb >= 6 ? 2160 :
    hardwareConcurrency >= 4 ? 1440 :
                               1080;

  const maxHeight = Math.min(bandwidthCapHeight, codecCapHeight, cpuCapHeight, screenCapHeight, isMobile ? 2160 : 4320);
  const maxTier = heightToTier(maxHeight);

  return {
    maxTier, maxHeight, codecs,
    hardwareConcurrency, deviceMemoryGb, pixelRatio,
    effectiveType, downlinkMbps: downlink, saveData,
    hdrCapable, prefersReducedMotion, isMobile,
    supportsHls, supportsMse,
  };
}

export function describeCapabilities(c: DeviceCapabilities): string {
  const codecList = Object.entries(c.codecs).filter(([, v]) => v).map(([k]) => k.toUpperCase()).join('/');
  return `${c.maxTier.toUpperCase()} · ${codecList || 'H264'} · ${c.downlinkMbps}Mbps · ${c.hardwareConcurrency} cores`;
}
