import React from 'react';
import { DashboardLayout } from '@/components/shell/DashboardLayout';
import { SectionCard, KPICard, KPIBand } from '@/components/shell/EnterprisePrimitives';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Star, MessageSquare, ThumbsUp, TrendingUp, Target, CheckCircle, AlertTriangle } from 'lucide-react';

const FEEDBACK = [
  { mentor: 'Sarah Chen', session: 'Portfolio review & career roadmap', date: 'Apr 18, 2026', rating: 5, outcome: 'Action plan created', goals: ['Redesign Acme case study', 'Apply to 5 PM roles', 'Update LinkedIn'], mentorNotes: 'Great session! Alex showed strong analytical thinking. Needs to work on storytelling in case studies.', menteeNotes: 'Extremely helpful. Sarah gave concrete, actionable feedback on my portfolio.' },
  { mentor: 'James Wilson', session: 'System design fundamentals', date: 'Apr 14, 2026', rating: 4, outcome: 'Skills assessment', goals: ['Practice 3 system design problems', 'Read "Designing Data-Intensive Apps" Ch.1-3'], mentorNotes: 'Good foundational knowledge but needs practice with distributed system patterns.', menteeNotes: 'Learned a lot about trade-offs in system design. Would like a follow-up on caching strategies.' },
  { mentor: 'Priya Sharma', session: 'UX portfolio feedback', date: 'Apr 10, 2026', rating: 5, outcome: 'Portfolio restructured', goals: ['Add metrics to all case studies', 'Create process documentation'], mentorNotes: 'Excellent design sensibility. Portfolio needs more emphasis on process and outcomes.', menteeNotes: 'Priya helped me see my portfolio from a hiring manager\'s perspective. Invaluable.' },
];

const RATING_DIST = [
  { stars: 5, count: 18, pct: 75 },
  { stars: 4, count: 4, pct: 17 },
  { stars: 3, count: 2, pct: 8 },
  { stars: 2, count: 0, pct: 0 },
  { stars: 1, count: 0, pct: 0 },
];

export default function MentorFeedbackPage() {
  return (
    <DashboardLayout topStrip={<><MessageSquare className="h-4 w-4 text-accent" /><span className="text-xs font-semibold">Session Feedback & Outcomes</span><div className="flex-1" /></>}>
      <KPIBand className="mb-3">
        <KPICard label="Sessions Completed" value="24" className="!rounded-2xl" />
        <KPICard label="Avg Rating Given" value="4.8" className="!rounded-2xl" />
        <KPICard label="Goals Set" value="42" className="!rounded-2xl" />
        <KPICard label="Goals Completed" value="31" change="74%" className="!rounded-2xl" />
      </KPIBand>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 mb-3">
        <SectionCard title="Rating Distribution" className="!rounded-2xl">
          <div className="space-y-1.5">
            {RATING_DIST.map(r => (
              <div key={r.stars} className="flex items-center gap-2">
                <div className="flex items-center gap-0.5 w-12">{Array.from({ length: r.stars }).map((_, i) => <Star key={i} className="h-2 w-2 text-[hsl(var(--gigvora-amber))] fill-[hsl(var(--gigvora-amber))]" />)}</div>
                <Progress value={r.pct} className="h-1.5 flex-1 rounded-full" />
                <span className="text-[8px] font-semibold w-4 text-right">{r.count}</span>
              </div>
            ))}
          </div>
        </SectionCard>
        <SectionCard title="Outcome Types" className="!rounded-2xl">
          <div className="space-y-1.5">
            {[{ label: 'Action plan created', count: 12, icon: Target }, { label: 'Skills assessment', count: 6, icon: TrendingUp }, { label: 'Portfolio restructured', count: 4, icon: CheckCircle }, { label: 'Interview prep', count: 2, icon: ThumbsUp }].map(o => (
              <div key={o.label} className="flex items-center gap-2 text-[9px]">
                <o.icon className="h-3 w-3 text-accent shrink-0" />
                <span className="flex-1">{o.label}</span>
                <span className="font-bold">{o.count}</span>
              </div>
            ))}
          </div>
        </SectionCard>
        <SectionCard title="Goal Progress" className="!rounded-2xl">
          <div className="space-y-2">
            <div className="flex justify-between text-[9px]"><span>Completed</span><span className="font-bold text-[hsl(var(--state-healthy))]">31</span></div>
            <Progress value={74} className="h-2 rounded-full" />
            <div className="flex justify-between text-[9px]"><span>In Progress</span><span className="font-bold text-accent">8</span></div>
            <Progress value={19} className="h-2 rounded-full" />
            <div className="flex justify-between text-[9px]"><span>Overdue</span><span className="font-bold text-[hsl(var(--state-critical))]">3</span></div>
            <Progress value={7} className="h-2 rounded-full" />
          </div>
        </SectionCard>
      </div>

      <SectionCard title="Session Feedback" className="!rounded-2xl">
        <div className="space-y-3">
          {FEEDBACK.map((f, i) => (
            <div key={i} className="rounded-2xl border p-3">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Avatar className="h-8 w-8 rounded-lg"><AvatarFallback className="rounded-lg bg-accent/10 text-accent text-[9px] font-bold">{f.mentor.split(' ').map(n => n[0]).join('')}</AvatarFallback></Avatar>
                  <div>
                    <div className="text-[10px] font-bold">{f.session}</div>
                    <div className="text-[8px] text-muted-foreground">with {f.mentor} · {f.date}</div>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <div className="flex">{Array.from({ length: f.rating }).map((_, j) => <Star key={j} className="h-2.5 w-2.5 text-[hsl(var(--gigvora-amber))] fill-[hsl(var(--gigvora-amber))]" />)}</div>
                  <Badge className="text-[7px] bg-accent/10 text-accent border-0 rounded-lg ml-1">{f.outcome}</Badge>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 mb-2">
                <div className="rounded-xl bg-muted/30 p-2"><div className="text-[7px] font-bold text-muted-foreground mb-0.5">Mentor Notes</div><p className="text-[8px]">{f.mentorNotes}</p></div>
                <div className="rounded-xl bg-muted/30 p-2"><div className="text-[7px] font-bold text-muted-foreground mb-0.5">Your Notes</div><p className="text-[8px]">{f.menteeNotes}</p></div>
              </div>
              <div><div className="text-[7px] font-bold text-muted-foreground mb-0.5">Action Items</div><div className="flex flex-wrap gap-1">{f.goals.map(g => <Badge key={g} variant="outline" className="text-[7px] rounded-md gap-0.5"><Target className="h-2 w-2" />{g}</Badge>)}</div></div>
            </div>
          ))}
        </div>
      </SectionCard>
    </DashboardLayout>
  );
}
