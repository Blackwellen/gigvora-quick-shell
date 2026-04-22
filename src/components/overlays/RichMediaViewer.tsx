import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  X, ChevronLeft, ChevronRight, Download, ZoomIn, ZoomOut,
  Maximize2, Share2, RotateCw, Play, Pause, SkipForward, SkipBack,
  Volume2, VolumeX, List, Repeat, Shuffle, Heart, Bookmark,
  FileText, Image, Film, Mic, Radio, Tv, Eye,
} from 'lucide-react';
import { cn } from '@/lib/utils';

/* ══════════════════════════════════════════════
   Rich Media Viewer
   ══════════════════════════════════════════════
   Unified viewer for:
   - Images with zoom/rotate/gallery
   - Video with controls
   - Documents with preview
   - Podcast player with queue
   - Webinar replay viewer
   - Interactive gallery mode
   ══════════════════════════════════════════════ */

export type MediaItemType = 'image' | 'video' | 'document' | 'podcast' | 'webinar';

export interface RichMediaItem {
  id: string;
  type: MediaItemType;
  src: string;
  title?: string;
  description?: string;
  thumbnail?: string;
  duration?: string;
  artist?: string;
  album?: string;
  episode?: number;
  date?: string;
  fileSize?: string;
  mimeType?: string;
}

interface RichMediaViewerProps {
  open: boolean;
  onClose: () => void;
  items: RichMediaItem[];
  initialIndex?: number;
  mode?: 'viewer' | 'gallery' | 'player';
}

const TYPE_ICONS: Record<MediaItemType, React.ElementType> = {
  image: Image, video: Film, document: FileText, podcast: Mic, webinar: Tv,
};

const TYPE_COLORS: Record<MediaItemType, string> = {
  image: 'bg-accent/10 text-accent',
  video: 'bg-primary/10 text-primary',
  document: 'bg-[hsl(var(--gigvora-amber)/0.1)] text-[hsl(var(--gigvora-amber))]',
  podcast: 'bg-[hsl(var(--gigvora-purple)/0.1)] text-[hsl(var(--gigvora-purple))]',
  webinar: 'bg-[hsl(var(--gigvora-teal)/0.1)] text-[hsl(var(--gigvora-teal))]',
};

