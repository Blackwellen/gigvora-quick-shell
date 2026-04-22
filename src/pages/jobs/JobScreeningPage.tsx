import React, { useState } from 'react';
import { DashboardLayout } from '@/components/shell/DashboardLayout';
import { SectionCard, KPICard, KPIBand, StatusBadge } from '@/components/shell/EnterprisePrimitives';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { ScanSearch, ArrowRight, CheckCircle, XCircle, MessageSquare, FileText, Star, Eye } from 'lucide-react';

const CANDIDATES = [
  { name: 'Marcus Thompson', score: 92, resume: true, portfolio: true, assessment: 85, notes: 2, stage: 'Ready for Interview', recommendation: 'strong-yes' as const },
  { name: 'Priya Ramanathan', score: 88, resume: true, portfolio: true, assessment: 78, notes: 1, stage: 'Assessment Complete', recommendation: 'yes' as const },
  { name: 'James Kim', score: 76, resume: true, portfolio: false, assessment: 0, notes: 0, stage: 'Resume Review', recommendation: 'pending' as const },
  { name: 'Lena Müller', score: 71, resume: true, portfolio: true, assessment: 62, notes: 3, stage: 'Assessment Complete', recommendation: 'no' as const },
];

const REC_CONFIG = {
  'strong-yes': { label: 'Strong Yes', class: 'bg-[hsl(var(--state-healthy)/0.1)] text-[hsl(var(--state-healthy))]' },
  'yes': { label: 'Yes', class: 'bg-accent/10 text-accent' },
  'pending': { label: 'Pending', class: 'bg-muted text-muted-foreground' },
  'no': { label: 'No', class: 'bg-[hsl(var(--state-critical)/0.1)] text-[hsl(var(--state-critical))]' },
};

const CRITERIA = [
  { label: 'Technical Skills', weight: 40 },
  { label: 'Experience Match', weight: 25 },
  { label: 'Cultural Fit', weight: 15 },
  { label: 'Communication', weight: 10 },
  { label: 'Portfolio Quality', weight: 10 },
];

export default function JobScreeningPage() {
  return (
    <DashboardLayout topStrip={<><ScanSearch className="h-4 w-4 text-accent" /><span className="text-xs font-semibold">Candidate Screening</span><div className="flex-1" /><Button variant="outline" size="sm" className="h-7 text-[10px] rounded-xl gap-1"><FileText className="h-3 w-3" />Scorecard Template</Button></>}>
      <KPIBand className="mb-3">
        <KPICard label="In Screening" value="8" className="!rounded-2xl" />
        <KPICard label="Passed" value="4" className="!rounded-2xl" />
        <KPICard label="Rejected" value="3" className="!rounded-2xl" />
        <KPICard label="Avg Score" value="81" className="!rounded-2xl" />
      </KPIBand>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 mb-3">
        <SectionCard title="Screening Criteria" className="!rounded-2xl lg:col-span-1">
          <div className="space-y-2">
            {CRITERIA.map(c => (
              <div key={c.label}>
                <div className="flex justify-between text-[9px] mb-0.5"><span className="font-medium">{c.label}</span><span className="font-bold">{c.weight}%</span></div>
                <Progress value={c.weight} className="h-1 rounded-full" />
              </div>
            ))}
          </div>
        </SectionCard>

        <div className="lg:col-span-2 space-y-2">
          {CANDIDATES.map((c, i) => {
            const rec = REC_CONFIG[c.recommendation];
            return (
              <SectionCard key={i} className="!rounded-2xl">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-xl bg-muted/50 flex items-center justify-center text-[10px] font-bold text-muted-foreground shrink-0">{c.name.split(' ').map(n => n[0]).join('')}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-[10px] font-bold">{c.name}</span>
                      <Badge className={cn('text-[7px] border-0 rounded-lg', rec.class)}>{rec.label}</Badge>
                      <div className={cn('px-1.5 py-0.5 rounded-md text-[7px] font-bold', c.score >= 80 ? 'bg-[hsl(var(--state-healthy)/0.1)] text-[hsl(var(--state-healthy))]' : 'bg-[hsl(var(--gigvora-amber)/0.1)] text-[hsl(var(--gigvora-amber))]')}>{c.score}/100</div>
                    </div>
                    <div className="flex items-center gap-3 text-[8px] text-muted-foreground">
                      <span className="flex items-center gap-0.5">{c.resume ? <CheckCircle className="h-2.5 w-2.5 text-[hsl(var(--state-healthy))]" /> : <XCircle className="h-2.5 w-2.5" />}Resume</span>
                      <span className="flex items-center gap-0.5">{c.portfolio ? <CheckCircle className="h-2.5 w-2.5 text-[hsl(var(--state-healthy))]" /> : <XCircle className="h-2.5 w-2.5" />}Portfolio</span>
                      <span>Assessment: {c.assessment > 0 ? `${c.assessment}%` : 'Pending'}</span>
                      <span>{c.stage}</span>
                      {c.notes > 0 && <span className="flex items-center gap-0.5"><MessageSquare className="h-2.5 w-2.5" />{c.notes} notes</span>}
                    </div>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <Button variant="outline" size="sm" className="h-6 text-[8px] rounded-lg gap-0.5"><Eye className="h-2.5 w-2.5" />Review</Button>
                    {c.recommendation !== 'no' && <Button size="sm" className="h-6 text-[8px] rounded-lg gap-0.5"><ArrowRight className="h-2.5 w-2.5" />Advance</Button>}
                  </div>
                </div>
              </SectionCard>
            );
          })}
        </div>
      </div>
    </DashboardLayout>
  );
}
