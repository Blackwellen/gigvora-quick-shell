import React from 'react';
import { DashboardLayout } from '@/components/shell/DashboardLayout';
import { SectionCard, KPICard, KPIBand } from '@/components/shell/EnterprisePrimitives';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { BarChart3, Download, TrendingUp, Clock, Users, Star, Target, Calendar } from 'lucide-react';

const MONTHLY = [
  { month: 'Jan', sessions: 3, hours: 2.5, goals: 6 },
  { month: 'Feb', sessions: 5, hours: 4.0, goals: 9 },
  { month: 'Mar', sessions: 4, hours: 3.5, goals: 8 },
  { month: 'Apr', sessions: 6, hours: 5.0, goals: 11 },
];

const MENTOR_STATS = [
  { name: 'Sarah Chen', sessions: 8, rating: 4.9, goalsSet: 14, goalsCompleted: 11 },
  { name: 'James Wilson', sessions: 5, rating: 4.8, goalsSet: 8, goalsCompleted: 6 },
  { name: 'Priya Sharma', sessions: 6, rating: 4.9, goalsSet: 10, goalsCompleted: 8 },
  { name: 'Marcus Johnson', sessions: 3, rating: 4.7, goalsSet: 5, goalsCompleted: 3 },
];

const SKILLS = [
  { skill: 'Product Management', before: 35, after: 72 },
  { skill: 'System Design', before: 20, after: 55 },
  { skill: 'UX Design', before: 45, after: 78 },
  { skill: 'Interview Readiness', before: 25, after: 68 },
];

export default function MentorAnalyticsPage() {
  return (
    <DashboardLayout topStrip={<><BarChart3 className="h-4 w-4 text-accent" /><span className="text-xs font-semibold">Mentorship Analytics</span><div className="flex-1" /><Button variant="outline" size="sm" className="h-7 text-[10px] rounded-xl gap-1"><Download className="h-3 w-3" />Export</Button></>}>
      <KPIBand className="mb-3">
        <KPICard label="Total Sessions" value="24" change="+6 this month" className="!rounded-2xl" />
        <KPICard label="Total Hours" value="18.5" className="!rounded-2xl" />
        <KPICard label="Goals Achieved" value="31" change="74%" className="!rounded-2xl" />
        <KPICard label="Skill Growth" value="+38%" className="!rounded-2xl" />
      </KPIBand>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 mb-3">
        <SectionCard title="Monthly Activity" className="!rounded-2xl">
          <div className="space-y-2.5">
            {MONTHLY.map(m => (
              <div key={m.month} className="flex items-center gap-3">
                <span className="text-[9px] font-bold w-6">{m.month}</span>
                <div className="flex-1">
                  <div className="flex justify-between text-[8px] mb-0.5"><span>Sessions</span><span className="font-semibold">{m.sessions}</span></div>
                  <Progress value={(m.sessions / 8) * 100} className="h-1 rounded-full mb-1" />
                  <div className="flex justify-between text-[8px] mb-0.5"><span>Hours</span><span className="font-semibold">{m.hours}h</span></div>
                  <Progress value={(m.hours / 6) * 100} className="h-1 rounded-full" />
                </div>
              </div>
            ))}
          </div>
        </SectionCard>

        <SectionCard title="Skill Growth" icon={<TrendingUp className="h-3.5 w-3.5 text-accent" />} className="!rounded-2xl">
          <div className="space-y-2.5">
            {SKILLS.map(s => (
              <div key={s.skill}>
                <div className="flex justify-between text-[9px] mb-0.5"><span className="font-medium">{s.skill}</span><span className="font-bold text-accent">+{s.after - s.before}%</span></div>
                <div className="flex gap-1 items-center">
                  <span className="text-[7px] text-muted-foreground w-6">{s.before}%</span>
                  <div className="flex-1 relative h-2 bg-muted/30 rounded-full overflow-hidden">
                    <div className="absolute inset-y-0 left-0 bg-muted-foreground/20 rounded-full" style={{ width: `${s.before}%` }} />
                    <div className="absolute inset-y-0 left-0 bg-accent rounded-full" style={{ width: `${s.after}%` }} />
                  </div>
                  <span className="text-[7px] font-bold w-6">{s.after}%</span>
                </div>
              </div>
            ))}
          </div>
        </SectionCard>
      </div>

      <SectionCard title="Mentor Performance" className="!rounded-2xl">
        <div className="space-y-1.5">
          <div className="grid grid-cols-5 gap-2 text-[8px] font-medium text-muted-foreground border-b pb-1"><span>Mentor</span><span>Sessions</span><span>Rating</span><span>Goals Set</span><span>Completed</span></div>
          {MENTOR_STATS.map(m => (
            <div key={m.name} className="grid grid-cols-5 gap-2 text-[9px] py-1.5 border-b border-border/20 last:border-0">
              <span className="font-semibold">{m.name}</span>
              <span>{m.sessions}</span>
              <span className="flex items-center gap-0.5"><Star className="h-2.5 w-2.5 text-[hsl(var(--gigvora-amber))]" />{m.rating}</span>
              <span>{m.goalsSet}</span>
              <span className="font-semibold">{m.goalsCompleted} ({Math.round((m.goalsCompleted / m.goalsSet) * 100)}%)</span>
            </div>
          ))}
        </div>
      </SectionCard>
    </DashboardLayout>
  );
}
