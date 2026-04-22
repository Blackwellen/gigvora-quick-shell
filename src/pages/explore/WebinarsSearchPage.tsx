import React from 'react';
import { DashboardLayout } from '@/components/shell/DashboardLayout';
import { SectionCard, KPICard, KPIBand } from '@/components/shell/EnterprisePrimitives';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Video, Search, Star, Users, Clock, Calendar, Eye, SlidersHorizontal, Ticket } from 'lucide-react';

const WEBINARS = [
  { title: 'Scaling Design Systems', host: 'Figma Community', date: 'Apr 28, 2026', time: '2:00 PM', attendees: 420, price: 'Free', rating: 4.9, category: 'Design' },
  { title: 'Advanced React Patterns', host: 'React Conf', date: 'May 5, 2026', time: '10:00 AM', attendees: 680, price: '$29', rating: 4.8, category: 'Engineering' },
  { title: 'Building a $1M Freelance Business', host: 'FreelanceHQ', date: 'May 12, 2026', time: '1:00 PM', attendees: 340, price: '$49', rating: 4.7, category: 'Business' },
  { title: 'AI Product Management', host: 'PM School', date: 'May 18, 2026', time: '3:00 PM', attendees: 520, price: 'Free', rating: 5.0, category: 'Product' },
];

export default function WebinarsSearchPage() {
  return (
    <DashboardLayout topStrip={<><Video className="h-4 w-4 text-accent" /><span className="text-xs font-semibold">Webinars Search</span><div className="flex-1" /><Button variant="outline" size="sm" className="h-7 text-[10px] rounded-xl gap-1"><SlidersHorizontal className="h-3 w-3" />Filters</Button></>}>
      <div className="flex gap-2 mb-3"><div className="relative flex-1"><Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" /><Input placeholder="Search webinars..." className="pl-8 h-8 text-xs rounded-xl" /></div></div>
      <KPIBand className="mb-3">
        <KPICard label="Upcoming" value="186" className="!rounded-2xl" />
        <KPICard label="Free" value="92" className="!rounded-2xl" />
        <KPICard label="Replays" value="1,240" className="!rounded-2xl" />
        <KPICard label="This Week" value="12" className="!rounded-2xl" />
      </KPIBand>
      <div className="space-y-2.5">
        {WEBINARS.map((w, i) => (
          <SectionCard key={i} className="!rounded-2xl">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 mb-0.5"><span className="text-[11px] font-bold">{w.title}</span><Badge variant="outline" className="text-[7px] rounded-md">{w.category}</Badge>{w.price === 'Free' && <Badge className="text-[7px] bg-[hsl(var(--state-healthy)/0.1)] text-[hsl(var(--state-healthy))] border-0 rounded-md">Free</Badge>}</div>
                <div className="flex items-center gap-3 text-[8px] text-muted-foreground">
                  <span>by {w.host}</span><span className="flex items-center gap-0.5"><Calendar className="h-2.5 w-2.5" />{w.date}</span><span className="flex items-center gap-0.5"><Clock className="h-2.5 w-2.5" />{w.time}</span><span className="flex items-center gap-0.5"><Users className="h-2.5 w-2.5" />{w.attendees}</span><span className="flex items-center gap-0.5"><Star className="h-2.5 w-2.5 text-[hsl(var(--gigvora-amber))]" />{w.rating}</span>{w.price !== 'Free' && <span>{w.price}</span>}
                </div>
              </div>
              <Button size="sm" className="h-7 text-[9px] rounded-xl gap-0.5"><Ticket className="h-3 w-3" />Register</Button>
            </div>
          </SectionCard>
        ))}
      </div>
    </DashboardLayout>
  );
}
