import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { DashboardLayout } from '@/components/shell/DashboardLayout';
import { SectionCard, KPICard, StatusBadge } from '@/components/shell/EnterprisePrimitives';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Calendar, Clock, Search, Filter, Video, MapPin, Phone, Users,
  ChevronRight, ArrowRight, Star, CheckCircle2, XCircle, AlertTriangle,
  RefreshCw, MessageSquare, DollarSign, Eye, MoreHorizontal, Briefcase,
} from 'lucide-react';
import { cn } from '@/lib/utils';

type BookingStatus = 'confirmed' | 'pending' | 'completed' | 'cancelled' | 'rescheduled';
type BookingType = 'mentor' | 'interview' | 'consultation' | 'webinar' | 'service';

interface Booking {
  id: string; title: string; with: string; initials: string; type: BookingType;
  status: BookingStatus; date: string; time: string; duration: string;
  format: 'video' | 'phone' | 'in-person'; price: string; notes?: string;
  rating?: number;
}

const STATUS_MAP: Record<BookingStatus, { cls: string; label: string }> = {
  confirmed: { cls: 'healthy', label: 'Confirmed' },
  pending: { cls: 'pending', label: 'Pending' },
  completed: { cls: 'healthy', label: 'Completed' },
  cancelled: { cls: 'critical', label: 'Cancelled' },
  rescheduled: { cls: 'pending', label: 'Rescheduled' },
};

const TYPE_COLORS: Record<BookingType, string> = {
  mentor: 'bg-accent/10 text-accent',
  interview: 'bg-[hsl(var(--gigvora-purple))]/10 text-[hsl(var(--gigvora-purple))]',
  consultation: 'bg-[hsl(var(--gigvora-green))]/10 text-[hsl(var(--gigvora-green))]',
  webinar: 'bg-[hsl(var(--gigvora-amber))]/10 text-[hsl(var(--gigvora-amber))]',
  service: 'bg-muted text-muted-foreground',
};

const FORMAT_ICONS = { video: Video, phone: Phone, 'in-person': MapPin };

const BOOKINGS: Booking[] = [
  { id: 'b1', title: 'Portfolio Review', with: 'Sarah Chen', initials: 'SC', type: 'mentor', status: 'confirmed', date: 'Today', time: '3:00 PM', duration: '60 min', format: 'video', price: '$40' },
  { id: 'b2', title: 'System Design Interview', with: 'TechCorp HR', initials: 'TC', type: 'interview', status: 'confirmed', date: 'Tomorrow', time: '10:00 AM', duration: '45 min', format: 'video', price: 'Free' },
  { id: 'b3', title: 'Brand Strategy Session', with: 'Marcus Johnson', initials: 'MJ', type: 'consultation', status: 'pending', date: 'Apr 18', time: '2:00 PM', duration: '90 min', format: 'video', price: '$120' },
  { id: 'b4', title: 'React Masterclass', with: 'Dev Academy', initials: 'DA', type: 'webinar', status: 'confirmed', date: 'Apr 20', time: '6:00 PM', duration: '120 min', format: 'video', price: '$49' },
  { id: 'b5', title: 'Logo Design Consultation', with: 'Priya Sharma', initials: 'PS', type: 'service', status: 'completed', date: 'Apr 10', time: '11:00 AM', duration: '30 min', format: 'phone', price: '$25', rating: 5 },
  { id: 'b6', title: 'Career Coaching', with: 'James Wilson', initials: 'JW', type: 'mentor', status: 'completed', date: 'Apr 8', time: '4:00 PM', duration: '60 min', format: 'video', price: '$40', rating: 4 },
  { id: 'b7', title: 'UX Audit Review', with: 'Elena Rodriguez', initials: 'ER', type: 'service', status: 'cancelled', date: 'Apr 5', time: '9:00 AM', duration: '60 min', format: 'video', price: '$80' },
  { id: 'b8', title: 'Technical Screening', with: 'StartupXYZ', initials: 'SX', type: 'interview', status: 'rescheduled', date: 'Apr 22', time: '1:00 PM', duration: '30 min', format: 'phone', price: 'Free' },
];

