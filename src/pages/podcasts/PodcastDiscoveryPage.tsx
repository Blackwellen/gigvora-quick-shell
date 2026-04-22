import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { DashboardLayout } from '@/components/shell/DashboardLayout';
import { SectionCard, KPICard, StatusBadge } from '@/components/shell/EnterprisePrimitives';
import { SectionBackNav } from '@/components/shell/SectionBackNav';
import { AdvancedFilterPanel, FilterDefinition, FilterValues } from '@/components/shell/AdvancedFilterPanel';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Headphones, Search, Play, Star, Users, Clock, ChevronRight,
  TrendingUp, Bookmark, Library, ListMusic, Radio, Mic,
  SlidersHorizontal, Heart, Globe, Calendar, BarChart3,
  Layers, Download, Share2, Rss, FolderOpen,
} from 'lucide-react';

const PODCAST_FILTERS: FilterDefinition[] = [
  { id: 'category', label: 'Category', type: 'multi-select', group: 'Content', options: [
    { value: 'technology', label: 'Technology', count: 420 }, { value: 'design', label: 'Design', count: 180 },
    { value: 'business', label: 'Business', count: 310 }, { value: 'ai-ml', label: 'AI / Machine Learning', count: 95 },
    { value: 'startups', label: 'Startups', count: 145 }, { value: 'engineering', label: 'Engineering', count: 230 },
    { value: 'product', label: 'Product Management', count: 120 }, { value: 'culture', label: 'Culture & Society', count: 85 },
    { value: 'marketing', label: 'Marketing', count: 175 }, { value: 'finance', label: 'Finance', count: 95 },
  ], defaultOpen: true },
  { id: 'format', label: 'Format', type: 'multi-select', group: 'Content', options: [
    { value: 'interview', label: 'Interview' }, { value: 'solo', label: 'Solo / Monologue' },
    { value: 'panel', label: 'Panel Discussion' }, { value: 'storytelling', label: 'Storytelling' },
    { value: 'educational', label: 'Educational / Tutorial' }, { value: 'debate', label: 'Debate' },
  ]},
  { id: 'duration', label: 'Episode Duration', type: 'single-select', group: 'Playback', options: [
    { value: 'short', label: 'Under 15 min' }, { value: 'medium', label: '15–30 min' },
    { value: 'standard', label: '30–60 min' }, { value: 'long', label: '60+ min' },
  ]},
  { id: 'frequency', label: 'Release Frequency', type: 'single-select', group: 'Content', options: [
    { value: 'daily', label: 'Daily' }, { value: 'weekly', label: 'Weekly' },
    { value: 'biweekly', label: 'Bi-Weekly' }, { value: 'monthly', label: 'Monthly' },
  ]},
  { id: 'language', label: 'Language', type: 'multi-select', group: 'Accessibility', options: [
    { value: 'en', label: 'English', count: 1800 }, { value: 'es', label: 'Spanish', count: 120 },
    { value: 'fr', label: 'French', count: 85 }, { value: 'de', label: 'German', count: 60 },
    { value: 'pt', label: 'Portuguese', count: 45 }, { value: 'ja', label: 'Japanese', count: 40 },
  ]},
  { id: 'rating', label: 'Minimum Rating', type: 'range', group: 'Quality', min: 1, max: 5, step: 0.5, unit: '★' },
  { id: 'subscribers', label: 'Subscriber Count', type: 'single-select', group: 'Popularity', options: [
    { value: '1k', label: '1K+' }, { value: '10k', label: '10K+' },
    { value: '50k', label: '50K+' }, { value: '100k', label: '100K+' },
  ]},
  { id: 'status', label: 'Show Status', type: 'multi-select', group: 'Content', options: [
    { value: 'active', label: 'Active' }, { value: 'completed', label: 'Completed Series' },
    { value: 'hiatus', label: 'On Hiatus' },
  ]},
  { id: 'hasTranscript', label: 'Has Transcript', type: 'toggle', group: 'Accessibility' },
  { id: 'hasVideo', label: 'Video Available', type: 'toggle', group: 'Content' },
  { id: 'isLive', label: 'Live Episodes', type: 'toggle', group: 'Content' },
  { id: 'isFree', label: 'Free Only', type: 'toggle', group: 'Pricing' },
  { id: 'explicit', label: 'Exclude Explicit', type: 'toggle', group: 'Content' },
  { id: 'newEpisodes', label: 'New Episodes This Week', type: 'toggle', group: 'Freshness' },
  { id: 'verified', label: 'Verified Hosts Only', type: 'toggle', group: 'Quality' },
];

