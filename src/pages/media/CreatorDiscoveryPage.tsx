import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/shell/DashboardLayout';
import { SectionCard } from '@/components/shell/EnterprisePrimitives';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import {
  Users, Search, UserPlus, CheckCircle2, Film,
  Headphones, TrendingUp, Star,
  Sparkles, ArrowRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Creator {
  id: string; name: string; avatar: string; verified: boolean;
  title: string; type: string; followers: string; views: string;
  topics: string[]; industry: string; recentActivity: string;
  engagement: string; contentCount: number; following: boolean;
}

const CREATORS: Creator[] = [
  { id: 'cr1', name: 'Sarah Kim', avatar: 'SK', verified: true, title: 'Product Design Lead', type: 'Video Creator', followers: '24.3K', views: '1.2M', topics: ['Design Systems', 'UI/UX', 'Figma'], industry: 'Design', recentActivity: '2h ago', engagement: '8.4%', contentCount: 142, following: false },
  { id: 'cr2', name: 'Alex Mercer', avatar: 'AM', verified: true, title: 'Senior Engineer', type: 'Educator', followers: '18.1K', views: '890K', topics: ['React', 'TypeScript', 'AI'], industry: 'Technology', recentActivity: '5h ago', engagement: '7.2%', contentCount: 98, following: true },
  { id: 'cr3', name: 'Priya Patel', avatar: 'PP', verified: true, title: 'Podcast Host & VC', type: 'Podcast Host', followers: '31.2K', views: '2.1M', topics: ['Startups', 'VC', 'Future of Work'], industry: 'Business', recentActivity: '1d ago', engagement: '9.1%', contentCount: 215, following: false },
  { id: 'cr4', name: 'Mike Davis', avatar: 'MD', verified: true, title: 'Startup Advisor', type: 'Business Creator', followers: '15.8K', views: '560K', topics: ['Pitch Decks', 'Fundraising', 'Growth'], industry: 'Business', recentActivity: '3h ago', engagement: '6.8%', contentCount: 67, following: false },
  { id: 'cr5', name: 'Yuki Tanaka', avatar: 'YT', verified: false, title: 'Creative Developer', type: 'Video Creator', followers: '8.4K', views: '320K', topics: ['CSS Art', 'Creative Coding', 'Web GL'], industry: 'Technology', recentActivity: '6h ago', engagement: '12.1%', contentCount: 54, following: true },
  { id: 'cr6', name: 'Elena Vasquez', avatar: 'EV', verified: true, title: 'UX Research Director', type: 'Educator', followers: '12.6K', views: '480K', topics: ['UX Research', 'Design Thinking', 'Accessibility'], industry: 'Design', recentActivity: '1d ago', engagement: '7.9%', contentCount: 89, following: false },
  { id: 'cr7', name: 'James Rivera', avatar: 'JR', verified: true, title: 'CTO & Tech Lead', type: 'Podcast Host', followers: '9.7K', views: '410K', topics: ['System Design', 'Leadership', 'Architecture'], industry: 'Technology', recentActivity: '12h ago', engagement: '6.3%', contentCount: 76, following: false },
  { id: 'cr8', name: 'Nina Patel', avatar: 'NP', verified: true, title: 'Growth Marketer', type: 'Business Creator', followers: '20.5K', views: '780K', topics: ['Growth', 'Marketing', 'Analytics'], industry: 'Marketing', recentActivity: '4h ago', engagement: '8.7%', contentCount: 112, following: true },
];

const CATEGORIES = ['All', 'Following', 'Suggested', 'Technology', 'Design', 'Business', 'Marketing'];
const TYPES = ['All', 'Video Creator', 'Podcast Host', 'Educator', 'Business Creator'];


export default function CreatorDiscoveryPage() {
  
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [creatorType, setCreatorType] = useState('All');
  const [following, setFollowing] = useState<Set<string>>(new Set(CREATORS.filter(c => c.following).map(c => c.id)));

  const filtered = CREATORS.filter(c => {
    if (search && !c.name.toLowerCase().includes(search.toLowerCase()) && !c.topics.some(t => t.toLowerCase().includes(search.toLowerCase()))) return false;
    if (category === 'Following') return following.has(c.id);
    if (category === 'Suggested') return !following.has(c.id);
    if (category !== 'All' && c.industry !== category) return false;
    if (creatorType !== 'All' && c.type !== creatorType) return false;
    return true;
  });

  const toggleFollow = (id: string) => setFollowing(p => { const s = new Set(p); if (s.has(id)) { s.delete(id); } else { s.add(id); } return s; });

  const TYPE_ICONS: Record<string, React.ElementType> = { 'Video Creator': Film, 'Podcast Host': Headphones, 'Educator': Star, 'Business Creator': TrendingUp };

  return (
    <DashboardLayout topStrip={
      <>
        <Users className="h-4 w-4 text-accent" />
        <span className="text-xs font-semibold">Creator Discovery</span>
        <div className="flex-1" />
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
          <Input placeholder="Search creators, topics..." value={search} onChange={e => setSearch(e.target.value)} className="pl-7 h-7 text-[10px]" />
        </div>
      </>
    } rightRail={
      <div className="space-y-4">
        <SectionCard title="Trending Creators" icon={<TrendingUp className="h-4 w-4 text-accent" />}>
          {CREATORS.filter(c => c.verified).slice(0, 4).map(c => (
            <div key={c.id} className="flex items-center gap-2 py-2 border-b last:border-0">
              <Avatar className="h-7 w-7"><AvatarFallback className="text-[8px] bg-accent/10">{c.avatar}</AvatarFallback></Avatar>
              <div className="flex-1 min-w-0">
                <div className="text-[10px] font-medium truncate flex items-center gap-1">{c.name}<CheckCircle2 className="h-2.5 w-2.5 text-blue-500" /></div>
                <div className="text-[8px] text-muted-foreground">{c.followers} followers</div>
              </div>
              <Button variant="outline" size="sm" className="h-5 text-[8px] rounded-lg px-2" onClick={() => toggleFollow(c.id)}>
                {following.has(c.id) ? 'Following' : 'Follow'}
              </Button>
            </div>
          ))}
        </SectionCard>
        <SectionCard title="Top Topics" icon={<Sparkles className="h-4 w-4 text-accent" />}>
          <div className="flex flex-wrap gap-1">
            {['React', 'AI/ML', 'Design Systems', 'Startups', 'Growth', 'UX Research', 'TypeScript', 'Leadership'].map(t => (
              <Badge key={t} variant="secondary" className="text-[8px] rounded-lg cursor-pointer hover:bg-accent/10">{t}</Badge>
            ))}
          </div>
        </SectionCard>
      </div>
    }>
      {/* Category chips */}
      <div className="flex items-center gap-1.5 mb-3 overflow-x-auto pb-1">
        {CATEGORIES.map(c => (
          <button key={c} onClick={() => setCategory(c)} className={cn('px-3 py-1.5 rounded-xl text-[10px] font-medium shrink-0 transition-all', category === c ? 'bg-accent text-accent-foreground shadow-sm' : 'bg-muted/50 text-muted-foreground hover:bg-muted')}>{c}</button>
        ))}
        <div className="h-4 w-px bg-border mx-1" />
        {TYPES.slice(1).map(t => {
          const TI = TYPE_ICONS[t] || Users;
          return (
            <button key={t} onClick={() => setCreatorType(creatorType === t ? 'All' : t)} className={cn('px-2.5 py-1.5 rounded-xl text-[10px] font-medium shrink-0 transition-all flex items-center gap-1', creatorType === t ? 'bg-accent/10 text-accent border border-accent/30' : 'bg-muted/50 text-muted-foreground hover:bg-muted')}>
              <TI className="h-3 w-3" />{t}
            </button>
          );
        })}
      </div>

      {/* Creators Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
        {filtered.map(c => {
          const TI = TYPE_ICONS[c.type] || Users;
          return (
            <div key={c.id} className="rounded-2xl border bg-card p-4 shadow-card hover:shadow-lg transition-all group">
              {/* Header */}
              <div className="flex items-start gap-3 mb-3">
                <Avatar className="h-12 w-12 ring-2 ring-accent/10"><AvatarFallback className="bg-accent/10 text-accent font-bold">{c.avatar}</AvatarFallback></Avatar>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-semibold flex items-center gap-1">{c.name}{c.verified && <CheckCircle2 className="h-3 w-3 text-blue-500" />}</div>
                  <div className="text-[10px] text-muted-foreground">{c.title}</div>
                  <Badge variant="outline" className="text-[8px] rounded-lg mt-1 gap-0.5"><TI className="h-2.5 w-2.5" />{c.type}</Badge>
                </div>
                <Button variant={following.has(c.id) ? 'secondary' : 'default'} size="sm" onClick={() => toggleFollow(c.id)} className="h-7 text-[10px] rounded-xl gap-1">
                  <UserPlus className="h-3 w-3" />{following.has(c.id) ? 'Following' : 'Follow'}
                </Button>
              </div>
              {/* Topics */}
              <div className="flex flex-wrap gap-1 mb-3">
                {c.topics.map(t => <Badge key={t} variant="secondary" className="text-[8px] rounded-lg">{t}</Badge>)}
              </div>
              {/* Stats */}
              <div className="grid grid-cols-4 gap-2 p-2 rounded-xl bg-muted/30 mb-3">
                <div className="text-center"><div className="text-[10px] font-bold">{c.followers}</div><div className="text-[7px] text-muted-foreground">Followers</div></div>
                <div className="text-center"><div className="text-[10px] font-bold">{c.views}</div><div className="text-[7px] text-muted-foreground">Views</div></div>
                <div className="text-center"><div className="text-[10px] font-bold">{c.engagement}</div><div className="text-[7px] text-muted-foreground">Engagement</div></div>
                <div className="text-center"><div className="text-[10px] font-bold">{c.contentCount}</div><div className="text-[7px] text-muted-foreground">Content</div></div>
              </div>
              {/* Footer */}
              <div className="flex items-center justify-between">
                <span className="text-[9px] text-muted-foreground">Active {c.recentActivity}</span>
                <Link to={`/media/creator/${c.id}`} className="text-[9px] text-accent hover:underline flex items-center gap-0.5">View Profile <ArrowRight className="h-2.5 w-2.5" /></Link>
              </div>
            </div>
          );
        })}
      </div>
    </DashboardLayout>
  );
}
