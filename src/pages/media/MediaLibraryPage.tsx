import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { DashboardLayout } from '@/components/shell/DashboardLayout';
import { SectionCard, KPICard } from '@/components/shell/EnterprisePrimitives';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  BookOpen, Search, Film, Headphones, Tv, Play, Eye, Clock,
  Heart, Bookmark, Trash2, FolderPlus, Grid, List, Filter,
  Download, Share2, Star,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const SAVED_ITEMS = [
  { id: '1', title: 'Building a $1M SaaS', type: 'video' as const, creator: 'TechFounders', duration: '42:15', savedAt: 'Today', progress: 45 },
  { id: '2', title: 'Future of Work — Ep. 142', type: 'podcast' as const, creator: 'Priya Patel', duration: '48 min', savedAt: 'Yesterday', progress: 80 },
  { id: '3', title: 'AI in Enterprise Panel', type: 'webinar' as const, creator: 'TechSummit', duration: '1:15:00', savedAt: '3 days ago', progress: 0 },
  { id: '4', title: 'CSS Art Challenge', type: 'reel' as const, creator: 'Yuki Tanaka', duration: '0:38', savedAt: '1 week ago', progress: 100 },
  { id: '5', title: 'UX Case Study: Airbnb', type: 'video' as const, creator: 'DesignPro', duration: '35:42', savedAt: '1 week ago', progress: 20 },
  { id: '6', title: 'Design Thinking Deep Dive', type: 'podcast' as const, creator: 'Elena V.', duration: '35 min', savedAt: '2 weeks ago', progress: 100 },
];

const TYPE_ICONS = { video: Film, podcast: Headphones, webinar: Tv, reel: Play };
const TYPE_COLORS = {
  video: 'bg-accent/10 text-accent',
  podcast: 'bg-[hsl(var(--gigvora-green))]/10 text-[hsl(var(--gigvora-green))]',
  webinar: 'bg-[hsl(var(--gigvora-amber))]/10 text-[hsl(var(--gigvora-amber))]',
  reel: 'bg-[hsl(var(--gigvora-purple))]/10 text-[hsl(var(--gigvora-purple))]',
};

const PLAYLISTS = [
  { name: 'Watch Later', count: 12, icon: '⏱️' },
  { name: 'Learning Path: React', count: 8, icon: '⚛️' },
  { name: 'Inspiration', count: 15, icon: '💡' },
  { name: 'Interview Prep', count: 6, icon: '🎯' },
];

export default function MediaLibraryPage() {
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState('all');

  const filtered = SAVED_ITEMS.filter(i => {
    if (tab !== 'all' && i.type !== tab) return false;
    if (search && !i.title.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <DashboardLayout topStrip={
      <>
        <BookOpen className="h-4 w-4 text-accent" />
        <span className="text-xs font-semibold">My Library</span>
        <div className="flex-1" />
        <div className="relative max-w-xs flex-1">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
          <Input placeholder="Search library..." value={search} onChange={e => setSearch(e.target.value)} className="pl-7 h-7 text-[10px]" />
        </div>
      </>
    }>
      {/* KPIs */}
      <div className="flex items-center gap-3 flex-wrap rounded-2xl border bg-card px-5 py-3 shadow-card mb-4">
        <KPICard label="Saved Items" value={String(SAVED_ITEMS.length)} />
        <KPICard label="In Progress" value={String(SAVED_ITEMS.filter(i => i.progress > 0 && i.progress < 100).length)} />
        <KPICard label="Completed" value={String(SAVED_ITEMS.filter(i => i.progress === 100).length)} />
        <KPICard label="Playlists" value={String(PLAYLISTS.length)} />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-4">
        <div className="xl:col-span-3">
          <Tabs value={tab} onValueChange={setTab}>
            <TabsList className="h-7 mb-3">
              <TabsTrigger value="all" className="text-[10px] h-5 px-2">All</TabsTrigger>
              <TabsTrigger value="video" className="text-[10px] h-5 px-2">Videos</TabsTrigger>
              <TabsTrigger value="podcast" className="text-[10px] h-5 px-2">Podcasts</TabsTrigger>
              <TabsTrigger value="webinar" className="text-[10px] h-5 px-2">Webinars</TabsTrigger>
              <TabsTrigger value="reel" className="text-[10px] h-5 px-2">Reels</TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="space-y-2">
            {filtered.map(item => {
              const Icon = TYPE_ICONS[item.type];
              return (
                <div key={item.id} className="flex items-center gap-3 p-3 rounded-xl border border-border/30 hover:border-accent/30 transition-all group">
                  <div className={cn('h-12 w-12 rounded-xl flex items-center justify-center shrink-0', TYPE_COLORS[item.type])}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-bold group-hover:text-accent transition-colors">{item.title}</span>
                      <Badge variant="secondary" className="text-[7px] h-3.5 capitalize">{item.type}</Badge>
                      {item.progress === 100 && <Badge className="text-[7px] h-3.5 bg-[hsl(var(--state-healthy))]/10 text-[hsl(var(--state-healthy))] border-0">Completed</Badge>}
                    </div>
                    <div className="text-[9px] text-muted-foreground mt-0.5">{item.creator} · {item.duration} · Saved {item.savedAt}</div>
                    {item.progress > 0 && item.progress < 100 && (
                      <div className="flex items-center gap-2 mt-1">
                        <div className="h-1 flex-1 max-w-[120px] bg-muted rounded-full"><div className="h-full bg-accent rounded-full" style={{ width: `${item.progress}%` }} /></div>
                        <span className="text-[8px] text-muted-foreground">{item.progress}%</span>
                      </div>
                    )}
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0 rounded-lg"><Play className="h-3 w-3" /></Button>
                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0 rounded-lg"><Share2 className="h-3 w-3" /></Button>
                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0 rounded-lg text-destructive"><Trash2 className="h-3 w-3" /></Button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Playlists sidebar */}
        <div>
          <SectionCard title="My Playlists" action={<Button variant="ghost" size="sm" className="h-5 text-[8px] gap-0.5"><FolderPlus className="h-2.5 w-2.5" /> New</Button>}>
            <div className="space-y-2">
              {PLAYLISTS.map(p => (
                <div key={p.name} className="flex items-center gap-2.5 p-2.5 rounded-xl border border-border/30 hover:border-accent/30 transition-all cursor-pointer">
                  <span className="text-lg">{p.icon}</span>
                  <div className="flex-1">
                    <div className="text-[10px] font-semibold">{p.name}</div>
                    <div className="text-[8px] text-muted-foreground">{p.count} items</div>
                  </div>
                </div>
              ))}
            </div>
          </SectionCard>

          <SectionCard title="Recently Watched" className="mt-3">
            <div className="space-y-1.5">
              {SAVED_ITEMS.filter(i => i.progress > 0).slice(0, 4).map(i => (
                <div key={i.id} className="text-[9px] p-1.5 rounded-lg hover:bg-muted/30 cursor-pointer">
                  <span className="font-medium">{i.title}</span>
                  <div className="text-muted-foreground">{i.creator} · {i.progress}% watched</div>
                </div>
              ))}
            </div>
          </SectionCard>
        </div>
      </div>
    </DashboardLayout>
  );
}
