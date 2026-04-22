import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { DashboardLayout } from '@/components/shell/DashboardLayout';
import { SectionCard, StatusBadge, KPICard, KPIBand } from '@/components/shell/EnterprisePrimitives';
import { cn } from '@/lib/utils';
import {
  Image, FileText, Video, Music, Grid, List, Search, Filter, Plus,
  Download, Share2, Eye, Heart, MessageSquare, MoreHorizontal,
  ZoomIn, ZoomOut, RotateCw, Maximize2, X, ChevronLeft, ChevronRight,
  Play, Pause, Volume2, VolumeX, SkipBack, SkipForward, Bookmark,
  Upload, Trash2, Lock, AlertTriangle, CheckCircle2, ExternalLink,
  Clock, Star, Sparkles, Copy, Settings, FolderOpen, Archive,
  type LucideIcon,
} from 'lucide-react';
import { toast } from 'sonner';

// ── Types ──
type MediaType = 'image' | 'video' | 'document' | 'audio';
type MediaStatus = 'published' | 'processing' | 'draft' | 'archived' | 'restricted' | 'failed';
type MainTab = 'gallery' | 'documents' | 'audio' | 'video' | 'recent' | 'saved';
type ViewMode = 'grid' | 'list';

interface MediaItem {
  id: string; name: string; type: MediaType; status: MediaStatus;
  size: string; date: string; owner: { name: string; initials: string };
  views: number; downloads: number; likes: number; comments: number;
  tags: string[]; project?: string; thumbnail?: string;
  duration?: string; pages?: number; isPremium?: boolean;
}

// ── Mock Data ──
const MEDIA_ITEMS: MediaItem[] = [
  { id: 'm1', name: 'Brand Guidelines v3.pdf', type: 'document', status: 'published', size: '4.2 MB', date: 'Apr 10', owner: { name: 'Sarah C.', initials: 'SC' }, views: 234, downloads: 89, likes: 12, comments: 3, tags: ['Brand', 'Design'], project: 'SaaS Platform', pages: 24 },
  { id: 'm2', name: 'Hero Banner — Spring Campaign.png', type: 'image', status: 'published', size: '2.8 MB', date: 'Apr 9', owner: { name: 'Alex K.', initials: 'AK' }, views: 567, downloads: 142, likes: 45, comments: 8, tags: ['Marketing', 'Campaign'] },
  { id: 'm3', name: 'Product Demo Walk-through.mp4', type: 'video', status: 'published', size: '156 MB', date: 'Apr 8', owner: { name: 'Elena R.', initials: 'ER' }, views: 1203, downloads: 67, likes: 89, comments: 21, tags: ['Product', 'Demo'], project: 'SaaS Platform', duration: '12:34' },
  { id: 'm4', name: 'Podcast Ep. 42 — Future of Work.mp3', type: 'audio', status: 'published', size: '48 MB', date: 'Apr 7', owner: { name: 'Priya P.', initials: 'PP' }, views: 890, downloads: 234, likes: 67, comments: 14, tags: ['Podcast', 'FutureOfWork'], duration: '45:12' },
  { id: 'm5', name: 'Dashboard Wireframes.fig', type: 'document', status: 'draft', size: '12 MB', date: 'Apr 6', owner: { name: 'Sarah C.', initials: 'SC' }, views: 45, downloads: 5, likes: 2, comments: 1, tags: ['Design', 'Wireframe'], project: 'SaaS Platform', pages: 18 },
  { id: 'm6', name: 'Team Celebration Photos.zip', type: 'image', status: 'published', size: '320 MB', date: 'Apr 5', owner: { name: 'Alex K.', initials: 'AK' }, views: 123, downloads: 34, likes: 28, comments: 6, tags: ['Team', 'Culture'] },
  { id: 'm7', name: 'API Architecture Diagram.svg', type: 'image', status: 'published', size: '890 KB', date: 'Apr 4', owner: { name: 'Elena R.', initials: 'ER' }, views: 345, downloads: 78, likes: 15, comments: 4, tags: ['Technical', 'Architecture'], project: 'Microservices' },
  { id: 'm8', name: 'Client Presentation — Q2 2026.pptx', type: 'document', status: 'restricted', size: '8.5 MB', date: 'Apr 3', owner: { name: 'Priya P.', initials: 'PP' }, views: 89, downloads: 12, likes: 5, comments: 2, tags: ['Sales', 'Presentation'], isPremium: true, pages: 32 },
  { id: 'm9', name: 'Onboarding Tutorial.mp4', type: 'video', status: 'processing', size: '240 MB', date: 'Apr 2', owner: { name: 'Alex K.', initials: 'AK' }, views: 0, downloads: 0, likes: 0, comments: 0, tags: ['Tutorial', 'Onboarding'], duration: '8:15' },
  { id: 'm10', name: 'Sound Effects Pack.zip', type: 'audio', status: 'archived', size: '180 MB', date: 'Mar 28', owner: { name: 'Elena R.', initials: 'ER' }, views: 56, downloads: 23, likes: 8, comments: 1, tags: ['Audio', 'SFX'], duration: 'Various' },
  { id: 'm11', name: 'Contract Template — NDA.docx', type: 'document', status: 'published', size: '120 KB', date: 'Mar 25', owner: { name: 'Sarah C.', initials: 'SC' }, views: 789, downloads: 456, likes: 34, comments: 7, tags: ['Legal', 'Template'], pages: 4 },
  { id: 'm12', name: 'Webinar Recording — AI Trends.mp4', type: 'video', status: 'published', size: '890 MB', date: 'Mar 20', owner: { name: 'Priya P.', initials: 'PP' }, views: 2340, downloads: 123, likes: 156, comments: 42, tags: ['Webinar', 'AI'], duration: '1:23:45', isPremium: true },
];

