import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { DashboardLayout } from '@/components/shell/DashboardLayout';
import { SectionCard, KPICard, KPIBand, StatusBadge } from '@/components/shell/EnterprisePrimitives';
import { SectionBackNav } from '@/components/shell/SectionBackNav';
import { AdvancedFilterPanel, FilterDefinition, FilterValues } from '@/components/shell/AdvancedFilterPanel';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Calendar, Search, Plus, Users, Clock, MapPin, Video, Bookmark,
  Bell, Globe, Filter, Star, TrendingUp, Mic, Wifi, Tag, Zap,
  ChevronRight, Eye, Heart, Share2, SlidersHorizontal,
} from 'lucide-react';

const EVENTS = [
  { id: '1', title: 'AI Product Leaders Summit', type: 'Conference', status: 'upcoming' as const, date: 'Apr 22, 2026', time: '9:00 AM EST', host: 'Gigvora', hostAvatar: 'GV', attendees: 450, maxAttendees: 600, format: 'hybrid' as const, location: 'San Francisco + Virtual', image: '🎙️', tags: ['AI', 'Product', 'Leadership'], price: 'Free', speakers: 8, rating: 4.9, category: 'Technology' },
  { id: '2', title: 'React Performance Workshop', type: 'Workshop', status: 'registering' as const, date: 'Apr 25, 2026', time: '2:00 PM EST', host: 'React Community', hostAvatar: 'RC', attendees: 120, maxAttendees: 150, format: 'virtual' as const, location: 'Virtual', image: '⚡', tags: ['React', 'Performance', 'Frontend'], price: '$49', speakers: 3, rating: 4.7, category: 'Technology' },
  { id: '3', title: 'Startup Pitch Night — NYC', type: 'Meetup', status: 'upcoming' as const, date: 'Apr 28, 2026', time: '6:30 PM EST', host: 'TechVentures', hostAvatar: 'TV', attendees: 80, maxAttendees: 100, format: 'in-person' as const, location: 'New York', image: '🚀', tags: ['Startups', 'Pitch', 'NYC'], price: '$25', speakers: 12, rating: 4.5, category: 'Business' },
  { id: '4', title: 'Cloud Security Masterclass', type: 'Webinar', status: 'live' as const, date: 'Apr 14, 2026', time: 'Now', host: 'SecureOps Inc', hostAvatar: 'SO', attendees: 230, maxAttendees: 500, format: 'virtual' as const, location: 'Virtual', image: '🔒', tags: ['Security', 'Cloud'], price: 'Free', speakers: 2, rating: 4.8, category: 'Technology' },
  { id: '5', title: 'Design Systems Conf 2026', type: 'Conference', status: 'upcoming' as const, date: 'May 5-6, 2026', time: 'All Day', host: 'Design Guild', hostAvatar: 'DG', attendees: 600, maxAttendees: 800, format: 'hybrid' as const, location: 'London + Virtual', image: '🎨', tags: ['Design', 'Systems', 'UI'], price: '$199', speakers: 20, rating: 4.9, category: 'Design' },
  { id: '6', title: 'Remote Work Roundtable', type: 'Roundtable', status: 'registering' as const, date: 'May 2, 2026', time: '11:00 AM EST', host: 'Remote Hub', hostAvatar: 'RH', attendees: 25, maxAttendees: 30, format: 'virtual' as const, location: 'Virtual', image: '🌍', tags: ['Remote', 'Culture'], price: 'Free', speakers: 4, rating: 4.3, category: 'Business' },
  { id: '7', title: 'Data Engineering Summit', type: 'Conference', status: 'upcoming' as const, date: 'May 10, 2026', time: '10:00 AM PST', host: 'DataPro', hostAvatar: 'DP', attendees: 320, maxAttendees: 500, format: 'hybrid' as const, location: 'Seattle + Virtual', image: '📊', tags: ['Data', 'Engineering', 'Pipeline'], price: '$149', speakers: 15, rating: 4.6, category: 'Technology' },
  { id: '8', title: 'UX Research Methods', type: 'Workshop', status: 'past' as const, date: 'Mar 20, 2026', time: '1:00 PM EST', host: 'UX Academy', hostAvatar: 'UA', attendees: 180, maxAttendees: 200, format: 'virtual' as const, location: 'Virtual', image: '🔬', tags: ['UX', 'Research'], price: '$79', speakers: 2, rating: 4.8, category: 'Design' },
];

