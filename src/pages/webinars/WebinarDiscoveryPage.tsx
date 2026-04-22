import React, { useState } from 'react';
import { DashboardLayout } from '@/components/shell/DashboardLayout';
import { SectionCard, KPICard, StatusBadge } from '@/components/shell/EnterprisePrimitives';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Video, Search, Plus, Users, Clock, Ticket, Calendar, Filter, Play, Bookmark, DollarSign } from 'lucide-react';

const WEBINARS = [
  { id: '1', title: 'Scaling AI Infrastructure', host: 'Dr. Raj Patel', image: '🤖', date: 'Apr 22, 2026', time: '2:00 PM EST', status: 'upcoming' as const, attendees: 340, maxAttendees: 500, price: 'Free', tags: ['AI', 'Infrastructure'] },
  { id: '2', title: 'Advanced React Patterns', host: 'Mike Liu', image: '⚛️', date: 'Apr 25, 2026', time: '11:00 AM EST', status: 'registering' as const, attendees: 180, maxAttendees: 300, price: '$29', tags: ['React', 'Advanced'] },
  { id: '3', title: 'Design Systems Workshop', host: 'Lisa Park', image: '🎨', date: 'Apr 14, 2026', time: 'Now', status: 'live' as const, attendees: 210, maxAttendees: 250, price: 'Free', tags: ['Design', 'Workshop'] },
  { id: '4', title: 'Fundraising Masterclass', host: 'Ana Rodriguez', image: '💰', date: 'Apr 28, 2026', time: '3:00 PM EST', status: 'upcoming' as const, attendees: 95, maxAttendees: 150, price: '$49', tags: ['Startups', 'Finance'] },
  { id: '5', title: 'Cloud Security Deep Dive', host: 'David Chen', image: '🔒', date: 'Apr 18, 2026', time: '1:00 PM EST', status: 'registering' as const, attendees: 120, maxAttendees: 200, price: 'Free', tags: ['Security', 'Cloud'] },
  { id: '6', title: 'Product-Led Growth Strategies', host: 'Sarah Kim', image: '📈', date: 'Apr 30, 2026', time: '10:00 AM EST', status: 'upcoming' as const, attendees: 220, maxAttendees: 400, price: '$19', tags: ['Product', 'Growth'] },
];

export default function WebinarDiscoveryPage() {
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState('all');
  const filtered = WEBINARS.filter(w => (tab === 'all' || w.status === tab) && w.title.toLowerCase().includes(search.toLowerCase()));

  return (
    <DashboardLayout
      topStrip={
        <div className="flex items-center gap-4 w-full">
          <Video className="h-4 w-4 text-accent" />
          <h1 className="text-sm font-bold mr-4">Webinars</h1>
          <KPICard label="Upcoming" value="14" />
          <KPICard label="Live Now" value="1" change="Join" trend="up" />
          <KPICard label="Registered" value="6" />
          <KPICard label="Replays" value="42" />
        </div>
      }
    >
      <SectionCard title="Discover Webinars" action={
        <div className="flex items-center gap-2">
          <Tabs value={tab} onValueChange={setTab}>
            <TabsList className="h-7">
              <TabsTrigger value="all" className="text-[10px] h-5 px-2">All</TabsTrigger>
              <TabsTrigger value="live" className="text-[10px] h-5 px-2">Live</TabsTrigger>
              <TabsTrigger value="upcoming" className="text-[10px] h-5 px-2">Upcoming</TabsTrigger>
              <TabsTrigger value="registering" className="text-[10px] h-5 px-2">Open</TabsTrigger>
            </TabsList>
          </Tabs>
          <Button size="sm" className="h-7 text-[10px] gap-1"><Plus className="h-3 w-3" /> Host Webinar</Button>
        </div>
      }>
        <div className="flex items-center gap-2 mb-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input placeholder="Search webinars..." value={search} onChange={e => setSearch(e.target.value)} className="pl-8 h-8 text-xs" />
          </div>
          <Button variant="outline" size="sm" className="h-8 text-[10px] gap-1"><Filter className="h-3 w-3" /> Filter</Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {filtered.map(w => (
            <div key={w.id} className={`p-4 rounded-xl border transition-all hover:shadow-md cursor-pointer group ${w.status === 'live' ? 'ring-2 ring-[hsl(var(--state-live))]/30' : 'border-border/40'}`}>
              <div className="flex items-start gap-3">
                <div className="h-12 w-12 rounded-xl bg-muted flex items-center justify-center text-xl shrink-0">{w.image}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <span className="text-xs font-bold group-hover:text-accent transition-colors">{w.title}</span>
                    {w.status === 'live' && <StatusBadge status="live" />}
                  </div>
                  <div className="text-[10px] text-muted-foreground">{w.host}</div>
                  <div className="flex items-center gap-2 text-[9px] text-muted-foreground mt-1">
                    <span><Calendar className="h-2.5 w-2.5 inline" /> {w.date} · {w.time}</span>
                    <span><Users className="h-2.5 w-2.5 inline" /> {w.attendees}/{w.maxAttendees}</span>
                  </div>
                  <div className="flex items-center gap-1 mt-1.5">
                    <Badge variant={w.price === 'Free' ? 'secondary' : 'outline'} className="text-[7px] h-3.5">{w.price}</Badge>
                    {w.tags.map(t => <Badge key={t} variant="outline" className="text-[7px] h-3.5">{t}</Badge>)}
                  </div>
                </div>
                <div className="flex flex-col gap-1 shrink-0">
                  <Button size="sm" className="h-6 text-[8px] rounded-lg">{w.status === 'live' ? 'Join' : 'Register'}</Button>
                  <Button variant="ghost" size="sm" className="h-6 text-[8px] rounded-lg"><Bookmark className="h-2.5 w-2.5" /></Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </SectionCard>
    </DashboardLayout>
  );
}
