import React, { useState } from 'react';
import { DashboardLayout } from '@/components/shell/DashboardLayout';
import { SectionCard, KPICard, KPIBand } from '@/components/shell/EnterprisePrimitives';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  Calendar, Clock, MapPin, Users, Plus, Video,
  CheckCircle, ExternalLink, Bell,
} from 'lucide-react';

type EventStatus = 'upcoming' | 'live' | 'past';

interface GroupEvent {
  id: string; title: string; date: string; time: string;
  location: string; attendees: number; capacity: number;
  status: EventStatus; rsvpd: boolean; host: string;
}

const EVENTS: GroupEvent[] = [
  { id: '1', title: 'React Meetup — Best Practices 2026', date: 'Apr 20, 2026', time: '6:00 PM EST', location: 'Virtual', attendees: 89, capacity: 150, status: 'upcoming', rsvpd: true, host: 'Sarah Kim' },
  { id: '2', title: 'Code Review Workshop', date: 'Apr 25, 2026', time: '2:00 PM EST', location: 'Virtual', attendees: 34, capacity: 50, status: 'upcoming', rsvpd: false, host: 'Mike Liu' },
  { id: '3', title: 'Live Coding: Server Components', date: 'May 1, 2026', time: '7:00 PM EST', location: 'Virtual', attendees: 0, capacity: 100, status: 'upcoming', rsvpd: false, host: 'Maya Chen' },
  { id: '4', title: 'Speed Networking Session', date: 'Apr 15, 2026', time: '5:00 PM EST', location: 'Virtual', attendees: 42, capacity: 42, status: 'past', rsvpd: true, host: 'Sarah Kim' },
  { id: '5', title: 'AMA with React Core Team', date: 'Apr 10, 2026', time: '3:00 PM EST', location: 'Virtual', attendees: 156, capacity: 200, status: 'past', rsvpd: true, host: 'Alex Torres' },
];

const STATUS_STYLES: Record<EventStatus, string> = {
  upcoming: 'bg-accent/10 text-accent',
  live: 'bg-destructive/10 text-destructive',
  past: 'bg-muted text-muted-foreground',
};

export default function GroupEventsPage() {
  const [statusFilter, setStatusFilter] = useState<'all' | EventStatus>('all');
  const filtered = EVENTS.filter(e => statusFilter === 'all' || e.status === statusFilter);

  const topStrip = (
    <>
      <Calendar className="h-4 w-4 text-muted-foreground" />
      <span className="text-xs font-semibold">React Developers — Events</span>
      <div className="flex-1" />
      <div className="flex items-center gap-1 bg-muted/40 rounded-xl p-0.5">
        {(['all', 'upcoming', 'past'] as const).map(f => (
          <button key={f} onClick={() => setStatusFilter(f)} className={cn('px-2 py-1 rounded-lg text-[8px] font-medium transition-colors capitalize', statusFilter === f ? 'bg-card shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground')}>{f}</button>
        ))}
      </div>
      <Button size="sm" className="h-7 text-[10px] gap-1"><Plus className="h-3 w-3" />Create Event</Button>
    </>
  );

  return (
    <DashboardLayout topStrip={topStrip}>
      <KPIBand className="mb-3">
        <KPICard label="Upcoming" value={String(EVENTS.filter(e => e.status === 'upcoming').length)} className="!rounded-2xl" />
        <KPICard label="Your RSVPs" value={String(EVENTS.filter(e => e.rsvpd).length)} className="!rounded-2xl" />
        <KPICard label="Past Events" value={String(EVENTS.filter(e => e.status === 'past').length)} className="!rounded-2xl" />
        <KPICard label="Total Attendees" value={String(EVENTS.reduce((s, e) => s + e.attendees, 0))} className="!rounded-2xl" />
      </KPIBand>

      <div className="space-y-2.5">
        {filtered.map(ev => (
          <div key={ev.id} className="rounded-2xl border bg-card p-4 hover:shadow-sm transition-all">
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[12px] font-bold">{ev.title}</span>
                  <Badge className={cn('text-[7px] border-0 capitalize rounded-lg', STATUS_STYLES[ev.status])}>{ev.status}</Badge>
                </div>
                <div className="flex items-center gap-3 text-[9px] text-muted-foreground">
                  <span className="flex items-center gap-0.5"><Calendar className="h-2.5 w-2.5" />{ev.date}</span>
                  <span className="flex items-center gap-0.5"><Clock className="h-2.5 w-2.5" />{ev.time}</span>
                  <span className="flex items-center gap-0.5"><MapPin className="h-2.5 w-2.5" />{ev.location}</span>
                  <span className="flex items-center gap-0.5"><Users className="h-2.5 w-2.5" />{ev.attendees}/{ev.capacity}</span>
                </div>
                <div className="text-[8px] text-muted-foreground mt-1">Hosted by {ev.host}</div>
              </div>
              <div className="flex items-center gap-1.5">
                {ev.rsvpd ? (
                  <Badge className="text-[8px] h-5 bg-[hsl(var(--state-healthy)/0.1)] text-[hsl(var(--state-healthy))] border-0 gap-0.5 rounded-lg"><CheckCircle className="h-2.5 w-2.5" />RSVP'd</Badge>
                ) : ev.status === 'upcoming' ? (
                  <Button size="sm" className="h-7 text-[9px] rounded-xl gap-1"><Bell className="h-3 w-3" />RSVP</Button>
                ) : (
                  <Button variant="outline" size="sm" className="h-7 text-[9px] rounded-xl gap-1"><Video className="h-3 w-3" />Replay</Button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </DashboardLayout>
  );
}
