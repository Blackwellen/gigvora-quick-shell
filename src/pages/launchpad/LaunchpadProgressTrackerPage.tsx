import React from 'react';
import { Link } from 'react-router-dom';
import { LaunchpadShell } from '@/components/launchpad/LaunchpadShell';
import { SectionCard, KPICard } from '@/components/shell/EnterprisePrimitives';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  CheckCircle2, Circle, ChevronRight, Trophy, Target,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Milestone {
  id: string; label: string; status: 'done' | 'active' | 'locked'; category: string;
}

const MILESTONES: Milestone[] = [
  { id: 'm1', label: 'Complete your profile', status: 'done', category: 'Setup' },
  { id: 'm2', label: 'Choose a career pathway', status: 'done', category: 'Setup' },
  { id: 'm3', label: 'Upload your CV / portfolio', status: 'done', category: 'Setup' },
  { id: 'm4', label: 'Connect with a mentor', status: 'done', category: 'Connect' },
  { id: 'm5', label: 'Complete first mentor session', status: 'active', category: 'Connect' },
  { id: 'm6', label: 'Join a learning path', status: 'active', category: 'Learn' },
  { id: 'm7', label: 'Complete a micro-project', status: 'locked', category: 'Build' },
  { id: 'm8', label: 'Earn your first badge', status: 'locked', category: 'Build' },
  { id: 'm9', label: 'Apply to an opportunity', status: 'locked', category: 'Apply' },
  { id: 'm10', label: 'Get shortlisted', status: 'locked', category: 'Apply' },
];

export default function LaunchpadProgressTrackerPage() {
  const done = MILESTONES.filter(m => m.status === 'done').length;
  const total = MILESTONES.length;
  const pct = Math.round((done / total) * 100);

  return (
    <LaunchpadShell>
      <div className="mb-4"><h1 className="text-lg font-bold">My Progress</h1><p className="text-[11px] text-muted-foreground">Track your launchpad journey and milestones</p></div>

      {/* Progress Overview */}
      <div className="rounded-2xl border bg-gradient-to-r from-accent/5 to-[hsl(var(--gigvora-purple))]/5 p-5 mb-4">
        <div className="flex items-center gap-4">
          <div className="h-20 w-20 rounded-2xl bg-accent/10 flex items-center justify-center shrink-0">
            <div className="text-center">
              <div className="text-2xl font-bold text-accent">{pct}%</div>
              <div className="text-[8px] text-muted-foreground">Complete</div>
            </div>
          </div>
          <div className="flex-1">
            <h3 className="text-[14px] font-bold mb-1">Your Journey Progress</h3>
            <p className="text-[10px] text-muted-foreground mb-2">{done} of {total} milestones completed · Keep going!</p>
            <Progress value={pct} className="h-2" />
          </div>
        </div>
      </div>

      {/* KPIs */}
      <div className="flex items-center gap-3 flex-wrap rounded-2xl border bg-card px-5 py-3 shadow-card mb-4">
        <KPICard label="Milestones" value={`${done}/${total}`} />
        <KPICard label="Mentor Sessions" value="1" />
        <KPICard label="Badges Earned" value="3" />
        <KPICard label="Applications" value="0" />
        <KPICard label="Days Active" value="12" />
      </div>

      {/* Milestone Timeline */}
      <SectionCard title="Milestones" icon={<Target className="h-3.5 w-3.5 text-accent" />}>
        <div className="space-y-0">
          {MILESTONES.map((m, i) => {
            const isLast = i === MILESTONES.length - 1;
            const showCategory = i === 0 || MILESTONES[i - 1].category !== m.category;
            return (
              <React.Fragment key={m.id}>
                {showCategory && (
                  <div className="text-[8px] font-bold text-muted-foreground uppercase tracking-wider pt-3 pb-1">{m.category}</div>
                )}
                <div className="flex items-center gap-3">
                  <div className="flex flex-col items-center">
                    {m.status === 'done' ? (
                      <CheckCircle2 className="h-5 w-5 text-[hsl(var(--state-healthy))]" />
                    ) : m.status === 'active' ? (
                      <div className="h-5 w-5 rounded-full border-2 border-accent bg-accent/10 flex items-center justify-center">
                        <div className="h-2 w-2 rounded-full bg-accent animate-pulse" />
                      </div>
                    ) : (
                      <Circle className="h-5 w-5 text-muted-foreground/30" />
                    )}
                    {!isLast && <div className={cn('w-px h-6', m.status === 'done' ? 'bg-[hsl(var(--state-healthy))]/30' : 'bg-border')} />}
                  </div>
                  <div className={cn(
                    'flex-1 py-2 text-[10px]',
                    m.status === 'locked' ? 'text-muted-foreground/50' :
                    m.status === 'active' ? 'font-semibold text-accent' : 'text-foreground'
                  )}>
                    {m.label}
                    {m.status === 'active' && <Badge className="text-[7px] h-3.5 ml-2 bg-accent/10 text-accent border-0">In Progress</Badge>}
                    {m.status === 'done' && <Badge className="text-[7px] h-3.5 ml-2 bg-[hsl(var(--state-healthy))]/10 text-[hsl(var(--state-healthy))] border-0">Done</Badge>}
                  </div>
                  {m.status === 'active' && (
                    <Button size="sm" className="h-6 text-[8px] rounded-lg gap-0.5 shrink-0">
                      Continue <ChevronRight className="h-2.5 w-2.5" />
                    </Button>
                  )}
                </div>
              </React.Fragment>
            );
          })}
        </div>
      </SectionCard>

      {/* Achievements */}
      <SectionCard title="Achievements" icon={<Trophy className="h-3.5 w-3.5 text-[hsl(var(--gigvora-amber))]" />} className="mt-3">
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: 'Profile Complete', icon: '✅', earned: true },
            { label: 'First Connection', icon: '🤝', earned: true },
            { label: 'Pathway Pioneer', icon: '🧭', earned: true },
            { label: 'Quick Learner', icon: '📖', earned: false },
            { label: 'Project Builder', icon: '🔨', earned: false },
            { label: 'Job Ready', icon: '🚀', earned: false },
          ].map(a => (
            <div key={a.label} className={cn(
              'text-center p-3 rounded-xl border transition-all',
              a.earned ? 'border-[hsl(var(--gigvora-amber))]/30 bg-[hsl(var(--gigvora-amber))]/5' : 'border-border/20 opacity-40'
            )}>
              <span className="text-xl block mb-1">{a.icon}</span>
              <span className="text-[8px] font-semibold">{a.label}</span>
            </div>
          ))}
        </div>
      </SectionCard>
    </LaunchpadShell>
  );
}
