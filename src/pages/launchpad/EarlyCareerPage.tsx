import React from 'react';
import { DashboardLayout } from '@/components/shell/DashboardLayout';
import { SectionCard, KPICard, KPIBand } from '@/components/shell/EnterprisePrimitives';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Compass, MapPin, Clock, Star, ChevronRight, Sparkles, BookOpen, Briefcase } from 'lucide-react';

const OPPORTUNITIES = [
  { title: 'Junior Frontend Developer', company: 'TechCorp', location: 'Remote', type: 'Internship', match: 92, deadline: '5 days' },
  { title: 'Marketing Coordinator', company: 'GrowthLab', location: 'London', type: 'Entry Level', match: 87, deadline: '12 days' },
  { title: 'Data Analyst Trainee', company: 'DataFirst', location: 'Berlin', type: 'Apprenticeship', match: 81, deadline: '8 days' },
  { title: 'UX Research Intern', company: 'DesignCo', location: 'Remote', type: 'Internship', match: 78, deadline: '3 days' },
];

export default function EarlyCareerPage() {
  return (
    <DashboardLayout topStrip={<><Compass className="h-4 w-4 text-accent" /><span className="text-xs font-semibold">Early Career Discovery</span><div className="flex-1" /><Button size="sm" className="h-7 text-[10px] rounded-xl gap-1"><Sparkles className="h-3 w-3" />AI Match</Button></>}>
      <KPIBand className="mb-3">
        <KPICard label="Matches" value="24" className="!rounded-2xl" />
        <KPICard label="Applications Sent" value="6" className="!rounded-2xl" />
        <KPICard label="Readiness Score" value="72%" className="!rounded-2xl" />
        <KPICard label="Skills Verified" value="8" className="!rounded-2xl" />
      </KPIBand>

      <SectionCard title="Recommended Opportunities" className="!rounded-2xl mb-3">
        <div className="space-y-2.5">
          {OPPORTUNITIES.map((o, i) => (
            <div key={i} className="rounded-2xl border bg-card p-3.5 hover:shadow-sm transition-all">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-[12px] font-bold">{o.title}</span>
                    <Badge className="text-[7px] bg-accent/10 text-accent border-0 rounded-lg">{o.match}% match</Badge>
                  </div>
                  <div className="text-[9px] text-muted-foreground flex items-center gap-2">
                    <span className="font-medium text-foreground">{o.company}</span>
                    <span className="flex items-center gap-0.5"><MapPin className="h-2.5 w-2.5" />{o.location}</span>
                    <Badge variant="outline" className="text-[7px] rounded-md">{o.type}</Badge>
                  </div>
                  <div className="text-[8px] text-muted-foreground mt-1 flex items-center gap-0.5"><Clock className="h-2.5 w-2.5" />{o.deadline} remaining</div>
                </div>
                <Button variant="outline" size="sm" className="h-7 text-[9px] rounded-xl gap-0.5"><ChevronRight className="h-3 w-3" />View</Button>
              </div>
            </div>
          ))}
        </div>
      </SectionCard>

      <SectionCard title="Readiness Path" icon={<BookOpen className="h-3.5 w-3.5 text-muted-foreground" />} className="!rounded-2xl">
        {[{ step: 'Complete profile', done: true }, { step: 'Verify 3 core skills', done: true }, { step: 'Complete simulation project', done: false }, { step: 'Get mentor endorsement', done: false }].map(s => (
          <div key={s.step} className="flex items-center gap-2.5 py-2 border-b border-border/30 last:border-0">
            <div className={`h-5 w-5 rounded-full flex items-center justify-center text-[8px] font-bold ${s.done ? 'bg-[hsl(var(--state-healthy)/0.15)] text-[hsl(var(--state-healthy))]' : 'border-2 border-muted-foreground/30'}`}>{s.done ? '✓' : ''}</div>
            <span className={`text-[10px] ${s.done ? 'line-through text-muted-foreground' : 'font-medium'}`}>{s.step}</span>
          </div>
        ))}
      </SectionCard>
    </DashboardLayout>
  );
}
