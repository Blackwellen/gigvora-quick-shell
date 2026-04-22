import React from 'react';
import { DashboardLayout } from '@/components/shell/DashboardLayout';
import { SectionCard, KPICard, KPIBand } from '@/components/shell/EnterprisePrimitives';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Wrench, Upload, MessageSquare, CheckCircle, Clock, FileText, Send, AlertTriangle } from 'lucide-react';

const MILESTONES = [
  { name: 'Discovery & Brief', status: 'complete' as const, date: 'Apr 12' },
  { name: 'Concept Development', status: 'complete' as const, date: 'Apr 15' },
  { name: 'Design Refinement', status: 'in-progress' as const, date: 'Apr 19 (est)' },
  { name: 'Final Delivery', status: 'pending' as const, date: 'Apr 22 (est)' },
];

const DELIVERABLES = [
  { name: 'Logo_Concepts_v2.pdf', size: '4.2 MB', date: 'Apr 15', status: 'approved' },
  { name: 'Brand_Guide_Draft.pdf', size: '8.1 MB', date: 'Apr 17', status: 'pending review' },
  { name: 'Color_Palette.png', size: '1.3 MB', date: 'Apr 15', status: 'approved' },
];

export default function ServiceDeliveryPage() {
  const rightRail = (
    <div className="space-y-3">
      <SectionCard title="Order Summary" className="!rounded-2xl">
        <div className="space-y-1 text-[8px]">
          <div className="flex justify-between"><span className="text-muted-foreground">Order</span><span className="font-mono font-semibold">SVC-4521</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Package</span><span className="font-semibold">Professional</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Amount</span><span className="font-semibold">$1,200</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Deadline</span><span className="font-semibold">Apr 22</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Revisions</span><span className="font-semibold">1/3 used</span></div>
        </div>
      </SectionCard>
      <SectionCard title="Client" className="!rounded-2xl">
        <div className="text-[10px] font-bold mb-0.5">Sarah Kim</div>
        <div className="text-[8px] text-muted-foreground">TechCorp · San Francisco</div>
        <Button variant="outline" className="w-full h-6 text-[8px] rounded-lg mt-2 gap-0.5"><MessageSquare className="h-2.5 w-2.5" />Message</Button>
      </SectionCard>
    </div>
  );

  return (
    <DashboardLayout topStrip={<><Wrench className="h-4 w-4 text-accent" /><span className="text-xs font-semibold">Service Delivery Workspace</span><Badge variant="outline" className="text-[9px] rounded-lg ml-2">SVC-4521</Badge><div className="flex-1" /><Button size="sm" className="h-7 text-[10px] rounded-xl gap-1"><Send className="h-3 w-3" />Submit Delivery</Button></>} rightRail={rightRail} rightRailWidth="w-48">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-[9px] font-medium">Overall Progress</span>
        <Progress value={65} className="h-2 rounded-full flex-1" />
        <span className="text-[10px] font-bold">65%</span>
      </div>

      <SectionCard title="Milestones" className="!rounded-2xl mb-3">
        <div className="space-y-2">
          {MILESTONES.map((m, i) => (
            <div key={i} className="flex items-center gap-2.5">
              {m.status === 'complete' && <CheckCircle className="h-4 w-4 text-[hsl(var(--state-healthy))] shrink-0" />}
              {m.status === 'in-progress' && <Clock className="h-4 w-4 text-accent animate-pulse shrink-0" />}
              {m.status === 'pending' && <div className="h-4 w-4 rounded-full border-2 border-muted-foreground/20 shrink-0" />}
              <span className={`text-[10px] flex-1 ${m.status === 'complete' ? 'text-muted-foreground' : m.status === 'in-progress' ? 'font-bold' : ''}`}>{m.name}</span>
              <span className="text-[8px] text-muted-foreground">{m.date}</span>
            </div>
          ))}
        </div>
      </SectionCard>

      <SectionCard title="Deliverables" action={<Button size="sm" className="h-6 text-[8px] rounded-lg gap-0.5"><Upload className="h-2.5 w-2.5" />Upload</Button>} className="!rounded-2xl mb-3">
        <div className="space-y-1.5">
          {DELIVERABLES.map((d, i) => (
            <div key={i} className="flex items-center gap-2 py-1.5 border-b border-border/20 last:border-0">
              <FileText className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="text-[9px] font-medium truncate">{d.name}</div>
                <div className="text-[7px] text-muted-foreground">{d.size} · {d.date}</div>
              </div>
              <Badge className={`text-[6px] border-0 rounded-md ${d.status === 'approved' ? 'bg-[hsl(var(--state-healthy)/0.1)] text-[hsl(var(--state-healthy))]' : 'bg-[hsl(var(--gigvora-amber)/0.1)] text-[hsl(var(--gigvora-amber))]'}`}>{d.status}</Badge>
            </div>
          ))}
        </div>
      </SectionCard>

      <SectionCard title="Revision Requests" className="!rounded-2xl">
        <div className="p-2.5 rounded-xl bg-[hsl(var(--state-caution)/0.05)] border border-[hsl(var(--state-caution)/0.2)] mb-2">
          <div className="flex items-center gap-1.5 mb-1"><AlertTriangle className="h-3 w-3 text-[hsl(var(--state-caution))]" /><span className="text-[9px] font-semibold">Revision Requested</span></div>
          <div className="text-[8px] text-muted-foreground">Client requested changes to the typography in the brand guide. See message thread for details.</div>
        </div>
        <div className="text-[8px] text-muted-foreground">1 of 3 revisions used · 2 remaining</div>
      </SectionCard>
    </DashboardLayout>
  );
}