const TYPE_ICONS: Record<MediaType, LucideIcon> = { image: Image, video: Video, document: FileText, audio: Music };
const TYPE_COLORS: Record<MediaType, string> = {
  image: 'bg-accent/15 text-accent', video: 'bg-[hsl(var(--gigvora-purple))]/15 text-[hsl(var(--gigvora-purple))]',
  document: 'bg-[hsl(var(--gigvora-amber))]/15 text-[hsl(var(--gigvora-amber))]', audio: 'bg-[hsl(var(--gigvora-green))]/15 text-[hsl(var(--gigvora-green))]',
};
const STATUS_MAP: Record<MediaStatus, { label: string; state: 'healthy' | 'live' | 'pending' | 'blocked' | 'caution' | 'degraded' }> = {
  published: { label: 'Published', state: 'healthy' }, processing: { label: 'Processing', state: 'pending' },
  draft: { label: 'Draft', state: 'caution' }, archived: { label: 'Archived', state: 'degraded' },
  restricted: { label: 'Restricted', state: 'blocked' }, failed: { label: 'Failed', state: 'blocked' },
};

const ACTIVITY = [
  { actor: 'Sarah C.', action: 'uploaded "Brand Guidelines v3.pdf"', time: '2h ago' },
  { actor: 'Alex K.', action: 'shared "Hero Banner" with Marketing team', time: '4h ago' },
  { actor: 'Elena R.', action: 'commented on "API Architecture Diagram"', time: '6h ago' },
  { actor: 'System', action: '"Onboarding Tutorial.mp4" processing started', time: '8h ago' },
  { actor: 'Priya P.', action: 'archived "Sound Effects Pack.zip"', time: '1d ago' },
];

const COLLECTIONS = [
  { name: 'Brand Assets', count: 24, icon: '🎨' },
  { name: 'Product Demos', count: 8, icon: '🎬' },
  { name: 'Legal Templates', count: 12, icon: '📋' },
  { name: 'Team Media', count: 36, icon: '👥' },
];

/* ═══════════════════════════════════════════════════════════
   Fullscreen Media Viewer Overlay
   ═══════════════════════════════════════════════════════════ */
