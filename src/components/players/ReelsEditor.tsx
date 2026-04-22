/**
 * ReelsEditor — minimal but functional reels composition surface.
 *
 * Capabilities (client-side, MVP):
 *   - Pick / drop a video file
 *   - Trim start/end with dual handles on a frame strip
 *   - Add caption + cover frame timestamp
 *   - Choose audio mode (original / mute / overlay-coming-soon)
 *   - Add up to 5 hashtags
 *   - Submit publishes via the supplied onPublish handler
 *
 * Heavier ops (re-encode, server-side trim, captions burn-in) live in the
 * NestJS media pipeline — this editor produces a `ReelsDraft` payload that the
 * server consumes.
 */
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Upload, Scissors, Image as ImgIcon, Type, Hash, Music, Volume2, VolumeX, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

export interface ReelsDraft {
  blob: Blob;
  durationSec: number;
  trimStartSec: number;
  trimEndSec: number;
  coverAtSec: number;
  caption: string;
  hashtags: string[];
  audioMode: 'original' | 'mute' | 'overlay';
}

interface Props {
  onPublish: (draft: ReelsDraft) => Promise<void> | void;
  className?: string;
}

const MAX_DURATION = 90; // seconds
const fmt = (s: number) => {
  const m = Math.floor(s / 60);
  const r = Math.floor(s % 60).toString().padStart(2, '0');
  return `${m}:${r}`;
};

