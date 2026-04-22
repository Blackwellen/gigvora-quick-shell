import React from 'react';
import { Link } from 'react-router-dom';
import { LaunchpadShell } from '@/components/launchpad/LaunchpadShell';
import { SectionCard, KPICard, KPIBand } from '@/components/shell/EnterprisePrimitives';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import {
  Calendar, Clock, Users, Video, Globe, MapPin, Mic,
  ChevronRight, Star, Play, Radio, Tv,
} from 'lucide-react';

const EVENTS = [
  { id: 'e1', title: 'Portfolio Review Workshop', date: 'Apr 16, 2026', time: '2:00 PM GMT', type: 'Workshop', host: 'DesignFlow', avatar: 'DF', attendees: 45, slots: 60, format: 'Virtual', beginner: true, free: true, live: false },
  { id: 'e2', title: 'Speed Networking: Tech Juniors', date: 'Apr 18, 2026', time: '11:00 AM PST', type: 'Networking', host: 'Gigvora', avatar: 'GV', attendees: 80, slots: 100, format: 'Virtual', beginner: true, free: true, live: false },
  { id: 'e3', title: 'Ask Me Anything: Product Management', date: 'Apr 20, 2026', time: '3:00 PM EST', type: 'AMA', host: 'PMSchool', avatar: 'PM', attendees: 120, slots: 200, format: 'Virtual', beginner: true, free: true, live: false },
  { id: 'e4', title: 'Company Open Day: TechCorp', date: 'Apr 22, 2026', time: '10:00 AM GMT', type: 'Open Day', host: 'TechCorp', avatar: 'TC', attendees: 35, slots: 50, format: 'Hybrid', beginner: true, free: true, live: false },
  { id: 'e5', title: 'Interview Prep Masterclass', date: 'Apr 25, 2026', time: '1:00 PM PST', type: 'Masterclass', host: 'Career Academy', avatar: 'CA', attendees: 200, slots: 300, format: 'Virtual', beginner: true, free: false, live: false },
  { id: 'e6', title: 'Live Coding: Build a Todo App', date: 'Today', time: '4:00 PM GMT', type: 'Live Session', host: 'DevMaster', avatar: 'DM', attendees: 56, slots: 100, format: 'Virtual', beginner: true, free: true, live: true },
];

const EVENT_TYPE_COLORS: Record<string, string> = {
  Workshop: 'bg-accent/10 text-accent',
  Networking: 'bg-[hsl(var(--gigvora-purple))]/10 text-[hsl(var(--gigvora-purple))]',
  AMA: 'bg-[hsl(var(--gigvora-amber))]/10 text-[hsl(var(--gigvora-amber))]',
  'Open Day': 'bg-[hsl(var(--state-healthy))]/10 text-[hsl(var(--state-healthy))]',
  Masterclass: 'bg-primary/10 text-primary',
  'Live Session': 'bg-[hsl(var(--state-live))]/10 text-[hsl(var(--state-live))]',
};

export default function LaunchpadEventsPage() {
  return (
    <LaunchpadShell>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-lg font-bold">Launchpad Events</h1>
          <p className="text-[11px] text-muted-foreground">Workshops, networking, open days, and learning sessions for emerging professionals</p>
        </div>
      </div>

      <KPIBand className="mb-4">
        <KPICard label="Upcoming Events" value={String(EVENTS.length)} className="!rounded-2xl" />
        <KPICard label="RSVPs" value="3" className="!rounded-2xl" />
        <KPICard label="Attended" value="5" className="!rounded-2xl" />
        <KPICard label="Live Now" value={String(EVENTS.filter(e => e.live).length)} className="!rounded-2xl" />
      </KPIBand>

      <div className="flex gap-1.5 mb-4 overflow-x-auto pb-1 scrollbar-none">
        {['All', 'Workshop', 'Networking', 'AMA', 'Open Day', 'Masterclass', 'Live Session'].map(t => (
          <Badge key={t} variant="outline" className="text-[9px] rounded-xl px-3 py-1.5 cursor-pointer hover:bg-accent/10 shrink-0">{t}</Badge>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {EVENTS.map(e => (
          <div key={e.id} className={cn('rounded-2xl border bg-card overflow-hidden hover:shadow-md transition-all cursor-pointer group', e.live && 'border-[hsl(var(--state-live))]/30')}>
            <div className={cn('h-24 bg-gradient-to-br flex items-center justify-center relative', e.live ? 'from-[hsl(var(--state-live))]/15 to-[hsl(var(--state-live))]/5' : 'from-accent/10 to-[hsl(var(--gigvora-purple))]/5')}>
              {e.live ? <Radio className="h-8 w-8 text-[hsl(var(--state-live))]/30 animate-pulse" /> : <Calendar className="h-8 w-8 text-muted-foreground/20" />}
              <Badge className={cn('absolute top-3 left-3 text-[7px] border-0 rounded-lg', EVENT_TYPE_COLORS[e.type] || 'bg-muted text-muted-foreground')}>
                {e.live && <Radio className="h-2 w-2 mr-0.5 animate-pulse" />}{e.type}
              </Badge>
              {e.free ? (
                <Badge className="absolute top-3 right-3 text-[7px] bg-[hsl(var(--state-healthy))]/10 text-[hsl(var(--state-healthy))] border-0 rounded-lg">Free</Badge>
              ) : (
                <Badge className="absolute top-3 right-3 text-[7px] bg-[hsl(var(--gigvora-amber))]/10 text-[hsl(var(--gigvora-amber))] border-0 rounded-lg">Paid</Badge>
              )}
            </div>
            <div className="p-4">
              <div className="text-[12px] font-bold group-hover:text-accent transition-colors mb-1">{e.title}</div>
              <div className="flex items-center gap-2 text-[9px] text-muted-foreground mb-2">
                <Avatar className="h-4 w-4 rounded-md"><AvatarFallback className="rounded-md text-[5px] bg-accent/10 text-accent">{e.avatar}</AvatarFallback></Avatar>
                <span>{e.host}</span>
              </div>
              <div className="flex items-center gap-2 text-[8px] text-muted-foreground mb-3">
                <span className="flex items-center gap-0.5"><Calendar className="h-2.5 w-2.5" />{e.date}</span>
                <span className="flex items-center gap-0.5"><Clock className="h-2.5 w-2.5" />{e.time}</span>
                <span className="flex items-center gap-0.5">{e.format === 'Virtual' ? <Video className="h-2.5 w-2.5" /> : <Globe className="h-2.5 w-2.5" />}{e.format}</span>
                <span className="flex items-center gap-0.5"><Users className="h-2.5 w-2.5" />{e.attendees}/{e.slots}</span>
              </div>
              <Button size="sm" className={cn('h-7 text-[9px] rounded-xl w-full gap-1', e.live && 'bg-[hsl(var(--state-live))] hover:bg-[hsl(var(--state-live))]/90')}>
                {e.live ? <><Play className="h-3 w-3" />Join Live</> : 'RSVP'}
              </Button>
            </div>
          </div>
        ))}
      </div>
    </LaunchpadShell>
  );
}