export default function BookingsListPage() {
  const [tab, setTab] = useState('all');
  const [search, setSearch] = useState('');

  const filtered = BOOKINGS.filter(b => {
    if (tab === 'upcoming') return ['confirmed', 'pending', 'rescheduled'].includes(b.status);
    if (tab === 'past') return ['completed', 'cancelled'].includes(b.status);
    if (tab !== 'all' && b.type !== tab) return false;
    if (search && !b.title.toLowerCase().includes(search.toLowerCase()) && !b.with.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const rightRail = (
    <div className="space-y-3">
      <SectionCard title="Quick Actions">
        <div className="space-y-1.5">
          <Link to="/calendar"><Button variant="outline" size="sm" className="w-full h-7 text-[9px] rounded-xl gap-1 justify-start"><Calendar className="h-3 w-3" /> View Calendar</Button></Link>
          <Link to="/calendar/availability"><Button variant="outline" size="sm" className="w-full h-7 text-[9px] rounded-xl gap-1 justify-start"><Clock className="h-3 w-3" /> Manage Availability</Button></Link>
          <Link to="/calendar/book"><Button size="sm" className="w-full h-7 text-[9px] rounded-xl gap-1 justify-start"><Calendar className="h-3 w-3" /> New Booking</Button></Link>
        </div>
      </SectionCard>
      <SectionCard title="Upcoming Today">
        <div className="space-y-2">
          {BOOKINGS.filter(b => b.date === 'Today').map(b => (
            <div key={b.id} className="flex items-center gap-2 p-2 rounded-xl bg-accent/5 border border-accent/10">
              <Avatar className="h-6 w-6 rounded-lg"><AvatarFallback className="rounded-lg bg-accent/10 text-accent text-[7px] font-bold">{b.initials}</AvatarFallback></Avatar>
              <div className="flex-1 min-w-0">
                <div className="text-[9px] font-semibold truncate">{b.title}</div>
                <div className="text-[8px] text-muted-foreground">{b.time} · {b.duration}</div>
              </div>
            </div>
          ))}
        </div>
      </SectionCard>
    </div>
  );

  return (
    <DashboardLayout topStrip={
      <>
        <Calendar className="h-4 w-4 text-accent" />
        <span className="text-xs font-semibold">My Bookings</span>
        <div className="flex-1" />
        <div className="relative max-w-xs flex-1">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
          <Input placeholder="Search bookings..." value={search} onChange={e => setSearch(e.target.value)} className="pl-7 h-7 text-[10px]" />
        </div>
        <Link to="/calendar"><Button variant="outline" size="sm" className="h-7 text-[10px] rounded-xl gap-1"><Calendar className="h-3 w-3" /> Calendar</Button></Link>
      </>
    } rightRail={rightRail} rightRailWidth="w-52">
      {/* KPIs */}
      <div className="flex items-center gap-3 flex-wrap rounded-2xl border bg-card px-5 py-3 shadow-card mb-4">
        <KPICard label="Upcoming" value={String(BOOKINGS.filter(b => ['confirmed', 'pending'].includes(b.status)).length)} />
        <KPICard label="Completed" value={String(BOOKINGS.filter(b => b.status === 'completed').length)} />
        <KPICard label="This Month" value="$274" />
        <KPICard label="Avg Rating" value="4.5★" />
      </div>

      {/* Tabs */}
      <Tabs value={tab} onValueChange={setTab} className="mb-4">
        <TabsList className="h-7">
          {[
            { value: 'all', label: 'All' },
            { value: 'upcoming', label: 'Upcoming' },
            { value: 'past', label: 'Past' },
            { value: 'mentor', label: 'Mentoring' },
            { value: 'interview', label: 'Interviews' },
            { value: 'service', label: 'Services' },
          ].map(t => (
            <TabsTrigger key={t.value} value={t.value} className="text-[9px] h-5 px-2">{t.label}</TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {/* Booking Cards */}
      <div className="space-y-2">
        {filtered.map(b => {
          const FormatIcon = FORMAT_ICONS[b.format];
          const st = STATUS_MAP[b.status];
          return (
            <div key={b.id} className="flex items-center gap-3 p-4 rounded-2xl border border-border/30 hover:border-accent/30 transition-all group bg-card">
              <Avatar className="h-11 w-11 rounded-xl shrink-0">
                <AvatarFallback className={cn('rounded-xl text-[10px] font-bold', TYPE_COLORS[b.type])}>{b.initials}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-[11px] font-bold truncate group-hover:text-accent transition-colors">{b.title}</span>
                  <StatusBadge status={st.cls as any} label={st.label} />
                  <Badge variant="outline" className="text-[7px] h-3.5 capitalize">{b.type}</Badge>
                </div>
                <div className="flex items-center gap-3 text-[9px] text-muted-foreground">
                  <span className="font-medium text-foreground">{b.with}</span>
                  <span className="flex items-center gap-0.5"><Calendar className="h-2.5 w-2.5" />{b.date}</span>
                  <span className="flex items-center gap-0.5"><Clock className="h-2.5 w-2.5" />{b.time}</span>
                  <span>{b.duration}</span>
                  <span className="flex items-center gap-0.5"><FormatIcon className="h-2.5 w-2.5" />{b.format}</span>
                  {b.price !== 'Free' && <span className="font-semibold text-foreground">{b.price}</span>}
                  {b.rating && <span className="flex items-center gap-0.5 text-[hsl(var(--gigvora-amber))]"><Star className="h-2.5 w-2.5 fill-current" />{b.rating}</span>}
                </div>
              </div>
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                {b.status === 'confirmed' && (
                  <>
                    <Button size="sm" className="h-7 text-[9px] rounded-lg gap-1"><Video className="h-3 w-3" /> Join</Button>
                    <Button variant="outline" size="sm" className="h-7 text-[9px] rounded-lg gap-1"><RefreshCw className="h-3 w-3" /> Reschedule</Button>
                  </>
                )}
                {b.status === 'completed' && !b.rating && (
                  <Button variant="outline" size="sm" className="h-7 text-[9px] rounded-lg gap-1"><Star className="h-3 w-3" /> Rate</Button>
                )}
                <Button variant="ghost" size="sm" className="h-7 w-7 p-0 rounded-lg"><Eye className="h-3 w-3" /></Button>
              </div>
            </div>
          );
        })}
      </div>
    </DashboardLayout>
  );
}
