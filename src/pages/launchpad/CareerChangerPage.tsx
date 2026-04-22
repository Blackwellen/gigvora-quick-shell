import React from 'react';
import { DashboardLayout } from '@/components/shell/DashboardLayout';
import { SectionCard, KPICard, KPIBand } from '@/components/shell/EnterprisePrimitives';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Target, ArrowRight, CheckCircle, Sparkles, BookOpen, MapPin } from 'lucide-react';

const TRANSITIONS = [
  { from: 'Teaching', to: 'UX Research', transferable: ['Communication', 'Analysis', 'Empathy'], gap: ['Figma', 'Usability Testing'], readiness: 65 },
  { from: 'Finance', to: 'Data Science', transferable: ['Excel', 'Statistics', 'Problem Solving'], gap: ['Python', 'ML Frameworks'], readiness: 55 },
  { from: 'Marketing', to: 'Product Management', transferable: ['Strategy', 'Analytics', 'Stakeholder Mgmt'], gap: ['Technical Writing', 'Agile'], readiness: 72 },
];

export default function CareerChangerPage() {
  return (
    <DashboardLayout topStrip={<><Target className="h-4 w-4 text-accent" /><span className="text-xs font-semibold">Career Changer Pathways</span><div className="flex-1" /><Button size="sm" className="h-7 text-[10px] rounded-xl gap-1"><Sparkles className="h-3 w-3" />AI Career Match</Button></>}>
      <KPIBand className="mb-3">
        <KPICard label="Transition Paths" value="12" className="!rounded-2xl" />
        <KPICard label="Transferable Skills" value="8" className="!rounded-2xl" />
        <KPICard label="Skills to Learn" value="4" className="!rounded-2xl" />
        <KPICard label="Readiness" value="65%" className="!rounded-2xl" />
      </KPIBand>

      <div className="space-y-3">
        {TRANSITIONS.map((t, i) => (
          <SectionCard key={i} className="!rounded-2xl">
            <div className="flex items-center gap-3 mb-3">
              <Badge variant="outline" className="text-[9px] rounded-xl px-3 py-1">{t.from}</Badge>
              <ArrowRight className="h-4 w-4 text-accent" />
              <Badge className="text-[9px] bg-accent/10 text-accent border-0 rounded-xl px-3 py-1">{t.to}</Badge>
              <div className="flex-1" />
              <span className="text-[10px] font-bold">{t.readiness}% ready</span>
            </div>
            <Progress value={t.readiness} className="h-1.5 rounded-full mb-3" />
            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className="text-[9px] font-semibold mb-1.5 flex items-center gap-1"><CheckCircle className="h-3 w-3 text-[hsl(var(--state-healthy))]" />Transferable Skills</div>
                <div className="flex flex-wrap gap-1">{t.transferable.map(s => <Badge key={s} variant="outline" className="text-[7px] rounded-md bg-[hsl(var(--state-healthy)/0.05)]">{s}</Badge>)}</div>
              </div>
              <div>
                <div className="text-[9px] font-semibold mb-1.5 flex items-center gap-1"><BookOpen className="h-3 w-3 text-[hsl(var(--state-caution))]" />Skills to Develop</div>
                <div className="flex flex-wrap gap-1">{t.gap.map(s => <Badge key={s} variant="outline" className="text-[7px] rounded-md bg-[hsl(var(--state-caution)/0.05)]">{s}</Badge>)}</div>
              </div>
            </div>
            <Button variant="outline" className="h-7 text-[9px] rounded-xl mt-3 gap-0.5">Start This Path <ArrowRight className="h-3 w-3" /></Button>
          </SectionCard>
        ))}
      </div>
    </DashboardLayout>
  );
}
