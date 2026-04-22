import React, { useState } from 'react';
import { NetworkShell } from '@/components/shell/NetworkShell';
import { SectionCard, KPICard } from '@/components/shell/EnterprisePrimitives';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Users, Search, MessageSquare, UserMinus, Clock, MapPin,
  Filter, Eye, Briefcase, Star, Globe, ChevronDown,
  Tag, Building2, GraduationCap, Award,
} from 'lucide-react';

const MOCK_CONNECTIONS = [
  { id: '1', name: 'Maya Chen', avatar: 'MC', headline: 'Product Lead @ Stripe', location: 'San Francisco', connectedSince: 'Jan 2025', mutual: 12, lastActive: '2h ago', industry: 'Fintech', degree: '1st', tags: ['Mentor', 'Collaborator'] },
  { id: '2', name: 'James Rivera', avatar: 'JR', headline: 'Staff Engineer @ Vercel', location: 'New York', connectedSince: 'Mar 2025', mutual: 8, lastActive: '1d ago', industry: 'Dev Tools', degree: '1st', tags: ['Peer'] },
  { id: '3', name: 'Aisha Patel', avatar: 'AP', headline: 'Design Director @ Figma', location: 'London', connectedSince: 'Feb 2025', mutual: 15, lastActive: '5h ago', industry: 'Design', degree: '1st', tags: ['Mentor', 'Speaker'] },
  { id: '4', name: 'Leo Tanaka', avatar: 'LT', headline: 'VP Eng @ Datadog', location: 'Remote', connectedSince: 'Dec 2024', mutual: 6, lastActive: '3d ago', industry: 'Observability', degree: '1st', tags: ['Leader'] },
  { id: '5', name: 'Sara Kim', avatar: 'SK', headline: 'ML Engineer @ OpenAI', location: 'San Francisco', connectedSince: 'Apr 2025', mutual: 19, lastActive: '30m ago', industry: 'AI/ML', degree: '1st', tags: ['Collaborator'] },
  { id: '6', name: 'David Park', avatar: 'DP', headline: 'Growth Lead @ Ramp', location: 'New York', connectedSince: 'Nov 2024', mutual: 10, lastActive: '1w ago', industry: 'Fintech', degree: '1st', tags: [] },
  { id: '7', name: 'Elena Vasquez', avatar: 'EV', headline: 'VP Eng @ Cloudflare', location: 'Austin', connectedSince: 'Sep 2024', mutual: 24, lastActive: '12h ago', industry: 'Infrastructure', degree: '1st', tags: ['Leader', 'Mentor'] },
  { id: '8', name: 'Raj Krishnan', avatar: 'RK', headline: 'Principal Architect @ AWS', location: 'Seattle', connectedSince: 'Aug 2024', mutual: 18, lastActive: '2d ago', industry: 'Cloud', degree: '1st', tags: ['Expert'] },
];

const FILTER_CATEGORIES = [
  { label: 'Industry', options: ['Fintech', 'Dev Tools', 'AI/ML', 'Design', 'Cloud', 'Infrastructure', 'Observability'] },
  { label: 'Location', options: ['San Francisco', 'New York', 'London', 'Remote', 'Austin', 'Seattle', 'Global'] },
  { label: 'Activity', options: ['Active today', 'This week', 'This month', 'Inactive 30d+'] },
  { label: 'Tags', options: ['Mentor', 'Collaborator', 'Leader', 'Speaker', 'Expert', 'Peer'] },
  { label: 'Connected', options: ['Last 30 days', 'Last 90 days', 'Last year', '1+ year'] },
  { label: 'Mutual Count', options: ['20+', '10-19', '5-9', '1-4', 'None'] },
];

export default function ConnectionsHubPage() {
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState('all');
  const [showFilters, setShowFilters] = useState(true);
  const filtered = MOCK_CONNECTIONS.filter(c => c.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <NetworkShell backLabel="Connections" backRoute="/networking">
      <div className="flex items-center gap-3 flex-wrap rounded-2xl border bg-card px-5 py-3 shadow-card mb-4">
        <Users className="h-4 w-4 text-accent" />
        <h1 className="text-sm font-bold mr-2">Connections</h1>
        <KPICard label="Total" value="342" />
        <KPICard label="New (30d)" value="18" change="+5 this week" trend="up" />
        <KPICard label="Pending Sent" value="3" />
        <KPICard label="Pending Received" value="5" />
        <KPICard label="Active Today" value="28" />
      </div>

      <div className="flex items-center gap-2 mb-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input placeholder="Search connections..." value={search} onChange={e => setSearch(e.target.value)} className="pl-8 h-8 text-xs" />
        </div>
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="h-7">
            <TabsTrigger value="all" className="text-[10px] h-5 px-2">All</TabsTrigger>
            <TabsTrigger value="recent" className="text-[10px] h-5 px-2">Recent</TabsTrigger>
            <TabsTrigger value="active" className="text-[10px] h-5 px-2">Active</TabsTrigger>
            <TabsTrigger value="tagged" className="text-[10px] h-5 px-2">Tagged</TabsTrigger>
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
                {fc.options.slice(0, 4).map(o => (
                  <Badge key={o} variant="outline" className="text-[7px] h-3.5 px-1.5 cursor-pointer hover:bg-accent/10 hover:border-accent/30 transition-colors">{o}</Badge>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="space-y-2">
        {filtered.map(c => (
          <div key={c.id} className="flex items-center gap-3 p-3.5 rounded-xl border border-border/40 hover:border-accent/30 hover:bg-accent/5 transition-all group">
            <Avatar className="h-11 w-11 ring-2 ring-accent/10">
              <AvatarFallback className="text-xs bg-accent/10 text-accent">{c.avatar}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold">{c.name}</span>
                <Badge variant="secondary" className="text-[7px] h-3.5">{c.degree}</Badge>
                {c.tags.map(t => <Badge key={t} className="text-[7px] h-3.5 bg-accent/10 text-accent border-0">{t}</Badge>)}
              </div>
              <div className="text-[10px] text-muted-foreground">{c.headline}</div>
              <div className="flex items-center gap-3 mt-0.5 text-[9px] text-muted-foreground">
                <span className="flex items-center gap-0.5"><MapPin className="h-2.5 w-2.5" /> {c.location}</span>
                <span className="flex items-center gap-0.5"><Building2 className="h-2.5 w-2.5" /> {c.industry}</span>
                <span>{c.mutual} mutual</span>
                <span className="flex items-center gap-0.5"><Clock className="h-2.5 w-2.5" /> {c.connectedSince}</span>
              </div>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <span className="text-[8px] text-muted-foreground mr-1">{c.lastActive}</span>
              <Button variant="ghost" size="sm" className="h-7 w-7 p-0 rounded-lg"><MessageSquare className="h-3.5 w-3.5" /></Button>
              <Button variant="ghost" size="sm" className="h-7 w-7 p-0 rounded-lg"><Eye className="h-3.5 w-3.5" /></Button>
              <Button variant="ghost" size="sm" className="h-7 w-7 p-0 rounded-lg"><Tag className="h-3.5 w-3.5" /></Button>
              <Button variant="ghost" size="sm" className="h-7 w-7 p-0 rounded-lg opacity-0 group-hover:opacity-100"><UserMinus className="h-3.5 w-3.5" /></Button>
            </div>
          </div>
        ))}
      </div>
    </NetworkShell>
  );
}
