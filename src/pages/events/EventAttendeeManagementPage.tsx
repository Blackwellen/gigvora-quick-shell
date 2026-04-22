import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { DashboardLayout } from '@/components/shell/DashboardLayout';
import { SectionCard, KPICard, KPIBand } from '@/components/shell/EnterprisePrimitives';
import { cn } from '@/lib/utils';
import {
  Users, Search, Filter, Mail, UserMinus, Shield,
  Clock, CheckCircle, XCircle, Download, Eye,
} from 'lucide-react';

type AttendeeStatus = 'registered' | 'checked-in' | 'attended' | 'no-show' | 'cancelled';

interface Attendee {
  id: string; name: string; initials: string; email: string;
  company: string; ticket: string; status: AttendeeStatus;
  registeredAt: string; checkedInAt?: string;
}

const ATTENDEES: Attendee[] = [
  { id: 'A1', name: 'Sarah Chen', initials: 'SC', email: 'sarah@stripe.com', company: 'Stripe', ticket: 'VIP', status: 'attended', registeredAt: 'Apr 1', checkedInAt: '1:55 PM' },
  { id: 'A2', name: 'Marcus Johnson', initials: 'MJ', email: 'marcus@design.co', company: 'Design Co', ticket: 'Professional', status: 'checked-in', registeredAt: 'Apr 3', checkedInAt: '2:01 PM' },
  { id: 'A3', name: 'Priya Patel', initials: 'PP', email: 'priya@ailab.io', company: 'AI Lab', ticket: 'Professional', status: 'registered', registeredAt: 'Apr 5' },
  { id: 'A4', name: 'Tom Wright', initials: 'TW', email: 'tom@novatech.com', company: 'NovaTech', ticket: 'General', status: 'no-show', registeredAt: 'Apr 2' },
  { id: 'A5', name: 'Lisa Park', initials: 'LP', email: 'lisa@acme.com', company: 'Acme Corp', ticket: 'VIP', status: 'cancelled', registeredAt: 'Mar 28' },
];

const STATUS_STYLES: Record<AttendeeStatus, string> = {
  registered: 'bg-accent/10 text-accent',
  'checked-in': 'bg-[hsl(var(--state-healthy)/0.1)] text-[hsl(var(--state-healthy))]',
  attended: 'bg-[hsl(var(--state-healthy)/0.15)] text-[hsl(var(--state-healthy))]',
  'no-show': 'bg-[hsl(var(--state-caution)/0.1)] text-[hsl(var(--state-caution))]',
  cancelled: 'bg-destructive/10 text-destructive',
};

const EventAttendeeManagementPage: React.FC = () => {
  const [statusFilter, setStatusFilter] = useState<'all' | AttendeeStatus>('all');
  const filtered = ATTENDEES.filter(a => statusFilter === 'all' || a.status === statusFilter);

  const topStrip = (
    <>
      <Users className="h-4 w-4 text-muted-foreground" />
      <span className="text-xs font-semibold">Attendee Management</span>
      <div className="flex-1" />
      <div className="flex items-center gap-1 bg-muted/40 rounded-xl p-0.5">
        {(['all', 'registered', 'checked-in', 'attended', 'no-show'] as const).map(f => (
          <button key={f} onClick={() => setStatusFilter(f)} className={cn('px-2 py-1 rounded-lg text-[8px] font-medium transition-colors capitalize', statusFilter === f ? 'bg-card shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground')}>{f === 'checked-in' ? 'In' : f}</button>
        ))}
      </div>
      <Button variant="outline" size="sm" className="h-7 text-[9px] rounded-xl gap-1"><Download className="h-3 w-3" />Export</Button>
      <Button variant="outline" size="sm" className="h-7 text-[9px] rounded-xl gap-1"><Mail className="h-3 w-3" />Email All</Button>
    </>
  );

  const rightRail = (
    <div className="space-y-3">
      <SectionCard title="Breakdown" className="!rounded-2xl">
        <div className="space-y-1 text-[9px]">
          {(Object.keys(STATUS_STYLES) as AttendeeStatus[]).map(s => (
            <div key={s} className="flex items-center gap-1.5">
              <Badge className={cn('text-[7px] border-0 capitalize w-16 justify-center rounded-lg', STATUS_STYLES[s])}>{s}</Badge>
              <span className="font-semibold">{ATTENDEES.filter(a => a.status === s).length}</span>
            </div>
          ))}
        </div>
      </SectionCard>
      <SectionCard title="Tickets" className="!rounded-2xl">
        <div className="space-y-1 text-[9px]">
          {['VIP', 'Professional', 'General'].map(t => (
            <div key={t} className="flex justify-between"><span className="text-muted-foreground">{t}</span><span className="font-semibold">{ATTENDEES.filter(a => a.ticket === t).length}</span></div>
          ))}
        </div>
      </SectionCard>
    </div>
  );

  return (
    <DashboardLayout topStrip={topStrip} rightRail={rightRail} rightRailWidth="w-44">
      <KPIBand className="mb-3">
        <KPICard label="Registered" value={String(ATTENDEES.length)} change="Total" className="!rounded-2xl" />
        <KPICard label="Checked In" value={String(ATTENDEES.filter(a => a.status === 'checked-in' || a.status === 'attended').length)} change="Present" className="!rounded-2xl" />
        <KPICard label="No-Shows" value={String(ATTENDEES.filter(a => a.status === 'no-show').length)} change="Absent" className="!rounded-2xl" />
        <KPICard label="Attendance" value={`${Math.round((ATTENDEES.filter(a => a.status === 'attended' || a.status === 'checked-in').length / ATTENDEES.filter(a => a.status !== 'cancelled').length) * 100)}%`} change="Rate" className="!rounded-2xl" />
      </KPIBand>

      <div className="space-y-2">
        {filtered.map(att => (
          <div key={att.id} className="rounded-2xl border bg-card p-3.5 hover:shadow-sm transition-all flex items-center gap-3">
            <Avatar className="h-9 w-9 rounded-2xl"><AvatarFallback className="rounded-2xl text-[9px] font-bold bg-accent/10 text-accent">{att.initials}</AvatarFallback></Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] font-bold">{att.name}</span>
                <Badge className={cn('text-[7px] border-0 capitalize rounded-lg', STATUS_STYLES[att.status])}>{att.status}</Badge>
                <Badge variant="outline" className="text-[7px] rounded-lg">{att.ticket}</Badge>
              </div>
              <div className="text-[9px] text-muted-foreground">{att.email} · {att.company}</div>
              <div className="text-[8px] text-muted-foreground mt-0.5 flex items-center gap-2">
                <span>Registered {att.registeredAt}</span>
                {att.checkedInAt && <><span>·</span><span className="flex items-center gap-0.5"><CheckCircle className="h-2.5 w-2.5 text-[hsl(var(--state-healthy))]" />In at {att.checkedInAt}</span></>}
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="sm" className="h-6 w-6 p-0 rounded-lg"><Eye className="h-3 w-3" /></Button>
              <Button variant="ghost" size="sm" className="h-6 w-6 p-0 rounded-lg"><Mail className="h-3 w-3" /></Button>
              <Button variant="ghost" size="sm" className="h-6 w-6 p-0 rounded-lg text-destructive"><UserMinus className="h-3 w-3" /></Button>
            </div>
          </div>
        ))}
      </div>
    </DashboardLayout>
  );
};

export default EventAttendeeManagementPage;
