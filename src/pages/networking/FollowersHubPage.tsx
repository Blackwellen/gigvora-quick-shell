import React, { useState } from 'react';
import { NetworkShell } from '@/components/shell/NetworkShell';
import { SectionCard, KPICard } from '@/components/shell/EnterprisePrimitives';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Star, Search, UserPlus, Eye, Bell, Users, Filter,
  MapPin, Briefcase, Clock, ChevronDown, TrendingUp,
  MessageSquare, Building2,
} from 'lucide-react';

const FOLLOWERS = [
  { id: '1', name: 'Jordan Blake', avatar: 'JB', headline: 'UX Researcher @ Google', location: 'Seattle', followedSince: 'Mar 2025', isFollowing: true, industry: 'Tech', mutual: 8 },
  { id: '2', name: 'Rina Okamoto', avatar: 'RO', headline: 'CTO @ Stealth Startup', location: 'Tokyo', followedSince: 'Feb 2025', isFollowing: false, industry: 'Startups', mutual: 3 },
  { id: '3', name: 'Carlos Mendez', avatar: 'CM', headline: 'Data Scientist @ Spotify', location: 'Barcelona', followedSince: 'Jan 2025', isFollowing: true, industry: 'Music Tech', mutual: 12 },
  { id: '4', name: 'Nina Petrova', avatar: 'NP', headline: 'Product Manager @ Notion', location: 'Berlin', followedSince: 'Apr 2025', isFollowing: false, industry: 'Productivity', mutual: 5 },
  { id: '5', name: 'Alex Okafor', avatar: 'AO', headline: 'Frontend Lead @ Shopify', location: 'Toronto', followedSince: 'Apr 2025', isFollowing: false, industry: 'E-commerce', mutual: 7 },
  { id: '6', name: 'Lisa Chen', avatar: 'LC', headline: 'Staff Engineer @ Meta', location: 'Menlo Park', followedSince: 'Mar 2025', isFollowing: true, industry: 'Social', mutual: 14 },
  { id: '7', name: 'Tom Wright', avatar: 'TW', headline: 'Creative Director @ Pentagram', location: 'London', followedSince: 'Jan 2025', isFollowing: false, industry: 'Design', mutual: 2 },
  { id: '8', name: 'Priya Shah', avatar: 'PS', headline: 'VP Marketing @ HubSpot', location: 'Boston', followedSince: 'Dec 2024', isFollowing: true, industry: 'Marketing', mutual: 9 },
];

const FILTER_CATEGORIES = [
  { label: 'Status', options: ['Following back', 'Not following', 'Connected', 'Not connected'] },
  { label: 'Industry', options: ['Tech', 'Design', 'Startups', 'Marketing', 'Finance', 'E-commerce'] },
  { label: 'Location', options: ['US', 'Europe', 'Asia', 'Remote', 'Local'] },
  { label: 'Followed Since', options: ['Last 7 days', 'Last 30 days', 'Last 90 days', '6+ months'] },
  { label: 'Mutual', options: ['10+', '5-9', '1-4', 'None'] },
  { label: 'Activity', options: ['Active today', 'This week', 'This month', 'Inactive'] },
];

export default function FollowersHubPage() {
  const [tab, setTab] = useState('all');
  const [search, setSearch] = useState('');
  const [showFilters, setShowFilters] = useState(true);

  const filtered = FOLLOWERS.filter(f => {
    if (search && !f.name.toLowerCase().includes(search.toLowerCase())) return false;
    if (tab === 'not-following') return !f.isFollowing;
    if (tab === 'mutual') return f.isFollowing;
    return true;
  });

  return (
    <NetworkShell backLabel="Followers" backRoute="/networking">
      <div className="flex items-center gap-3 flex-wrap rounded-2xl border bg-card px-5 py-3 shadow-card mb-4">
        <Star className="h-4 w-4 text-accent" />
        <h1 className="text-sm font-bold mr-2">Followers</h1>
        <KPICard label="Followers" value="1,280" change="+48 this month" trend="up" />
        <KPICard label="Not Following Back" value={String(FOLLOWERS.filter(f => !f.isFollowing).length)} />
        <KPICard label="New (7d)" value="12" change="+3" trend="up" />
        <KPICard label="Profile Views" value="89" change="+15%" trend="up" />
      </div>

      <div className="flex items-center gap-2 mb-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input placeholder="Search followers..." value={search} onChange={e => setSearch(e.target.value)} className="pl-8 h-8 text-xs" />
        </div>
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="h-7">
            <TabsTrigger value="all" className="text-[10px] h-5 px-2">All</TabsTrigger>
            <TabsTrigger value="not-following" className="text-[10px] h-5 px-2">Not Following</TabsTrigger>
            <TabsTrigger value="mutual" className="text-[10px] h-5 px-2">Mutual</TabsTrigger>
          </TabsList>
        </Tabs>
        <Button variant="outline" size="sm" onClick={() => setShowFilters(!showFilters)} className={`h-7 text-[10px] gap-1 rounded-xl ${showFilters ? 'bg-accent/10 border-accent/30' : ''}`}>
          <Filter className="h-3 w-3" /> Filters <ChevronDown className="h-2.5 w-2.5" />
        </Button>
      </div>

      {showFilters && (
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-2 mb-4 p-3 rounded-xl border border-border/40 bg-card/50">
          {FILTER_CATEGORIES.map(fc => (
            <div key={fc.label}>
              <div className="text-[8px] font-semibold text-muted-foreground mb-1">{fc.label}</div>
              <div className="flex flex-wrap gap-1">
                {fc.options.map(o => (
                  <Badge key={o} variant="outline" className="text-[7px] h-3.5 px-1.5 cursor-pointer hover:bg-accent/10 hover:border-accent/30 transition-colors">{o}</Badge>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="space-y-2">
        {filtered.map(f => (
          <div key={f.id} className="flex items-center gap-3 p-3.5 rounded-xl border border-border/40 hover:border-accent/30 hover:bg-accent/5 transition-all">
            <Avatar className="h-10 w-10 ring-2 ring-accent/10">
              <AvatarFallback className="text-xs bg-accent/10 text-accent">{f.avatar}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold">{f.name}</span>
                {f.isFollowing && <Badge className="text-[7px] h-3.5 bg-accent/10 text-accent border-0">Mutual</Badge>}
              </div>
              <div className="text-[10px] text-muted-foreground">{f.headline}</div>
              <div className="flex items-center gap-3 mt-0.5 text-[9px] text-muted-foreground">
                <span className="flex items-center gap-0.5"><MapPin className="h-2.5 w-2.5" /> {f.location}</span>
                <span className="flex items-center gap-0.5"><Building2 className="h-2.5 w-2.5" /> {f.industry}</span>
                <span>{f.mutual} mutual</span>
                <span>Since {f.followedSince}</span>
              </div>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              {f.isFollowing ? (
                <Badge variant="secondary" className="text-[8px] h-5">Following</Badge>
              ) : (
                <Button variant="outline" size="sm" className="h-7 text-[9px] gap-1 rounded-xl"><UserPlus className="h-3 w-3" /> Follow Back</Button>
              )}
              <Button variant="ghost" size="sm" className="h-7 w-7 p-0 rounded-lg"><MessageSquare className="h-3 w-3" /></Button>
              <Button variant="ghost" size="sm" className="h-7 w-7 p-0 rounded-lg"><Eye className="h-3 w-3" /></Button>
            </div>
          </div>
        ))}
      </div>
    </NetworkShell>
  );
}