const SHOWS = [
  { id: '1', title: 'Tech Talks Daily', host: 'Sarah Kim', image: '🎙️', category: 'Technology', rating: 4.8, episodes: 342, subscribers: '45K', latest: 'Apr 12, 2026', status: 'new-episode' as const },
  { id: '2', title: 'Design Matters', host: 'Debbie Millman', image: '🎨', category: 'Design', rating: 4.9, episodes: 890, subscribers: '120K', latest: 'Apr 10, 2026', status: 'popular' as const },
  { id: '3', title: 'The Freelance Hour', host: 'James Rivera', image: '💼', category: 'Business', rating: 4.6, episodes: 156, subscribers: '18K', latest: 'Apr 13, 2026', status: 'new-episode' as const },
  { id: '4', title: 'AI Frontiers', host: 'Dr. Raj Patel', image: '🤖', category: 'AI/ML', rating: 4.7, episodes: 78, subscribers: '32K', latest: 'Apr 11, 2026', status: 'trending' as const },
  { id: '5', title: 'Startup Stories', host: 'Ana Rodriguez', image: '🚀', category: 'Startups', rating: 4.5, episodes: 210, subscribers: '28K', latest: 'Apr 9, 2026', status: 'popular' as const },
  { id: '6', title: 'Code Review Radio', host: 'Mike Liu', image: '📻', category: 'Engineering', rating: 4.4, episodes: 445, subscribers: '56K', latest: 'Apr 14, 2026', status: 'new-episode' as const },
];

const TRENDING_EPISODES = [
  { title: 'Why AI Agents Will Replace SaaS', show: 'AI Frontiers', duration: '42 min', plays: '12.4K' },
  { title: 'Salary Negotiation for Freelancers', show: 'The Freelance Hour', duration: '38 min', plays: '8.9K' },
  { title: 'React 21 Deep Dive', show: 'Code Review Radio', duration: '55 min', plays: '15.2K' },
];

const HUB_LINKS = [
  { label: 'My Library', href: '/podcasts/library', icon: Library, desc: 'Saved & downloaded' },
  { label: 'Queue', href: '/podcasts/queue', icon: ListMusic, desc: 'Up next' },
  { label: 'Subscriptions', href: '/podcasts/subscriptions', icon: Rss, desc: 'Following' },
  { label: 'Series', href: '/podcasts/series', icon: Layers, desc: 'All series' },
  { label: 'Player', href: '/podcasts/player', icon: Play, desc: 'Now playing' },
  { label: 'Live', href: '/podcasts/recorder', icon: Radio, desc: 'Live podcasts' },
  { label: 'Creator Studio', href: '/podcasts/studio', icon: Mic, desc: 'Create & manage' },
  { label: 'Analytics', href: '/podcasts/analytics', icon: BarChart3, desc: 'Performance' },
];

