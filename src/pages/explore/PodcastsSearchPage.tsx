import React from 'react';
import { DashboardLayout } from '@/components/shell/DashboardLayout';
import { SectionCard, KPICard, KPIBand } from '@/components/shell/EnterprisePrimitives';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Podcast, Search, Star, Headphones, Clock, Eye, SlidersHorizontal, Heart, Play } from 'lucide-react';

const PODCASTS = [
  { title: 'The Design Hustle', host: 'Sarah Chen', episodes: 142, rating: 4.9, subscribers: '12.4K', category: 'Design', latest: 'How to Price Your Design Work' },
  { title: 'Code & Career', host: 'James Wilson', episodes: 86, rating: 4.8, subscribers: '8.2K', category: 'Engineering', latest: 'From IC to Engineering Manager' },
  { title: 'Freelance Freedom', host: 'Lena Müller', episodes: 64, rating: 4.7, subscribers: '5.6K', category: 'Business', latest: 'Building Recurring Revenue' },
  { title: 'AI Frontiers', host: 'Marcus Johnson', episodes: 48, rating: 4.9, subscribers: '18K', category: 'Technology', latest: 'The Future of Code Generation' },
];

export default function PodcastsSearchPage() {
  return (
    <DashboardLayout topStrip={<><Podcast className="h-4 w-4 text-accent" /><span className="text-xs font-semibold">Podcasts Search</span><div className="flex-1" /><Button variant="outline" size="sm" className="h-7 text-[10px] rounded-xl gap-1"><SlidersHorizontal className="h-3 w-3" />Filters</Button></>}>
      <div className="flex gap-2 mb-3"><div className="relative flex-1"><Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" /><Input placeholder="Search podcasts..." className="pl-8 h-8 text-xs rounded-xl" /></div></div>
      <KPIBand className="mb-3">
        <KPICard label="Shows" value="480" className="!rounded-2xl" />
        <KPICard label="Episodes" value="12.4K" className="!rounded-2xl" />
        <KPICard label="Trending" value="24" className="!rounded-2xl" />
        <KPICard label="New This Week" value="86" className="!rounded-2xl" />
      </KPIBand>
      <div className="space-y-2.5">
        {PODCASTS.map((p, i) => (
          <SectionCard key={i} className="!rounded-2xl">
            <div className="flex items-center gap-3">
              <div className="h-14 w-14 rounded-2xl bg-muted/30 flex items-center justify-center shrink-0"><Podcast className="h-6 w-6 text-muted-foreground/40" /></div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5"><span className="text-[11px] font-bold">{p.title}</span><Badge variant="outline" className="text-[7px] rounded-md">{p.category}</Badge></div>
                <div className="flex items-center gap-2 text-[8px] text-muted-foreground mb-1">
                  <span>by {p.host}</span><span className="flex items-center gap-0.5"><Star className="h-2.5 w-2.5 text-[hsl(var(--gigvora-amber))]" />{p.rating}</span><span>{p.episodes} episodes</span><span className="flex items-center gap-0.5"><Headphones className="h-2.5 w-2.5" />{p.subscribers}</span>
                </div>
                <div className="text-[8px] text-muted-foreground flex items-center gap-1"><Play className="h-2.5 w-2.5 text-accent" />Latest: {p.latest}</div>
              </div>
              <div className="flex gap-1 shrink-0"><Button variant="outline" size="sm" className="h-7 text-[9px] rounded-xl"><Heart className="h-3 w-3" /></Button><Button size="sm" className="h-7 text-[9px] rounded-xl gap-0.5"><Headphones className="h-3 w-3" />Listen</Button></div>
            </div>
          </SectionCard>
        ))}
      </div>
    </DashboardLayout>
  );
}