const FullscreenViewer: React.FC<{ item: MediaItem | null; open: boolean; onClose: () => void; items: MediaItem[]; onNav: (id: string) => void }> = ({ item, open, onClose, items, onNav }) => {
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);

  if (!open || !item) return null;
  const idx = items.findIndex(i => i.id === item.id);
  const hasPrev = idx > 0;
  const hasNext = idx < items.length - 1;
  const Icon = TYPE_ICONS[item.type];

  const resetView = () => { setZoom(1); setRotation(0); };

  return (
    <div className="fixed inset-0 z-[100] flex flex-col bg-black/95 animate-fade-in" onClick={onClose}>
      {/* Top bar */}
      <div className="flex items-center justify-between px-5 py-3.5 text-white/80" onClick={e => e.stopPropagation()}>
        <div className="flex items-center gap-3">
          <span className="text-[11px] font-semibold bg-white/10 px-2.5 py-1 rounded-lg">{idx + 1} / {items.length}</span>
          <span className="text-[11px] font-medium truncate max-w-[200px]">{item.name}</span>
          <Badge variant="secondary" className="text-[7px] rounded-lg capitalize bg-white/10 text-white/70">{item.type}</Badge>
        </div>
        <div className="flex items-center gap-0.5">
          {item.type === 'image' && (
            <>
              <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl text-white/70 hover:text-white hover:bg-white/10" onClick={() => setZoom(z => Math.max(0.5, z - 0.25))}><ZoomOut className="h-4 w-4" /></Button>
              <span className="text-[10px] min-w-10 text-center font-mono">{Math.round(zoom * 100)}%</span>
              <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl text-white/70 hover:text-white hover:bg-white/10" onClick={() => setZoom(z => Math.min(3, z + 0.25))}><ZoomIn className="h-4 w-4" /></Button>
              <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl text-white/70 hover:text-white hover:bg-white/10" onClick={resetView}><Maximize2 className="h-4 w-4" /></Button>
              <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl text-white/70 hover:text-white hover:bg-white/10" onClick={() => setRotation(r => (r + 90) % 360)}><RotateCw className="h-4 w-4" /></Button>
              <div className="w-px h-5 bg-white/20 mx-1.5" />
            </>
          )}
          <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl text-white/70 hover:text-white hover:bg-white/10" onClick={() => toast.success('Downloaded!')}><Download className="h-4 w-4" /></Button>
          <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl text-white/70 hover:text-white hover:bg-white/10" onClick={() => toast.success('Link copied!')}><Share2 className="h-4 w-4" /></Button>
          <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl text-white/70 hover:text-white hover:bg-white/10"><ExternalLink className="h-4 w-4" /></Button>
          <div className="w-px h-5 bg-white/20 mx-1.5" />
          <button onClick={onClose} className="h-9 w-9 rounded-xl flex items-center justify-center text-white/70 hover:text-white hover:bg-white/10 transition-colors"><X className="h-5 w-5" /></button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex items-center justify-center relative min-h-0" onClick={e => e.stopPropagation()}>
        {hasPrev && (
          <button onClick={() => { resetView(); onNav(items[idx - 1].id); }} className="absolute left-4 top-1/2 -translate-y-1/2 h-12 w-12 rounded-2xl bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-all duration-200 hover:scale-105 z-10">
            <ChevronLeft className="h-5 w-5" />
          </button>
        )}

        <div className="max-w-full max-h-full overflow-auto p-4">
          {item.type === 'image' && (
            <div className="rounded-2xl bg-white/5 p-8 flex flex-col items-center gap-4">
              <div className="h-48 w-72 rounded-xl bg-gradient-to-br from-accent/20 to-accent/5 flex items-center justify-center transition-all duration-300" style={{ transform: `scale(${zoom}) rotate(${rotation}deg)` }}>
                <Image className="h-16 w-16 text-accent/40" />
              </div>
              <span className="text-[11px] text-white/60">{item.name}</span>
            </div>
          )}
          {item.type === 'video' && (
            <div className="rounded-2xl bg-white/5 p-6 flex flex-col items-center gap-4 max-w-lg">
              <div className="relative h-56 w-full rounded-xl bg-gradient-to-br from-[hsl(var(--gigvora-purple))]/20 to-black flex items-center justify-center">
                <button onClick={() => setPlaying(!playing)} className="h-16 w-16 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white transition-all hover:scale-110">
                  {playing ? <Pause className="h-7 w-7" /> : <Play className="h-7 w-7 ml-1" />}
                </button>
                {item.duration && <span className="absolute bottom-3 right-3 text-[10px] text-white/70 bg-black/50 px-2 py-0.5 rounded-lg">{item.duration}</span>}
              </div>
              <div className="w-full flex items-center gap-2">
                <div className="flex-1 h-1 bg-white/20 rounded-full"><div className="h-full w-1/3 bg-accent rounded-full" /></div>
                <button onClick={() => setMuted(!muted)} className="text-white/60 hover:text-white"><Volume2 className="h-4 w-4" /></button>
              </div>
              <span className="text-[11px] text-white/60">{item.name}</span>
            </div>
          )}
          {item.type === 'audio' && (
            <div className="rounded-2xl bg-white/5 p-8 flex flex-col items-center gap-4 max-w-md">
              <div className="h-32 w-32 rounded-3xl bg-gradient-to-br from-[hsl(var(--gigvora-green))]/30 to-black flex items-center justify-center">
                <Music className="h-12 w-12 text-[hsl(var(--gigvora-green))]/60" />
              </div>
              <span className="text-[13px] text-white font-semibold">{item.name}</span>
              {item.duration && <span className="text-[10px] text-white/50">{item.duration}</span>}
              <div className="w-full flex items-center gap-3">
                <SkipBack className="h-4 w-4 text-white/50 hover:text-white cursor-pointer" />
                <button onClick={() => setPlaying(!playing)} className="h-12 w-12 rounded-full bg-[hsl(var(--gigvora-green))]/30 hover:bg-[hsl(var(--gigvora-green))]/50 flex items-center justify-center text-white transition-all hover:scale-105">
                  {playing ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5 ml-0.5" />}
                </button>
                <SkipForward className="h-4 w-4 text-white/50 hover:text-white cursor-pointer" />
              </div>
              <div className="w-full flex items-center gap-2">
                <span className="text-[8px] text-white/40">0:00</span>
                <div className="flex-1 h-1 bg-white/20 rounded-full"><div className="h-full w-1/4 bg-[hsl(var(--gigvora-green))] rounded-full" /></div>
                <span className="text-[8px] text-white/40">{item.duration}</span>
              </div>
            </div>
          )}
          {item.type === 'document' && (
            <div className="rounded-3xl bg-card p-10 text-center max-w-md mx-auto border shadow-2xl">
              <div className="h-16 w-16 rounded-2xl bg-[hsl(var(--gigvora-amber))]/10 flex items-center justify-center mx-auto mb-4"><FileText className="h-8 w-8 text-[hsl(var(--gigvora-amber))]" /></div>
              <h3 className="text-sm font-bold mb-1 text-foreground">{item.name}</h3>
              <p className="text-[10px] text-muted-foreground mb-1">{item.size} · {item.pages} pages</p>
              <div className="flex items-center justify-center gap-1.5 mt-3">
                <Button size="sm" className="h-9 text-[10px] gap-1.5 rounded-xl"><Download className="h-3 w-3" />Download</Button>
                <Button variant="outline" size="sm" className="h-9 text-[10px] gap-1.5 rounded-xl"><ExternalLink className="h-3 w-3" />Open</Button>
              </div>
            </div>
          )}
        </div>

        {hasNext && (
          <button onClick={() => { resetView(); onNav(items[idx + 1].id); }} className="absolute right-4 top-1/2 -translate-y-1/2 h-12 w-12 rounded-2xl bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-all duration-200 hover:scale-105 z-10">
            <ChevronRight className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* Thumbnail strip */}
      {items.length > 1 && (
        <div className="flex items-center justify-center gap-2 py-4" onClick={e => e.stopPropagation()}>
          {items.slice(Math.max(0, idx - 4), Math.min(items.length, idx + 5)).map(it => {
            const TIcon = TYPE_ICONS[it.type];
            return (
              <button key={it.id} onClick={() => { resetView(); onNav(it.id); }} className={cn('h-14 w-14 rounded-xl overflow-hidden border-2 transition-all duration-200 flex items-center justify-center', it.id === item.id ? 'border-white opacity-100 scale-110 shadow-lg' : 'border-transparent opacity-40 hover:opacity-70 hover:scale-105', TYPE_COLORS[it.type].replace('text-', 'bg-').split(' ')[0])}>
                <TIcon className="h-5 w-5 text-white/60" />
              </button>
            );
          })}
        </div>
      )}

      {/* Info bar */}
      <div className="px-6 py-3 flex items-center justify-center gap-4 text-white/50 text-[10px]" onClick={e => e.stopPropagation()}>
        <span className="flex items-center gap-1"><Eye className="h-3 w-3" />{item.views}</span>
        <span className="flex items-center gap-1"><Download className="h-3 w-3" />{item.downloads}</span>
        <span className="flex items-center gap-1"><Heart className="h-3 w-3" />{item.likes}</span>
        <span className="flex items-center gap-1"><MessageSquare className="h-3 w-3" />{item.comments}</span>
        <span>·</span>
        <span>{item.size}</span>
        <span>·</span>
        <span>by {item.owner.name}</span>
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════
   Detail Drawer
   ═══════════════════════════════════════════════════════════ */
const MediaDetailDrawer: React.FC<{ item: MediaItem | null; open: boolean; onClose: () => void; onFullscreen: () => void }> = ({ item, open, onClose, onFullscreen }) => {
  if (!item) return null;
  const Icon = TYPE_ICONS[item.type];
  const sm = STATUS_MAP[item.status];
  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent className="w-[460px] overflow-y-auto p-0">
        <SheetHeader className="p-5 border-b"><SheetTitle className="text-sm flex items-center gap-2"><Icon className="h-4 w-4 text-accent" />{item.name}</SheetTitle></SheetHeader>
        <div className="p-5 space-y-4">
          {/* Preview */}
          <div className={cn('rounded-2xl h-40 flex items-center justify-center cursor-pointer hover:shadow-md transition-all', TYPE_COLORS[item.type])} onClick={onFullscreen}>
            <div className="text-center">
              <Icon className="h-10 w-10 mx-auto mb-2 opacity-60" />
              <span className="text-[9px] font-medium opacity-60">Click to preview</span>
            </div>
          </div>

          {/* Meta grid */}
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: 'Status', value: <StatusBadge status={sm.state} label={sm.label} /> },
              { label: 'Type', value: <Badge variant="secondary" className="text-[8px] capitalize rounded-lg">{item.type}</Badge> },
              { label: 'Size', value: item.size },
              { label: 'Date', value: item.date },
              ...(item.duration ? [{ label: 'Duration', value: item.duration }] : []),
              ...(item.pages ? [{ label: 'Pages', value: `${item.pages} pages` }] : []),
            ].map(m => (
              <div key={m.label} className="rounded-2xl border p-2.5">
                <div className="text-[7px] text-muted-foreground mb-0.5">{m.label}</div>
                <div className="text-[9px] font-medium">{m.value}</div>
              </div>
            ))}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-4 gap-1.5">
            {[
              { icon: Eye, value: item.views, label: 'Views' },
              { icon: Download, value: item.downloads, label: 'DLs' },
              { icon: Heart, value: item.likes, label: 'Likes' },
              { icon: MessageSquare, value: item.comments, label: 'Comments' },
            ].map(s => (
              <div key={s.label} className="rounded-xl border p-2 text-center">
                <s.icon className="h-3 w-3 mx-auto mb-0.5 text-muted-foreground" />
                <div className="text-[10px] font-bold">{s.value}</div>
                <div className="text-[6px] text-muted-foreground">{s.label}</div>
              </div>
            ))}
          </div>

          {/* Owner */}
          <div className="flex items-center gap-2.5 p-2.5 rounded-xl border">
            <Avatar className="h-8 w-8 ring-1 ring-muted/40"><AvatarFallback className="text-[8px] bg-accent/10 text-accent font-bold">{item.owner.initials}</AvatarFallback></Avatar>
            <div>
              <div className="text-[10px] font-semibold">{item.owner.name}</div>
              <div className="text-[8px] text-muted-foreground">Owner · {item.date}</div>
            </div>
            <Button variant="ghost" size="sm" className="h-5 text-[7px] ml-auto px-1.5 rounded-lg"><ExternalLink className="h-2.5 w-2.5" /></Button>
          </div>

          {item.project && (
            <div className="rounded-xl border bg-muted/15 px-3 py-2 flex items-center gap-2">
              <Badge variant="secondary" className="text-[7px] h-3.5 rounded-lg">Project</Badge>
              <span className="text-[9px] font-semibold text-accent">{item.project}</span>
            </div>
          )}

          {item.isPremium && (
            <div className="rounded-xl border border-[hsl(var(--gigvora-amber))]/30 bg-[hsl(var(--gigvora-amber))]/5 px-3 py-2 flex items-center gap-2">
              <Lock className="h-3 w-3 text-[hsl(var(--gigvora-amber))]" />
              <span className="text-[9px] font-medium">Premium content — subscription required</span>
            </div>
          )}

          {/* Tags */}
          <div>
            <div className="text-[10px] font-semibold mb-1.5">Tags</div>
            <div className="flex flex-wrap gap-1">
              {item.tags.map(t => <Badge key={t} variant="secondary" className="text-[7px] rounded-lg">{t}</Badge>)}
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-1.5 border-t pt-3">
            <Button size="sm" className="h-7 text-[9px] gap-1 rounded-xl" onClick={onFullscreen}><Eye className="h-2.5 w-2.5" />Preview</Button>
            <Button variant="outline" size="sm" className="h-7 text-[9px] gap-1 rounded-xl" onClick={() => toast.success('Downloaded!')}><Download className="h-2.5 w-2.5" />Download</Button>
            <Button variant="outline" size="sm" className="h-7 text-[9px] gap-1 rounded-xl" onClick={() => toast.success('Link copied!')}><Share2 className="h-2.5 w-2.5" />Share</Button>
            <Button variant="outline" size="sm" className="h-7 text-[9px] gap-1 rounded-xl"><Bookmark className="h-2.5 w-2.5" />Save</Button>
            {item.status !== 'archived' && (
              <Button variant="ghost" size="sm" className="h-7 text-[9px] gap-1 rounded-xl text-destructive"><Trash2 className="h-2.5 w-2.5" />Delete</Button>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

/* ═══════════════════════════════════════════════════════════
   Upload Drawer
   ═══════════════════════════════════════════════════════════ */
const UploadDrawer: React.FC<{ open: boolean; onClose: () => void }> = ({ open, onClose }) => (
  <Sheet open={open} onOpenChange={onClose}>
    <SheetContent className="w-[440px] overflow-y-auto p-0">
      <SheetHeader className="p-5 border-b"><SheetTitle className="text-sm flex items-center gap-2"><Upload className="h-4 w-4 text-accent" />Upload Media</SheetTitle></SheetHeader>
      <div className="p-5 space-y-4">
        <div className="rounded-2xl border-2 border-dashed border-accent/30 bg-accent/5 p-8 text-center hover:border-accent/50 transition-all cursor-pointer">
          <Upload className="h-10 w-10 mx-auto mb-3 text-accent/40" />
          <div className="text-[11px] font-semibold mb-1">Drop files here or click to browse</div>
          <div className="text-[9px] text-muted-foreground">Images, Videos, Documents, Audio · Max 500 MB</div>
        </div>
        <div>
          <label className="text-[11px] font-semibold mb-1.5 block">Title</label>
          <input className="w-full h-9 rounded-xl border bg-background px-3 text-[11px] focus:outline-none focus:ring-2 focus:ring-accent/30" placeholder="File title..." />
        </div>
        <div>
          <label className="text-[11px] font-semibold mb-1.5 block">Collection</label>
          <select className="w-full h-9 rounded-xl border bg-background px-3 text-[11px]">
            <option>None</option>
            {COLLECTIONS.map(c => <option key={c.name}>{c.name}</option>)}
          </select>
        </div>
        <div>
          <label className="text-[11px] font-semibold mb-1.5 block">Tags</label>
          <input className="w-full h-9 rounded-xl border bg-background px-3 text-[11px] focus:outline-none focus:ring-2 focus:ring-accent/30" placeholder="Comma-separated..." />
        </div>
        <div>
          <label className="text-[11px] font-semibold mb-1.5 block">Access</label>
          <select className="w-full h-9 rounded-xl border bg-background px-3 text-[11px]">
            <option>Public</option><option>Team Only</option><option>Private</option><option>Premium</option>
          </select>
        </div>
        <Button className="w-full h-10 rounded-2xl text-[11px] gap-1.5" onClick={() => { onClose(); toast.success('Upload started!'); }}>
          <Upload className="h-4 w-4" />Upload Files
        </Button>
      </div>
    </SheetContent>
  </Sheet>
);

/* ═══════════════════════════════════════════════════════════
   Compare Drawer
   ═══════════════════════════════════════════════════════════ */
const CompareDrawer: React.FC<{ open: boolean; onClose: () => void; items: MediaItem[] }> = ({ open, onClose, items }) => (
  <Sheet open={open} onOpenChange={onClose}>
    <SheetContent className="w-[600px] overflow-y-auto p-0">
      <SheetHeader className="p-5 border-b"><SheetTitle className="text-sm">Compare Files</SheetTitle></SheetHeader>
      <div className="p-5">
        {items.length < 2 ? (
          <div className="text-center py-8 text-muted-foreground text-[11px]">Select 2+ items to compare</div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {items.slice(0, 2).map(it => {
              const TIcon = TYPE_ICONS[it.type];
              return (
                <div key={it.id} className="rounded-2xl border p-4">
                  <div className={cn('rounded-xl h-24 flex items-center justify-center mb-3', TYPE_COLORS[it.type])}><TIcon className="h-8 w-8 opacity-50" /></div>
                  <div className="text-[10px] font-bold truncate mb-1">{it.name}</div>
                  <div className="space-y-1 text-[8px] text-muted-foreground">
                    <div>Size: {it.size}</div><div>Views: {it.views}</div><div>Downloads: {it.downloads}</div><div>Date: {it.date}</div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </SheetContent>
  </Sheet>
);

/* ═══════════════════════════════════════════════════════════
   MAIN PAGE
   ═══════════════════════════════════════════════════════════ */
const MediaViewerPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<MainTab>('gallery');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [selectedItem, setSelectedItem] = useState<MediaItem | null>(null);
  const [fullscreenItem, setFullscreenItem] = useState<MediaItem | null>(null);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [compareOpen, setCompareOpen] = useState(false);
  const [compareItems, setCompareItems] = useState<MediaItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('all');

  const filtered = MEDIA_ITEMS.filter(m => {
    if (filterType !== 'all' && m.type !== filterType) return false;
    if (searchQuery && !m.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    if (activeTab === 'documents') return m.type === 'document';
    if (activeTab === 'audio') return m.type === 'audio';
    if (activeTab === 'video') return m.type === 'video';
    if (activeTab === 'saved') return false; // placeholder
    if (activeTab === 'recent') return true;
    return true;
  });

  const toggleCompare = (item: MediaItem) => {
    setCompareItems(prev => prev.find(i => i.id === item.id) ? prev.filter(i => i.id !== item.id) : [...prev.slice(-1), item]);
  };

  const TABS: { id: MainTab; label: string; icon: LucideIcon }[] = [
    { id: 'gallery', label: 'Gallery', icon: Grid },
    { id: 'documents', label: 'Documents', icon: FileText },
    { id: 'video', label: 'Video', icon: Video },
    { id: 'audio', label: 'Audio', icon: Music },
    { id: 'recent', label: 'Recent', icon: Clock },
    { id: 'saved', label: 'Saved', icon: Bookmark },
  ];

  /* ── Top Strip ── */
  const topStrip = (
    <>
      <div className="flex items-center gap-2.5">
        <div className="h-7 w-7 rounded-xl bg-accent/10 flex items-center justify-center"><Image className="h-3.5 w-3.5 text-accent" /></div>
        <span className="text-xs font-bold">Media Library</span>
        <Badge variant="secondary" className="text-[7px] rounded-lg">{MEDIA_ITEMS.length} files</Badge>
      </div>
      <div className="flex-1" />
      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
        <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="h-7 w-44 rounded-xl border bg-background pl-7 pr-3 text-[9px] focus:outline-none focus:ring-2 focus:ring-accent/30" placeholder="Search files..." />
      </div>
      <select value={filterType} onChange={e => setFilterType(e.target.value)} className="h-7 rounded-xl border bg-background px-2 text-[9px] ml-1.5">
        <option value="all">All types</option>
        <option value="image">Images</option><option value="video">Videos</option>
        <option value="document">Documents</option><option value="audio">Audio</option>
      </select>
      <div className="flex items-center gap-0.5 bg-muted/40 rounded-xl p-0.5 ml-1.5">
        {([['grid', Grid], ['list', List]] as [ViewMode, LucideIcon][]).map(([v, VIcon]) => (
          <button key={v} onClick={() => setViewMode(v)} className={cn('p-1.5 rounded-lg transition-all', viewMode === v ? 'bg-background shadow-sm text-accent' : 'text-muted-foreground hover:text-foreground')}>
            <VIcon className="h-3 w-3" />
          </button>
        ))}
      </div>
      {compareItems.length > 0 && (
        <Button variant="outline" size="sm" className="h-7 text-[9px] rounded-xl gap-1 ml-1.5" onClick={() => setCompareOpen(true)}>
          Compare ({compareItems.length})
        </Button>
      )}
      <Button size="sm" className="h-7 text-[9px] rounded-xl gap-1 ml-1.5" onClick={() => setUploadOpen(true)}><Plus className="h-3 w-3" />Upload</Button>
    </>
  );

  /* ── Right Rail ── */
  const rightRail = (
    <div className="space-y-3">
      <SectionCard title="Collections" className="!rounded-2xl">
        <div className="space-y-1">
          {COLLECTIONS.map(c => (
            <button key={c.name} className="flex items-center gap-2 p-2 rounded-xl hover:bg-muted/30 transition-all w-full text-left group">
              <span className="text-sm">{c.icon}</span>
              <div className="flex-1 min-w-0">
                <div className="text-[9px] font-semibold truncate group-hover:text-accent transition-colors">{c.name}</div>
                <div className="text-[7px] text-muted-foreground">{c.count} files</div>
              </div>
            </button>
          ))}
        </div>
      </SectionCard>

      <SectionCard title="Storage" className="!rounded-2xl">
        <div className="space-y-2">
          <div className="flex items-center justify-between text-[9px]">
            <span className="text-muted-foreground">Used</span>
            <span className="font-semibold">2.4 GB / 10 GB</span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden"><div className="h-full w-[24%] bg-accent rounded-full" /></div>
          <div className="grid grid-cols-2 gap-1.5">
            {[
              { type: 'Images', size: '890 MB', color: 'bg-accent' },
              { type: 'Videos', size: '1.1 GB', color: 'bg-[hsl(var(--gigvora-purple))]' },
              { type: 'Docs', size: '230 MB', color: 'bg-[hsl(var(--gigvora-amber))]' },
              { type: 'Audio', size: '228 MB', color: 'bg-[hsl(var(--gigvora-green))]' },
            ].map(s => (
              <div key={s.type} className="flex items-center gap-1.5 text-[8px]">
                <div className={cn('h-2 w-2 rounded-full', s.color)} />
                <span className="text-muted-foreground">{s.type}</span>
                <span className="font-semibold ml-auto">{s.size}</span>
              </div>
            ))}
          </div>
        </div>
      </SectionCard>

      <SectionCard title="Quick Actions" className="!rounded-2xl">
        <div className="space-y-0.5">
          {[
            { l: 'Upload Files', icon: Upload },
            { l: 'Create Collection', icon: FolderOpen },
            { l: 'View Archive', icon: Archive },
            { l: 'Storage Settings', icon: Settings },
          ].map(a => (
            <button key={a.l} onClick={() => a.l === 'Upload Files' ? setUploadOpen(true) : toast.info(a.l)} className="flex items-center gap-2 p-2 rounded-xl hover:bg-muted/30 transition-all w-full text-left text-[9px] font-medium group">
              <a.icon className="h-3 w-3 text-muted-foreground group-hover:text-accent transition-colors" />
              <span className="group-hover:text-accent transition-colors">{a.l}</span>
            </button>
          ))}
        </div>
      </SectionCard>
    </div>
  );

  /* ── Bottom Section ── */
  const bottomSection = (
    <div className="p-4">
      <div className="text-[11px] font-bold mb-3 flex items-center gap-1.5"><Clock className="h-3.5 w-3.5 text-accent" />Recent Activity</div>
      <div className="flex gap-3 overflow-x-auto pb-1">
        {ACTIVITY.map((a, i) => (
          <div key={i} className="shrink-0 rounded-2xl border bg-card px-3.5 py-2.5 min-w-[220px] hover:shadow-sm transition-all">
            <div className="flex items-center gap-1.5 mb-0.5">
              <Avatar className="h-4 w-4 ring-1 ring-muted/40"><AvatarFallback className="text-[5px] bg-accent/10 text-accent font-bold">{a.actor[0]}</AvatarFallback></Avatar>
              <span className="text-[9px] font-semibold">{a.actor}</span>
            </div>
            <p className="text-[8px] text-muted-foreground line-clamp-2">{a.action}</p>
            <div className="text-[7px] text-muted-foreground mt-0.5">{a.time}</div>
          </div>
        ))}
      </div>
    </div>
  );

  /* ── Render a media card ── */
  const renderCard = (item: MediaItem) => {
    const Icon = TYPE_ICONS[item.type];
    const sm = STATUS_MAP[item.status];
    const isComparing = compareItems.some(c => c.id === item.id);

    if (viewMode === 'list') {
      return (
        <div key={item.id} onClick={() => setSelectedItem(item)} className={cn('rounded-2xl border p-3 bg-card cursor-pointer hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 flex items-center gap-3', selectedItem?.id === item.id && 'border-accent')}>
          <div className={cn('h-10 w-10 rounded-xl flex items-center justify-center shrink-0', TYPE_COLORS[item.type])}><Icon className="h-4 w-4" /></div>
          <div className="flex-1 min-w-0">
            <div className="text-[11px] font-bold truncate">{item.name}</div>
            <div className="flex items-center gap-2 text-[8px] text-muted-foreground mt-0.5">
              <span>{item.size}</span><span>·</span><span>{item.date}</span>
              {item.duration && <><span>·</span><span>{item.duration}</span></>}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {item.isPremium && <Lock className="h-3 w-3 text-[hsl(var(--gigvora-amber))]" />}
            <StatusBadge status={sm.state} label={sm.label} />
            <span className="text-[8px] text-muted-foreground flex items-center gap-0.5"><Eye className="h-2.5 w-2.5" />{item.views}</span>
            <Button variant="ghost" size="sm" className="h-6 w-6 rounded-lg p-0" onClick={e => { e.stopPropagation(); toggleCompare(item); }}>
              <CheckCircle2 className={cn('h-3 w-3', isComparing ? 'text-accent' : 'text-muted-foreground')} />
            </Button>
          </div>
        </div>
      );
    }

    return (
      <div key={item.id} onClick={() => setSelectedItem(item)} className={cn('rounded-2xl border bg-card cursor-pointer hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 overflow-hidden group', selectedItem?.id === item.id && 'border-accent')}>
        <div className={cn('h-28 flex items-center justify-center relative', TYPE_COLORS[item.type])}>
          <Icon className="h-8 w-8 opacity-40 group-hover:scale-110 transition-transform" />
          {item.isPremium && <div className="absolute top-2 right-2"><Lock className="h-3 w-3 text-[hsl(var(--gigvora-amber))]" /></div>}
          {item.status === 'processing' && <div className="absolute bottom-2 left-2 right-2 h-1 bg-white/20 rounded-full"><div className="h-full w-1/2 bg-white/60 rounded-full animate-pulse" /></div>}
          <button onClick={e => { e.stopPropagation(); setFullscreenItem(item); }} className="absolute inset-0 bg-black/0 group-hover:bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all">
            <Eye className="h-6 w-6 text-white" />
          </button>
          {item.duration && <span className="absolute bottom-2 right-2 text-[8px] bg-black/50 text-white px-1.5 py-0.5 rounded-md">{item.duration}</span>}
        </div>
        <div className="p-3">
          <div className="text-[10px] font-bold truncate mb-1">{item.name}</div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-[7px] text-muted-foreground">
              <span>{item.size}</span><span>·</span><span>{item.date}</span>
            </div>
            <StatusBadge status={sm.state} label={sm.label} />
          </div>
          <div className="flex items-center gap-2 mt-2 text-[7px] text-muted-foreground">
            <span className="flex items-center gap-0.5"><Eye className="h-2 w-2" />{item.views}</span>
            <span className="flex items-center gap-0.5"><Download className="h-2 w-2" />{item.downloads}</span>
            <span className="flex items-center gap-0.5"><Heart className="h-2 w-2" />{item.likes}</span>
            <button onClick={e => { e.stopPropagation(); toggleCompare(item); }} className="ml-auto">
              <CheckCircle2 className={cn('h-3 w-3', isComparing ? 'text-accent' : 'text-muted-foreground/30')} />
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <DashboardLayout topStrip={topStrip} rightRail={rightRail} rightRailWidth="w-52" bottomSection={bottomSection}>
      {/* KPI Band */}
      <KPIBand className="mb-4">
        <KPICard label="Total Files" value={String(MEDIA_ITEMS.length)} change="items" />
        <KPICard label="Total Views" value={String(MEDIA_ITEMS.reduce((s, m) => s + m.views, 0))} change="all time" trend="up" />
        <KPICard label="Downloads" value={String(MEDIA_ITEMS.reduce((s, m) => s + m.downloads, 0))} change="this month" trend="up" />
        <KPICard label="Storage" value="2.4 GB" change="of 10 GB" />
      </KPIBand>

      {/* Tab Nav */}
      <div className="flex items-center gap-0.5 p-1 rounded-2xl bg-muted/30 mb-4">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)} className={cn(
            'flex items-center gap-1.5 px-3.5 py-2 text-[10px] font-semibold rounded-xl transition-all duration-200',
            activeTab === t.id ? 'bg-background shadow-sm text-accent' : 'text-muted-foreground hover:text-foreground hover:bg-muted/30'
          )}><t.icon className="h-3 w-3" />{t.label}</button>
        ))}
      </div>

      {/* Content */}
      {activeTab === 'saved' ? (
        <div className="rounded-2xl border p-12 text-center">
          <Bookmark className="h-10 w-10 mx-auto mb-3 text-muted-foreground/30" />
          <div className="text-[12px] font-bold mb-1">No saved items</div>
          <div className="text-[10px] text-muted-foreground">Bookmark files from the gallery to save them here.</div>
        </div>
      ) : (
        <div className={cn(viewMode === 'grid' ? 'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3' : 'space-y-2')}>
          {filtered.map(renderCard)}
          {filtered.length === 0 && (
            <div className="col-span-full rounded-2xl border p-12 text-center">
              <Search className="h-8 w-8 mx-auto mb-3 text-muted-foreground/30" />
              <div className="text-[11px] font-bold mb-1">No files found</div>
              <div className="text-[9px] text-muted-foreground">Try adjusting your search or filters.</div>
            </div>
          )}
        </div>
      )}

      {/* Drawers & Overlays */}
      <MediaDetailDrawer item={selectedItem} open={!!selectedItem && !fullscreenItem} onClose={() => setSelectedItem(null)} onFullscreen={() => { if (selectedItem) setFullscreenItem(selectedItem); }} />
      <FullscreenViewer item={fullscreenItem} open={!!fullscreenItem} onClose={() => setFullscreenItem(null)} items={filtered} onNav={id => setFullscreenItem(filtered.find(m => m.id === id) || null)} />
      <UploadDrawer open={uploadOpen} onClose={() => setUploadOpen(false)} />
      <CompareDrawer open={compareOpen} onClose={() => setCompareOpen(false)} items={compareItems} />
    </DashboardLayout>
  );
};

export default MediaViewerPage;
