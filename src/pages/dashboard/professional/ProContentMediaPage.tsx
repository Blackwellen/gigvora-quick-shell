import React, { useState } from 'react';
import { KPIBand, KPICard, SectionCard, StatusBadge } from '@/components/shell/EnterprisePrimitives';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  Film, Eye, Heart, MessageSquare, ChevronRight, Plus,
  FileText, Mic, Video, MonitorPlay, TrendingUp, ExternalLink,
  BarChart3,
} from 'lucide-react';

type ContentTab = 'all' | 'posts' | 'videos' | 'podcasts' | 'webinars' | 'drafts';

interface ContentItem {
  id: string; title: string; type: 'post' | 'video' | 'podcast' | 'webinar'; status: 'published' | 'draft' | 'scheduled';
  views: string; likes: number; comments: number; date: string;
}

const CONTENT: ContentItem[] = [
  { id: 'c1', title: 'Advanced React Patterns for 2026', type: 'post', status: 'published', views: '2.4K', likes: 89, comments: 12, date: 'Apr 10' },
  { id: 'c2', title: 'Building Enterprise UI Systems', type: 'video', status: 'published', views: '1.8K', likes: 64, comments: 8, date: 'Apr 5' },
  { id: 'c3', title: 'The Future of Design Systems', type: 'podcast', status: 'published', views: '950', likes: 32, comments: 5, date: 'Mar 28' },
  { id: 'c4', title: 'Q2 Product Strategy Webinar', type: 'webinar', status: 'scheduled', views: '—', likes: 0, comments: 0, date: 'Apr 22' },
  { id: 'c5', title: 'Freelancing in the AI Era (Draft)', type: 'post', status: 'draft', views: '—', likes: 0, comments: 0, date: '—' },
  { id: 'c6', title: 'Portfolio Showcase Reel', type: 'video', status: 'draft', views: '—', likes: 0, comments: 0, date: '—' },
];

const TYPE_ICONS: Record<string, React.ElementType> = { post: FileText, video: Video, podcast: Mic, webinar: MonitorPlay };

export default function ProContentMediaPage() {
  const [tab, setTab] = useState<ContentTab>('all');

  const typeMap: Record<string, string> = { posts: 'post', videos: 'video', podcasts: 'podcast', webinars: 'webinar' };
  const filtered = CONTENT.filter(c => {
    if (tab === 'all') return true;
    if (tab === 'drafts') return c.status === 'draft';
    return c.type === typeMap[tab];
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold flex items-center gap-2"><Film className="h-5 w-5 text-accent" /> Content & Media</h1>
          <p className="text-[11px] text-muted-foreground">Manage and monitor your content performance across all formats</p>
        </div>
        <Button size="sm" className="h-8 text-[10px] rounded-xl gap-1"><Plus className="h-3.5 w-3.5" />Create</Button>
      </div>

      <KPIBand>
        <KPICard label="Published" value="3" />
        <KPICard label="Total Views" value="5.1K" change="+28%" trend="up" />
        <KPICard label="Engagement" value="210" change="Likes + comments" />
        <KPICard label="Drafts" value="2" change="Continue editing" />
      </KPIBand>

      {/* Top Content */}
      <div className="rounded-2xl border bg-gradient-to-r from-accent/5 to-[hsl(var(--gigvora-purple)/0.05)] p-4 flex items-center gap-3">
        <TrendingUp className="h-6 w-6 text-accent shrink-0" />
        <div className="flex-1">
          <div className="text-[10px] font-bold">Top Performing: Advanced React Patterns for 2026</div>
          <div className="text-[9px] text-muted-foreground">2.4K views · 89 likes · 12 comments</div>
        </div>
        <Button variant="outline" size="sm" className="h-7 text-[8px] rounded-xl gap-1"><BarChart3 className="h-3 w-3" />Analytics</Button>
      </div>

      <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
        {(['all', 'posts', 'videos', 'podcasts', 'webinars', 'drafts'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} className={cn(
            'px-3 py-1.5 rounded-xl text-[9px] font-medium shrink-0 transition-all capitalize',
            tab === t ? 'bg-accent text-accent-foreground shadow-sm' : 'bg-muted/50 text-muted-foreground hover:bg-muted'
          )}>{t}</button>
        ))}
      </div>

      <div className="space-y-2">
        {filtered.map(item => {
          const TIcon = TYPE_ICONS[item.type] || FileText;
          return (
            <div key={item.id} className="rounded-2xl border bg-card p-3.5 flex items-center gap-3 hover:shadow-sm transition-all cursor-pointer group">
              <div className="h-10 w-10 rounded-xl bg-muted/50 flex items-center justify-center shrink-0 group-hover:bg-accent/10 transition-colors">
                <TIcon className="h-4 w-4 text-muted-foreground group-hover:text-accent transition-colors" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-[11px] font-semibold truncate group-hover:text-accent transition-colors">{item.title}</span>
                  <StatusBadge status={item.status === 'published' ? 'healthy' : item.status === 'scheduled' ? 'live' : 'pending'} label={item.status} />
                  <Badge variant="outline" className="text-[7px] rounded-lg capitalize">{item.type}</Badge>
                </div>
                <div className="text-[9px] text-muted-foreground flex items-center gap-3">
                  {item.views !== '—' && <span className="flex items-center gap-0.5"><Eye className="h-2.5 w-2.5" />{item.views}</span>}
                  {item.likes > 0 && <span className="flex items-center gap-0.5"><Heart className="h-2.5 w-2.5" />{item.likes}</span>}
                  {item.comments > 0 && <span className="flex items-center gap-0.5"><MessageSquare className="h-2.5 w-2.5" />{item.comments}</span>}
                  {item.date !== '—' && <span>{item.date}</span>}
                </div>
              </div>
              <Button variant="outline" size="sm" className="h-7 text-[8px] rounded-xl gap-1 shrink-0">
                {item.status === 'draft' ? 'Edit' : 'View'}
              </Button>
              <ChevronRight className="h-3 w-3 text-muted-foreground/30 shrink-0" />
            </div>
          );
        })}
      </div>

      {/* Quick Actions */}
      <SectionCard title="Quick Actions" className="!rounded-2xl">
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" className="h-8 text-[9px] rounded-xl gap-1"><ExternalLink className="h-3 w-3" />Open Media Center</Button>
          <Button variant="outline" size="sm" className="h-8 text-[9px] rounded-xl gap-1"><Video className="h-3 w-3" />Upload Video</Button>
          <Button variant="outline" size="sm" className="h-8 text-[9px] rounded-xl gap-1"><Mic className="h-3 w-3" />New Podcast</Button>
          <Button variant="outline" size="sm" className="h-8 text-[9px] rounded-xl gap-1"><MonitorPlay className="h-3 w-3" />Create Webinar</Button>
        </div>
      </SectionCard>
    </div>
  );
}
