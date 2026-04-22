import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { DashboardLayout } from '@/components/shell/DashboardLayout';
import { SectionCard, KPICard } from '@/components/shell/EnterprisePrimitives';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import {
  Image, Film, Music, FileText, Upload, Search, Grid, List, Filter,
  Download, Trash2, Copy, Edit, Eye, Tag, Clock, HardDrive,
  CheckCircle2, AlertTriangle, ArrowRight, FolderPlus, Star,
  ChevronDown, MoreHorizontal, Link as LinkIcon, Shield, Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';

type AssetType = 'image' | 'video' | 'audio' | 'document' | 'graphic';
type AssetStatus = 'ready' | 'processing' | 'error' | 'rights-issue';

interface Asset {
  id: string; name: string; type: AssetType; status: AssetStatus;
  size: string; dimensions?: string; duration?: string;
  uploadedAt: string; usedIn: number; tags: string[];
  format: string;
}

const TYPE_ICONS: Record<AssetType, React.ElementType> = {
  image: Image, video: Film, audio: Music, document: FileText, graphic: Image,
};
const TYPE_COLORS: Record<AssetType, string> = {
  image: 'bg-accent/10 text-accent',
  video: 'bg-[hsl(var(--gigvora-purple))]/10 text-[hsl(var(--gigvora-purple))]',
  audio: 'bg-[hsl(var(--gigvora-green))]/10 text-[hsl(var(--gigvora-green))]',
  document: 'bg-muted text-muted-foreground',
  graphic: 'bg-[hsl(var(--gigvora-amber))]/10 text-[hsl(var(--gigvora-amber))]',
};
const STATUS_MAP: Record<AssetStatus, { cls: string; label: string; icon: React.ElementType }> = {
  ready: { cls: 'bg-[hsl(var(--state-healthy))]/10 text-[hsl(var(--state-healthy))]', label: 'Ready', icon: CheckCircle2 },
  processing: { cls: 'bg-[hsl(var(--gigvora-amber))]/10 text-[hsl(var(--gigvora-amber))]', label: 'Processing', icon: Loader2 },
  error: { cls: 'bg-destructive/10 text-destructive', label: 'Error', icon: AlertTriangle },
  'rights-issue': { cls: 'bg-destructive/10 text-destructive', label: 'Rights Issue', icon: Shield },
};

const ASSETS: Asset[] = [
  { id: 'a1', name: 'hero-banner-q2.jpg', type: 'image', status: 'ready', size: '2.4 MB', dimensions: '1920×1080', uploadedAt: '2 hours ago', usedIn: 3, tags: ['banner', 'campaign', 'q2'], format: 'JPEG' },
  { id: 'a2', name: 'product-demo-v3.mp4', type: 'video', status: 'ready', size: '148 MB', duration: '4:32', uploadedAt: '1 day ago', usedIn: 1, tags: ['demo', 'product'], format: 'MP4' },
  { id: 'a3', name: 'podcast-intro-jingle.mp3', type: 'audio', status: 'ready', size: '1.2 MB', duration: '0:15', uploadedAt: '3 days ago', usedIn: 12, tags: ['podcast', 'intro', 'music'], format: 'MP3' },
  { id: 'a4', name: 'brand-guidelines-2026.pdf', type: 'document', status: 'ready', size: '8.5 MB', uploadedAt: '1 week ago', usedIn: 0, tags: ['brand', 'guidelines'], format: 'PDF' },
  { id: 'a5', name: 'social-template-pack.png', type: 'graphic', status: 'ready', size: '3.1 MB', dimensions: '1080×1080', uploadedAt: '2 days ago', usedIn: 5, tags: ['template', 'social'], format: 'PNG' },
  { id: 'a6', name: 'webinar-backdrop.mp4', type: 'video', status: 'processing', size: '245 MB', duration: '0:30', uploadedAt: '30 min ago', usedIn: 0, tags: ['webinar', 'backdrop'], format: 'MP4' },
  { id: 'a7', name: 'team-photo-offsite.jpg', type: 'image', status: 'ready', size: '4.8 MB', dimensions: '4032×3024', uploadedAt: '5 days ago', usedIn: 2, tags: ['team', 'photo'], format: 'JPEG' },
  { id: 'a8', name: 'client-testimonial.mp3', type: 'audio', status: 'rights-issue', size: '3.2 MB', duration: '2:45', uploadedAt: '1 week ago', usedIn: 0, tags: ['testimonial', 'client'], format: 'MP3' },
  { id: 'a9', name: 'infographic-saas-metrics.svg', type: 'graphic', status: 'ready', size: '0.4 MB', dimensions: '800×2400', uploadedAt: '4 days ago', usedIn: 4, tags: ['infographic', 'saas'], format: 'SVG' },
  { id: 'a10', name: 'reel-clip-raw.mov', type: 'video', status: 'error', size: '890 MB', uploadedAt: '1 hour ago', usedIn: 0, tags: ['reel', 'raw'], format: 'MOV' },
];

const FOLDERS = [
  { name: 'Campaign Assets', count: 24, icon: '🎯' },
  { name: 'Podcast Media', count: 38, icon: '🎙️' },
  { name: 'Brand Kit', count: 12, icon: '🎨' },
  { name: 'Templates', count: 15, icon: '📐' },
  { name: 'Stock Photos', count: 67, icon: '📷' },
];

const FILTER_GROUPS = [
  { label: 'Type', options: ['Image', 'Video', 'Audio', 'Document', 'Graphic'] },
  { label: 'Status', options: ['Ready', 'Processing', 'Error', 'Rights Issue'] },
  { label: 'Format', options: ['JPEG', 'PNG', 'SVG', 'MP4', 'MOV', 'MP3', 'WAV', 'PDF'] },
  { label: 'Size', options: ['< 1 MB', '1-10 MB', '10-100 MB', '100 MB+'] },
  { label: 'Usage', options: ['Used', 'Unused', 'Most Used'] },
  { label: 'Upload Date', options: ['Today', 'This Week', 'This Month', 'Older'] },
  { label: 'Rights', options: ['Owned', 'Licensed', 'Creative Commons', 'Unverified'] },
  { label: 'Sort', options: ['Newest', 'Oldest', 'Largest', 'Most Used', 'Name A-Z'] },
];

export default function AssetLibraryPage() {
  const [search, setSearch] = useState('');
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [typeFilter, setTypeFilter] = useState('all');
  const [showFilters, setShowFilters] = useState(true);
  const [dragging, setDragging] = useState(false);

  const filtered = ASSETS.filter(a => {
    if (typeFilter !== 'all' && a.type !== typeFilter) return false;
    if (search && !a.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <DashboardLayout topStrip={
      <>
        <HardDrive className="h-4 w-4 text-accent" />
        <span className="text-xs font-semibold">Asset Library</span>
        <div className="flex-1" />
        <div className="relative max-w-xs flex-1">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
          <Input placeholder="Search assets..." value={search} onChange={e => setSearch(e.target.value)} className="pl-7 h-7 text-[10px]" />
        </div>
        <Button size="sm" className="h-7 text-[10px] rounded-xl gap-1"><Upload className="h-3 w-3" /> Upload</Button>
        <Link to="/creation-studio" className="text-[9px] text-accent font-medium flex items-center gap-0.5 hover:underline">
          Studio <ArrowRight className="h-2.5 w-2.5" />
        </Link>
      </>
    }>
      {/* Upload Drop Zone */}
      <div
        onDragOver={e => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={e => { e.preventDefault(); setDragging(false); }}
        className={cn(
          'rounded-2xl border-2 border-dashed p-6 text-center mb-4 transition-all',
          dragging ? 'border-accent bg-accent/5 scale-[1.01]' : 'border-border/40 bg-muted/10 hover:border-accent/30'
        )}
      >
        <Upload className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
        <p className="text-[11px] font-semibold">Drag & drop files here or <button className="text-accent hover:underline">browse</button></p>
        <p className="text-[9px] text-muted-foreground mt-1">Supports images, videos, audio, documents · Max 500 MB per file</p>
      </div>

      {/* KPIs + Filters */}
      <div className="flex items-center gap-3 flex-wrap rounded-2xl border bg-card px-5 py-3 shadow-card mb-4">
        <KPICard label="Total Assets" value={String(ASSETS.length)} />
        <KPICard label="Storage Used" value="1.3 GB" />
        <KPICard label="Ready" value={String(ASSETS.filter(a => a.status === 'ready').length)} />
        <KPICard label="Issues" value={String(ASSETS.filter(a => a.status === 'error' || a.status === 'rights-issue').length)} />
      </div>

      <div className="flex items-center gap-1.5 mb-3">
        {['all', 'image', 'video', 'audio', 'document', 'graphic'].map(t => (
          <button key={t} onClick={() => setTypeFilter(t)} className={cn('px-2.5 py-1 rounded-xl text-[9px] font-medium capitalize transition-all', typeFilter === t ? 'bg-accent text-accent-foreground' : 'bg-muted/50 text-muted-foreground hover:bg-muted')}>
            {t === 'all' ? 'All' : t}
          </button>
        ))}
        <Button variant="outline" size="sm" onClick={() => setShowFilters(!showFilters)} className={cn('h-6 text-[9px] gap-1 rounded-xl ml-auto', showFilters && 'bg-accent/10 border-accent/30')}>
          <Filter className="h-3 w-3" /> Filters <ChevronDown className="h-2.5 w-2.5" />
        </Button>
        <div className="flex gap-0.5">
          <button onClick={() => setView('grid')} className={cn('h-6 w-6 rounded-lg flex items-center justify-center', view === 'grid' ? 'bg-accent/10 text-accent' : 'text-muted-foreground')}><Grid className="h-3 w-3" /></button>
          <button onClick={() => setView('list')} className={cn('h-6 w-6 rounded-lg flex items-center justify-center', view === 'list' ? 'bg-accent/10 text-accent' : 'text-muted-foreground')}><List className="h-3 w-3" /></button>
        </div>
      </div>

      {showFilters && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4 p-3 rounded-xl border border-border/40 bg-card/50">
          {FILTER_GROUPS.map(fg => (
            <div key={fg.label}>
              <div className="text-[8px] font-semibold text-muted-foreground mb-1">{fg.label}</div>
              <div className="flex flex-wrap gap-1">
                {fg.options.map(o => (
                  <Badge key={o} variant="outline" className="text-[7px] h-3.5 px-1.5 cursor-pointer hover:bg-accent/10 hover:border-accent/30 transition-colors">{o}</Badge>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-4">
        <div className="xl:col-span-3">
          <div className={cn(view === 'grid' ? 'grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3' : 'space-y-2')}>
            {filtered.map(asset => {
              const Icon = TYPE_ICONS[asset.type];
              const st = STATUS_MAP[asset.status];
              const StIcon = st.icon;
              return view === 'grid' ? (
                <div key={asset.id} className="rounded-2xl border border-border/30 hover:border-accent/30 transition-all group overflow-hidden cursor-pointer">
                  <div className={cn('h-28 flex items-center justify-center', TYPE_COLORS[asset.type])}>
                    <Icon className="h-10 w-10 opacity-30" />
                  </div>
                  <div className="p-2.5">
                    <p className="text-[10px] font-semibold truncate group-hover:text-accent transition-colors">{asset.name}</p>
                    <div className="flex items-center gap-1.5 mt-1">
                      <Badge className={cn('text-[6px] h-3 border-0 gap-0.5', st.cls)}><StIcon className="h-1.5 w-1.5" />{st.label}</Badge>
                      <span className="text-[8px] text-muted-foreground">{asset.size}</span>
                    </div>
                    <div className="text-[8px] text-muted-foreground mt-0.5">{asset.format} · {asset.dimensions || asset.duration || ''}</div>
                  </div>
                </div>
              ) : (
                <div key={asset.id} className="flex items-center gap-3 p-3 rounded-xl border border-border/30 hover:border-accent/30 transition-all group">
                  <div className={cn('h-10 w-10 rounded-xl flex items-center justify-center shrink-0', TYPE_COLORS[asset.type])}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-semibold truncate">{asset.name}</span>
                      <Badge className={cn('text-[6px] h-3 border-0 gap-0.5', st.cls)}><StIcon className="h-1.5 w-1.5" />{st.label}</Badge>
                    </div>
                    <div className="text-[8px] text-muted-foreground mt-0.5">
                      {asset.format} · {asset.size} · {asset.dimensions || asset.duration || ''} · Used in {asset.usedIn} items · {asset.uploadedAt}
                    </div>
                    <div className="flex gap-1 mt-1 flex-wrap">
                      {asset.tags.map(t => <Badge key={t} variant="outline" className="text-[6px] h-3">{t}</Badge>)}
                    </div>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0 rounded-lg"><Eye className="h-3 w-3" /></Button>
                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0 rounded-lg"><Copy className="h-3 w-3" /></Button>
                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0 rounded-lg"><Download className="h-3 w-3" /></Button>
                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0 rounded-lg text-destructive"><Trash2 className="h-3 w-3" /></Button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Folders sidebar */}
        <div>
          <SectionCard title="Folders" action={<Button variant="ghost" size="sm" className="h-5 text-[8px] gap-0.5"><FolderPlus className="h-2.5 w-2.5" /> New</Button>}>
            <div className="space-y-2">
              {FOLDERS.map(f => (
                <div key={f.name} className="flex items-center gap-2.5 p-2.5 rounded-xl border border-border/30 hover:border-accent/30 transition-all cursor-pointer">
                  <span className="text-lg">{f.icon}</span>
                  <div className="flex-1">
                    <div className="text-[10px] font-semibold">{f.name}</div>
                    <div className="text-[8px] text-muted-foreground">{f.count} assets</div>
                  </div>
                </div>
              ))}
            </div>
          </SectionCard>

          <SectionCard title="Storage" className="mt-3">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-[10px]">
                <span className="font-semibold">1.3 GB</span>
                <span className="text-muted-foreground">of 10 GB</span>
              </div>
              <Progress value={13} className="h-1.5" />
              <div className="space-y-1">
                {[
                  { label: 'Videos', size: '680 MB', pct: 52 },
                  { label: 'Images', size: '340 MB', pct: 26 },
                  { label: 'Audio', size: '180 MB', pct: 14 },
                  { label: 'Documents', size: '100 MB', pct: 8 },
                ].map(s => (
                  <div key={s.label} className="flex items-center gap-2">
                    <span className="text-[8px] w-16">{s.label}</span>
                    <div className="flex-1 h-1 bg-muted rounded-full"><div className="h-full bg-accent/60 rounded-full" style={{ width: `${s.pct}%` }} /></div>
                    <span className="text-[8px] text-muted-foreground w-12 text-right">{s.size}</span>
                  </div>
                ))}
              </div>
            </div>
          </SectionCard>
        </div>
      </div>
    </DashboardLayout>
  );
}