export const RichMediaViewer: React.FC<RichMediaViewerProps> = ({
  open, onClose, items, initialIndex = 0, mode: initialMode = 'viewer',
}) => {
  const [currentIdx, setCurrentIdx] = useState(initialIndex);
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [volume, setVolume] = useState(80);
  const [isMuted, setIsMuted] = useState(false);
  const [mode, setMode] = useState(initialMode);
  const [isLiked, setIsLiked] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [showQueue, setShowQueue] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval>>();

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft' && currentIdx > 0) { setCurrentIdx(i => i - 1); resetView(); }
      if (e.key === 'ArrowRight' && currentIdx < items.length - 1) { setCurrentIdx(i => i + 1); resetView(); }
      if (e.key === ' ') { e.preventDefault(); setIsPlaying(p => !p); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, currentIdx, items.length, onClose]);

  // Simulate playback
  useEffect(() => {
    if (isPlaying) {
      intervalRef.current = setInterval(() => {
        setProgress(p => {
          if (p >= 100) { setIsPlaying(false); return 0; }
          return p + 0.5;
        });
      }, 100);
    } else {
      clearInterval(intervalRef.current);
    }
    return () => clearInterval(intervalRef.current);
  }, [isPlaying]);

  const resetView = () => { setZoom(1); setRotation(0); setProgress(0); setIsPlaying(false); };

  if (!open || items.length === 0) return null;

  const item = items[currentIdx];
  const hasPrev = currentIdx > 0;
  const hasNext = currentIdx < items.length - 1;
  const isAudioType = item.type === 'podcast' || item.type === 'webinar';
  const TypeIcon = TYPE_ICONS[item.type];

  const nav = (dir: 'prev' | 'next') => {
    resetView();
    setCurrentIdx(i => dir === 'prev' ? Math.max(0, i - 1) : Math.min(items.length - 1, i + 1));
  };

  return (
    <div className="fixed inset-0 z-[100] flex flex-col bg-black/95" onClick={onClose}>
      {/* ═══ Top Bar ═══ */}
      <div className="flex items-center justify-between px-4 py-3 text-white/80 shrink-0" onClick={e => e.stopPropagation()}>
        <div className="flex items-center gap-2.5">
          <Badge className={cn('text-[7px] border-0 capitalize', TYPE_COLORS[item.type])}>
            <TypeIcon className="h-2.5 w-2.5 mr-0.5" />{item.type}
          </Badge>
          <span className="text-[10px] font-semibold bg-white/10 px-2 py-0.5 rounded-lg">{currentIdx + 1} / {items.length}</span>
          {item.title && <span className="text-[10px] font-medium truncate max-w-[200px]">{item.title}</span>}
        </div>

        <div className="flex items-center gap-0.5">
          {item.type === 'image' && (
            <>
              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-xl text-white/60 hover:text-white hover:bg-white/10" onClick={() => setZoom(z => Math.max(0.5, z - 0.25))}>
                <ZoomOut className="h-3.5 w-3.5" />
              </Button>
              <span className="text-[9px] min-w-8 text-center font-mono">{Math.round(zoom * 100)}%</span>
              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-xl text-white/60 hover:text-white hover:bg-white/10" onClick={() => setZoom(z => Math.min(3, z + 0.25))}>
                <ZoomIn className="h-3.5 w-3.5" />
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-xl text-white/60 hover:text-white hover:bg-white/10" onClick={() => setRotation(r => (r + 90) % 360)}>
                <RotateCw className="h-3.5 w-3.5" />
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-xl text-white/60 hover:text-white hover:bg-white/10" onClick={resetView}>
                <Maximize2 className="h-3.5 w-3.5" />
              </Button>
              <div className="w-px h-4 bg-white/15 mx-1" />
            </>
          )}

          {/* Mode toggles */}
          <div className="flex items-center gap-0.5 rounded-lg bg-white/5 p-0.5 mr-1">
            {(['viewer', 'gallery', ...(isAudioType ? ['player' as const] : [])] as const).map(m => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={cn('px-2 py-1 rounded-md text-[7px] font-medium transition-colors capitalize',
                  mode === m ? 'bg-white/15 text-white' : 'text-white/40 hover:text-white/70'
                )}
              >
                {m}
              </button>
            ))}
          </div>

          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-xl text-white/60 hover:text-white hover:bg-white/10" onClick={() => setIsLiked(!isLiked)}>
            <Heart className={cn('h-3.5 w-3.5', isLiked && 'fill-red-500 text-red-500')} />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-xl text-white/60 hover:text-white hover:bg-white/10" onClick={() => setIsSaved(!isSaved)}>
            <Bookmark className={cn('h-3.5 w-3.5', isSaved && 'fill-accent text-accent')} />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-xl text-white/60 hover:text-white hover:bg-white/10">
            <Download className="h-3.5 w-3.5" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-xl text-white/60 hover:text-white hover:bg-white/10">
            <Share2 className="h-3.5 w-3.5" />
          </Button>
          <div className="w-px h-4 bg-white/15 mx-1" />
          <button onClick={onClose} className="h-8 w-8 rounded-xl flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* ═══ Main Content ═══ */}
      <div className="flex-1 flex min-h-0" onClick={e => e.stopPropagation()}>
        {/* Main viewer area */}
        <div className={cn('flex-1 flex items-center justify-center relative', showQueue && 'mr-64')}>
          {hasPrev && (
            <button className="absolute left-3 top-1/2 -translate-y-1/2 h-10 w-10 rounded-2xl bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-all z-10" onClick={() => nav('prev')}>
              <ChevronLeft className="h-4 w-4" />
            </button>
          )}

          {/* Content renderer */}
          <div className="max-w-full max-h-full overflow-auto p-4">
            {item.type === 'image' && (
              <img
                src={item.src}
                alt={item.title || 'Preview'}
                className="max-h-[70vh] object-contain transition-all duration-300"
                style={{ transform: `scale(${zoom}) rotate(${rotation}deg)` }}
                draggable={false}
              />
            )}

            {item.type === 'video' && (
              <div className="relative rounded-2xl overflow-hidden max-w-4xl mx-auto">
                <div className="aspect-video bg-black/50 flex items-center justify-center rounded-2xl border border-white/10">
                  <div className="text-center">
                    <Film className="h-12 w-12 text-white/20 mx-auto mb-3" />
                    <p className="text-sm font-medium text-white/60">{item.title || 'Video'}</p>
                    {item.duration && <p className="text-[10px] text-white/30 mt-0.5">{item.duration}</p>}
                  </div>
                </div>
              </div>
            )}

            {item.type === 'document' && (
              <div className="bg-card rounded-3xl p-8 text-center max-w-sm mx-auto border shadow-2xl">
                <div className="h-14 w-14 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-3 text-xl">📄</div>
                <h3 className="text-sm font-bold mb-0.5">{item.title || 'Document'}</h3>
                {item.description && <p className="text-[10px] text-muted-foreground mb-1">{item.description}</p>}
                <div className="flex items-center justify-center gap-3 text-[8px] text-muted-foreground mb-3">
                  {item.fileSize && <span>{item.fileSize}</span>}
                  {item.mimeType && <span>{item.mimeType}</span>}
                  {item.date && <span>{item.date}</span>}
                </div>
                <div className="flex gap-2 justify-center">
                  <Button size="sm" className="text-[9px] h-8 gap-1 rounded-xl"><Eye className="h-3 w-3" />Preview</Button>
                  <Button size="sm" variant="outline" className="text-[9px] h-8 gap-1 rounded-xl"><Download className="h-3 w-3" />Download</Button>
                </div>
              </div>
            )}

            {(item.type === 'podcast' || item.type === 'webinar') && (
              <div className="max-w-md mx-auto">
                {/* Album art / thumbnail */}
                <div className="aspect-square max-w-[280px] mx-auto rounded-3xl bg-gradient-to-br from-accent/20 to-primary/20 border flex items-center justify-center mb-6 shadow-2xl overflow-hidden">
                  {item.thumbnail ? (
                    <img src={item.thumbnail} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="text-center">
                      {item.type === 'podcast' ? <Mic className="h-16 w-16 text-white/15" /> : <Tv className="h-16 w-16 text-white/15" />}
                    </div>
                  )}
                </div>

                {/* Track info */}
                <div className="text-center mb-6">
                  <h3 className="text-base font-bold text-white">{item.title || (item.type === 'podcast' ? 'Podcast Episode' : 'Webinar Replay')}</h3>
                  {item.artist && <p className="text-[11px] text-white/50 mt-0.5">{item.artist}</p>}
                  {item.album && <p className="text-[10px] text-white/30">{item.album}</p>}
                  {item.episode && <Badge className="text-[7px] mt-1.5 bg-white/10 text-white/60 border-0">Ep. {item.episode}</Badge>}
                </div>

                {/* Progress */}
                <div className="mb-4">
                  <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                    <div className="h-full bg-accent rounded-full transition-all" style={{ width: `${progress}%` }} />
                  </div>
                  <div className="flex justify-between mt-1 text-[8px] text-white/30 font-mono">
                    <span>{Math.floor(progress * 0.45)}:{String(Math.floor((progress * 27) % 60)).padStart(2, '0')}</span>
                    <span>{item.duration || '45:00'}</span>
                  </div>
                </div>

                {/* Controls */}
                <div className="flex items-center justify-center gap-3">
                  <button className="text-white/40 hover:text-white transition-colors"><Shuffle className="h-3.5 w-3.5" /></button>
                  <button onClick={() => nav('prev')} disabled={!hasPrev} className="text-white/60 hover:text-white transition-colors disabled:opacity-30"><SkipBack className="h-5 w-5" /></button>
                  <button
                    onClick={() => setIsPlaying(!isPlaying)}
                    className="h-14 w-14 rounded-full bg-accent flex items-center justify-center text-white hover:scale-105 transition-transform shadow-lg"
                  >
                    {isPlaying ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6 ml-0.5" />}
                  </button>
                  <button onClick={() => nav('next')} disabled={!hasNext} className="text-white/60 hover:text-white transition-colors disabled:opacity-30"><SkipForward className="h-5 w-5" /></button>
                  <button className="text-white/40 hover:text-white transition-colors"><Repeat className="h-3.5 w-3.5" /></button>
                </div>

                {/* Volume */}
                <div className="flex items-center gap-2 justify-center mt-4">
                  <button onClick={() => setIsMuted(!isMuted)} className="text-white/40 hover:text-white transition-colors">
                    {isMuted ? <VolumeX className="h-3.5 w-3.5" /> : <Volume2 className="h-3.5 w-3.5" />}
                  </button>
                  <div className="w-24">
                    <Slider
                      value={[isMuted ? 0 : volume]}
                      onValueChange={([v]) => { setVolume(v); setIsMuted(false); }}
                      max={100}
                      step={1}
                      className="cursor-pointer"
                    />
                  </div>
                </div>

                {/* Queue toggle */}
                <div className="flex justify-center mt-4">
                  <button
                    onClick={() => setShowQueue(!showQueue)}
                    className={cn('flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[9px] font-medium transition-all',
                      showQueue ? 'bg-white/15 text-white' : 'bg-white/5 text-white/40 hover:text-white/70'
                    )}
                  >
                    <List className="h-3 w-3" />Queue ({items.length})
                  </button>
                </div>
              </div>
            )}
          </div>

          {hasNext && (
            <button className="absolute right-3 top-1/2 -translate-y-1/2 h-10 w-10 rounded-2xl bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-all z-10" onClick={() => nav('next')}>
              <ChevronRight className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* ═══ Queue Panel ═══ */}
        {showQueue && (
          <div className="w-64 bg-white/5 border-l border-white/10 flex flex-col shrink-0">
            <div className="px-3 py-2.5 border-b border-white/10 flex items-center justify-between">
              <span className="text-[10px] font-bold text-white/80">Queue</span>
              <span className="text-[8px] text-white/30">{items.length} items</span>
            </div>
            <ScrollArea className="flex-1">
              <div className="p-1.5 space-y-0.5">
                {items.map((it, i) => {
                  const QIcon = TYPE_ICONS[it.type];
                  return (
                    <button
                      key={it.id}
                      onClick={() => { setCurrentIdx(i); resetView(); }}
                      className={cn(
                        'w-full flex items-center gap-2 p-2 rounded-lg text-left transition-all',
                        i === currentIdx ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white/70 hover:bg-white/5'
                      )}
                    >
                      <div className={cn('h-6 w-6 rounded-md flex items-center justify-center shrink-0', i === currentIdx ? 'bg-accent/20' : 'bg-white/5')}>
                        {i === currentIdx && isPlaying ? <Radio className="h-2.5 w-2.5 text-accent animate-pulse" /> : <QIcon className="h-2.5 w-2.5" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-[8px] font-medium truncate">{it.title || `Item ${i + 1}`}</div>
                        {it.duration && <div className="text-[7px] opacity-50">{it.duration}</div>}
                      </div>
                    </button>
                  );
                })}
              </div>
            </ScrollArea>
          </div>
        )}
      </div>

      {/* ═══ Gallery Mode Thumbnails ═══ */}
      {mode === 'gallery' && items.length > 1 && (
        <div className="flex items-center justify-center gap-2 py-3 shrink-0" onClick={e => e.stopPropagation()}>
          {items.map((it, i) => (
            <button
              key={it.id}
              onClick={() => { setCurrentIdx(i); resetView(); }}
              className={cn(
                'h-12 w-12 rounded-xl overflow-hidden border-2 transition-all duration-200',
                i === currentIdx ? 'border-white opacity-100 scale-110 shadow-lg' : 'border-transparent opacity-30 hover:opacity-60 hover:scale-105'
              )}
            >
              {it.type === 'image' && it.src ? (
                <img src={it.src} alt="" className="h-full w-full object-cover" />
              ) : (
                <div className="h-full w-full bg-white/10 flex items-center justify-center">
                  {React.createElement(TYPE_ICONS[it.type], { className: 'h-3 w-3 text-white/30' })}
                </div>
              )}
            </button>
          ))}
        </div>
      )}

      {/* ═══ Description Bar ═══ */}
      {item.description && mode === 'viewer' && (
        <div className="px-5 py-2.5 text-center shrink-0" onClick={e => e.stopPropagation()}>
          <p className="text-[10px] text-white/50 max-w-md mx-auto">{item.description}</p>
        </div>
      )}
    </div>
  );
};