const EVENT_FILTERS: FilterDefinition[] = [
  { id: 'type', label: 'Event Type', type: 'multi-select', group: 'Event', options: [
    { value: 'Conference', label: 'Conference', count: 3 }, { value: 'Workshop', label: 'Workshop', count: 2 },
    { value: 'Meetup', label: 'Meetup', count: 1 }, { value: 'Webinar', label: 'Webinar', count: 1 },
    { value: 'Roundtable', label: 'Roundtable', count: 1 }, { value: 'Hackathon', label: 'Hackathon' },
  ], defaultOpen: true },
  { id: 'format', label: 'Format', type: 'multi-select', group: 'Event', options: [
    { value: 'virtual', label: 'Virtual', count: 4 }, { value: 'in-person', label: 'In-Person', count: 1 },
    { value: 'hybrid', label: 'Hybrid', count: 3 },
  ], defaultOpen: true },
  { id: 'category', label: 'Category', type: 'multi-select', group: 'Event', options: [
    { value: 'Technology', label: 'Technology' }, { value: 'Design', label: 'Design' },
    { value: 'Business', label: 'Business' }, { value: 'Marketing', label: 'Marketing' },
    { value: 'Finance', label: 'Finance' }, { value: 'HR', label: 'HR & People' },
  ]},
  { id: 'price', label: 'Price Range', type: 'range', group: 'Cost', min: 0, max: 500, step: 25, unit: '$' },
  { id: 'freeOnly', label: 'Free Events Only', type: 'toggle', group: 'Cost' },
  { id: 'dateRange', label: 'Date', type: 'single-select', group: 'When', options: [
    { value: 'today', label: 'Today' }, { value: 'this-week', label: 'This Week' },
    { value: 'this-month', label: 'This Month' }, { value: 'next-month', label: 'Next Month' },
    { value: 'custom', label: 'Custom Range' },
  ]},
  { id: 'attendeeSize', label: 'Attendee Size', type: 'single-select', group: 'Event', options: [
    { value: 'small', label: 'Small (< 50)' }, { value: 'medium', label: 'Medium (50-200)' },
    { value: 'large', label: 'Large (200-500)' }, { value: 'xlarge', label: 'Extra Large (500+)' },
  ]},
  { id: 'location', label: 'Location', type: 'multi-select', group: 'Where', options: [
    { value: 'virtual', label: 'Virtual' }, { value: 'new-york', label: 'New York' },
    { value: 'san-francisco', label: 'San Francisco' }, { value: 'london', label: 'London' },
    { value: 'seattle', label: 'Seattle' }, { value: 'remote', label: 'Remote' },
  ]},
  { id: 'hasRecording', label: 'Has Recording Available', type: 'toggle', group: 'Features' },
  { id: 'hasCertificate', label: 'Offers Certificate', type: 'toggle', group: 'Features' },
  { id: 'speakerCount', label: 'Min Speakers', type: 'range', group: 'Features', min: 1, max: 25, step: 1 },
  { id: 'rating', label: 'Min Rating', type: 'range', group: 'Quality', min: 1, max: 5, step: 0.5 },
  { id: 'spotsAvailable', label: 'Has Spots Available', type: 'toggle', group: 'Availability' },
];

