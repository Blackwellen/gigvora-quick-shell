import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DashboardLayout } from '@/components/shell/DashboardLayout';
import { SectionCard, KPICard, KPIBand } from '@/components/shell/EnterprisePrimitives';
import { cn } from '@/lib/utils';
import {
  Calendar, Search, Plus, Users, Clock, MapPin, Globe,
  Video, Building2, Star, Eye, CheckCircle2, Bookmark,
} from 'lucide-react';

type EventType = 'roundtable' | 'briefing' | 'summit' | 'webinar' | 'networking';
type EventStatus = 'upcoming' | 'live' | 'past' | 'registering';
interface EnterpriseEvent {
  id: string; title: string; type: EventType; status: EventStatus;
  date: string; time: string; host: string; attendees: number;
  maxAttendees: number; format: 'virtual' | 'in-person' | 'hybrid';
  description: string; tags: string[];
}

const TYPE_COLORS: Record<EventType, string> = {
  roundtable: 'bg-accent/10 text-accent', briefing: 'bg-primary/10 text-primary',
  summit: 'bg-[hsl(var(--gigvora-purple))]/10 text-[hsl(var(--gigvora-purple))]',
  webinar: 'bg-[hsl(var(--gigvora-blue))]/10 text-[hsl(var(--gigvora-blue))]',
  networking: 'bg-[hsl(var(--gigvora-amber))]/10 text-[hsl(var(--gigvora-amber))]',
};

const EVENTS: EnterpriseEvent[] = [
  { id: 'EV-1', title: 'AI in Supply Chain — Executive Roundtable', type: 'roundtable', status: 'upcoming', date: 'Apr 18, 2026', time: '2:00 PM EST', host: 'Acme Corporation', attendees: 18, maxAttendees: 25, format: 'virtual', description: 'Senior leaders discuss AI adoption challenges in enterprise supply chains.', tags: ['AI', 'Supply Chain', 'Executive'] },
  { id: 'EV-2', title: 'Cloud Security Briefing Q2', type: 'briefing', status: 'registering', date: 'Apr 22, 2026', time: '10:00 AM EST', host: 'SecureOps Inc', attendees: 45, maxAttendees: 100, format: 'virtual', description: 'Quarterly threat landscape update and security best practices for enterprise.', tags: ['Security', 'Cloud', 'Compliance'] },
  { id: 'EV-3', title: 'Enterprise Connect Summit 2026', type: 'summit', status: 'upcoming', date: 'May 5-7, 2026', time: 'All Day', host: 'Gigvora', attendees: 230, maxAttendees: 500, format: 'hybrid', description: 'The premier enterprise networking and partnership summit.', tags: ['Summit', 'Networking', 'Partnerships'] },
  { id: 'EV-4', title: 'Data Strategy for Enterprise Leaders', type: 'webinar', status: 'live', date: 'Apr 14, 2026', time: 'Now', host: 'DataFlow Analytics', attendees: 89, maxAttendees: 200, format: 'virtual', description: 'Live session on building data-driven enterprise strategy.', tags: ['Data', 'Strategy', 'Analytics'] },
  { id: 'EV-5', title: 'CTO Networking Dinner — NYC', type: 'networking', status: 'upcoming', date: 'Apr 25, 2026', time: '7:00 PM EST', host: 'TechVentures Ltd', attendees: 12, maxAttendees: 20, format: 'in-person', description: 'Intimate dinner for CTOs to discuss technology leadership challenges.', tags: ['CTO', 'Networking', 'NYC'] },
];

