import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/shell/DashboardLayout';
import { SectionCard, KPICard } from '@/components/shell/EnterprisePrimitives';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import {
  Film, Upload, Search, Eye, Heart, MessageSquare,
  Clock, Calendar, MoreHorizontal, Pencil, Trash2, Archive,
  Play, BarChart3, Globe, Lock, EyeOff,
  CheckCircle2, Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';

type VideoStatus = 'published' | 'draft' | 'scheduled' | 'processing' | 'archived';

interface StudioVideo {
  id: string; title: string; status: VideoStatus; views: string; likes: string;
  comments: number; duration: string; uploadDate: string; category: string;
  visibility: 'public' | 'unlisted' | 'private'; thumbnail?: string; engagement: number;
}

const STUDIO_VIDEOS: StudioVideo[] = [
  { id: 'sv1', title: 'Building a $1M SaaS — Full Documentary', status: 'published', views: '45K', likes: '4.2K', comments: 234, duration: '42:15', uploadDate: 'Apr 10, 2026', category: 'Business', visibility: 'public', engagement: 89 },
  { id: 'sv2', title: 'Advanced React Patterns Workshop', status: 'published', views: '23K', likes: '2.8K', comments: 156, duration: '1:28:30', uploadDate: 'Apr 8, 2026', category: 'Development', visibility: 'public', engagement: 76 },
  { id: 'sv3', title: 'Q2 Product Roadmap Walkthrough', status: 'draft', views: '0', likes: '0', comments: 0, duration: '18:45', uploadDate: 'Apr 12, 2026', category: 'Product', visibility: 'private', engagement: 0 },
  { id: 'sv4', title: 'Design System Deep Dive', status: 'scheduled', views: '0', likes: '0', comments: 0, duration: '55:20', uploadDate: 'Apr 15, 2026', category: 'Design', visibility: 'public', engagement: 0 },
  { id: 'sv5', title: 'Freelancing Masterclass: Getting to $200K', status: 'published', views: '31K', likes: '3.5K', comments: 89, duration: '55:10', uploadDate: 'Apr 5, 2026', category: 'Career', visibility: 'public', engagement: 82 },
  { id: 'sv6', title: 'Team Onboarding Tutorial', status: 'processing', views: '0', likes: '0', comments: 0, duration: '12:00', uploadDate: 'Apr 13, 2026', category: 'Tutorial', visibility: 'unlisted', engagement: 0 },
  { id: 'sv7', title: 'AI Tools Review — 2026 Edition', status: 'archived', views: '8.2K', likes: '980', comments: 45, duration: '38:00', uploadDate: 'Mar 1, 2026', category: 'AI', visibility: 'public', engagement: 61 },
];

const STATUS_CONFIG: Record<VideoStatus, { label: string; color: string; icon: React.ElementType }> = {
  published: { label: 'Published', color: 'bg-emerald-500/10 text-emerald-600 border-emerald-200', icon: CheckCircle2 },
  draft: { label: 'Draft', color: 'bg-amber-500/10 text-amber-600 border-amber-200', icon: Pencil },
  scheduled: { label: 'Scheduled', color: 'bg-blue-500/10 text-blue-600 border-blue-200', icon: Calendar },
  processing: { label: 'Processing', color: 'bg-purple-500/10 text-purple-600 border-purple-200', icon: Loader2 },
  archived: { label: 'Archived', color: 'bg-gray-500/10 text-gray-500 border-gray-200', icon: Archive },
};

const VIS_ICON = { public: Globe, unlisted: EyeOff, private: Lock };

export default function VideoStudioPage() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<'all' | VideoStatus>('all');
  const [search, setSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const filtered = STUDIO_VIDEOS.filter(v => {
    if (tab !== 'all' && v.status !== tab) return false;
    if (search && !v.title.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const toggle = (id: string) => setSelectedIds(p => { const s = new Set(p); if (s.has(id)) { s.delete(id); } else { s.add(id); } return s; });

  return (
    <DashboardLayout topStrip={
      <>
        <Film className="h-4 w-4 text-accent" />
        <span className="text-xs font-semibold">Video Studio</span>
        <div className="flex-1" />
        <div className="relative max-w-xs flex-1">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
          <Input placeholder="Search your videos..." value={search} onChange={e => setSearch(e.target.value)} className="pl-7 h-7 text-[10px]" />
        </div>
        <Button size="sm" onClick={() => navigate('/media/videos/upload')} className="h-7 text-[10px] rounded-xl gap-1"><Upload className="h-3 w-3" /> Upload</Button>
      </>
    } rightRail={
      <div className="space-y-4">
        <SectionCard title="Quick Stats" icon={<BarChart3 className="h-4 w-4 text-accent" />}>
          <div className="space-y-2">
            {[{ l: 'Total Views', v: '107.2K' }, { l: 'Total Likes', v: '11.5K' }, { l: 'Avg. Engagement', v: '78%' }, { l: 'Subscribers from Videos', v: '1.2K' }].map(s => (
              <div key={s.l} className="flex items-center justify-between py-1 border-b last:border-0">
                <span className="text-[10px] text-muted-foreground">{s.l}</span>
                <span className="text-[10px] font-semibold">{s.v}</span>
              </div>
            ))}
          </div>
        </SectionCard>
        <SectionCard title="Recent Comments" icon={<MessageSquare className="h-4 w-4 text-accent" />}>
          {[
            { user: 'Elena V.', text: 'Amazing content! More please.', time: '2h ago' },
            { user: 'Raj K.', text: 'This changed how I think about SaaS.', time: '5h ago' },
            { user: 'Sophie L.', text: 'Would love a follow-up.', time: '1d ago' },
          ].map((c, i) => (
            <div key={i} className="py-2 border-b last:border-0">
              <div className="text-[10px] font-medium">{c.user} <span className="text-muted-foreground font-normal">· {c.time}</span></div>
              <div className="text-[10px] text-muted-foreground mt-0.5 line-clamp-1">{c.text}</div>
            </div>
          ))}
        </SectionCard>
      </div>
    }>
      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-4">
        <KPICard label="Total Videos" value="7" />
        <KPICard label="Published" value={String(STUDIO_VIDEOS.filter(v => v.status === 'published').length)} />
        <KPICard label="Drafts" value={String(STUDIO_VIDEOS.filter(v => v.status === 'draft').length)} />
        <KPICard label="Scheduled" value={String(STUDIO_VIDEOS.filter(v => v.status === 'scheduled').length)} />
        <KPICard label="Processing" value={String(STUDIO_VIDEOS.filter(v => v.status === 'processing').length)} />
      </div>

      {/* Tabs */}
      <Tabs value={tab} onValueChange={v => setTab(v as any)}>
        <div className="flex items-center justify-between mb-3">
          <TabsList className="h-7">
            <TabsTrigger value="all" className="text-[10px] h-5 px-2">All</TabsTrigger>
            <TabsTrigger value="published" className="text-[10px] h-5 px-2">Published</TabsTrigger>
            <TabsTrigger value="draft" className="text-[10px] h-5 px-2">Drafts</TabsTrigger>
            <TabsTrigger value="scheduled" className="text-[10px] h-5 px-2">Scheduled</TabsTrigger>
            <TabsTrigger value="archived" className="text-[10px] h-5 px-2">Archived</TabsTrigger>
          </TabsList>
          {selectedIds.size > 0 && (
            <div className="flex gap-1">
              <Button variant="outline" size="sm" className="h-6 text-[9px] rounded-xl gap-1"><Archive className="h-3 w-3" /> Archive</Button>
              <Button variant="outline" size="sm" className="h-6 text-[9px] rounded-xl gap-1 text-destructive"><Trash2 className="h-3 w-3" /> Delete</Button>
            </div>
          )}
        </div>
      </Tabs>

      {/* Video List */}
      <div className="space-y-2">
        {filtered.map(v => {
          const SC = STATUS_CONFIG[v.status];
          const VI = VIS_ICON[v.visibility];
          return (
            <div key={v.id} className={cn('rounded-2xl border bg-card p-3 shadow-card hover:shadow-md transition-all group', selectedIds.has(v.id) && 'ring-2 ring-accent')}>
              <div className="flex items-start gap-3">
                <input type="checkbox" checked={selectedIds.has(v.id)} onChange={() => toggle(v.id)} className="mt-1 rounded" />
                {/* Thumbnail placeholder */}
                <div className="w-32 h-20 rounded-xl bg-gradient-to-br from-accent/10 to-muted flex items-center justify-center shrink-0">
                  <Play className="h-6 w-6 text-muted-foreground/30" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <Link to={`/media/videos/studio/${v.id}`} className="text-xs font-semibold hover:text-accent transition-colors line-clamp-1">{v.title}</Link>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge className={cn('text-[8px] rounded-lg border', SC.color)}><SC.icon className={cn('h-2.5 w-2.5 mr-0.5', v.status === 'processing' && 'animate-spin')} />{SC.label}</Badge>
                        <Badge variant="outline" className="text-[8px] rounded-lg gap-0.5"><VI className="h-2.5 w-2.5" />{v.visibility}</Badge>
                        <span className="text-[9px] text-muted-foreground">{v.category}</span>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0 rounded-lg opacity-0 group-hover:opacity-100"><MoreHorizontal className="h-3.5 w-3.5" /></Button>
                  </div>
                  <div className="flex items-center gap-4 mt-2 text-[9px] text-muted-foreground">
                    <span className="flex items-center gap-1"><Eye className="h-3 w-3" />{v.views}</span>
                    <span className="flex items-center gap-1"><Heart className="h-3 w-3" />{v.likes}</span>
                    <span className="flex items-center gap-1"><MessageSquare className="h-3 w-3" />{v.comments}</span>
                    <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{v.duration}</span>
                    <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{v.uploadDate}</span>
                  </div>
                  {v.status === 'published' && (
                    <div className="mt-2"><Progress value={v.engagement} className="h-1 rounded-full" /><span className="text-[8px] text-muted-foreground">{v.engagement}% engagement</span></div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </DashboardLayout>
  );
}
