import React from 'react';
import { DashboardLayout } from '@/components/shell/DashboardLayout';
import { SectionCard, KPICard, KPIBand } from '@/components/shell/EnterprisePrimitives';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Calendar, Clock, Settings, AlertTriangle, ChevronLeft, ChevronRight } from 'lucide-react';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const HOURS = [
  { day: 'Mon', start: '9:00', end: '17:00', active: true },
  { day: 'Tue', start: '9:00', end: '17:00', active: true },
  { day: 'Wed', start: '9:00', end: '17:00', active: true },
  { day: 'Thu', start: '9:00', end: '17:00', active: true },
  { day: 'Fri', start: '9:00', end: '15:00', active: true },
  { day: 'Sat', start: '', end: '', active: false },
  { day: 'Sun', start: '', end: '', active: false },
];

export default function ServiceAvailabilityPage() {
  return (
    <DashboardLayout topStrip={<><Calendar className="h-4 w-4 text-accent" /><span className="text-xs font-semibold">Availability Center</span><div className="flex-1" /><Button size="sm" className="h-7 text-[10px] rounded-xl gap-1"><Settings className="h-3 w-3" />Settings</Button></>}>
      <KPIBand className="mb-3">
        <KPICard label="Active Slots" value="24" change="This week" className="!rounded-2xl" />
        <KPICard label="Booked" value="8" className="!rounded-2xl" />
        <KPICard label="Available" value="16" className="!rounded-2xl" />
        <KPICard label="Utilization" value="33%" className="!rounded-2xl" />
      </KPIBand>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <SectionCard title="Weekly Schedule" className="!rounded-2xl">
          <div className="space-y-2">
            {HOURS.map(h => (
              <div key={h.day} className="flex items-center gap-3 py-1.5 border-b border-border/20 last:border-0">
                <span className="text-[10px] font-bold w-8">{h.day}</span>
                <Switch defaultChecked={h.active} />
                {h.active ? (
                  <div className="flex items-center gap-1.5">
                    <input className="w-16 h-6 rounded-lg border px-2 text-[9px] text-center" defaultValue={h.start} />
                    <span className="text-[8px] text-muted-foreground">to</span>
                    <input className="w-16 h-6 rounded-lg border px-2 text-[9px] text-center" defaultValue={h.end} />
                  </div>
                ) : (
                  <span className="text-[9px] text-muted-foreground">Unavailable</span>
                )}
              </div>
            ))}
          </div>
        </SectionCard>

        <SectionCard title="Calendar View" className="!rounded-2xl">
          <div className="flex items-center justify-between mb-3">
            <Button variant="ghost" size="sm" className="h-6 w-6 p-0 rounded-lg"><ChevronLeft className="h-3.5 w-3.5" /></Button>
            <span className="text-[10px] font-bold">April 2026</span>
            <Button variant="ghost" size="sm" className="h-6 w-6 p-0 rounded-lg"><ChevronRight className="h-3.5 w-3.5" /></Button>
          </div>
          <div className="grid grid-cols-7 gap-1 text-center">
            {DAYS.map(d => <div key={d} className="text-[7px] font-medium text-muted-foreground py-1">{d}</div>)}
            {Array.from({ length: 30 }, (_, i) => i + 1).map(d => (
              <div key={d} className={`h-7 rounded-lg text-[8px] flex items-center justify-center cursor-pointer transition-colors ${d === 14 ? 'bg-accent text-accent-foreground font-bold' : [5, 6, 12, 13, 19, 20, 26, 27].includes(d) ? 'text-muted-foreground/40' : 'hover:bg-muted/50'}`}>{d}</div>
            ))}
          </div>
        </SectionCard>
      </div>

      <SectionCard title="Capacity Rules" className="!rounded-2xl mt-3">
        <div className="space-y-2">
          {[{ label: 'Max concurrent orders', value: '3' }, { label: 'Minimum lead time', value: '2 days' }, { label: 'Buffer between bookings', value: '1 day' }, { label: 'Max bookings per day', value: '4' }].map(r => (
            <div key={r.label} className="flex items-center justify-between py-1">
              <span className="text-[9px]">{r.label}</span>
              <input className="w-20 h-6 rounded-lg border px-2 text-[9px] text-right" defaultValue={r.value} />
            </div>
          ))}
        </div>
        <div className="flex items-center gap-2 mt-3 p-2 rounded-xl bg-[hsl(var(--state-caution)/0.05)] border border-[hsl(var(--state-caution)/0.2)]">
          <AlertTriangle className="h-3.5 w-3.5 text-[hsl(var(--state-caution))] shrink-0" />
          <span className="text-[8px] text-[hsl(var(--state-caution))]">You have 2 overlapping bookings next week. Review your schedule.</span>
        </div>
      </SectionCard>
    </DashboardLayout>
  );
}
