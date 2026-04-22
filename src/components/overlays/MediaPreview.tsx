import React, { useState, useEffect } from 'react';
import { X, ChevronLeft, ChevronRight, Download, ExternalLink, ZoomIn, ZoomOut, Maximize2, Share2, RotateCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface MediaItem {
  id: string;
  type: 'image' | 'video' | 'document';
  src: string;
  title?: string;
  description?: string;
}

interface MediaPreviewProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  items: MediaItem[];
  initialIndex?: number;
}

export const MediaPreview: React.FC<MediaPreviewProps> = ({
  open, onOpenChange, items, initialIndex = 0,
}) => {
  const [currentIdx, setCurrentIdx] = useState(initialIndex);
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onOpenChange(false);
      if (e.key === 'ArrowLeft' && currentIdx > 0) { setCurrentIdx(i => i - 1); setZoom(1); setRotation(0); }
      if (e.key === 'ArrowRight' && currentIdx < items.length - 1) { setCurrentIdx(i => i + 1); setZoom(1); setRotation(0); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, currentIdx, items.length, onOpenChange]);

  if (!open || items.length === 0) return null;

  const item = items[currentIdx];
  const hasPrev = currentIdx > 0;
  const hasNext = currentIdx < items.length - 1;

  const nav = (dir: 'prev' | 'next') => {
    setZoom(1);
    setRotation(0);
    setCurrentIdx(i => dir === 'prev' ? Math.max(0, i - 1) : Math.min(items.length - 1, i + 1));
  };

  return (
    <div className="fixed inset-0 z-[100] flex flex-col bg-black/95" onClick={() => onOpenChange(false)}>
      {/* Top bar */}
      <div className="flex items-center justify-between px-5 py-3.5 text-white/80" onClick={e => e.stopPropagation()}>
        <div className="flex items-center gap-3">
          <span className="text-[11px] font-semibold bg-white/10 px-2.5 py-1 rounded-lg">{currentIdx + 1} / {items.length}</span>
          {item.title && <span className="text-[11px] font-medium">{item.title}</span>}
        </div>
        <div className="flex items-center gap-0.5">
          <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl text-white/70 hover:text-white hover:bg-white/10" onClick={() => setZoom(z => Math.max(0.5, z - 0.25))}>
            <ZoomOut className="h-4 w-4" />
          </Button>
          <span className="text-[10px] min-w-10 text-center font-mono">{Math.round(zoom * 100)}%</span>
          <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl text-white/70 hover:text-white hover:bg-white/10" onClick={() => setZoom(z => Math.min(3, z + 0.25))}>
            <ZoomIn className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl text-white/70 hover:text-white hover:bg-white/10" onClick={() => { setZoom(1); setRotation(0); }}>
            <Maximize2 className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl text-white/70 hover:text-white hover:bg-white/10" onClick={() => setRotation(r => (r + 90) % 360)}>
            <RotateCw className="h-4 w-4" />
          </Button>
          <div className="w-px h-5 bg-white/20 mx-1.5" />
          <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl text-white/70 hover:text-white hover:bg-white/10">
            <Download className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl text-white/70 hover:text-white hover:bg-white/10">
            <Share2 className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl text-white/70 hover:text-white hover:bg-white/10">
            <ExternalLink className="h-4 w-4" />
          </Button>
          <div className="w-px h-5 bg-white/20 mx-1.5" />
          <button onClick={() => onOpenChange(false)} className="h-9 w-9 rounded-xl flex items-center justify-center text-white/70 hover:text-white hover:bg-white/10 transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex items-center justify-center relative min-h-0" onClick={e => e.stopPropagation()}>
        {hasPrev && (
          <button
            className="absolute left-4 top-1/2 -translate-y-1/2 h-12 w-12 rounded-2xl bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-all duration-200 hover:scale-105 z-10"
            onClick={() => nav('prev')}
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
        )}

        <div className="max-w-full max-h-full overflow-auto p-4">
          {item.type === 'image' && (
            <img
              src={item.src}
              alt={item.title || 'Preview'}
              className="max-h-[75vh] object-contain transition-all duration-300"
              style={{ transform: `scale(${zoom}) rotate(${rotation}deg)` }}
              draggable={false}
            />
          )}
          {item.type === 'video' && (
            <video src={item.src} controls className="max-h-[75vh] max-w-full rounded-2xl" />
          )}
          {item.type === 'document' && (
            <div className="bg-card rounded-3xl p-10 text-center max-w-md mx-auto border shadow-2xl">
              <div className="h-16 w-16 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4 text-2xl">📄</div>
              <h3 className="text-sm font-bold mb-1">{item.title || 'Document'}</h3>
              <p className="text-[10px] text-muted-foreground mb-4">{item.description || 'Preview not available'}</p>
              <Button size="sm" className="text-[10px] h-9 gap-1.5 rounded-xl">
                <Download className="h-3 w-3" /> Download
              </Button>
            </div>
          )}
        </div>

        {hasNext && (
          <button
            className="absolute right-4 top-1/2 -translate-y-1/2 h-12 w-12 rounded-2xl bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-all duration-200 hover:scale-105 z-10"
            onClick={() => nav('next')}
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* Thumbnail strip */}
      {items.length > 1 && (
        <div className="flex items-center justify-center gap-2 py-4" onClick={e => e.stopPropagation()}>
          {items.map((it, i) => (
            <button
              key={it.id}
              onClick={() => { setCurrentIdx(i); setZoom(1); setRotation(0); }}
              className={cn(
                'h-14 w-14 rounded-xl overflow-hidden border-2 transition-all duration-200',
                i === currentIdx ? 'border-white opacity-100 scale-110 shadow-lg' : 'border-transparent opacity-40 hover:opacity-70 hover:scale-105'
              )}
            >
              {it.type === 'image' ? (
                <img src={it.src} alt="" className="h-full w-full object-cover" />
              ) : (
                <div className="h-full w-full bg-white/10 flex items-center justify-center text-white/50 text-xs font-medium">
                  {it.type === 'video' ? '▶' : '📄'}
                </div>
              )}
            </button>
          ))}
        </div>
      )}

      {/* Description bar */}
      {item.description && (
        <div className="px-6 py-3 text-center" onClick={e => e.stopPropagation()}>
          <p className="text-[11px] text-white/60 max-w-lg mx-auto">{item.description}</p>
        </div>
      )}
    </div>
  );
};