const EnterpriseEventsPage: React.FC = () => {
  const topStrip = (
    <>
      <Calendar className="h-4 w-4 text-[hsl(var(--state-live))]" />
      <span className="text-xs font-semibold">Enterprise Events</span>
      <Badge className="bg-[hsl(var(--state-live))]/10 text-[hsl(var(--state-live))] text-[7px] border-0">Enterprise Only</Badge>
      <div className="flex-1" />
      <Button size="sm" className="h-7 text-[9px] rounded-xl gap-1"><Plus className="h-3 w-3" />Host Event</Button>
    </>
  );

  const rightRail = (
    <div className="space-y-3">
      <SectionCard title="Your RSVPs" className="!rounded-2xl">
        <div className="space-y-1 text-[9px]">
          <div className="flex justify-between"><span className="text-muted-foreground">Upcoming</span><span className="font-semibold">3</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Attended (YTD)</span><span className="font-semibold">12</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Hosted</span><span className="font-semibold">2</span></div>
        </div>
      </SectionCard>
      <SectionCard title="Event Types" className="!rounded-2xl">
        <div className="space-y-1 text-[9px]">
          {(['roundtable', 'briefing', 'summit', 'webinar', 'networking'] as EventType[]).map(t => (
            <div key={t} className="flex justify-between">
              <Badge className={cn('text-[7px] border-0 capitalize', TYPE_COLORS[t])}>{t}</Badge>
              <span className="font-semibold">{EVENTS.filter(e => e.type === t).length}</span>
            </div>
          ))}
        </div>
      </SectionCard>
    </div>
  );

  return (
    <DashboardLayout topStrip={topStrip} rightRail={rightRail} rightRailWidth="w-48">
      <KPIBand className="mb-3">
        <KPICard label="Upcoming" value={String(EVENTS.filter(e => e.status === 'upcoming' || e.status === 'registering').length)} className="!rounded-2xl" />
        <KPICard label="Live Now" value={String(EVENTS.filter(e => e.status === 'live').length)} className="!rounded-2xl" />
        <KPICard label="Total Attendees" value="394" className="!rounded-2xl" />
        <KPICard label="Your Events" value="2" change="Hosted" className="!rounded-2xl" />
      </KPIBand>

      <div className="space-y-2.5">
        {EVENTS.map(e => (
          <div key={e.id} className={cn('rounded-2xl border bg-card p-4 hover:shadow-md cursor-pointer transition-all group', e.status === 'live' && 'ring-2 ring-[hsl(var(--state-live))]/30')}>
            <div className="flex items-start gap-3">
              <div className={cn('h-12 w-12 rounded-xl flex flex-col items-center justify-center shrink-0 text-center', TYPE_COLORS[e.type])}>
                <Calendar className="h-4 w-4 mb-0.5" />
                <span className="text-[7px] font-bold leading-none">{e.date.split(',')[0].split(' ').slice(0, 2).join(' ')}</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <span className="text-[12px] font-bold group-hover:text-accent transition-colors">{e.title}</span>
                  {e.status === 'live' && <Badge className="bg-[hsl(var(--state-live))]/10 text-[hsl(var(--state-live))] text-[7px] border-0 animate-pulse">LIVE</Badge>}
                  <Badge className={cn('text-[7px] border-0 capitalize', TYPE_COLORS[e.type])}>{e.type}</Badge>
                </div>
                <div className="flex items-center gap-2 text-[9px] text-muted-foreground mb-1">
                  <span><Building2 className="h-2.5 w-2.5 inline" /> {e.host}</span>
                  <span><Clock className="h-2.5 w-2.5 inline" /> {e.time}</span>
                  <span>{e.format === 'virtual' ? <Video className="h-2.5 w-2.5 inline" /> : <MapPin className="h-2.5 w-2.5 inline" />} {e.format}</span>
                  <span><Users className="h-2.5 w-2.5 inline" /> {e.attendees}/{e.maxAttendees}</span>
                </div>
                <p className="text-[9px] text-muted-foreground line-clamp-1">{e.description}</p>
                <div className="flex gap-1 mt-1.5">{e.tags.map(t => <Badge key={t} variant="secondary" className="text-[7px]">{t}</Badge>)}</div>
              </div>
              <div className="flex flex-col gap-1 shrink-0">
                <Button size="sm" className="h-6 text-[8px] rounded-lg">{e.status === 'live' ? 'Join' : 'RSVP'}</Button>
                <Button variant="ghost" size="sm" className="h-6 text-[8px] rounded-lg"><Bookmark className="h-2.5 w-2.5" /></Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </DashboardLayout>
  );
};

export default EnterpriseEventsPage;
