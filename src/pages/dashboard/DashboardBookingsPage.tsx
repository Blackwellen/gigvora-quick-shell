import React, { useState } from 'react';
import { SectionCard, KPICard, KPIBand, StatusBadge } from '@/components/shell/EnterprisePrimitives';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import {
  Calendar, Clock, ChevronRight, Video, MapPin,
  MessageSquare, RotateCcw, XCircle, User, CheckCircle2,
  Phone, ExternalLink,
} from 'lucide-react';

type BookingStatus = 'upcoming' | 'completed' | 'cancelled' | 'rescheduled';

interface Booking {
  id: string; title: string; host: string; status: BookingStatus;
  date: string; time: string; duration: string; type: 'video' | 'phone' | 'in-person';
  notes?: string;
}

const BOOKINGS: Booking[] = [
  { id: '1', title: 'Career Strategy Session', host: 'Elena Rodriguez', status: 'upcoming', date: 'Apr 15', time: '2:00 PM', duration: '30 min', type: 'video' },
  { id: '2', title: 'Brand Consultation', host: 'StudioLab', status: 'upcoming', date: 'Apr 18', time: '10:00 AM', duration: '60 min', type: 'video', notes: 'Prepare brand brief beforehand' },
  { id: '3', title: 'Technical Interview Prep', host: 'CodeMentor Pro', status: 'upcoming', date: 'Apr 20', time: '3:00 PM', duration: '45 min', type: 'phone' },
  { id: '4', title: 'Portfolio Review', host: 'Tom Williams', status: 'completed', date: 'Apr 10', time: '11:00 AM', duration: '30 min', type: 'video' },
  { id: '5', title: 'Product Strategy Workshop', host: 'Sarah Chen', status: 'completed', date: 'Apr 5', time: '9:00 AM', duration: '90 min', type: 'video' },
  { id: '6', title: 'Networking Coffee', host: 'Marcus Johnson', status: 'cancelled', date: 'Apr 3', time: '4:00 PM', duration: '30 min', type: 'in-person' },
];

const STATUS_MAP: Record<BookingStatus, { badge: 'live' | 'healthy' | 'blocked' | 'caution'; label: string }> = {
  upcoming: { badge: 'live', label: 'Upcoming' },
  completed: { badge: 'healthy', label: 'Completed' },
  cancelled: { badge: 'blocked', label: 'Cancelled' },
  rescheduled: { badge: 'caution', label: 'Rescheduled' },
};

const TYPE_ICON = { video: Video, phone: Phone, 'in-person': MapPin };

const DashboardBookingsPage: React.FC = () => {
  const [tab, setTab] = useState<'all' | BookingStatus>('all');
  const [selected, setSelected] = useState<Booking | null>(null);

  const filtered = tab === 'all' ? BOOKINGS : BOOKINGS.filter(b => b.status === tab);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-bold flex items-center gap-2"><Calendar className="h-5 w-5 text-accent" /> Bookings</h1>
        <p className="text-[11px] text-muted-foreground">Manage your consultations, sessions, and meetings</p>
      </div>

      <KPIBand>
        <KPICard label="Upcoming" value="3" />
        <KPICard label="This Week" value="1" change="Tomorrow" trend="up" />
        <KPICard label="Completed" value="2" />
        <KPICard label="Total Sessions" value={String(BOOKINGS.length)} />
      </KPIBand>

      <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
        {(['all', 'upcoming', 'completed', 'cancelled'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} className={cn(
            'px-3 py-1.5 rounded-xl text-[9px] font-medium shrink-0 transition-all capitalize',
            tab === t ? 'bg-accent text-accent-foreground shadow-sm' : 'bg-muted/50 text-muted-foreground hover:bg-muted'
          )}>{t}</button>
        ))}
      </div>

      <div className="space-y-2">
        {filtered.map(booking => {
          const sm = STATUS_MAP[booking.status];
          const TIcon = TYPE_ICON[booking.type];
          return (
            <div key={booking.id} onClick={() => setSelected(booking)} className="rounded-2xl border bg-card p-3.5 flex items-center gap-3 hover:shadow-sm transition-all cursor-pointer group">
              <div className="h-10 w-10 rounded-xl bg-muted/50 flex items-center justify-center shrink-0 group-hover:bg-accent/10 transition-colors">
                <TIcon className="h-4 w-4 text-muted-foreground group-hover:text-accent transition-colors" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-[11px] font-semibold truncate group-hover:text-accent transition-colors">{booking.title}</span>
                  <StatusBadge status={sm.badge} label={sm.label} />
                </div>
                <div className="text-[9px] text-muted-foreground flex items-center gap-3">
                  <span className="flex items-center gap-0.5"><User className="h-2.5 w-2.5" />{booking.host}</span>
                  <span className="flex items-center gap-0.5"><Calendar className="h-2.5 w-2.5" />{booking.date}</span>
                  <span className="flex items-center gap-0.5"><Clock className="h-2.5 w-2.5" />{booking.time} · {booking.duration}</span>
                </div>
              </div>
              <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/30 shrink-0" />
            </div>
          );
        })}
      </div>

      <Sheet open={!!selected} onOpenChange={() => setSelected(null)}>
        <SheetContent className="w-[420px] p-0 overflow-y-auto">
          <SheetHeader className="p-4 border-b"><SheetTitle className="text-sm">Booking Detail</SheetTitle></SheetHeader>
          {selected && (
            <div className="p-4 space-y-4">
              <h3 className="text-[12px] font-bold">{selected.title}</h3>
              <div className="grid grid-cols-2 gap-2">
                <div className="rounded-xl bg-muted/30 p-2.5"><div className="text-[8px] text-muted-foreground">Host</div><div className="text-[10px] font-semibold">{selected.host}</div></div>
                <div className="rounded-xl bg-muted/30 p-2.5"><div className="text-[8px] text-muted-foreground">Date & Time</div><div className="text-[10px] font-semibold">{selected.date} at {selected.time}</div></div>
                <div className="rounded-xl bg-muted/30 p-2.5"><div className="text-[8px] text-muted-foreground">Duration</div><div className="text-[10px] font-semibold">{selected.duration}</div></div>
                <div className="rounded-xl bg-muted/30 p-2.5"><div className="text-[8px] text-muted-foreground">Type</div><div className="text-[10px] font-semibold capitalize">{selected.type}</div></div>
              </div>
              {selected.notes && (
                <div className="rounded-xl bg-accent/5 border border-accent/10 p-3 text-[9px]"><strong>Notes:</strong> {selected.notes}</div>
              )}
              {selected.status === 'upcoming' && (
                <div className="flex gap-2 pt-2 border-t">
                  {selected.type === 'video' && <Button size="sm" className="h-8 text-[9px] flex-1 rounded-xl gap-1"><Video className="h-3 w-3" />Join Session</Button>}
                  <Button variant="outline" size="sm" className="h-8 text-[9px] flex-1 rounded-xl gap-1"><RotateCcw className="h-3 w-3" />Reschedule</Button>
                  <Button variant="outline" size="sm" className="h-8 text-[9px] rounded-xl gap-1 text-destructive"><XCircle className="h-3 w-3" />Cancel</Button>
                </div>
              )}
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default DashboardBookingsPage;
