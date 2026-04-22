/**
 * InterviewPlayer — synchronized video + transcript + scorecard player.
 *
 * Built for the recruitment interview review surface. Plays the recorded
 * interview, pins the transcript with active-cue highlighting, and exposes
 * scorecard markers as scrub-bar chapters.
 *
 * Props:
 *   src               video URL (mp4 or hls.js compatible)
 *   transcriptCues    Array<{ start: seconds, end: seconds, speaker, text }>
 *   chapters          Array<{ at: seconds, label, kind: 'question'|'note'|'flag' }>
 *   onScorecardJump   (atSeconds) => void  — click a chapter
 *
 * No external deps beyond what's already in the project.
 */
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, Flag, MessageSquare, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface InterviewCue { start: number; end: number; speaker: string; text: string }
export interface InterviewChapter { at: number; label: string; kind: 'question' | 'note' | 'flag' }

interface Props {
  src: string;
  poster?: string;
  transcriptCues?: InterviewCue[];
  chapters?: InterviewChapter[];
  onScorecardJump?: (at: number) => void;
  className?: string;
}

const fmt = (s: number) => {
  if (!Number.isFinite(s)) return '0:00';
  const m = Math.floor(s / 60);
  const r = Math.floor(s % 60).toString().padStart(2, '0');
  return `${m}:${r}`;
};

export const InterviewPlayer: React.FC<Props> = ({
  src, poster, transcriptCues = [], chapters = [], onScorecardJump, className,
}) => {
  const ref = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [t, setT] = useState(0);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    const onTime = () => setT(v.currentTime);
    const onMeta = () => setDuration(v.duration || 0);
    const onPlay = () => setPlaying(true);
    const onPause = () => setPlaying(false);
    v.addEventListener('timeupdate', onTime);
    v.addEventListener('loadedmetadata', onMeta);
    v.addEventListener('play', onPlay);
    v.addEventListener('pause', onPause);
    return () => {
      v.removeEventListener('timeupdate', onTime);
      v.removeEventListener('loadedmetadata', onMeta);
      v.removeEventListener('play', onPlay);
      v.removeEventListener('pause', onPause);
    };
  }, []);

  const seek = (to: number) => { if (ref.current) ref.current.currentTime = Math.max(0, Math.min(duration, to)); };
  const toggle = () => { if (ref.current) { if (playing) ref.current.pause(); else ref.current.play(); } };
  const toggleMute = () => { if (ref.current) { ref.current.muted = !muted; setMuted(!muted); } };

  const activeCueIdx = useMemo(
    () => transcriptCues.findIndex((c) => t >= c.start && t < c.end),
    [t, transcriptCues],
  );

  const progressPct = duration > 0 ? (t / duration) * 100 : 0;

  return (
    <div className={cn('grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-3 rounded-2xl border bg-card overflow-hidden', className)}>
      {/* ── Video + controls ── */}
      <div className="bg-black relative aspect-video">
        <video
          ref={ref}
          src={src}
          poster={poster}
          className="absolute inset-0 w-full h-full object-contain"
          onClick={toggle}
        />
        {/* Scrub bar with chapters */}
        <div className="absolute left-0 right-0 bottom-0 px-3 pb-2 pt-8 bg-gradient-to-t from-black/80 to-transparent">
          <div
            role="slider"
            aria-label="Scrub"
            tabIndex={0}
            className="relative h-1.5 rounded-full bg-white/20 cursor-pointer"
            onClick={(e) => {
              const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
              const pct = (e.clientX - rect.left) / rect.width;
              seek(pct * duration);
            }}
          >
            <div className="absolute left-0 top-0 h-full rounded-full bg-primary" style={{ width: `${progressPct}%` }} />
            {chapters.map((c) => {
              const left = duration > 0 ? (c.at / duration) * 100 : 0;
              const Icon = c.kind === 'flag' ? Flag : c.kind === 'note' ? MessageSquare : ChevronRight;
              return (
                <button
                  key={`${c.at}-${c.label}`}
                  className="absolute -top-1 -translate-x-1/2 h-3.5 w-3.5 rounded-full bg-amber-400 ring-2 ring-amber-200 flex items-center justify-center"
                  style={{ left: `${left}%` }}
                  onClick={(e) => { e.stopPropagation(); seek(c.at); onScorecardJump?.(c.at); }}
                  title={`${fmt(c.at)} — ${c.label}`}
                >
                  <Icon className="h-2 w-2 text-black" />
                </button>
              );
            })}
          </div>
          <div className="mt-2 flex items-center gap-3 text-white">
            <button onClick={() => seek(t - 10)} aria-label="Back 10s"><SkipBack className="h-4 w-4" /></button>
            <button onClick={toggle} aria-label={playing ? 'Pause' : 'Play'}>
              {playing ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
            </button>
            <button onClick={() => seek(t + 10)} aria-label="Forward 10s"><SkipForward className="h-4 w-4" /></button>
            <span className="text-[11px] tabular-nums">{fmt(t)} / {fmt(duration)}</span>
            <div className="flex-1" />
            <button onClick={toggleMute} aria-label={muted ? 'Unmute' : 'Mute'}>
              {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
            </button>
          </div>
        </div>
      </div>

      {/* ── Transcript pane ── */}
      <div className="border-l bg-background">
        <div className="px-3 py-2.5 border-b text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          Transcript
        </div>
        <div className="max-h-[420px] overflow-y-auto p-2 space-y-1">
          {transcriptCues.length === 0 && (
            <div className="text-[12px] text-muted-foreground px-2 py-3">No transcript available.</div>
          )}
          {transcriptCues.map((c, i) => (
            <button
              key={i}
              onClick={() => seek(c.start)}
              className={cn(
                'w-full text-left rounded-md px-2.5 py-2 text-[12px] leading-snug transition-colors',
                i === activeCueIdx
                  ? 'bg-primary/10 text-foreground'
                  : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground',
              )}
            >
              <div className="flex items-center gap-2 text-[10px] uppercase tracking-wider text-muted-foreground/80">
                <span className="font-semibold">{c.speaker}</span>
                <span className="tabular-nums">{fmt(c.start)}</span>
              </div>
              <div className="mt-0.5">{c.text}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default InterviewPlayer;
