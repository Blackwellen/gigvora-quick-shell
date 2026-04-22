import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/shell/DashboardLayout';
import { SectionCard } from '@/components/shell/EnterprisePrimitives';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import {
  Play, Film, Headphones, Radio, Search,
  Eye, Plus, Star,
  Zap, Users, Crown,
  ChevronRight, BookOpen, Tv, Upload, BarChart3,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const TRENDING_REELS = [
  { id: 'r1', title: 'Design System in 60s', creator: 'Sarah K.', avatar: 'SK', views: '12K', likes: '2.4K', duration: '0:58', category: 'Design' },
  { id: 'r2', title: 'AI Prompt Engineering Tips', creator: 'Alex M.', avatar: 'AM', views: '8.5K', likes: '1.8K', duration: '0:45', category: 'AI' },
  { id: 'r3', title: 'Remote Work Setup Tour', creator: 'Lisa P.', avatar: 'LP', views: '6.2K', likes: '1.1K', duration: '1:12', category: 'Lifestyle' },
  { id: 'r4', title: 'Startup Pitch Breakdown', creator: 'Mike D.', avatar: 'MD', views: '15K', likes: '3.2K', duration: '0:52', category: 'Business' },
  { id: 'r5', title: 'CSS Art Challenge', creator: 'Yuki T.', avatar: 'YT', views: '4.8K', likes: '890', duration: '0:38', category: 'Dev' },
  { id: 'r6', title: 'Salary Negotiation Tips', creator: 'Nina P.', avatar: 'NP', views: '9.7K', likes: '1.5K', duration: '0:55', category: 'Career' },
];

const FEATURED_VIDEOS = [
  { id: 'v1', title: 'Building a $1M SaaS — Full Documentary', creator: 'TechFounders', avatar: 'TF', views: '45K', duration: '42:15', category: 'Business', premium: false },
  { id: 'v2', title: 'Advanced React Patterns Workshop', creator: 'DevMaster', avatar: 'DM', views: '23K', duration: '1:28:30', category: 'Development', premium: true },
  { id: 'v3', title: 'UX Case Study: Airbnb Redesign', creator: 'DesignPro', avatar: 'DP', views: '18K', duration: '35:42', category: 'Design', premium: false },
  { id: 'v4', title: 'Freelancing Masterclass', creator: 'GigGuru', avatar: 'GG', views: '31K', duration: '55:10', category: 'Career', premium: true },
  { id: 'v5', title: 'System Design Interview Prep', creator: 'TechInterviews', avatar: 'TI', views: '67K', duration: '1:15:00', category: 'Development', premium: false },
  { id: 'v6', title: 'How I Got 50K Followers', creator: 'GrowthHack', avatar: 'GH', views: '92K', duration: '28:30', category: 'Marketing', premium: false },
];

const TRENDING_PODCASTS = [
  { id: 'p1', title: 'The Future of Work — Ep. 142', host: 'Priya Patel', avatar: 'PP', listeners: '8.4K', duration: '48 min', live: false },
  { id: 'p2', title: 'Startup Diaries LIVE', host: 'James Rivera', avatar: 'JR', listeners: '2.1K', duration: 'Live Now', live: true },
  { id: 'p3', title: 'Design Thinking Deep Dive', host: 'Elena V.', avatar: 'EV', listeners: '5.6K', duration: '35 min', live: false },
];

const UPCOMING_WEBINARS = [
  { id: 'w1', title: 'AI in Enterprise — Panel Discussion', host: 'TechSummit', date: 'Today 3 PM', attendees: 342, free: true },
  { id: 'w2', title: 'Product Management Masterclass', host: 'PMSchool', date: 'Tomorrow 11 AM', attendees: 156, free: false },
  { id: 'w3', title: 'Scaling Remote Teams', host: 'RemoteFirst', date: 'Friday 2 PM', attendees: 89, free: true },
];

const CREATORS = [
  { name: 'Sarah Kim', avatar: 'SK', followers: '24K', type: 'Video Creator', verified: true },
  { name: 'Mike Liu', avatar: 'ML', followers: '18K', type: 'Podcast Host', verified: true },
  { name: 'Ana Rodriguez', avatar: 'AR', followers: '12K', type: 'Educator', verified: false },
  { name: 'David Chen', avatar: 'DC', followers: '9.2K', type: 'Designer', verified: true },
  { name: 'Nina Patel', avatar: 'NP', followers: '20K', type: 'Growth', verified: true },
];

export default function MediaHomePage() {
  const [search, setSearch] = useState('');
  const navigate = useNavigate();

  const rightRail = (
    <div className="space-y-3">
      <SectionCard title="Quick Actions" className="!rounded-2xl">
        <div className="space-y-1.5">
          {[
            { label: 'Upload Video', icon: Upload, href: '/media/videos/upload', color: 'text-accent' },
            { label: 'Create Reel', icon: Zap, href: '/media/reels/studio', color: 'text-[hsl(var(--gigvora-purple))]' },
            { label: 'Video Studio', icon: Film, href: '/media/videos/studio', color: 'text-muted-foreground' },
            { label: 'My Library', icon: BookOpen, href: '/media/library', color: 'text-muted-foreground' },
            { label: 'Analytics', icon: BarChart3, href: '/media/analytics', color: 'text-muted-foreground' },
          ].map(a => (
            <Link key={a.label} to={a.href} className="flex items-center gap-2.5 py-2 px-2 rounded-xl hover:bg-muted/50 transition-colors text-[10px] font-medium">
              <a.icon className={cn('h-3.5 w-3.5', a.color)} />
              {a.label}
            </Link>
          ))}
        </div>
      </SectionCard>
      <SectionCard title="Creators to Follow" icon={<Star className="h-3.5 w-3.5 text-[hsl(var(--gigvora-amber))]" />} className="!rounded-2xl">
        <div className="space-y-2">
          {CREATORS.slice(0, 4).map(c => (
            <div key={c.name} className="flex items-center gap-2 py-1">
              <Avatar className="h-7 w-7"><AvatarFallback className="text-[7px] bg-accent/10 text-accent">{c.avatar}</AvatarFallback></Avatar>
              <div className="flex-1 min-w-0">
                <div className="text-[9px] font-semibold truncate flex items-center gap-1">{c.name}{c.verified && <Crown className="h-2 w-2 text-accent" />}</div>
                <div className="text-[7px] text-muted-foreground">{c.type}</div>
              </div>
              <Button variant="outline" size="sm" className="h-5 text-[7px] rounded-lg px-2">Follow</Button>
            </div>
          ))}
        </div>
      </SectionCard>
    </div>
  );

  return (
    <DashboardLayout
      topStrip={
        <>
          <Film className="h-4 w-4 text-accent" />
          <span className="text-xs font-semibold">Media Hub</span>
          <div className="flex-1" />
          <div className="relative max-w-xs flex-1">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
            <Input placeholder="Search media..." value={search} onChange={e => setSearch(e.target.value)} className="pl-7 h-7 text-[10px] rounded-xl" />
          </div>
          <Button size="sm" className="h-7 text-[10px] rounded-xl gap-1" onClick={() => navigate('/media/reels')}>
            <Zap className="h-3 w-3" /> Reels
          </Button>
          <Button size="sm" variant="outline" className="h-7 text-[10px] rounded-xl gap-1" onClick={() => navigate('/media/videos')}>
            <Film className="h-3 w-3" /> Videos
          </Button>
        </>
      }
      rightRail={rightRail}
      rightRailWidth="w-52"
    >
      {/* Quick Nav Strip */}
      <div className="flex items-center gap-2 mb-4 overflow-x-auto pb-1 scrollbar-none">
        {[
          { label: 'Reels', icon: Zap, href: '/media/reels', color: 'bg-[hsl(var(--gigvora-purple))]/10 text-[hsl(var(--gigvora-purple))]' },
          { label: 'Videos', icon: Film, href: '/media/videos', color: 'bg-accent/10 text-accent' },
          { label: 'Creators', icon: Users, href: '/media/creators', color: 'bg-accent/10 text-accent' },
          { label: 'Podcasts', icon: Headphones, href: '/podcasts', color: 'bg-[hsl(var(--gigvora-green))]/10 text-[hsl(var(--gigvora-green))]' },
          { label: 'Webinars', icon: Tv, href: '/webinars', color: 'bg-[hsl(var(--gigvora-amber))]/10 text-[hsl(var(--gigvora-amber))]' },
          { label: 'Library', icon: BookOpen, href: '/media/library', color: 'bg-muted text-muted-foreground' },
          { label: 'Upload', icon: Plus, href: '/media/videos/upload', color: 'bg-accent text-accent-foreground' },
        ].map(q => (
          <Link key={q.label} to={q.href} className={cn('flex items-center gap-1.5 px-3 py-2 rounded-xl text-[10px] font-semibold shrink-0 transition-all hover:shadow-sm hover:scale-[1.02]', q.color)}>
            <q.icon className="h-3.5 w-3.5" /> {q.label}
          </Link>
        ))}
      </div>

      {/* Trending Reels - Horizontal */}
      <SectionCard title="Trending Reels" icon={<Zap className="h-3.5 w-3.5 text-[hsl(var(--gigvora-purple))]" />} action={<Link to="/media/reels" className="text-[9px] text-accent font-medium flex items-center gap-0.5 hover:underline">View All <ChevronRight className="h-2.5 w-2.5" /></Link>} className="!rounded-2xl">
        <div className="flex gap-2.5 overflow-x-auto pb-2 scrollbar-none">
          {TRENDING_REELS.map(r => (
            <div key={r.id} onClick={() => navigate('/media/reels')} className="shrink-0 w-[130px] cursor-pointer group">
              <div className="relative h-[185px] rounded-2xl bg-gradient-to-br from-[hsl(var(--gigvora-purple))]/20 via-black/50 to-accent/10 flex items-center justify-center mb-1.5 overflow-hidden group-hover:shadow-lg transition-all">
                <Play className="h-7 w-7 text-white/40 group-hover:text-white/70 group-hover:scale-110 transition-all" />
                <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between">
                  <span className="text-[7px] text-white bg-black/60 px-1.5 py-0.5 rounded-lg">{r.duration}</span>
                  <span className="text-[7px] text-white/70 flex items-center gap-0.5"><Eye className="h-2 w-2" />{r.views}</span>
                </div>
                <Badge className="absolute top-2 right-2 text-[6px] h-3 bg-black/50 text-white border-0">{r.category}</Badge>
              </div>
              <p className="text-[9px] font-semibold truncate group-hover:text-accent transition-colors">{r.title}</p>
              <div className="flex items-center gap-1 text-[7px] text-muted-foreground mt-0.5">
                <Avatar className="h-3.5 w-3.5"><AvatarFallback className="text-[4px] bg-accent/10 text-accent">{r.avatar}</AvatarFallback></Avatar>
                <span className="truncate">{r.creator}</span>
              </div>
            </div>
          ))}
        </div>
      </SectionCard>

      {/* Featured Videos */}
      <SectionCard title="Featured Videos" icon={<Film className="h-3.5 w-3.5 text-accent" />} action={<Link to="/media/videos" className="text-[9px] text-accent font-medium flex items-center gap-0.5 hover:underline">Browse All <ChevronRight className="h-2.5 w-2.5" /></Link>} className="!rounded-2xl mt-3">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
          {FEATURED_VIDEOS.map(v => (
            <div key={v.id} onClick={() => navigate(`/media/videos/${v.id}`)} className="rounded-2xl border bg-card overflow-hidden hover:shadow-md hover:-translate-y-0.5 cursor-pointer group transition-all">
              <div className="relative aspect-video bg-gradient-to-br from-accent/10 to-muted/30 flex items-center justify-center">
                <Play className="h-8 w-8 text-muted-foreground/30 group-hover:text-accent/60 group-hover:scale-110 transition-all" />
                <span className="absolute bottom-2 right-2 text-[7px] text-white bg-black/70 px-1.5 py-0.5 rounded-lg font-mono">{v.duration}</span>
                {v.premium && <Badge className="absolute top-2 left-2 text-[6px] h-3.5 bg-[hsl(var(--gigvora-amber))]/80 text-white border-0 gap-0.5"><Star className="h-2 w-2" />PRO</Badge>}
              </div>
              <div className="p-2.5">
                <p className="text-[10px] font-bold group-hover:text-accent transition-colors line-clamp-2 mb-1">{v.title}</p>
                <div className="flex items-center gap-1.5">
                  <Avatar className="h-4 w-4"><AvatarFallback className="text-[5px] bg-accent/10 text-accent">{v.avatar}</AvatarFallback></Avatar>
                  <span className="text-[8px] text-muted-foreground">{v.creator}</span>
                  <span className="text-[8px] text-muted-foreground ml-auto flex items-center gap-0.5"><Eye className="h-2.5 w-2.5" />{v.views}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </SectionCard>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-3 mt-3">
        {/* Podcasts */}
        <SectionCard title="Trending Podcasts" icon={<Headphones className="h-3.5 w-3.5 text-[hsl(var(--gigvora-green))]" />} action={<Link to="/podcasts" className="text-[9px] text-accent font-medium flex items-center gap-0.5 hover:underline">All Podcasts <ChevronRight className="h-2.5 w-2.5" /></Link>} className="!rounded-2xl">
          <div className="space-y-2">
            {TRENDING_PODCASTS.map(p => (
              <Link key={p.id} to={p.live ? `/podcasts/player` : `/podcasts/episode/${p.id}`} className="flex items-center gap-3 p-2.5 rounded-xl border border-border/30 hover:border-accent/30 hover:shadow-sm transition-all">
                <div className={cn('h-10 w-10 rounded-xl flex items-center justify-center shrink-0', p.live ? 'bg-[hsl(var(--state-live))]/10' : 'bg-[hsl(var(--gigvora-green))]/10')}>
                  {p.live ? <Radio className="h-4 w-4 text-[hsl(var(--state-live))] animate-pulse" /> : <Headphones className="h-4 w-4 text-[hsl(var(--gigvora-green))]" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-semibold truncate">{p.title}</span>
                    {p.live && <Badge className="text-[6px] h-3 bg-[hsl(var(--state-live))]/10 text-[hsl(var(--state-live))] border-0 animate-pulse">LIVE</Badge>}
                  </div>
                  <div className="text-[8px] text-muted-foreground">{p.host} · {p.listeners} listeners · {p.duration}</div>
                </div>
                <Play className="h-4 w-4 text-muted-foreground/40 shrink-0" />
              </Link>
            ))}
          </div>
        </SectionCard>

        {/* Webinars */}
        <SectionCard title="Upcoming Webinars" icon={<Tv className="h-3.5 w-3.5 text-[hsl(var(--gigvora-amber))]" />} action={<Link to="/webinars" className="text-[9px] text-accent font-medium flex items-center gap-0.5 hover:underline">All Webinars <ChevronRight className="h-2.5 w-2.5" /></Link>} className="!rounded-2xl">
          <div className="space-y-2">
            {UPCOMING_WEBINARS.map(w => (
              <Link key={w.id} to={`/webinars/${w.id}`} className="flex items-center gap-3 p-2.5 rounded-xl border border-border/30 hover:border-accent/30 hover:shadow-sm transition-all">
                <div className="h-10 w-10 rounded-xl bg-[hsl(var(--gigvora-amber))]/10 flex items-center justify-center shrink-0">
                  <Tv className="h-4 w-4 text-[hsl(var(--gigvora-amber))]" />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-[10px] font-semibold truncate block">{w.title}</span>
                  <div className="text-[8px] text-muted-foreground">{w.host} · {w.date} · {w.attendees} registered</div>
                </div>
                <Badge variant={w.free ? 'secondary' : 'outline'} className="text-[7px] h-4 shrink-0 rounded-lg">{w.free ? 'Free' : 'Paid'}</Badge>
              </Link>
            ))}
          </div>
        </SectionCard>
      </div>
    </DashboardLayout>
  );
}
