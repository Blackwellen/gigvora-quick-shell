import React from 'react';
import { DashboardLayout } from '@/components/shell/DashboardLayout';
import { SectionCard, KPICard, KPIBand } from '@/components/shell/EnterprisePrimitives';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Calendar, Search, MapPin, Users, Clock, Video, Eye, SlidersHorizontal, Ticket } from 'lucide-react';

const EVENTS = [
  { title: 'Design Systems at Scale', type: 'Webinar', date: 'Apr 28, 2026', time: '2:00 PM EST', attendees: 240, price: 'Free', location: 'Virtual', host: 'Figma Community' },
  { title: 'Product Design Meetup NYC', type: 'Meetup', date: 'May 5, 2026', time: '6:30 PM EST', attendees: 85, price: 'Free', location: 'New York', host: 'Design NYC' },
  { title: 'Freelancer Summit 2026', type: 'Conference', date: 'Jun 15, 2026', time: 'All Day', attendees: 1200, price: '$199', location: 'San Francisco', host: 'FreelanceHQ' },
  { title: 'AI for Product Managers', type: 'Workshop', date: 'May 12, 2026', time: '10:00 AM EST', attendees: 60, price: '$49', location: 'Virtual', host: 'PM School' },
];

export default function EventsSearchPage() {
  return (
    <DashboardLayout topStrip={<><Calendar className="h-4 w-4 text-accent" /><span className="text-xs font-semibold">Events Search</span><div className="flex-1" /><Button variant="outline" size="sm" className="h-7 text-[10px] rounded-xl gap-1"><SlidersHorizontal className="h-3 w-3" />Filters</Button></>}>
      <div className="flex gap-2 mb-3"><div className="relative flex-1"><Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" /><Input placeholder="Search events..." className="pl-8 h-8 text-xs rounded-xl" /></div></div>
      <div className="flex flex-wrap gap-1 mb-3">{['Type', 'Date', 'Location', 'Price', 'Topic'].map(f => <Button key={f} variant="outline" size="sm" className="h-6 text-[8px] rounded-lg">{f}</Button>)}</div>
      <KPIBand className="mb-3">
        <KPICard label="Upcoming" value="342" className="!rounded-2xl" />
        <KPICard label="Free Events" value="186" className="!rounded-2xl" />
        <KPICard label="Virtual" value="248" className="!rounded-2xl" />
        <KPICard label="This Week" value="24" className="!rounded-2xl" />
      </KPIBand>
      <div className="space-y-2.5">
        {EVENTS.map((e, i) => (
          <SectionCard key={i} className="!rounded-2xl">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 mb-0.5"><span className="text-[11px] font-bold">{e.title}</span><Badge variant="outline" className="text-[7px] rounded-md">{e.type}</Badge>{e.price === 'Free' && <Badge className="text-[7px] bg-[hsl(var(--state-healthy)/0.1)] text-[hsl(var(--state-healthy))] border-0 rounded-md">Free</Badge>}</div>
                <div className="flex items-center gap-3 text-[8px] text-muted-foreground">
                  <span>by {e.host}</span><span className="flex items-center gap-0.5"><Calendar className="h-2.5 w-2.5" />{e.date}</span><span className="flex items-center gap-0.5"><Clock className="h-2.5 w-2.5" />{e.time}</span><span className="flex items-center gap-0.5"><MapPin className="h-2.5 w-2.5" />{e.location}</span><span className="flex items-center gap-0.5"><Users className="h-2.5 w-2.5" />{e.attendees}</span>{e.price !== 'Free' && <span>{e.price}</span>}
                </div>
              </div>
              <Button size="sm" className="h-7 text-[9px] rounded-xl gap-0.5"><Ticket className="h-3 w-3" />RSVP</Button>
            </div>
          </SectionCard>
        ))}
      </div>
    </DashboardLayout>
  );
}
