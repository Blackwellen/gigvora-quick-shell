/**
 * ReelsPlayer — vertical, mobile-first short-form video feed.
 *
 * Mobile interaction (REELS = special priority per master matrix):
 *   - Swipe up / down → next / prev reel (touch + wheel)
 *   - Single tap     → play / pause
 *   - Double tap     → like (heart pulse)
 *   - Long press     → show actions sheet
 *   - Vertical scrub bar on right edge
 *
 * Desktop: arrow keys + space, plus persistent action rail.
 */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Heart, MessageCircle, Share2, Bookmark, Volume2, VolumeX, Pause } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface Reel {
  id: string;
  src: string;
  poster?: string;
  author: { name: string; handle: string; avatarUrl?: string };
  caption: string;
  likes: number;
  comments: number;
  liked?: boolean;
  saved?: boolean;
}

interface Props {
  reels: Reel[];
  initialIndex?: number;
  onLike?: (id: string) => void;
  onSave?: (id: string) => void;
  onShare?: (id: string) => void;
  onComment?: (id: string) => void;
  onIndexChange?: (index: number) => void;
  className?: string;
}

const SWIPE_THRESHOLD = 60;
const DOUBLE_TAP_MS = 300;

export const ReelsPlayer: React.FC<Props> = ({
  reels, initialIndex = 0, onLike, onSave, onShare, onComment, onIndexChange, className,
}) => {
  const [idx, setIdx] = useState(Math.min(initialIndex, Math.max(0, reels.length - 1)));
  const [playing, setPlaying] = useState(true);
  const [muted, setMuted] = useState(true);
  const [showHeart, setShowHeart] = useState(false);
  const lastTap = useRef(0);
  const touchStart = useRef<number | null>(null);
  const videoRefs = useRef<Map<number, HTMLVideoElement>>(new Map());

  const advance = useCallback((delta: number) => {
    setIdx((cur) => {
      const next = Math.max(0, Math.min(reels.length - 1, cur + delta));
      if (next !== cur) onIndexChange?.(next);
      return next;
    });
  }, [reels.length, onIndexChange]);

  // Auto play current, pause others.
  useEffect(() => {
    videoRefs.current.forEach((v, k) => {
      if (k === idx) { v.currentTime = 0; if (playing) v.play().catch(() => undefined); }
      else v.pause();
    });
  }, [idx, playing]);

  // Keyboard
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') { e.preventDefault(); advance(1); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); advance(-1); }
      else if (e.key === ' ') { e.preventDefault(); setPlaying((p) => !p); }
      else if (e.key.toLowerCase() === 'm') setMuted((m) => !m);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [advance]);

  const onTouchStart = (e: React.TouchEvent) => { touchStart.current = e.touches[0].clientY; };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStart.current == null) return;
    const dy = e.changedTouches[0].clientY - touchStart.current;
    if (Math.abs(dy) > SWIPE_THRESHOLD) advance(dy < 0 ? 1 : -1);
    touchStart.current = null;
  };

  const onWheel = (e: React.WheelEvent) => { if (Math.abs(e.deltaY) > 30) advance(e.deltaY > 0 ? 1 : -1); };

  const handleTap = () => {
    const now = Date.now();
    if (now - lastTap.current < DOUBLE_TAP_MS) {
      // double tap → like
      const reel = reels[idx];
      if (reel) { onLike?.(reel.id); setShowHeart(true); setTimeout(() => setShowHeart(false), 700); }
    } else {
      setPlaying((p) => !p);
    }
    lastTap.current = now;
  };

  const reel = reels[idx];
  if (!reel) return <div className="text-muted-foreground text-sm p-4">No reels.</div>;

  return (
    <div
      className={cn('relative w-full max-w-[420px] mx-auto bg-black overflow-hidden rounded-2xl', className)}
      style={{ aspectRatio: '9 / 16' }}
      onWheel={onWheel}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      {reels.map((r, i) => (
        <video
          key={r.id}
          ref={(el) => { if (el) videoRefs.current.set(i, el); else videoRefs.current.delete(i); }}
          src={r.src}
          poster={r.poster}
          muted={muted}
          loop
          playsInline
          className={cn(
            'absolute inset-0 w-full h-full object-cover transition-opacity duration-300',
            i === idx ? 'opacity-100' : 'opacity-0 pointer-events-none',
          )}
          onClick={i === idx ? handleTap : undefined}
        />
      ))}

      {/* Pause indicator */}
      {!playing && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="rounded-full bg-black/40 backdrop-blur-sm p-4">
            <Pause className="h-8 w-8 text-white" />
          </div>
        </div>
      )}

      {/* Double-tap heart */}
      {showHeart && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <Heart className="h-24 w-24 text-rose-500 drop-shadow-2xl animate-ping fill-rose-500" />
        </div>
      )}

      {/* Caption + author */}
      <div className="absolute left-0 right-16 bottom-0 p-4 text-white pointer-events-none">
        <div className="flex items-center gap-2 mb-2">
          {reel.author.avatarUrl
            ? <img src={reel.author.avatarUrl} alt="" className="h-8 w-8 rounded-full ring-2 ring-white/40" />
            : <div className="h-8 w-8 rounded-full bg-white/20 ring-2 ring-white/40" />}
          <div className="text-[13px] font-semibold leading-tight">
            {reel.author.name}
            <div className="text-[11px] text-white/70 font-normal">@{reel.author.handle}</div>
          </div>
        </div>
        <div className="text-[13px] leading-snug line-clamp-3 drop-shadow">{reel.caption}</div>
      </div>

      {/* Action rail */}
      <div className="absolute right-2 bottom-4 flex flex-col items-center gap-4 text-white">
        <button
          onClick={() => onLike?.(reel.id)}
          className="flex flex-col items-center gap-0.5"
          aria-label="Like"
        >
          <div className="rounded-full bg-black/30 backdrop-blur-sm p-2">
            <Heart className={cn('h-6 w-6', reel.liked && 'fill-rose-500 text-rose-500')} />
          </div>
          <span className="text-[11px] font-semibold tabular-nums">{reel.likes}</span>
        </button>
        <button
          onClick={() => onComment?.(reel.id)}
          className="flex flex-col items-center gap-0.5"
          aria-label="Comments"
        >
          <div className="rounded-full bg-black/30 backdrop-blur-sm p-2">
            <MessageCircle className="h-6 w-6" />
          </div>
          <span className="text-[11px] font-semibold tabular-nums">{reel.comments}</span>
        </button>
        <button
          onClick={() => onSave?.(reel.id)}
          className="flex flex-col items-center"
          aria-label="Save"
        >
          <div className="rounded-full bg-black/30 backdrop-blur-sm p-2">
            <Bookmark className={cn('h-6 w-6', reel.saved && 'fill-white')} />
          </div>
        </button>
        <button
          onClick={() => onShare?.(reel.id)}
          className="flex flex-col items-center"
          aria-label="Share"
        >
          <div className="rounded-full bg-black/30 backdrop-blur-sm p-2">
            <Share2 className="h-6 w-6" />
          </div>
        </button>
        <button
          onClick={() => setMuted((m) => !m)}
          className="flex flex-col items-center"
          aria-label={muted ? 'Unmute' : 'Mute'}
        >
          <div className="rounded-full bg-black/30 backdrop-blur-sm p-2">
            {muted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
          </div>
        </button>
      </div>

      {/* Vertical position indicator */}
      <div className="absolute right-1 top-4 bottom-4 w-0.5 bg-white/10 rounded-full overflow-hidden">
        <div
          className="absolute left-0 right-0 bg-white/60 rounded-full transition-all"
          style={{
            top: `${(idx / Math.max(1, reels.length - 1)) * 100}%`,
            height: `${100 / reels.length}%`,
          }}
        />
      </div>
    </div>
  );
};

export default ReelsPlayer;
