import React, { useState } from 'react';
import { SectionCard } from '@/components/shell/EnterprisePrimitives';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import {
  Film, Search, Play, Bookmark, Clock, Eye,
  Headphones, Video, MonitorPlay, ChevronRight,
  Trash2, ExternalLink, Heart,
} from 'lucide-react';

type MediaType = 'all' | 'videos' | 'webinars' | 'podcasts' | 'saved';

const MEDIA_ITEMS = [
  { id: 'm1', type: 'videos' as const, icon: Video, title: 'Advanced React Patterns — Deep Dive', creator: 'Alex Chen', duration: '45 min', views: '12K', saved: true, progress: 65, thumb: '🎬' },
  { id: 'm2', type: 'webinars' as const, icon: MonitorPlay, title: 'Building Enterprise UI Systems', creator: 'Sarah Mitchell', duration: '90 min', views: '8K', saved: true, progress: 100, thumb: '📺' },
  { id: 'm3', type: 'podcasts' as const, icon: Headphones, title: 'The Future of Remote Work', creator: 'WorkCast', duration: '32 min', views: '5K', saved: false, progress: 40, thumb: '🎙️' },
  { id: 'm4', type: 'videos' as const, icon: Video, title: 'Figma for Developers', creator: 'DesignDev', duration: '28 min', views: '22K', saved: true, progress: 0, thumb: '🎬' },
  { id: 'm5', type: 'webinars' as const, icon: MonitorPlay, title: 'Scaling SaaS from 0 to $10M ARR', creator: 'GrowthOps', duration: '60 min', views: '15K', saved: false, progress: 0, thumb: '📺' },
  { id: 'm6', type: 'podcasts' as const, icon: Headphones, title: 'Creative Leadership in Tech', creator: 'TechTalk', duration: '40 min', views: '3K', saved: true, progress: 80, thumb: '🎙️' },
];

const TABS: { value: MediaType; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'videos', label: 'Videos' },
  { value: 'webinars', label: 'Webinars' },
  { value: 'podcasts', label: 'Podcasts' },
  { value: 'saved', label: 'Saved' },
];

const DashboardMediaLibraryPage: React.FC = () => {
  const [tab, setTab] = useState<MediaType>('all');
  const [search, setSearch] = useState('');

  const filtered = MEDIA_ITEMS.filter(m => {
    if (tab === 'saved') return m.saved;
    if (tab !== 'all' && m.type !== tab) return false;
    if (search && !m.title.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const continueWatching = MEDIA_ITEMS.filter(m => m.progress > 0 && m.progress < 100);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-bold flex items-center gap-2"><Film className="h-5 w-5 text-accent" /> Media Library</h1>
        <p className="text-[11px] text-muted-foreground">Your saved and purchased media content</p>
      </div>

      <div className="flex items-center gap-2">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
          <Input placeholder="Search library..." value={search} onChange={e => setSearch(e.target.value)} className="pl-7 h-8 text-[10px] rounded-xl" />
        </div>
      </div>

      <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
        {TABS.map(t => (
          <button key={t.value} onClick={() => setTab(t.value)} className={cn(
            'px-3 py-1.5 rounded-xl text-[9px] font-medium shrink-0 transition-all',
            tab === t.value ? 'bg-accent text-accent-foreground shadow-sm' : 'bg-muted/50 text-muted-foreground hover:bg-muted'
          )}>{t.label}</button>
        ))}
      </div>

      {/* Continue watching strip */}
      {tab === 'all' && continueWatching.length > 0 && (
        <SectionCard title="Continue Watching" icon={<Play className="h-3.5 w-3.5 text-accent" />} className="!rounded-2xl">
          <div className="flex gap-2 overflow-x-auto pb-1">
            {continueWatching.map(m => (
              <div key={m.id} className="shrink-0 w-48 rounded-xl border bg-card overflow-hidden hover:shadow-sm transition-all cursor-pointer group">
                <div className="h-20 bg-muted/30 flex items-center justify-center text-2xl relative">
                  {m.thumb}
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-muted"><div className="h-full bg-accent" style={{ width: `${m.progress}%` }} /></div>
                </div>
                <div className="p-2">
                  <div className="text-[9px] font-semibold truncate group-hover:text-accent transition-colors">{m.title}</div>
                  <div className="text-[8px] text-muted-foreground">{m.creator} · {m.progress}% watched</div>
                </div>
              </div>
            ))}
          </div>
        </SectionCard>
      )}

      {/* Main grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
        {filtered.map(m => (
          <div key={m.id} className="rounded-2xl border bg-card overflow-hidden hover:shadow-sm transition-all cursor-pointer group">
            <div className="h-28 bg-muted/20 flex items-center justify-center text-3xl relative">
              {m.thumb}
              <div className="absolute top-2 right-2 flex gap-1">
                <Badge variant="secondary" className="text-[7px] h-4 rounded-md backdrop-blur-sm">{m.duration}</Badge>
              </div>
              {m.progress > 0 && <div className="absolute bottom-0 left-0 right-0 h-1 bg-muted"><div className="h-full bg-accent" style={{ width: `${m.progress}%` }} /></div>}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                <Play className="h-8 w-8 text-white opacity-0 group-hover:opacity-80 transition-opacity" />
              </div>
            </div>
            <div className="p-3">
              <div className="text-[11px] font-semibold group-hover:text-accent transition-colors truncate">{m.title}</div>
              <div className="text-[9px] text-muted-foreground mt-0.5 flex items-center gap-2">
                <span>{m.creator}</span>
                <span className="flex items-center gap-0.5"><Eye className="h-2.5 w-2.5" />{m.views}</span>
                {m.saved && <Bookmark className="h-2.5 w-2.5 text-accent" />}
              </div>
            </div>
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="rounded-2xl border-2 border-dashed p-12 text-center">
          <Film className="h-8 w-8 text-muted-foreground/20 mx-auto mb-2" />
          <div className="text-xs font-semibold text-muted-foreground">No media found</div>
        </div>
      )}
    </div>
  );
};

export default DashboardMediaLibraryPage;
