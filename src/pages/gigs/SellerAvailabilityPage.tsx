import React from 'react';
import { DashboardLayout } from '@/components/shell/DashboardLayout';
import { SectionCard } from '@/components/shell/EnterprisePrimitives';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { CalendarDays, Clock, Pause, Play, Settings } from 'lucide-react';

export default function SellerAvailabilityPage() {
  return (
    <DashboardLayout
      topStrip={
        <div className="flex items-center gap-3 w-full">
          <CalendarDays className="h-4 w-4 text-accent" />
          <h1 className="text-sm font-bold">Availability Center</h1>
          <Badge className="text-[8px] h-4 bg-[hsl(var(--state-healthy)/0.1)] text-[hsl(var(--state-healthy))] border-0">Online</Badge>
          <div className="flex-1" />
          <Button variant="outline" size="sm" className="h-7 text-[10px] gap-1"><Pause className="h-3 w-3" /> Pause All Gigs</Button>
        </div>
      }
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <SectionCard title="Working Hours">
          <div className="space-y-2">
            {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(day => (
              <div key={day} className="flex items-center gap-3 text-[10px]">
                <label className="w-20 flex items-center gap-2"><input type="checkbox" defaultChecked={day !== 'Sunday'} className="accent-accent" />{day}</label>
                <Input defaultValue={day === 'Sunday' ? '' : '09:00'} placeholder="Off" className="h-7 text-[10px] w-20" disabled={day === 'Sunday'} />
                <span className="text-muted-foreground">to</span>
                <Input defaultValue={day === 'Sunday' ? '' : '18:00'} placeholder="Off" className="h-7 text-[10px] w-20" disabled={day === 'Sunday'} />
              </div>
            ))}
          </div>
        </SectionCard>

        <div className="space-y-4">
          <SectionCard title="Queue Limits">
            <div className="space-y-3">
              <div><label className="text-[10px] font-medium block mb-1">Max concurrent orders</label><Input defaultValue="5" className="h-8 text-xs" /></div>
              <div><label className="text-[10px] font-medium block mb-1">Auto-pause when queue reaches</label><Input defaultValue="8" className="h-8 text-xs" /></div>
              <div><label className="text-[10px] font-medium block mb-1">Response time target</label><Input defaultValue="2 hours" className="h-8 text-xs" /></div>
            </div>
          </SectionCard>

          <SectionCard title="Vacation Mode">
            <div className="space-y-3">
              <div className="p-3 rounded-xl bg-muted/30 text-[10px] text-muted-foreground">
                Vacation mode pauses all gigs and sends an auto-reply to inquiries.
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div><label className="text-[10px] font-medium block mb-1">Start</label><Input type="date" className="h-8 text-xs" /></div>
                <div><label className="text-[10px] font-medium block mb-1">End</label><Input type="date" className="h-8 text-xs" /></div>
              </div>
              <Button variant="outline" size="sm" className="h-8 text-[10px] w-full">Schedule Vacation</Button>
            </div>
          </SectionCard>
        </div>
      </div>

      <SectionCard title="Per-Gig Controls" className="mt-4">
        {[
          { gig: 'Logo Design Package', status: 'active', queue: 3, max: 5 },
          { gig: 'Brand Identity Kit', status: 'active', queue: 1, max: 3 },
          { gig: 'UI/UX Audit', status: 'paused', queue: 0, max: 2 },
        ].map((g, i) => (
          <div key={i} className="flex items-center gap-3 py-2.5 border-b border-border/30 last:border-0">
            <span className="text-[10px] font-medium flex-1">{g.gig}</span>
            <Badge variant={g.status === 'active' ? 'secondary' : 'outline'} className="text-[8px] h-4 capitalize">{g.status}</Badge>
            <span className="text-[9px] text-muted-foreground">{g.queue}/{g.max} in queue</span>
            <Button variant="ghost" size="sm" className="h-6 text-[9px] gap-1">
              {g.status === 'active' ? <><Pause className="h-2.5 w-2.5" /> Pause</> : <><Play className="h-2.5 w-2.5" /> Resume</>}
            </Button>
          </div>
        ))}
      </SectionCard>
    </DashboardLayout>
  );
}