export const ReelsEditor: React.FC<Props> = ({ onPublish, className }) => {
  const [file, setFile] = useState<File | null>(null);
  const [url, setUrl] = useState<string>('');
  const [duration, setDuration] = useState(0);
  const [trim, setTrim] = useState<[number, number]>([0, 0]);
  const [coverAt, setCoverAt] = useState(0);
  const [caption, setCaption] = useState('');
  const [hashtagInput, setHashtagInput] = useState('');
  const [hashtags, setHashtags] = useState<string[]>([]);
  const [audio, setAudio] = useState<'original' | 'mute' | 'overlay'>('original');
  const [submitting, setSubmitting] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Wire object URL
  useEffect(() => {
    if (!file) return;
    const u = URL.createObjectURL(file);
    setUrl(u);
    return () => URL.revokeObjectURL(u);
  }, [file]);

  const onMeta = () => {
    const v = videoRef.current;
    if (!v) return;
    const d = v.duration || 0;
    setDuration(d);
    const end = Math.min(d, MAX_DURATION);
    setTrim([0, end]);
    setCoverAt(0);
  };

  const onPick = (f?: File | null) => {
    if (!f) return;
    if (!f.type.startsWith('video/')) return;
    setFile(f);
  };

  const addHashtag = () => {
    const tag = hashtagInput.trim().replace(/^#/, '');
    if (!tag || hashtags.includes(tag) || hashtags.length >= 5) { setHashtagInput(''); return; }
    setHashtags([...hashtags, tag]);
    setHashtagInput('');
  };

  const removeHashtag = (tag: string) => setHashtags(hashtags.filter((h) => h !== tag));

  const trimDur = useMemo(() => Math.max(0, trim[1] - trim[0]), [trim]);
  const valid = !!file && trimDur >= 1 && trimDur <= MAX_DURATION && caption.trim().length > 0;

  const submit = async () => {
    if (!file || !valid) return;
    setSubmitting(true);
    try {
      await onPublish({
        blob: file,
        durationSec: duration,
        trimStartSec: trim[0],
        trimEndSec: trim[1],
        coverAtSec: coverAt,
        caption: caption.trim(),
        hashtags,
        audioMode: audio,
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={cn('grid grid-cols-1 lg:grid-cols-[360px_1fr] gap-4 p-4 bg-card border rounded-2xl', className)}>
      {/* ── Preview pane ── */}
      <div className="bg-black rounded-xl overflow-hidden flex items-center justify-center" style={{ aspectRatio: '9 / 16' }}>
        {url ? (
          <video
            ref={videoRef}
            src={url}
            controls
            playsInline
            muted={audio === 'mute'}
            onLoadedMetadata={onMeta}
            className="w-full h-full object-contain"
          />
        ) : (
          <label className="flex flex-col items-center justify-center text-white/80 cursor-pointer p-8 text-center">
            <Upload className="h-10 w-10 mb-3 opacity-70" />
            <div className="text-sm font-medium">Drop a video or click to upload</div>
            <div className="text-[11px] text-white/50 mt-1">MP4 / MOV — up to 90s</div>
            <input
              type="file"
              accept="video/*"
              className="hidden"
              onChange={(e) => onPick(e.target.files?.[0])}
            />
          </label>
        )}
      </div>

      {/* ── Controls ── */}
      <div className="space-y-4">
        {/* Trim */}
        <section>
          <div className="flex items-center gap-2 text-[12px] font-semibold mb-2">
            <Scissors className="h-3.5 w-3.5" /> Trim · {fmt(trim[0])} – {fmt(trim[1])} <span className="text-muted-foreground font-normal">({fmt(trimDur)})</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <label className="block text-[11px] text-muted-foreground">
              Start
              <input
                type="range" min={0} max={duration} step={0.1} value={trim[0]}
                onChange={(e) => setTrim(([_, end]) => [Math.min(parseFloat(e.target.value), end), end])}
                className="w-full"
              />
            </label>
            <label className="block text-[11px] text-muted-foreground">
              End
              <input
                type="range" min={0} max={duration} step={0.1} value={trim[1]}
                onChange={(e) => setTrim(([start, _]) => [start, Math.max(parseFloat(e.target.value), start)])}
                className="w-full"
              />
            </label>
          </div>
          {trimDur > MAX_DURATION && (
            <div className="text-[11px] text-rose-600 mt-1">Reels cap at {MAX_DURATION}s.</div>
          )}
        </section>

        {/* Cover */}
        <section>
          <div className="flex items-center gap-2 text-[12px] font-semibold mb-2">
            <ImgIcon className="h-3.5 w-3.5" /> Cover frame · {fmt(coverAt)}
          </div>
          <input
            type="range" min={trim[0]} max={trim[1]} step={0.1} value={coverAt}
            onChange={(e) => {
              const v = parseFloat(e.target.value);
              setCoverAt(v);
              if (videoRef.current) videoRef.current.currentTime = v;
            }}
            className="w-full"
          />
        </section>

        {/* Caption */}
        <section>
          <div className="flex items-center gap-2 text-[12px] font-semibold mb-2">
            <Type className="h-3.5 w-3.5" /> Caption
          </div>
          <Textarea
            value={caption}
            onChange={(e) => setCaption(e.target.value.slice(0, 220))}
            placeholder="Say something…"
            className="resize-none"
            rows={3}
          />
          <div className="text-[10px] text-muted-foreground text-right mt-1">{caption.length} / 220</div>
        </section>

        {/* Hashtags */}
        <section>
          <div className="flex items-center gap-2 text-[12px] font-semibold mb-2">
            <Hash className="h-3.5 w-3.5" /> Hashtags · {hashtags.length} / 5
          </div>
          <div className="flex gap-2">
            <Input
              value={hashtagInput}
              onChange={(e) => setHashtagInput(e.target.value.replace(/\s/g, ''))}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addHashtag(); } }}
              placeholder="add tag"
              className="h-8 text-[12px]"
            />
            <Button size="sm" variant="outline" onClick={addHashtag} disabled={hashtags.length >= 5}>Add</Button>
          </div>
          {hashtags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {hashtags.map((h) => (
                <button
                  key={h}
                  onClick={() => removeHashtag(h)}
                  className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[11px] hover:bg-primary/20 transition-colors"
                >
                  #{h} ×
                </button>
              ))}
            </div>
          )}
        </section>

        {/* Audio */}
        <section>
          <div className="flex items-center gap-2 text-[12px] font-semibold mb-2">
            <Music className="h-3.5 w-3.5" /> Audio
          </div>
          <div className="flex gap-1">
            {(['original', 'mute', 'overlay'] as const).map((mode) => {
              const Icon = mode === 'mute' ? VolumeX : Volume2;
              return (
                <button
                  key={mode}
                  onClick={() => setAudio(mode)}
                  className={cn(
                    'flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md border text-[11.5px] capitalize transition-colors',
                    audio === mode ? 'bg-primary/10 border-primary/40 text-primary font-medium' : 'text-muted-foreground hover:bg-muted/50',
                  )}
                  disabled={mode === 'overlay'}
                  title={mode === 'overlay' ? 'Overlay mixing — server-side, coming soon' : ''}
                >
                  <Icon className="h-3.5 w-3.5" /> {mode}
                </button>
              );
            })}
          </div>
        </section>

        {/* Submit */}
        <div className="pt-2 border-t flex items-center justify-between">
          <div className="text-[11px] text-muted-foreground">
            {valid ? 'Ready to publish.' : 'Fill caption and trim a clip to publish.'}
          </div>
          <Button onClick={submit} disabled={!valid || submitting}>
            <Send className="h-3.5 w-3.5 mr-1.5" />
            {submitting ? 'Publishing…' : 'Publish reel'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ReelsEditor;
