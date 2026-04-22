import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { NetworkShell } from '@/components/shell/NetworkShell';
import { SectionCard, KPICard, StatusBadge } from '@/components/shell/EnterprisePrimitives';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import {
  Radio, Plus, Users, Clock, Mic, Lock, Globe, Volume2, Search,
  Filter, ChevronDown, MapPin, Star, Zap, Calendar, Building2,
  Eye, Crown, Shield, Heart, Tag, Sparkles, ArrowRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Room {
  id: string; name: string; host: string; hostAvatar: string;
  attendees: number; maxAttendees: number; status: 'live' | 'upcoming' | 'ended';
  topic: string; access: 'public' | 'invite' | 'enterprise';
  duration: string; speakers: string[]; description: string;
  industry: string; language: string; hostVerified: boolean;
  format: 'discussion' | 'panel' | 'fireside' | 'workshop' | 'ama';
  level: 'beginner' | 'intermediate' | 'advanced' | 'all';
  tags: string[];
}

const ROOMS: Room[] = [
  { id: '1', name: 'AI in Product Management', host: 'Sarah Kim', hostAvatar: 'SK', attendees: 18, maxAttendees: 30, status: 'live', topic: 'AI / Product', access: 'public', duration: '45 min', speakers: ['SK', 'ML', 'AP'], description: 'Explore how AI is transforming product management workflows and decision-making.', industry: 'Technology', language: 'English', hostVerified: true, format: 'panel', level: 'intermediate', tags: ['AI', 'Product Management'] },
  { id: '2', name: 'Remote Work Best Practices', host: 'Mike Liu', hostAvatar: 'ML', attendees: 24, maxAttendees: 50, status: 'live', topic: 'Remote Work', access: 'public', duration: '1h 12min', speakers: ['ML', 'JR'], description: 'Sharing strategies for effective remote team management.', industry: 'Management', language: 'English', hostVerified: true, format: 'fireside', level: 'all', tags: ['Remote', 'Leadership'] },
  { id: '3', name: 'Startup Fundraising Q&A', host: 'Ana Rodriguez', hostAvatar: 'AR', attendees: 32, maxAttendees: 40, status: 'live', topic: 'Startups', access: 'public', duration: '28 min', speakers: ['AR', 'DC', 'LP'], description: 'Open Q&A on fundraising strategies for early-stage startups.', industry: 'Venture Capital', language: 'English', hostVerified: false, format: 'ama', level: 'beginner', tags: ['Fundraising', 'Startups'] },
  { id: '4', name: 'Enterprise Architecture Review', host: 'David Chen', hostAvatar: 'DC', attendees: 8, maxAttendees: 15, status: 'live', topic: 'Architecture', access: 'invite', duration: '15 min', speakers: ['DC'], description: 'Invite-only session reviewing enterprise architecture patterns.', industry: 'Engineering', language: 'English', hostVerified: true, format: 'workshop', level: 'advanced', tags: ['Architecture', 'Enterprise'] },
  { id: '5', name: 'Design System Critique', host: 'Lisa Park', hostAvatar: 'LP', attendees: 0, maxAttendees: 25, status: 'upcoming', topic: 'Design', access: 'public', duration: 'Starts in 2h', speakers: [], description: 'Collaborative critique of design systems from top companies.', industry: 'Design', language: 'English', hostVerified: false, format: 'discussion', level: 'intermediate', tags: ['Design Systems', 'UX'] },
  { id: '6', name: 'Cloud Security Roundtable', host: 'James Rivera', hostAvatar: 'JR', attendees: 0, maxAttendees: 20, status: 'upcoming', topic: 'Security', access: 'public', duration: 'Tomorrow 3 PM', speakers: [], description: 'Discussion on cloud security best practices and emerging threats.', industry: 'Cybersecurity', language: 'English', hostVerified: true, format: 'panel', level: 'advanced', tags: ['Security', 'Cloud'] },
  { id: '7', name: 'Japón Tech Meetup', host: 'Yuki Tanaka', hostAvatar: 'YT', attendees: 0, maxAttendees: 30, status: 'upcoming', topic: 'Community', access: 'public', duration: 'Friday 10 AM JST', speakers: [], description: 'Monthly meetup for tech professionals in Japan.', industry: 'Technology', language: 'Japanese', hostVerified: false, format: 'discussion', level: 'all', tags: ['Japan', 'Community'] },
  { id: '8', name: 'Series A Founders Circle', host: 'Elena Vasquez', hostAvatar: 'EV', attendees: 12, maxAttendees: 15, status: 'live', topic: 'Startups', access: 'enterprise', duration: '52 min', speakers: ['EV', 'RK'], description: 'Enterprise-only circle for Series A founders.', industry: 'Venture Capital', language: 'English', hostVerified: true, format: 'fireside', level: 'advanced', tags: ['Founders', 'Enterprise'] },
];

const FORMAT_COLORS: Record<string, string> = {
  discussion: 'bg-accent/10 text-accent',
  panel: 'bg-[hsl(var(--gigvora-purple))]/10 text-[hsl(var(--gigvora-purple))]',
  fireside: 'bg-[hsl(var(--gigvora-amber))]/10 text-[hsl(var(--gigvora-amber))]',
  workshop: 'bg-[hsl(var(--state-healthy))]/10 text-[hsl(var(--state-healthy))]',
  ama: 'bg-[hsl(var(--state-review))]/10 text-[hsl(var(--state-review))]',
};

const ACCESS_ICONS = { public: Globe, invite: Lock, enterprise: Shield };

const FILTER_CATEGORIES = [
  { label: 'Status', options: ['Live Now', 'Upcoming', 'Starting Soon'] },
  { label: 'Topic', options: ['AI', 'Product', 'Design', 'Engineering', 'Startups', 'Remote Work', 'Security', 'Community'] },
  { label: 'Format', options: ['Discussion', 'Panel', 'Fireside Chat', 'Workshop', 'AMA'] },
  { label: 'Access', options: ['Public', 'Invite Only', 'Enterprise'] },
  { label: 'Industry', options: ['Technology', 'Design', 'Venture Capital', 'Engineering', 'Management', 'Cybersecurity'] },
  { label: 'Level', options: ['Beginner', 'Intermediate', 'Advanced', 'All Levels'] },
  { label: 'Language', options: ['English', 'Spanish', 'Japanese', 'French', 'German'] },
  { label: 'Size', options: ['Small (<15)', 'Medium (15-30)', 'Large (30+)'] },
  { label: 'Duration', options: ['< 30 min', '30-60 min', '1h+'] },
  { label: 'Host', options: ['Verified Hosts', 'Enterprise Hosts', 'Community Hosts'] },
  { label: 'Capacity', options: ['Spots Available', 'Almost Full', 'Waitlist'] },
  { label: 'Time', options: ['Now', 'Next Hour', 'Today', 'This Week'] },
];

export default function NetworkingRoomsLobbyPage() {
  const [tab, setTab] = useState('all');
  const [search, setSearch] = useState('');
  const [showFilters, setShowFilters] = useState(true);
  const navigate = useNavigate();

  const liveCount = ROOMS.filter(r => r.status === 'live').length;
  const totalListeners = ROOMS.filter(r => r.status === 'live').reduce((a, r) => a + r.attendees, 0);

  const filtered = ROOMS.filter(r => {
    if (tab === 'live' && r.status !== 'live') return false;
    if (tab === 'upcoming' && r.status !== 'upcoming') return false;
    if (search && !r.name.toLowerCase().includes(search.toLowerCase()) && !r.topic.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <NetworkShell backLabel="Rooms" backRoute="/networking">
      {/* KPI Strip */}
      <div className="flex items-center gap-3 flex-wrap rounded-2xl border bg-card px-5 py-3 shadow-card mb-4">
        <Radio className="h-4 w-4 text-[hsl(var(--state-live))]" />
        <h1 className="text-sm font-bold mr-2">Networking Rooms</h1>
        <KPICard label="Live Rooms" value={String(liveCount)} change="now" trend="up" />
        <KPICard label="Total Listeners" value={String(totalListeners)} />
        <KPICard label="Upcoming" value={String(ROOMS.filter(r => r.status === 'upcoming').length)} />
        <KPICard label="Rooms Today" value={String(ROOMS.length)} />
      </div>

      {/* Controls */}
      <div className="flex items-center gap-2 mb-3 flex-wrap">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input placeholder="Search rooms, topics, hosts..." value={search} onChange={e => setSearch(e.target.value)} className="pl-8 h-8 text-xs" />
        </div>
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="h-7">
            <TabsTrigger value="all" className="text-[10px] h-5 px-2">All</TabsTrigger>
            <TabsTrigger value="live" className="text-[10px] h-5 px-2 gap-1">Live <span className="h-1.5 w-1.5 rounded-full bg-[hsl(var(--state-live))] animate-pulse" /></TabsTrigger>
            <TabsTrigger value="upcoming" className="text-[10px] h-5 px-2">Upcoming</TabsTrigger>
          </TabsList>
        </Tabs>
        <Button variant="outline" size="sm" onClick={() => setShowFilters(!showFilters)} className={`h-7 text-[10px] gap-1 rounded-xl ${showFilters ? 'bg-accent/10 border-accent/30' : ''}`}>
          <Filter className="h-3 w-3" /> Filters ({FILTER_CATEGORIES.length}) <ChevronDown className="h-2.5 w-2.5" />
        </Button>
        <Button size="sm" className="h-7 text-[10px] gap-1 rounded-xl" onClick={() => navigate('/networking/rooms/create')}>
          <Plus className="h-3 w-3" /> Create Room
        </Button>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-2 mb-4 p-3 rounded-xl border border-border/40 bg-card/50">
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

      {/* Room Cards */}
      <div className="space-y-3">
        {filtered.map(r => {
          const AccessIcon = ACCESS_ICONS[r.access];
          const capacityPct = r.maxAttendees > 0 ? (r.attendees / r.maxAttendees) * 100 : 0;
          return (
            <div key={r.id} className={cn(
              'p-4 rounded-2xl border transition-all hover:shadow-md cursor-pointer group',
              r.status === 'live' ? 'border-[hsl(var(--state-live))]/30 bg-[hsl(var(--state-live))]/3' : 'border-border/40 hover:border-accent/30'
            )} onClick={() => navigate(`/networking/rooms/${r.id}`)}>
              <div className="flex items-start gap-3">
                <div className="relative">
                  <Avatar className="h-12 w-12 ring-2 ring-accent/10">
                    <AvatarFallback className="text-sm bg-accent/10 text-accent">{r.hostAvatar}</AvatarFallback>
                  </Avatar>
                  {r.hostVerified && (
                    <div className="absolute -bottom-0.5 -right-0.5 h-4 w-4 rounded-full bg-accent flex items-center justify-center">
                      <Crown className="h-2.5 w-2.5 text-white" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                    <span className="text-xs font-bold group-hover:text-accent transition-colors">{r.name}</span>
                    {r.status === 'live' && <StatusBadge status="live" />}
                    <Badge className={cn('text-[7px] h-3.5 border-0 capitalize', FORMAT_COLORS[r.format])}>{r.format}</Badge>
                    <Badge variant="outline" className="text-[7px] h-3.5 gap-0.5"><AccessIcon className="h-2 w-2" /> {r.access === 'enterprise' ? 'Enterprise' : r.access === 'invite' ? 'Invite' : 'Public'}</Badge>
                  </div>
                  <p className="text-[9px] text-muted-foreground mb-1.5 line-clamp-1">{r.description}</p>
                  <div className="flex items-center gap-3 text-[9px] text-muted-foreground flex-wrap">
                    <span>Host: <strong>{r.host}</strong></span>
                    <span className="flex items-center gap-0.5"><Users className="h-2.5 w-2.5" /> {r.attendees}/{r.maxAttendees}</span>
                    <span className="flex items-center gap-0.5"><Clock className="h-2.5 w-2.5" /> {r.duration}</span>
                    <span className="flex items-center gap-0.5"><Building2 className="h-2.5 w-2.5" /> {r.industry}</span>
                    <Badge variant="secondary" className="text-[7px] h-3.5 capitalize">{r.level}</Badge>
                  </div>
                  {/* Capacity bar */}
                  {r.status === 'live' && (
                    <div className="flex items-center gap-2 mt-1.5">
                      <Progress value={capacityPct} className={cn('h-1 flex-1 max-w-[120px]', capacityPct > 80 ? '[&>div]:bg-[hsl(var(--state-critical))]' : '')} />
                      <span className="text-[8px] text-muted-foreground">{capacityPct > 80 ? 'Almost full' : `${Math.round(100 - capacityPct)}% available`}</span>
                    </div>
                  )}
                  {/* Speakers */}
                  {r.speakers.length > 0 && (
                    <div className="flex items-center gap-1 mt-2">
                      <Volume2 className="h-2.5 w-2.5 text-muted-foreground" />
                      <span className="text-[8px] text-muted-foreground mr-1">Speaking:</span>
                      <div className="flex -space-x-1.5">
                        {r.speakers.map(s => (
                          <Avatar key={s} className="h-5 w-5 border-2 border-background">
                            <AvatarFallback className="text-[6px] bg-muted">{s}</AvatarFallback>
                          </Avatar>
                        ))}
                      </div>
                    </div>
                  )}
                  {/* Tags */}
                  <div className="flex items-center gap-1 mt-1.5 flex-wrap">
                    {r.tags.map(t => <Badge key={t} variant="outline" className="text-[7px] h-3.5 px-1.5">{t}</Badge>)}
                  </div>
                </div>
                <Button size="sm" className={cn('h-8 text-[10px] px-4 shrink-0 rounded-xl gap-1', r.status === 'live' ? '' : 'bg-muted text-muted-foreground hover:bg-accent hover:text-accent-foreground')}>
                  {r.status === 'live' ? <><Radio className="h-3 w-3" /> Join</> : <><Calendar className="h-3 w-3" /> Remind</>}
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </NetworkShell>
  );
}
