import React, { useState } from 'react';
import { KPIBand, KPICard, StatusBadge } from '@/components/shell/EnterprisePrimitives';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import {
  Calendar, Clock, ChevronRight, Video, MessageSquare,
  CheckCircle2, XCircle, RotateCcw, User, Phone, MapPin,
} from 'lucide-react';

type BookingStatus = 'upcoming' | 'pending' | 'confirmed' | 'completed' | 'cancelled';

interface Booking {
  id: string; title: string; client: string; status: BookingStatus;
  date: string; time: string; duration: string; type: 'video' | 'phone' | 'in-person';
  notes?: string;
}

const BOOKINGS: Booking[] = [
  { id: '1', title: 'Brand Consultation', client: 'TechPulse Inc', status: 'pending', date: 'Apr 16', time: '10:00 AM', duration: '60 min', type: 'video', notes: 'Client wants to discuss brand refresh' },
  { id: '2', title: 'Career Mentoring Session', client: 'Sarah Chen', status: 'confirmed', date: 'Apr 17', time: '2:00 PM', duration: '30 min', type: 'video' },
  { id: '3', title: 'UX Review Call', client: 'Acme Corp', status: 'confirmed', date: 'Apr 18', time: '11:00 AM', duration: '45 min', type: 'phone' },
  { id: '4', title: 'Project Kickoff', client: 'StartupXYZ', status: 'upcoming', date: 'Apr 20', time: '3:00 PM', duration: '60 min', type: 'video' },
  { id: '5', title: 'Portfolio Review', client: 'Marcus Johnson', status: 'completed', date: 'Apr 10', time: '4:00 PM', duration: '30 min', type: 'video' },
  { id: '6', title: 'Discovery Call', client: 'FinApp', status: 'cancelled', date: 'Apr 8', time: '9:00 AM', duration: '30 min', type: 'phone' },
];

const STATUS_MAP: Record<BookingStatus, { badge: 'caution' | 'live' | 'healthy' | 'blocked' | 'pending'; label: string }> = {
  pending: { badge: 'caution', label: 'Pending' },
  confirmed: { badge: 'live', label: 'Confirmed' },
  upcoming: { badge: 'pending', label: 'Upcoming' },
  completed: { badge: 'healthy', label: 'Completed' },
  cancelled: { badge: 'blocked', label: 'Cancelled' },
};

const TYPE_ICON = { video: Video, phone: Phone, 'in-person': MapPin };

export default function ProBookingsPage() {
  const [tab, setTab] = useState<'all' | BookingStatus>('all');
  const [selected, setSelected] = useState<Booking | null>(null);

  const filtered = tab === 'all' ? BOOKINGS : BOOKINGS.filter(b => b.status === tab);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-bold flex items-center gap-2"><Calendar className="h-5 w-5 text-accent" /> Bookings</h1>
        <p className="text-[11px] text-muted-foreground">Manage consultations, sessions, and client meetings</p>
      </div>

      <KPIBand>
        <KPICard label="Pending Requests" value="1" change="Action needed" trend="down" />
        <KPICard label="Confirmed" value="2" />
        <KPICard label="This Week" value="3" />
        <KPICard label="Completed (MTD)" value="1" />
      </KPIBand>

      <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
        {(['all', 'pending', 'confirmed', 'upcoming', 'completed', 'cancelled'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} className={cn(
            'px-3 py-1.5 rounded-xl text-[9px] font-medium shrink-0 transition-all capitalize',
            tab === t ? 'bg-accent text-accent-foreground shadow-sm' : 'bg-muted/50 text-muted-foreground hover:bg-muted'
          )}>{t}</button>
        ))}
      </div>

      <div className="space-y-2">
        {filtered.map(b => {
          const sm = STATUS_MAP[b.status];
          const TIcon = TYPE_ICON[b.type];
          return (
            <div key={b.id} onClick={() => setSelected(b)} className="rounded-2xl border bg-card p-3.5 flex items-center gap-3 hover:shadow-sm transition-all cursor-pointer group">
              <div className="h-10 w-10 rounded-xl bg-muted/50 flex items-center justify-center shrink-0 group-hover:bg-accent/10 transition-colors">
                <TIcon className="h-4 w-4 text-muted-foreground group-hover:text-accent transition-colors" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-[11px] font-semibold group-hover:text-accent transition-colors">{b.title}</span>
                  <StatusBadge status={sm.badge} label={sm.label} />
                </div>
                <div className="text-[9px] text-muted-foreground flex items-center gap-3">
                  <span className="flex items-center gap-0.5"><User className="h-2.5 w-2.5" />{b.client}</span>
                  <span className="flex items-center gap-0.5"><Calendar className="h-2.5 w-2.5" />{b.date}</span>
                  <span className="flex items-center gap-0.5"><Clock className="h-2.5 w-2.5" />{b.time} · {b.duration}</span>
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
                <div className="rounded-xl bg-muted/30 p-2.5"><div className="text-[8px] text-muted-foreground">Client</div><div className="text-[10px] font-semibold">{selected.client}</div></div>
                <div className="rounded-xl bg-muted/30 p-2.5"><div className="text-[8px] text-muted-foreground">Date</div><div className="text-[10px] font-semibold">{selected.date} at {selected.time}</div></div>
                <div className="rounded-xl bg-muted/30 p-2.5"><div className="text-[8px] text-muted-foreground">Duration</div><div className="text-[10px] font-semibold">{selected.duration}</div></div>
                <div className="rounded-xl bg-muted/30 p-2.5"><div className="text-[8px] text-muted-foreground">Type</div><div className="text-[10px] font-semibold capitalize">{selected.type}</div></div>
              </div>
              {selected.notes && <div className="rounded-xl bg-accent/5 border border-accent/10 p-3 text-[9px]"><strong>Notes:</strong> {selected.notes}</div>}
              {(selected.status === 'pending' || selected.status === 'confirmed' || selected.status === 'upcoming') && (
                <div className="flex gap-2 pt-2 border-t">
                  {selected.status === 'pending' && <Button size="sm" className="h-8 text-[9px] flex-1 rounded-xl gap-1"><CheckCircle2 className="h-3 w-3" />Confirm</Button>}
                  {selected.type === 'video' && <Button variant="outline" size="sm" className="h-8 text-[9px] flex-1 rounded-xl gap-1"><Video className="h-3 w-3" />Join</Button>}
                  <Button variant="outline" size="sm" className="h-8 text-[9px] rounded-xl gap-1"><RotateCcw className="h-3 w-3" />Reschedule</Button>
                  <Button variant="outline" size="sm" className="h-8 text-[9px] rounded-xl gap-1 text-destructive"><XCircle className="h-3 w-3" />Cancel</Button>
                </div>
              )}
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
