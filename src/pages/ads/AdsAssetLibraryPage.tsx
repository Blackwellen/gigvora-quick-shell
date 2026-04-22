import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DashboardLayout } from '@/components/shell/DashboardLayout';
import { SectionCard, KPICard, KPIBand } from '@/components/shell/EnterprisePrimitives';
import { cn } from '@/lib/utils';
import {
  FileText, Search, Upload, Image, Video, Music, Layers, FolderOpen,
  Download, Trash2, Eye, Plus, Filter, Clock, MoreHorizontal, Star,
} from 'lucide-react';

type AssetType = 'image' | 'video' | 'audio' | 'carousel' | 'template';
interface Asset {
  id: string; name: string; type: AssetType; size: string; dimensions: string;
  uploaded: string; usedIn: number; starred: boolean;
}

const ASSETS: Asset[] = [
  { id: 'A-001', name: 'brand-hero-v3.png', type: 'image', size: '2.4 MB', dimensions: '1200x628', uploaded: '2h ago', usedIn: 5, starred: true },
  { id: 'A-002', name: 'product-demo-15s.mp4', type: 'video', size: '18 MB', dimensions: '1080x1080', uploaded: '1d ago', usedIn: 3, starred: true },
  { id: 'A-003', name: 'testimonial-bg.mp3', type: 'audio', size: '1.2 MB', dimensions: '—', uploaded: '3d ago', usedIn: 1, starred: false },
  { id: 'A-004', name: 'feature-carousel-set.zip', type: 'carousel', size: '8.5 MB', dimensions: '1080x1080 x4', uploaded: '5d ago', usedIn: 2, starred: false },
  { id: 'A-005', name: 'logo-white.svg', type: 'image', size: '45 KB', dimensions: '400x100', uploaded: '1w ago', usedIn: 12, starred: true },
  { id: 'A-006', name: 'cta-template-v2.png', type: 'template', size: '1.1 MB', dimensions: '1200x628', uploaded: '2w ago', usedIn: 8, starred: false },
  { id: 'A-007', name: 'explainer-30s.mp4', type: 'video', size: '42 MB', dimensions: '1920x1080', uploaded: '4d ago', usedIn: 1, starred: false },
  { id: 'A-008', name: 'banner-dark.png', type: 'image', size: '1.8 MB', dimensions: '1200x628', uploaded: '6d ago', usedIn: 4, starred: false },
];

const TYPE_ICONS: Record<AssetType, typeof Image> = { image: Image, video: Video, audio: Music, carousel: Layers, template: FileText };
const TYPE_COLORS: Record<AssetType, string> = {
  image: 'bg-accent/10 text-accent', video: 'bg-primary/10 text-primary', audio: 'bg-[hsl(var(--gigvora-purple))]/10 text-[hsl(var(--gigvora-purple))]',
  carousel: 'bg-[hsl(var(--gigvora-blue))]/10 text-[hsl(var(--gigvora-blue))]', template: 'bg-[hsl(var(--gigvora-amber))]/10 text-[hsl(var(--gigvora-amber))]',
};

const AdsAssetLibraryPage: React.FC = () => {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');

  const filtered = ASSETS.filter(a => {
    const ms = !search || a.name.toLowerCase().includes(search.toLowerCase());
    const mt = typeFilter === 'all' || a.type === typeFilter;
    return ms && mt;
  });

  const topStrip = (
    <>
      <FileText className="h-4 w-4 text-accent" />
      <span className="text-xs font-semibold">Ads — Asset Library</span>
      <div className="flex-1" />
      <div className="relative">
        <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search assets..." className="h-7 rounded-xl border bg-background pl-7 pr-3 text-[10px] w-44 focus:outline-none focus:ring-2 focus:ring-accent/30" />
      </div>
      <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} className="h-7 rounded-xl border bg-background px-2 text-[9px]">
        <option value="all">All Types</option>
        <option value="image">Images</option>
        <option value="video">Videos</option>
        <option value="audio">Audio</option>
        <option value="carousel">Carousels</option>
        <option value="template">Templates</option>
      </select>
      <Button size="sm" className="h-7 text-[9px] rounded-xl gap-1"><Upload className="h-3 w-3" />Upload</Button>
    </>
  );

  const rightRail = (
    <div className="space-y-3">
      <SectionCard title="Storage" className="!rounded-2xl">
        <div className="space-y-1.5 text-[9px]">
          <div className="flex justify-between"><span className="text-muted-foreground">Total Assets</span><span className="font-semibold">{ASSETS.length}</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Storage Used</span><span className="font-semibold">75 MB</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Storage Limit</span><span className="font-semibold">5 GB</span></div>
          <div className="h-1 rounded-full bg-muted overflow-hidden"><div className="h-full bg-accent rounded-full" style={{ width: '1.5%' }} /></div>
        </div>
      </SectionCard>
      <SectionCard title="By Type" className="!rounded-2xl">
        <div className="space-y-1 text-[9px]">
          {(['image', 'video', 'audio', 'carousel', 'template'] as AssetType[]).map(t => (
            <div key={t} className="flex justify-between">
              <Badge className={cn('text-[7px] border-0 capitalize', TYPE_COLORS[t])}>{t}</Badge>
              <span className="font-semibold">{ASSETS.filter(a => a.type === t).length}</span>
            </div>
          ))}
        </div>
      </SectionCard>
    </div>
  );

  return (
    <DashboardLayout topStrip={topStrip} rightRail={rightRail} rightRailWidth="w-48">
      <KPIBand className="mb-3">
        <KPICard label="Total Assets" value={String(ASSETS.length)} className="!rounded-2xl" />
        <KPICard label="In Use" value={String(ASSETS.filter(a => a.usedIn > 0).length)} className="!rounded-2xl" />
        <KPICard label="Starred" value={String(ASSETS.filter(a => a.starred).length)} className="!rounded-2xl" />
        <KPICard label="Storage" value="75 MB" change="of 5 GB" className="!rounded-2xl" />
      </KPIBand>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
        {filtered.map(a => {
          const Icon = TYPE_ICONS[a.type];
          return (
            <div key={a.id} className="rounded-2xl border bg-card overflow-hidden hover:shadow-md cursor-pointer transition-all group">
              <div className={cn('h-24 flex items-center justify-center', TYPE_COLORS[a.type].replace('text-', 'bg-').split(' ')[0])}>
                <Icon className="h-8 w-8 text-muted-foreground/30" />
              </div>
              <div className="p-2.5">
                <div className="flex items-center gap-1 mb-0.5">
                  {a.starred && <Star className="h-2.5 w-2.5 text-[hsl(var(--gigvora-amber))] fill-current" />}
                  <Badge className={cn('text-[6px] border-0 capitalize', TYPE_COLORS[a.type])}>{a.type}</Badge>
                </div>
                <div className="text-[10px] font-semibold truncate group-hover:text-accent transition-colors">{a.name}</div>
                <div className="text-[8px] text-muted-foreground mt-0.5">{a.size} · {a.dimensions}</div>
                <div className="text-[8px] text-muted-foreground">Used in {a.usedIn} creatives · {a.uploaded}</div>
              </div>
            </div>
          );
        })}
      </div>
    </DashboardLayout>
  );
};

export default AdsAssetLibraryPage;
