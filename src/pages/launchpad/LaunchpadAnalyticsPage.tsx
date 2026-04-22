import React from 'react';
import { LaunchpadShell } from '@/components/launchpad/LaunchpadShell';
import { SectionCard, KPICard, KPIBand } from '@/components/shell/EnterprisePrimitives';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { BarChart3, TrendingUp, Target, Award, BookOpen, Briefcase, Users, Download } from 'lucide-react';

const SKILL_PROGRESS = [
  { skill: 'React', level: 75, category: 'Technical' },
  { skill: 'TypeScript', level: 60, category: 'Technical' },
  { skill: 'Communication', level: 85, category: 'Professional' },
  { skill: 'Problem Solving', level: 70, category: 'Professional' },
  { skill: 'UX Design', level: 45, category: 'Design' },
  { skill: 'Data Analysis', level: 55, category: 'Analytical' },
];

const MILESTONES = [
  { label: 'First project completed', date: 'Mar 15', done: true },
  { label: 'Mentor session completed', date: 'Mar 22', done: true },
  { label: '3 badges earned', date: 'Apr 2', done: true },
  { label: 'Portfolio published', date: 'Apr 8', done: true },
  { label: '5 projects completed', date: '', done: false },
  { label: 'First application sent', date: '', done: false },
];

export default function LaunchpadAnalyticsPage() {
  return (
    <LaunchpadShell>
      <div className="flex items-center justify-between mb-4">
        <div><h1 className="text-lg font-bold">Progress & Analytics</h1><p className="text-[11px] text-muted-foreground">Track your skill development and achievements</p></div>
        <Button variant="outline" size="sm" className="h-7 text-[10px] rounded-xl gap-1"><Download className="h-3 w-3" />Export Report</Button>
      </div>
      <KPIBand className="mb-3">
        <KPICard label="Overall Readiness" value="72%" change="+8% this month" className="!rounded-2xl" />
        <KPICard label="Skills Verified" value="8/12" className="!rounded-2xl" />
        <KPICard label="Learning Hours" value="42" className="!rounded-2xl" />
        <KPICard label="Milestones Hit" value="4/6" className="!rounded-2xl" />
      </KPIBand>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 mb-3">
        <SectionCard title="Skill Progress" icon={<TrendingUp className="h-3.5 w-3.5 text-muted-foreground" />} className="!rounded-2xl">
          {SKILL_PROGRESS.map(s => (
            <div key={s.skill} className="py-1.5">
              <div className="flex justify-between text-[9px] mb-0.5">
                <span className="font-medium">{s.skill}</span>
                <div className="flex items-center gap-1.5"><Badge variant="outline" className="text-[6px] rounded-md">{s.category}</Badge><span className="font-semibold">{s.level}%</span></div>
              </div>
              <Progress value={s.level} className="h-1 rounded-full" />
            </div>
          ))}
        </SectionCard>

        <SectionCard title="Milestones" icon={<Target className="h-3.5 w-3.5 text-muted-foreground" />} className="!rounded-2xl">
          {MILESTONES.map((m, i) => (
            <div key={i} className="flex items-center gap-2.5 py-1.5 border-b border-border/20 last:border-0">
              <div className={`h-5 w-5 rounded-full flex items-center justify-center text-[8px] font-bold ${m.done ? 'bg-[hsl(var(--state-healthy))]/15 text-[hsl(var(--state-healthy))]' : 'border-2 border-muted-foreground/20'}`}>{m.done ? '✓' : i + 1}</div>
              <span className={`text-[9px] flex-1 ${m.done ? 'text-muted-foreground' : 'font-medium'}`}>{m.label}</span>
              {m.date && <span className="text-[7px] text-muted-foreground">{m.date}</span>}
            </div>
          ))}
        </SectionCard>
      </div>

      <SectionCard title="Activity Summary" className="!rounded-2xl">
        <div className="grid grid-cols-4 gap-3 text-center">
          {[{ icon: BookOpen, label: 'Modules', value: '12' }, { icon: Briefcase, label: 'Projects', value: '3' }, { icon: Users, label: 'Sessions', value: '6' }, { icon: Award, label: 'Badges', value: '3' }].map(a => (
            <div key={a.label} className="p-3 rounded-xl bg-muted/30">
              <a.icon className="h-5 w-5 mx-auto text-accent mb-1" />
              <div className="text-[14px] font-black">{a.value}</div>
              <div className="text-[8px] text-muted-foreground">{a.label}</div>
            </div>
          ))}
        </div>
      </SectionCard>
    </LaunchpadShell>
  );
}
