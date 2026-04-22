import React from 'react';
import { DashboardLayout } from '@/components/shell/DashboardLayout';
import { SectionCard, KPICard, KPIBand, StatusBadge } from '@/components/shell/EnterprisePrimitives';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, MapPin, Users, Video, Clock, Eye } from 'lucide-react';

const EVENTS = [
  { title: 'Design Systems at Scale', type: 'Webinar', role: 'Speaker', date: 'Apr 28, 2026', time: '2:00 PM EST', attendees: 240, status: 'upcoming' as const, location: 'Virtual' },
  { title: 'Product Design Meetup NYC', type: 'Meetup', role: 'Panelist', date: 'May 5, 2026', time: '6:30 PM EST', attendees: 85, status: 'upcoming' as const, location: 'New York' },
  { title: 'Freelancer Summit 2026', type: 'Conference', role: 'Attendee', date: 'Mar 15, 2026', time: 'All Day', attendees: 1200, status: 'past' as const, location: 'San Francisco' },
  { title: 'Portfolio Review Workshop', type: 'Workshop', role: 'Host', date: 'Mar 8, 2026', time: '10:00 AM EST', attendees: 32, status: 'past' as const, location: 'Virtual' },
  { title: 'UX Research Methods', type: 'Webinar', role: 'Attendee', date: 'Feb 20, 2026', time: '1:00 PM EST', attendees: 180, status: 'past' as const, location: 'Virtual' },
];

export default function ProfileEventsTab() {
  return (
    <DashboardLayout topStrip={<><Calendar className="h-4 w-4 text-accent" /><span className="text-xs font-semibold">Events</span><div className="flex-1" /><div className="flex gap-1">{['All', 'Upcoming', 'Past', 'Hosting'].map(f => <Button key={f} variant="outline" size="sm" className="h-6 text-[8px] rounded-lg">{f}</Button>)}</div></>}>
      <KPIBand className="mb-3">
        <KPICard label="Events Attended" value="12" className="!rounded-2xl" />
        <KPICard label="Events Hosted" value="3" className="!rounded-2xl" />
        <KPICard label="Speaking Engagements" value="4" className="!rounded-2xl" />
        <KPICard label="Upcoming" value="2" className="!rounded-2xl" />
      </KPIBand>
      <div className="space-y-2.5">
        {EVENTS.map((e, i) => (
          <SectionCard key={i} className="!rounded-2xl">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-[11px] font-bold">{e.title}</span>
                  <StatusBadge status={e.status === 'upcoming' ? 'healthy' : 'review'} label={e.status} />
                  <Badge variant="outline" className="text-[7px] rounded-md">{e.type}</Badge>
                  <Badge className="text-[7px] bg-accent/10 text-accent border-0 rounded-lg">{e.role}</Badge>
                </div>
                <div className="flex items-center gap-3 text-[8px] text-muted-foreground">
                  <span className="flex items-center gap-0.5"><Calendar className="h-2.5 w-2.5" />{e.date}</span>
                  <span className="flex items-center gap-0.5"><Clock className="h-2.5 w-2.5" />{e.time}</span>
                  <span className="flex items-center gap-0.5"><MapPin className="h-2.5 w-2.5" />{e.location}</span>
                  <span className="flex items-center gap-0.5"><Users className="h-2.5 w-2.5" />{e.attendees}</span>
                </div>
              </div>
              {e.status === 'upcoming' ? <Button size="sm" className="h-6 text-[8px] rounded-lg">RSVP</Button> : <Button variant="outline" size="sm" className="h-6 text-[8px] rounded-lg"><Eye className="h-2.5 w-2.5 mr-0.5" />Recap</Button>}
            </div>
          </SectionCard>
        ))}
      </div>
    </DashboardLayout>
  );
}
