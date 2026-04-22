import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import {
  Play, Pause, Volume2, VolumeX, Maximize2, Loader2, Settings, Subtitles,
  PictureInPicture2, Gauge, Wifi, Radio, RotateCcw,
} from 'lucide-react';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuCheckboxItem,
} from '@/components/ui/dropdown-menu';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import {
  detectCapabilities, describeCapabilities, type DeviceCapabilities,
} from '@/lib/media/deviceCapabilities';

/**
 * Gigvora Video Viewer SDK — single component used across:
 *   • Shorts / Reels
 *   • Long-form videos (movies, podcasts, replays)
 *   • Webinars + Live (LL-HLS, DASH)
 *
 * Capabilities:
 *   • Device + codec + bandwidth detection (up to 8K, AV1/HEVC/VP9/H264)
 *   • Adaptive bitrate via hls.js (HLS/LL-HLS) or dashjs (DASH); falls back to
 *     native playback on Safari/iOS for HLS.
 *   • Manual quality picker (Auto + every available rendition).
 *   • Full controls: play/pause, mute, scrub, speed, captions, PiP, fullscreen,
 *     seek ±10s, live indicator with "go live" button.
 *   • Hover-to-preview (silent slices) for non-shorts.
 *   • Shorts auto-play in viewport (muted) via IntersectionObserver.
 *   • SSR-safe: capability detection runs client-only.
 */

export interface VideoViewerCaption { src: string; lang: string; label: string; default?: boolean; }
export interface VideoViewerProps {
  src: string;                     // .m3u8 / .mpd / .mp4 / blob:
  dashSrc?: string;                // optional explicit DASH manifest
  poster?: string;
  kind?: 'short' | 'long' | 'webinar' | 'live';
  autoplay?: boolean;
  muted?: boolean;
  loop?: boolean;
  hoverPreview?: boolean;
  captions?: VideoViewerCaption[];
  className?: string;
  onEnded?: () => void;
  /** Show device-capability badge in the bottom bar (debug/QA aid). */
  showCapabilityBadge?: boolean;
}

interface QualityLevel { id: number | 'auto'; height: number; bitrate?: number; label: string; }

const SPEEDS = [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];

