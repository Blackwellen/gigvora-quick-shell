import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/shell/DashboardLayout';
import { SectionCard } from '@/components/shell/EnterprisePrimitives';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import {
  Play, Film, Search, Eye, Heart,
  TrendingUp, Star, Crown, Grid, List, SlidersHorizontal,
  Upload,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Video {
  id: string; title: string; creator: string; avatar: string; verified: boolean;
  views: string; likes: string; duration: string; date: string;
  category: string; tags: string[]; premium: boolean; description: string;
}

const VIDEOS: Video[] = [
  { id: 'v1', title: 'Building a $1M SaaS — Full Documentary', creator: 'TechFounders', avatar: 'TF', verified: true, views: '45K', likes: '4.2K', duration: '42:15', date: '2 days ago', category: 'Business', tags: ['SaaS', 'Startup', 'Documentary'], premium: false, description: 'The complete journey of building a SaaS from zero to $1M ARR.' },
  { id: 'v2', title: 'Advanced React Patterns Workshop', creator: 'DevMaster', avatar: 'DM', verified: true, views: '23K', likes: '2.8K', duration: '1:28:30', date: '1 week ago', category: 'Development', tags: ['React', 'Patterns', 'Workshop'], premium: true, description: 'Deep dive into compound components, render props, and hooks patterns.' },
  { id: 'v3', title: 'UX Case Study: Airbnb Redesign', creator: 'DesignPro', avatar: 'DP', verified: true, views: '18K', likes: '1.9K', duration: '35:42', date: '3 days ago', category: 'Design', tags: ['UX', 'Case Study', 'Redesign'], premium: false, description: 'Breaking down how Airbnb approached their latest redesign.' },
  { id: 'v4', title: 'Freelancing Masterclass: Getting to $200K', creator: 'GigGuru', avatar: 'GG', verified: true, views: '31K', likes: '3.5K', duration: '55:10', date: '5 days ago', category: 'Career', tags: ['Freelancing', 'Income', 'Strategy'], premium: true, description: 'Actionable strategies to scale your freelance income to six figures.' },
  { id: 'v5', title: 'System Design Interview Prep', creator: 'TechInterviews', avatar: 'TI', verified: false, views: '67K', likes: '5.1K', duration: '1:15:00', date: '1 week ago', category: 'Development', tags: ['System Design', 'Interview'], premium: false, description: 'Complete guide to system design interviews with real examples.' },
  { id: 'v6', title: 'How I Got 50K Followers in 3 Months', creator: 'GrowthHack', avatar: 'GH', verified: true, views: '92K', likes: '8.7K', duration: '28:30', date: '4 days ago', category: 'Marketing', tags: ['Growth', 'Social Media'], premium: false, description: 'My exact content strategy for rapid audience growth.' },
  { id: 'v7', title: 'Product Management: Roadmap Planning', creator: 'PMInsights', avatar: 'PM', verified: true, views: '14K', likes: '1.2K', duration: '48:00', date: '2 weeks ago', category: 'Product', tags: ['PM', 'Roadmap', 'Strategy'], premium: true, description: 'How top PMs build and communicate product roadmaps.' },
  { id: 'v8', title: 'Typography Fundamentals for UI', creator: 'TypeSchool', avatar: 'TS', verified: false, views: '9.3K', likes: '980', duration: '32:15', date: '6 days ago', category: 'Design', tags: ['Typography', 'UI', 'Fundamentals'], premium: false, description: 'Master type scale, pairing, and hierarchy for better interfaces.' },
  { id: 'v9', title: 'AI Tools for Developers 2026', creator: 'DevMaster', avatar: 'DM', verified: true, views: '34K', likes: '3.8K', duration: '52:30', date: '3 days ago', category: 'AI', tags: ['AI', 'Tools', 'Developer'], premium: false, description: 'The best AI coding tools and how to use them effectively.' },
];

const CATEGORIES = ['All', 'Business', 'Development', 'Design', 'Marketing', 'Career', 'Product', 'AI', 'Leadership'];

const FILTER_GROUPS = [
  { label: 'Duration', options: ['< 10 min', '10-30 min', '30-60 min', '1h+'] },
  { label: 'Upload Date', options: ['Today', 'This Week', 'This Month', 'This Year'] },
  { label: 'Type', options: ['Tutorial', 'Workshop', 'Documentary', 'Case Study', 'Interview', 'Talk'] },
  { label: 'Access', options: ['Free', 'Premium'] },
  { label: 'Sort By', options: ['Most Viewed', 'Most Liked', 'Newest', 'Longest'] },
  { label: 'Creator', options: ['Verified Only', 'Following', 'All'] },
];

export default function VideoDiscoveryPage() {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [showFilters, setShowFilters] = useState(false);
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const navigate = useNavigate();

  const filtered = VIDEOS.filter(v => {
    if (category !== 'All' && v.category !== category) return false;
    if (search && !v.title.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const rightRail = (
    <div className="space-y-3">
      <SectionCard title="Trending Now" icon={<TrendingUp className="h-3.5 w-3.5 text-accent" />} className="!rounded-2xl">
        <div className="space-y-2">
          {VIDEOS.slice(0, 4).map(v => (
            <div key={v.id} onClick={() => navigate(`/media/videos/${v.id}`)} className="flex gap-2 cursor-pointer group py-1">
              <div className="h-10 w-16 rounded-lg bg-gradient-to-br from-accent/10 to-muted/30 flex items-center justify-center shrink-0">
                <Play className="h-3 w-3 text-muted-foreground/40 group-hover:text-accent transition-colors" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[8px] font-semibold line-clamp-2 group-hover:text-accent transition-colors">{v.title}</p>
                <span className="text-[7px] text-muted-foreground">{v.views} views</span>
              </div>
            </div>
          ))}
        </div>
      </SectionCard>
      <SectionCard title="Top Creators" className="!rounded-2xl">
        <div className="space-y-1.5">
          {[{ n: 'TechFounders', a: 'TF', f: '24K' }, { n: 'DevMaster', a: 'DM', f: '18K' }, { n: 'GrowthHack', a: 'GH', f: '15K' }].map(c => (
            <div key={c.n} className="flex items-center gap-2 py-1">
              <Avatar className="h-6 w-6"><AvatarFallback className="text-[6px] bg-accent/10 text-accent">{c.a}</AvatarFallback></Avatar>
              <div className="flex-1"><span className="text-[8px] font-medium">{c.n}</span><div className="text-[7px] text-muted-foreground">{c.f} followers</div></div>
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
          <span className="text-xs font-semibold">Video Center</span>
          <div className="flex-1" />
          <div className="relative max-w-sm flex-1">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
            <Input placeholder="Search videos..." value={search} onChange={e => setSearch(e.target.value)} className="pl-7 h-7 text-[10px] rounded-xl" />
          </div>
          <Button size="sm" onClick={() => navigate('/media/videos/upload')} className="h-7 text-[10px] rounded-xl gap-1"><Upload className="h-3 w-3" /> Upload</Button>
        </>
      }
      rightRail={rightRail}
      rightRailWidth="w-52"
    >
      {/* Categories + Controls */}
      <div className="flex items-center gap-1.5 mb-3 overflow-x-auto pb-1 scrollbar-none">
        {CATEGORIES.map(c => (
          <button key={c} onClick={() => setCategory(c)} className={cn('px-3 py-1.5 rounded-xl text-[10px] font-medium shrink-0 transition-all', category === c ? 'bg-accent text-accent-foreground shadow-sm' : 'bg-muted/50 text-muted-foreground hover:bg-muted')}>
            {c}
          </button>
        ))}
        <Button variant="outline" size="sm" onClick={() => setShowFilters(!showFilters)} className={cn('h-7 text-[10px] gap-1 rounded-xl shrink-0', showFilters && 'bg-accent/10 border-accent/30')}>
          <SlidersHorizontal className="h-3 w-3" /> Filters
        </Button>
        <div className="flex-1" />
        <div className="flex gap-0.5 shrink-0">
          <button onClick={() => setView('grid')} className={cn('h-7 w-7 rounded-lg flex items-center justify-center transition-colors', view === 'grid' ? 'bg-accent/10 text-accent' : 'text-muted-foreground hover:bg-muted')}><Grid className="h-3.5 w-3.5" /></button>
          <button onClick={() => setView('list')} className={cn('h-7 w-7 rounded-lg flex items-center justify-center transition-colors', view === 'list' ? 'bg-accent/10 text-accent' : 'text-muted-foreground hover:bg-muted')}><List className="h-3.5 w-3.5" /></button>
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2 mb-4 p-3 rounded-2xl border border-border/40 bg-card/50">
          {FILTER_GROUPS.map(fg => (
            <div key={fg.label}>
              <div className="text-[8px] font-semibold text-muted-foreground mb-1">{fg.label}</div>
              <div className="flex flex-wrap gap-1">
                {fg.options.map(o => (
                  <Badge key={o} variant="outline" className="text-[7px] h-3.5 px-1.5 rounded-lg cursor-pointer hover:bg-accent/10 hover:border-accent/30 transition-colors">{o}</Badge>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Results */}
      <div className={cn(view === 'grid' ? 'grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3' : 'space-y-2.5')}>
        {filtered.map(v => (
          <div key={v.id} onClick={() => navigate(`/media/videos/${v.id}`)} className={cn(
            'cursor-pointer group transition-all',
            view === 'list' ? 'flex gap-3 p-3 rounded-2xl border border-border/30 hover:border-accent/30 hover:shadow-sm' : 'rounded-2xl border bg-card overflow-hidden hover:shadow-md hover:-translate-y-0.5'
          )}>
            {/* Thumbnail */}
            <div className={cn('relative bg-gradient-to-br from-accent/10 to-muted/30 flex items-center justify-center overflow-hidden', view === 'grid' ? 'aspect-video' : 'h-24 w-40 shrink-0 rounded-xl')}>
              <Play className="h-8 w-8 text-muted-foreground/30 group-hover:text-accent/60 group-hover:scale-110 transition-all" />
              <span className="absolute bottom-2 right-2 text-[7px] text-white bg-black/70 px-1.5 py-0.5 rounded-lg font-mono">{v.duration}</span>
              {v.premium && <Badge className="absolute top-2 left-2 text-[6px] h-3.5 bg-[hsl(var(--gigvora-amber))]/80 text-white border-0 gap-0.5"><Star className="h-2 w-2" />PRO</Badge>}
            </div>
            <div className={cn('flex-1 min-w-0', view === 'grid' ? 'p-2.5' : '')}>
              <p className={cn('font-bold group-hover:text-accent transition-colors line-clamp-2', view === 'grid' ? 'text-[10px]' : 'text-xs')}>{v.title}</p>
              <div className="flex items-center gap-1.5 mt-1">
                <Avatar className="h-5 w-5"><AvatarFallback className="text-[6px] bg-accent/10 text-accent">{v.avatar}</AvatarFallback></Avatar>
                <span className="text-[9px] text-muted-foreground">{v.creator}</span>
                {v.verified && <Crown className="h-2.5 w-2.5 text-accent" />}
              </div>
              <div className="flex items-center gap-2 text-[8px] text-muted-foreground mt-1">
                <span className="flex items-center gap-0.5"><Eye className="h-2.5 w-2.5" />{v.views}</span>
                <span className="flex items-center gap-0.5"><Heart className="h-2.5 w-2.5" />{v.likes}</span>
                <span>{v.date}</span>
              </div>
              {view === 'list' && <p className="text-[9px] text-muted-foreground mt-1 line-clamp-1">{v.description}</p>}
              <div className="flex gap-1 mt-1.5 flex-wrap">
                {v.tags.slice(0, 3).map(t => <Badge key={t} variant="outline" className="text-[7px] h-3.5 rounded-lg">{t}</Badge>)}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Results info */}
      <div className="mt-4 text-center text-[9px] text-muted-foreground">
        Showing {filtered.length} of {VIDEOS.length} videos
      </div>
    </DashboardLayout>
  );
}
