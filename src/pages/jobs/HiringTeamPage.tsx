import React from 'react';
import { DashboardLayout } from '@/components/shell/DashboardLayout';
import { SectionCard, KPICard, KPIBand } from '@/components/shell/EnterprisePrimitives';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { UsersRound, Plus, MessageSquare, Star, Settings, Eye, UserPlus, Shield } from 'lucide-react';

const TEAM_MEMBERS = [
  { name: 'Alex Rivera', role: 'Recruiter', permissions: 'Full Access', actions: 24, lastActive: '10m ago', avatar: 'AR' },
  { name: 'Jordan Mitchell', role: 'Hiring Manager', permissions: 'Review & Decide', actions: 18, lastActive: '1h ago', avatar: 'JM' },
  { name: 'Sam Kowalski', role: 'Interviewer', permissions: 'Interview Only', actions: 8, lastActive: '3h ago', avatar: 'SK' },
  { name: 'Dana Park', role: 'Coordinator', permissions: 'Schedule Only', actions: 32, lastActive: '30m ago', avatar: 'DP' },
];

const FEEDBACK = [
  { candidate: 'Marcus Thompson', reviewer: 'Jordan M.', rating: 4, comment: 'Strong technical skills, good culture fit. Recommend moving forward.', date: '2h ago' },
  { candidate: 'Priya Ramanathan', reviewer: 'Sam K.', rating: 5, comment: 'Excellent problem-solving. Best candidate in the pipeline.', date: '5h ago' },
  { candidate: 'James Kim', reviewer: 'Alex R.', rating: 3, comment: 'Decent skills but lacks senior-level experience. Consider for mid-level.', date: '1d ago' },
];

const PERM_CLASS: Record<string, string> = {
  'Full Access': 'bg-accent/10 text-accent',
  'Review & Decide': 'bg-[hsl(var(--gigvora-amber)/0.1)] text-[hsl(var(--gigvora-amber))]',
  'Interview Only': 'bg-muted text-muted-foreground',
  'Schedule Only': 'bg-muted text-muted-foreground',
};

export default function HiringTeamPage() {
  return (
    <DashboardLayout topStrip={<><UsersRound className="h-4 w-4 text-accent" /><span className="text-xs font-semibold">Hiring Team Collaboration</span><div className="flex-1" /><Button size="sm" className="h-7 text-[10px] rounded-xl gap-1"><UserPlus className="h-3 w-3" />Invite Member</Button></>}>
      <KPIBand className="mb-3">
        <KPICard label="Team Size" value="4" className="!rounded-2xl" />
        <KPICard label="Feedback Given" value="12" className="!rounded-2xl" />
        <KPICard label="Avg Response Time" value="4h" className="!rounded-2xl" />
        <KPICard label="Consensus Rate" value="78%" className="!rounded-2xl" />
      </KPIBand>

      <SectionCard title="Team Members" action={<Button variant="outline" size="sm" className="h-6 text-[8px] rounded-lg gap-0.5"><Settings className="h-2.5 w-2.5" />Permissions</Button>} className="!rounded-2xl mb-3">
        <div className="space-y-2">
          {TEAM_MEMBERS.map((m, i) => (
            <div key={i} className="rounded-2xl border p-3 flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-accent/10 flex items-center justify-center text-[10px] font-bold text-accent shrink-0">{m.avatar}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-[10px] font-bold">{m.name}</span>
                  <Badge variant="outline" className="text-[7px] rounded-md">{m.role}</Badge>
                  <Badge className={cn('text-[6px] border-0 rounded-md', PERM_CLASS[m.permissions])}><Shield className="h-2 w-2 mr-0.5" />{m.permissions}</Badge>
                </div>
                <div className="text-[8px] text-muted-foreground">{m.actions} actions · Last active {m.lastActive}</div>
              </div>
              <Button variant="outline" size="sm" className="h-6 text-[8px] rounded-lg gap-0.5"><MessageSquare className="h-2.5 w-2.5" />Message</Button>
            </div>
          ))}
        </div>
      </SectionCard>

      <SectionCard title="Recent Feedback" className="!rounded-2xl">
        <div className="space-y-2">
          {FEEDBACK.map((f, i) => (
            <div key={i} className="py-2.5 border-b border-border/20 last:border-0">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold">{f.candidate}</span>
                  <span className="text-[8px] text-muted-foreground">by {f.reviewer}</span>
                  <div className="flex">{Array.from({ length: f.rating }).map((_, j) => <Star key={j} className="h-2.5 w-2.5 text-[hsl(var(--gigvora-amber))] fill-[hsl(var(--gigvora-amber))]" />)}</div>
                </div>
                <span className="text-[7px] text-muted-foreground">{f.date}</span>
              </div>
              <div className="text-[9px] text-muted-foreground">{f.comment}</div>
            </div>
          ))}
        </div>
      </SectionCard>
    </DashboardLayout>
  );
}