function formatTime(s: number): string {
  if (!isFinite(s) || s < 0) return '0:00';
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = Math.floor(s % 60);
  return h > 0
    ? `${h}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
    : `${m}:${String(sec).padStart(2, '0')}`;
}

export function VideoViewer({
  src, dashSrc, poster, kind = 'long', autoplay, muted = true, loop,
  hoverPreview = true, captions = [], className, onEnded, showCapabilityBadge,
}: VideoViewerProps) {
  const ref = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const hlsRef = useRef<any>(null);
  const dashRef = useRef<any>(null);
  const hoverTimer = useRef<number | null>(null);
  const previewSlice = useRef(0);

  const [ready, setReady] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(muted);
  const [volume, setVolume] = useState(1);
  const [hovering, setHovering] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [buffered, setBuffered] = useState(0);
  const [speed, setSpeed] = useState(1);
  const [levels, setLevels] = useState<QualityLevel[]>([]);
  const [activeLevel, setActiveLevel] = useState<number | 'auto'>('auto');
  const [captionTrack, setCaptionTrack] = useState<string | 'off'>('off');
  const [isLive, setIsLive] = useState(kind === 'live');
  const [atLiveEdge, setAtLiveEdge] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pipActive, setPipActive] = useState(false);
  const [caps, setCaps] = useState<DeviceCapabilities | null>(null);

  const isHls = useMemo(() => /\.m3u8($|\?)/i.test(src), [src]);
  const isDash = useMemo(() => !!dashSrc || /\.mpd($|\?)/i.test(src), [src, dashSrc]);

  // ------- Capability detection (client-only) -------
  useEffect(() => { setCaps(detectCapabilities()); }, []);

  // ------- Wire video element listeners -------
  useEffect(() => {
    const v = ref.current; if (!v) return;
    const onLoaded = () => { setReady(true); setDuration(v.duration || 0); };
    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    const onTime = () => {
      setCurrentTime(v.currentTime);
      try {
        const b = v.buffered;
        if (b.length > 0) setBuffered(b.end(b.length - 1));
      } catch { /* noop */ }
      if (isLive && v.duration && isFinite(v.duration)) {
        setAtLiveEdge((v.duration - v.currentTime) < 6);
      }
    };
    const onErr = () => setError('Playback error');
    const onEnter = () => setPipActive(true);
    const onLeave = () => setPipActive(false);
    v.addEventListener('loadedmetadata', onLoaded);
    v.addEventListener('play', onPlay);
    v.addEventListener('pause', onPause);
    v.addEventListener('timeupdate', onTime);
    v.addEventListener('error', onErr);
    v.addEventListener('enterpictureinpicture', onEnter);
    v.addEventListener('leavepictureinpicture', onLeave);
    return () => {
      v.removeEventListener('loadedmetadata', onLoaded);
      v.removeEventListener('play', onPlay);
      v.removeEventListener('pause', onPause);
      v.removeEventListener('timeupdate', onTime);
      v.removeEventListener('error', onErr);
      v.removeEventListener('enterpictureinpicture', onEnter);
      v.removeEventListener('leavepictureinpicture', onLeave);
    };
  }, [isLive]);

  // ------- HLS / LL-HLS via hls.js (or native on Safari) -------
  useEffect(() => {
    if (!isHls || isDash) return;
    const v = ref.current; if (!v) return;
    setError(null);

    if (v.canPlayType('application/vnd.apple.mpegurl')) {
      v.src = src;
      // Native HLS does not expose levels in a portable way — leave Auto-only.
      setLevels([{ id: 'auto', height: 0, label: 'Auto' }]);
      return;
    }
    if (typeof (window as any).MediaSource === 'undefined') {
      v.src = src; // last-ditch progressive
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const mod: any = await import('hls.js');
        if (cancelled || !mod?.default?.isSupported?.()) { v.src = src; return; }
        const Hls = mod.default;
        const hls = new Hls({
          lowLatencyMode: kind === 'live',
          backBufferLength: kind === 'live' ? 30 : 90,
          maxBufferLength: kind === 'live' ? 6 : 30,
          enableWorker: true,
          capLevelToPlayerSize: true,
        });
        hlsRef.current = hls;
        hls.loadSource(src);
        hls.attachMedia(v);

        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          const lvls: QualityLevel[] = (hls.levels || []).map((l: any, i: number) => ({
            id: i,
            height: l.height,
            bitrate: l.bitrate,
            label: l.height ? `${l.height}p` : `${Math.round((l.bitrate || 0) / 1000)}kbps`,
          }));
          setLevels([{ id: 'auto', height: 0, label: 'Auto' }, ...lvls]);
          setIsLive(!!hls.levels?.[0]?.details?.live || kind === 'live');
        });
        hls.on(Hls.Events.LEVEL_SWITCHED, (_e: any, d: any) => setActiveLevel(d.level));
        hls.on(Hls.Events.ERROR, (_e: any, d: any) => {
          if (d.fatal) setError(`HLS ${d.type}: ${d.details}`);
        });
      } catch {
        v.src = src;
      }
    })();
    return () => {
      cancelled = true;
      try { hlsRef.current?.destroy?.(); } catch { /* noop */ }
      hlsRef.current = null;
    };
  }, [src, isHls, isDash, kind]);

  // ------- DASH via dashjs -------
  useEffect(() => {
    if (!isDash) return;
    const v = ref.current; if (!v) return;
    setError(null);
    let cancelled = false;
    (async () => {
      try {
        const mod: any = await import('dashjs');
        if (cancelled) return;
        const player = mod.MediaPlayer().create();
        dashRef.current = player;
        player.initialize(v, dashSrc ?? src, !!autoplay);
        player.updateSettings({
          streaming: {
            lowLatencyEnabled: kind === 'live',
            abr: { autoSwitchBitrate: { video: true } },
          },
        });
        player.on('streamInitialized', () => {
          const bitrates = player.getBitrateInfoListFor('video') || [];
          const lvls: QualityLevel[] = bitrates.map((b: any) => ({
            id: b.qualityIndex,
            height: b.height,
            bitrate: b.bitrate,
            label: b.height ? `${b.height}p` : `${Math.round((b.bitrate || 0) / 1000)}kbps`,
          }));
          setLevels([{ id: 'auto', height: 0, label: 'Auto' }, ...lvls]);
        });
        player.on('qualityChangeRendered', (e: any) => {
          if (e.mediaType === 'video') setActiveLevel(e.newQuality);
        });
        player.on('error', (e: any) => setError(`DASH error: ${e?.error?.message ?? 'unknown'}`));
      } catch (e: any) {
        setError(`DASH load failed: ${e?.message ?? 'unknown'}`);
      }
    })();
    return () => {
      cancelled = true;
      try { dashRef.current?.reset?.(); } catch { /* noop */ }
      dashRef.current = null;
    };
  }, [src, dashSrc, isDash, kind, autoplay]);

  // ------- Shorts auto-play on view -------
  useEffect(() => {
    if (kind !== 'short') return;
    const v = ref.current; if (!v) return;
    const obs = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) { v.muted = true; v.play().catch(() => undefined); }
        else v.pause();
      });
    }, { threshold: 0.6 });
    obs.observe(v);
    return () => obs.disconnect();
  }, [kind]);

  // ------- Hover preview -------
  const onEnter = useCallback(() => {
    if (!hoverPreview || kind === 'short' || kind === 'live') return;
    setHovering(true);
    const v = ref.current; if (!v || !ready) return;
    if (isPlaying) return; // user already watching — don't disrupt
    v.muted = true;
    v.play().catch(() => undefined);
    hoverTimer.current = window.setInterval(() => {
      if (!v.duration) return;
      previewSlice.current = (previewSlice.current + 1) % 4;
      v.currentTime = (v.duration / 4) * previewSlice.current;
    }, 2000);
  }, [hoverPreview, kind, ready, isPlaying]);

  const onLeave = useCallback(() => {
    setHovering(false);
    if (hoverTimer.current) { clearInterval(hoverTimer.current); hoverTimer.current = null; }
    const v = ref.current; if (!v) return;
    if (!isPlaying) { v.pause(); v.currentTime = 0; v.muted = isMuted; }
  }, [isPlaying, isMuted]);

  // ------- Controls -------
  const toggle = () => { const v = ref.current; if (!v) return; if (v.paused) v.play(); else v.pause(); };
  const toggleMute = () => { const v = ref.current; if (!v) return; v.muted = !v.muted; setIsMuted(v.muted); };
  const onVolume = (val: number[]) => { const v = ref.current; if (!v) return; v.volume = val[0]; setVolume(val[0]); v.muted = val[0] === 0; setIsMuted(val[0] === 0); };
  const seek = (val: number[]) => { const v = ref.current; if (!v) return; v.currentTime = val[0]; };
  const seekBy = (delta: number) => { const v = ref.current; if (!v) return; v.currentTime = Math.max(0, Math.min((v.duration || 0), v.currentTime + delta)); };
  const fullscreen = () => { const el = containerRef.current; if (!el) return; if (document.fullscreenElement) document.exitFullscreen(); else el.requestFullscreen?.(); };
  const togglePip = async () => {
    const v = ref.current; if (!v) return;
    try {
      if ((document as any).pictureInPictureElement) await (document as any).exitPictureInPicture();
      else if ((v as any).requestPictureInPicture) await (v as any).requestPictureInPicture();
    } catch { /* noop */ }
  };
  const setPlaybackSpeed = (s: number) => { const v = ref.current; if (!v) return; v.playbackRate = s; setSpeed(s); };
  const goLive = () => { const v = ref.current; if (!v || !v.duration || !isFinite(v.duration)) return; v.currentTime = v.duration - 1; };

  const setQuality = (id: number | 'auto') => {
    setActiveLevel(id);
    if (hlsRef.current) hlsRef.current.currentLevel = id === 'auto' ? -1 : id;
    if (dashRef.current) {
      if (id === 'auto') dashRef.current.updateSettings({ streaming: { abr: { autoSwitchBitrate: { video: true } } } });
      else { dashRef.current.updateSettings({ streaming: { abr: { autoSwitchBitrate: { video: false } } } }); dashRef.current.setQualityFor('video', id); }
    }
  };

  const setCaption = (lang: string | 'off') => {
    setCaptionTrack(lang);
    const v = ref.current; if (!v) return;
    Array.from(v.textTracks).forEach((t) => { t.mode = (lang !== 'off' && t.language === lang) ? 'showing' : 'hidden'; });
  };

  // ------- Keyboard shortcuts (focus on container) -------
  useEffect(() => {
    const el = containerRef.current; if (!el) return;
    const onKey = (e: KeyboardEvent) => {
      if (!el.contains(document.activeElement) && document.activeElement !== el) return;
      switch (e.key) {
        case ' ': case 'k': e.preventDefault(); toggle(); break;
        case 'ArrowLeft':   e.preventDefault(); seekBy(-10); break;
        case 'ArrowRight':  e.preventDefault(); seekBy(10); break;
        case 'm':           toggleMute(); break;
        case 'f':           fullscreen(); break;
        case 'p':           togglePip(); break;
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <div
      ref={containerRef}
      tabIndex={0}
      className={`relative group overflow-hidden rounded-2xl bg-black focus:outline-none focus:ring-2 focus:ring-accent ${className ?? ''}`}
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
    >
      <video
        ref={ref}
        src={isHls || isDash ? undefined : src}
        poster={poster}
        playsInline
        muted={muted}
        loop={loop || kind === 'short'}
        autoPlay={autoplay && kind !== 'short'}
        onEnded={onEnded}
        crossOrigin="anonymous"
        className="w-full h-full object-cover"
      >
        {captions.map((c) => (
          <track key={c.lang} kind="subtitles" src={c.src} srcLang={c.lang} label={c.label} default={c.default} />
        ))}
      </video>

      {!ready && !error && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/30">
          <Loader2 className="h-6 w-6 text-white animate-spin" />
        </div>
      )}

      {error && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 text-white p-4 text-center gap-2">
          <span className="text-xs">{error}</span>
          <Button size="sm" variant="secondary" onClick={() => { setError(null); ref.current?.load(); }}><RotateCcw className="h-3 w-3 mr-1" />Retry</Button>
        </div>
      )}

      {/* Live badge */}
      {isLive && (
        <div className="absolute top-2 left-2 flex items-center gap-1.5">
          <Badge className="gap-1 text-[9px] bg-red-600 hover:bg-red-600 text-white border-0">
            <Radio className="h-2.5 w-2.5 animate-pulse" />LIVE
          </Badge>
          {!atLiveEdge && (
            <Button size="sm" variant="secondary" className="h-5 text-[9px] px-2" onClick={goLive}>Go live</Button>
          )}
        </div>
      )}

      {hovering && hoverPreview && kind !== 'short' && !isLive && (
        <div className="absolute top-2 left-2 rounded-md bg-black/60 px-2 py-0.5 text-[10px] text-white">Preview</div>
      )}

      {showCapabilityBadge && caps && (
        <div className="absolute top-2 right-2">
          <Badge variant="secondary" className="gap-1 text-[8px]"><Wifi className="h-2.5 w-2.5" />{describeCapabilities(caps)}</Badge>
        </div>
      )}

      {/* Bottom controls */}
      <div className={`absolute bottom-0 inset-x-0 px-2 pt-6 pb-1.5 bg-gradient-to-t from-black/80 to-transparent transition ${kind === 'short' ? 'opacity-0' : 'opacity-0 group-hover:opacity-100 focus-within:opacity-100'}`}>
        {/* Scrubber */}
        {!isLive && duration > 0 && (
          <div className="px-1 mb-1">
            <div className="relative h-1.5">
              <div className="absolute inset-0 rounded-full bg-white/15" />
              <div className="absolute inset-y-0 left-0 rounded-full bg-white/30" style={{ width: `${(buffered / duration) * 100}%` }} />
              <Slider value={[currentTime]} min={0} max={Math.max(duration, 0.001)} step={0.1} onValueChange={seek} className="absolute inset-0" />
            </div>
            <div className="flex items-center justify-between text-[9px] text-white/80 mt-0.5">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>
        )}

        <div className="flex items-center gap-1">
          <Button size="icon" variant="ghost" className="h-7 w-7 text-white hover:bg-white/20" onClick={toggle}>
            {isPlaying ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
          </Button>
          {!isLive && (
            <>
              <Button size="icon" variant="ghost" className="h-7 w-7 text-white hover:bg-white/20" onClick={() => seekBy(-10)} title="-10s"><RotateCcw className="h-3.5 w-3.5" /></Button>
            </>
          )}
          <Button size="icon" variant="ghost" className="h-7 w-7 text-white hover:bg-white/20" onClick={toggleMute}>
            {isMuted || volume === 0 ? <VolumeX className="h-3.5 w-3.5" /> : <Volume2 className="h-3.5 w-3.5" />}
          </Button>
          <div className="hidden sm:block w-16">
            <Slider value={[isMuted ? 0 : volume]} min={0} max={1} step={0.05} onValueChange={onVolume} />
          </div>

          <span className="ml-auto" />

          {/* Speed */}
          {!isLive && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="sm" variant="ghost" className="h-7 text-[10px] text-white hover:bg-white/20 gap-1"><Gauge className="h-3 w-3" />{speed}x</Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-black/90 border-white/10 text-white">
                <DropdownMenuLabel className="text-[10px]">Playback speed</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {SPEEDS.map((s) => (
                  <DropdownMenuCheckboxItem key={s} checked={speed === s} onCheckedChange={() => setPlaybackSpeed(s)} className="text-[11px]">{s}x</DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          {/* Quality */}
          {levels.length > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="sm" variant="ghost" className="h-7 text-[10px] text-white hover:bg-white/20 gap-1">
                  <Settings className="h-3 w-3" />
                  {activeLevel === 'auto' ? 'Auto' : (levels.find((l) => l.id === activeLevel)?.label ?? 'Auto')}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-black/90 border-white/10 text-white">
                <DropdownMenuLabel className="text-[10px]">Quality {caps && `· max ${caps.maxTier.toUpperCase()}`}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {levels.map((l) => (
                  <DropdownMenuCheckboxItem key={String(l.id)} checked={activeLevel === l.id} onCheckedChange={() => setQuality(l.id)} className="text-[11px]">
                    {l.label}{l.bitrate ? ` · ${Math.round(l.bitrate / 1000)}kbps` : ''}
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          {/* Captions */}
          {captions.length > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="icon" variant="ghost" className="h-7 w-7 text-white hover:bg-white/20"><Subtitles className="h-3.5 w-3.5" /></Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-black/90 border-white/10 text-white">
                <DropdownMenuLabel className="text-[10px]">Captions</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onSelect={() => setCaption('off')} className="text-[11px]">{captionTrack === 'off' && '✓ '}Off</DropdownMenuItem>
                {captions.map((c) => (
                  <DropdownMenuItem key={c.lang} onSelect={() => setCaption(c.lang)} className="text-[11px]">
                    {captionTrack === c.lang && '✓ '}{c.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          <Button size="icon" variant="ghost" className={`h-7 w-7 text-white hover:bg-white/20 ${pipActive ? 'bg-white/15' : ''}`} onClick={togglePip} title="Picture-in-picture">
            <PictureInPicture2 className="h-3.5 w-3.5" />
          </Button>

          <Button size="icon" variant="ghost" className="h-7 w-7 text-white hover:bg-white/20" onClick={fullscreen}>
            <Maximize2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