export default function PodcastDiscoveryPage() {
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState('all');
  const [showFilters, setShowFilters] = useState(true);
  const [filterValues, setFilterValues] = useState<FilterValues>({});
  const filtered = SHOWS.filter(s => s.title.toLowerCase().includes(search.toLowerCase()));

  return (
    <DashboardLayout
      topStrip={
        <div className="flex items-center gap-4 w-full">
          <Headphones className="h-4 w-4 text-accent" />
          <h1 className="text-sm font-bold mr-4">Podcasts</h1>
          <KPICard label="Shows" value="2.4K" />
          <KPICard label="New Episodes" value="128" change="today" trend="up" />
          <KPICard label="Subscribed" value="12" />
          <KPICard label="Queue" value="8" />
        </div>
      }
      rightRail={
        <div className="space-y-3">
          {/* Hub Navigation */}
          <SectionCard title="Podcast Hub" icon={<Headphones className="h-3 w-3 text-accent" />}>
            <div className="space-y-0.5">
              {HUB_LINKS.map(link => (
                <Link key={link.href} to={link.href} className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-accent/10 transition-colors group">
                  <link.icon className="h-3 w-3 text-muted-foreground group-hover:text-accent transition-colors" />
                  <div className="flex-1 min-w-0">
                    <div className="text-[10px] font-medium group-hover:text-accent transition-colors">{link.label}</div>
                    <div className="text-[8px] text-muted-foreground">{link.desc}</div>
                  </div>
                  <ChevronRight className="h-2.5 w-2.5 text-muted-foreground/50" />
                </Link>
              ))}
            </div>
          </SectionCard>

          <SectionCard title="Trending Episodes" icon={<TrendingUp className="h-3 w-3 text-accent" />}>
            {TRENDING_EPISODES.map((ep, i) => (
              <div key={i} className="flex items-center gap-2 py-2 border-b border-border/30 last:border-0">
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0 shrink-0"><Play className="h-3 w-3" /></Button>
                <div className="flex-1 min-w-0">
                  <div className="text-[10px] font-medium truncate">{ep.title}</div>
                  <div className="text-[8px] text-muted-foreground">{ep.show} · {ep.duration} · {ep.plays} plays</div>
                </div>
              </div>
            ))}
          </SectionCard>

          <SectionCard title="Categories">
            <div className="flex flex-wrap gap-1">
              {['Technology', 'Design', 'Business', 'AI/ML', 'Startups', 'Engineering', 'Product', 'Culture'].map(c => (
                <Badge key={c} variant="outline" className="text-[8px] h-4 px-1.5 cursor-pointer hover:bg-accent/10">{c}</Badge>
              ))}
            </div>
          </SectionCard>
        </div>
      }
      rightRailWidth="w-56"
    >
      <SectionBackNav homeRoute="/dashboard" homeLabel="Dashboard" currentLabel="Podcasts" icon={<Headphones className="h-3 w-3" />} />

      {/* Filter Controls */}
      <div className="flex items-center gap-2 mb-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input placeholder="Search shows, episodes, hosts..." value={search} onChange={e => setSearch(e.target.value)} className="pl-8 h-8 text-xs" />
        </div>
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="h-7">
            <TabsTrigger value="all" className="text-[10px] h-5 px-2">All</TabsTrigger>
            <TabsTrigger value="subscribed" className="text-[10px] h-5 px-2">Subscribed</TabsTrigger>
            <TabsTrigger value="trending" className="text-[10px] h-5 px-2">Trending</TabsTrigger>
            <TabsTrigger value="live" className="text-[10px] h-5 px-2">Live</TabsTrigger>
            <TabsTrigger value="upcoming" className="text-[10px] h-5 px-2">Upcoming</TabsTrigger>
          </TabsList>
        </Tabs>
        <Button variant="outline" size="sm" className="h-7 text-[10px] gap-1 rounded-xl" onClick={() => setShowFilters(!showFilters)}>
          <SlidersHorizontal className="h-3 w-3" /> Filters
          {Object.keys(filterValues).length > 0 && (
            <Badge className="text-[7px] h-3.5 px-1 ml-0.5 bg-accent text-accent-foreground">{Object.keys(filterValues).length}</Badge>
          )}
        </Button>
      </div>

      {showFilters && (
        <div className="mb-3">
          <AdvancedFilterPanel filters={PODCAST_FILTERS} values={filterValues} onChange={setFilterValues} inline />
        </div>
      )}

      {/* Shows Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {filtered.map(s => (
          <Link key={s.id} to={`/podcasts/show/${s.id}`} className="block">
            <div className="p-4 rounded-2xl border border-border/40 hover:border-accent/30 hover:bg-accent/5 transition-all cursor-pointer group">
              <div className="flex items-start gap-3">
                <div className="h-14 w-14 rounded-xl bg-muted flex items-center justify-center text-2xl shrink-0">{s.image}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <span className="text-xs font-bold group-hover:text-accent transition-colors">{s.title}</span>
                    {s.status === 'new-episode' && <Badge className="text-[7px] h-3.5 bg-accent/10 text-accent border-0">New</Badge>}
                    {s.status === 'trending' && <Badge className="text-[7px] h-3.5 bg-[hsl(var(--gigvora-amber))]/10 text-[hsl(var(--gigvora-amber))] border-0">Trending</Badge>}
                  </div>
                  <div className="text-[10px] text-muted-foreground">{s.host}</div>
                  <div className="flex items-center gap-3 mt-1 text-[9px] text-muted-foreground">
                    <span className="flex items-center gap-0.5"><Star className="h-2.5 w-2.5 fill-[hsl(var(--gigvora-amber))] text-[hsl(var(--gigvora-amber))]" /> {s.rating}</span>
                    <span>{s.episodes} eps</span>
                    <span><Users className="h-2.5 w-2.5 inline" /> {s.subscribers}</span>
                  </div>
                  <div className="flex items-center gap-2 mt-1.5">
                    <Badge variant="outline" className="text-[7px] h-3.5">{s.category}</Badge>
                    <span className="text-[8px] text-muted-foreground"><Clock className="h-2.5 w-2.5 inline" /> {s.latest}</span>
                  </div>
                </div>
                <div className="flex flex-col gap-1 shrink-0">
                  <Button size="sm" className="h-6 text-[8px] gap-1 rounded-lg" onClick={e => e.preventDefault()}><Play className="h-2.5 w-2.5" /> Play</Button>
                  <Button variant="ghost" size="sm" className="h-6 text-[8px] rounded-lg" onClick={e => e.preventDefault()}><Bookmark className="h-2.5 w-2.5" /></Button>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </DashboardLayout>
  );
}