export default function EventsDiscoveryPage() {
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState('all');
  const [showFilters, setShowFilters] = useState(true);
  const [filterValues, setFilterValues] = useState<FilterValues>({});

  const filtered = useMemo(() => {
    return EVENTS.filter(e => {
      if (tab !== 'all' && e.status !== tab) return false;
      if (search && !e.title.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [tab, search]);

  const statusColor = (s: string) => {
    if (s === 'live') return 'live' as const;
    if (s === 'upcoming') return 'healthy' as const;
    if (s === 'registering') return 'pending' as const;
    return 'review' as const;
  };

  return (
    <DashboardLayout
      topStrip={
        <div className="flex items-center gap-4 w-full">
          <Calendar className="h-4 w-4 text-accent" />
          <h1 className="text-sm font-bold mr-4">Events</h1>
          <KPICard label="Upcoming" value="12" />
          <KPICard label="Live Now" value="1" change="Join" trend="up" />
          <KPICard label="Your RSVPs" value="4" />
          <KPICard label="Hosted" value="2" />
          <KPICard label="Past Events" value="24" />
        </div>
      }
    >
      <SectionBackNav homeRoute="/networking" homeLabel="Networking" currentLabel="Events" icon={<Wifi className="h-3 w-3" />} />

      <div className="flex items-center gap-2 mb-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input placeholder="Search events by name, topic, host..." value={search} onChange={e => setSearch(e.target.value)} className="pl-8 h-8 text-xs rounded-xl" />
        </div>
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="h-7">
            <TabsTrigger value="all" className="text-[10px] h-5 px-2">All</TabsTrigger>
            <TabsTrigger value="live" className="text-[10px] h-5 px-2">Live</TabsTrigger>
            <TabsTrigger value="upcoming" className="text-[10px] h-5 px-2">Upcoming</TabsTrigger>
            <TabsTrigger value="registering" className="text-[10px] h-5 px-2">Open</TabsTrigger>
            <TabsTrigger value="past" className="text-[10px] h-5 px-2">Past</TabsTrigger>
          </TabsList>
        </Tabs>
        <Button variant="outline" size="sm" className="h-8 text-[10px] gap-1 rounded-xl" onClick={() => setShowFilters(!showFilters)}>
          <SlidersHorizontal className="h-3 w-3" /> Filters
          {Object.keys(filterValues).length > 0 && (
            <Badge className="text-[7px] h-3.5 px-1 ml-0.5 bg-accent text-accent-foreground">{Object.keys(filterValues).length}</Badge>
          )}
        </Button>
        <Link to="/events/create">
          <Button size="sm" className="h-8 text-[10px] gap-1 rounded-xl"><Plus className="h-3 w-3" /> Create Event</Button>
        </Link>
      </div>

      {showFilters && (
        <div className="mb-4">
          <AdvancedFilterPanel filters={EVENT_FILTERS} values={filterValues} onChange={setFilterValues} inline />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {filtered.map(e => (
          <Link key={e.id} to={`/events/${e.id}`} className="block">
            <SectionCard className="!rounded-2xl hover:shadow-lg transition-all hover:-translate-y-0.5 cursor-pointer group">
              <div className="flex items-start gap-3">
                <div className="h-14 w-14 rounded-xl bg-muted flex items-center justify-center text-2xl shrink-0">{e.image}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <span className="text-[12px] font-bold group-hover:text-accent transition-colors">{e.title}</span>
                    <StatusBadge status={statusColor(e.status)} label={e.status} />
                  </div>
                  <div className="flex items-center gap-2 text-[9px] text-muted-foreground mb-1">
                    <Avatar className="h-4 w-4"><AvatarFallback className="text-[6px] bg-accent/10 text-accent">{e.hostAvatar}</AvatarFallback></Avatar>
                    <span className="font-medium text-foreground">{e.host}</span>
                    <span className="flex items-center gap-0.5"><Calendar className="h-2.5 w-2.5" />{e.date}</span>
                    <span className="flex items-center gap-0.5"><Clock className="h-2.5 w-2.5" />{e.time}</span>
                  </div>
                  <div className="flex items-center gap-2 text-[9px] text-muted-foreground mb-1.5">
                    <span className="flex items-center gap-0.5">{e.format === 'virtual' ? <Video className="h-2.5 w-2.5" /> : <MapPin className="h-2.5 w-2.5" />} {e.location}</span>
                    <span className="flex items-center gap-0.5"><Users className="h-2.5 w-2.5" /> {e.attendees}/{e.maxAttendees}</span>
                    <span className="flex items-center gap-0.5"><Mic className="h-2.5 w-2.5" /> {e.speakers} speakers</span>
                    <span className="flex items-center gap-0.5"><Star className="h-2.5 w-2.5 text-[hsl(var(--gigvora-amber))]" /> {e.rating}</span>
                    <Badge variant="outline" className="text-[7px] h-3.5">{e.type}</Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex gap-1">{e.tags.map(t => <Badge key={t} variant="secondary" className="text-[7px]">{t}</Badge>)}</div>
                    <span className="ml-auto text-[10px] font-bold text-accent">{e.price}</span>
                  </div>
                </div>
                <div className="flex flex-col gap-1 shrink-0">
                  <Button size="sm" className="h-6 text-[8px] rounded-lg">{e.status === 'live' ? 'Join Now' : 'RSVP'}</Button>
                  <Button variant="ghost" size="sm" className="h-6 text-[8px] rounded-lg"><Bookmark className="h-2.5 w-2.5" /></Button>
                </div>
              </div>
            </SectionCard>
          </Link>
        ))}
      </div>
    </DashboardLayout>
  );
}
