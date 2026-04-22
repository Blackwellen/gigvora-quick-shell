import React, { useState } from 'react';
import { LaunchpadShell } from '@/components/launchpad/LaunchpadShell';
import { SectionCard, KPICard, KPIBand } from '@/components/shell/EnterprisePrimitives';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  Trophy, Clock, Users, Star, Award, Play, CheckCircle2,
  Target, Zap, Code2, Palette, BarChart3, Megaphone,
  BookOpen, ArrowRight,
} from 'lucide-react';

const CHALLENGES = [
  { id: 'c1', title: 'Design a Mobile Banking App', host: 'DesignFlow', type: 'Design Challenge', difficulty: 'Intermediate', time: '5 days', skills: ['Figma', 'UI Design', 'UX Research'], participants: 180, badge: 'Mobile Designer', outcome: 'Portfolio case study', review: 'Peer + mentor review', icon: Palette, color: 'from-[hsl(var(--gigvora-purple))]/15 to-accent/5', status: 'open' },
  { id: 'c2', title: 'Build a REST API', host: 'TechCorp', type: 'Technical Challenge', difficulty: 'Beginner', time: '3 days', skills: ['Node.js', 'REST', 'SQL'], participants: 340, badge: 'API Builder', outcome: 'Working code project', review: 'Automated tests + mentor', icon: Code2, color: 'from-accent/15 to-[hsl(var(--gigvora-blue))]/5', status: 'open' },
  { id: 'c3', title: 'Social Media Campaign Brief', host: 'GrowthLab', type: 'Creative Challenge', difficulty: 'Beginner', time: '2 days', skills: ['Content', 'Strategy', 'Copywriting'], participants: 220, badge: 'Campaign Creator', outcome: 'Campaign portfolio piece', review: 'Industry panel', icon: Megaphone, color: 'from-[hsl(var(--gigvora-amber))]/15 to-[hsl(var(--gigvora-amber))]/5', status: 'open' },
  { id: 'c4', title: 'Data Dashboard Analysis', host: 'DataSphere', type: 'Business Case', difficulty: 'Intermediate', time: '1 week', skills: ['Python', 'SQL', 'Data Viz'], participants: 130, badge: 'Data Explorer', outcome: 'Analysis report', review: 'Mentor review', icon: BarChart3, color: 'from-[hsl(var(--state-healthy))]/15 to-[hsl(var(--state-healthy))]/5', status: 'open' },
  { id: 'c5', title: 'Product Requirements Doc', host: 'PMSchool', type: 'Business Case', difficulty: 'Advanced', time: '4 days', skills: ['Product', 'Requirements', 'User Stories'], participants: 95, badge: 'Product Thinker', outcome: 'PRD template', review: 'PM mentor', icon: BookOpen, color: 'from-muted to-muted/30', status: 'open' },
  { id: 'c6', title: 'Portfolio Website Challenge', host: 'Gigvora', type: 'Project Simulation', difficulty: 'Beginner', time: '1 week', skills: ['HTML', 'CSS', 'JavaScript'], participants: 510, badge: 'Web Builder', outcome: 'Live portfolio site', review: 'Peer review', icon: Target, color: 'from-accent/15 to-accent/5', status: 'open' },
];

const DIFFICULTY_COLORS: Record<string, string> = {
  Beginner: 'bg-[hsl(var(--state-healthy))]/10 text-[hsl(var(--state-healthy))]',
  Intermediate: 'bg-[hsl(var(--gigvora-amber))]/10 text-[hsl(var(--gigvora-amber))]',
  Advanced: 'bg-accent/10 text-accent',
};

export default function LaunchpadChallengesPage() {
  return (
    <LaunchpadShell>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-lg font-bold">Challenges</h1>
          <p className="text-[11px] text-muted-foreground">Build experience through structured challenges and earn badges</p>
        </div>
      </div>

      <KPIBand className="mb-4">
        <KPICard label="Open Challenges" value={String(CHALLENGES.length)} className="!rounded-2xl" />
        <KPICard label="Completed" value="3" className="!rounded-2xl" />
        <KPICard label="Badges Earned" value="3" className="!rounded-2xl" />
        <KPICard label="Portfolio Items" value="4" className="!rounded-2xl" />
      </KPIBand>

      <div className="flex gap-1.5 mb-4 overflow-x-auto pb-1 scrollbar-none">
        {['All', 'Design Challenge', 'Technical Challenge', 'Creative Challenge', 'Business Case', 'Project Simulation'].map(t => (
          <Badge key={t} variant="outline" className="text-[9px] rounded-xl px-3 py-1.5 cursor-pointer hover:bg-accent/10 shrink-0">{t}</Badge>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {CHALLENGES.map(c => (
          <div key={c.id} className="rounded-2xl border bg-card overflow-hidden hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer group">
            <div className={cn('h-20 bg-gradient-to-br flex items-center justify-center relative', c.color)}>
              <c.icon className="h-8 w-8 text-muted-foreground/20" />
              <Badge className={cn('absolute top-3 right-3 text-[7px] border-0 rounded-lg', DIFFICULTY_COLORS[c.difficulty])}>{c.difficulty}</Badge>
            </div>
            <div className="p-4">
              <Badge variant="outline" className="text-[7px] rounded-md mb-1.5">{c.type}</Badge>
              <div className="text-[12px] font-bold group-hover:text-accent transition-colors mb-0.5">{c.title}</div>
              <div className="text-[9px] text-muted-foreground mb-2">by {c.host}</div>
              <div className="flex items-center gap-2 text-[8px] text-muted-foreground mb-2">
                <span className="flex items-center gap-0.5"><Clock className="h-2.5 w-2.5" />{c.time}</span>
                <span className="flex items-center gap-0.5"><Users className="h-2.5 w-2.5" />{c.participants}</span>
                <span className="flex items-center gap-0.5"><Award className="h-2.5 w-2.5 text-accent" />{c.badge}</span>
              </div>
              <div className="flex gap-1 flex-wrap mb-3">{c.skills.map(s => <Badge key={s} variant="secondary" className="text-[6px] h-3 rounded-md">{s}</Badge>)}</div>
              <div className="flex items-center gap-2 text-[8px] text-muted-foreground mb-3">
                <CheckCircle2 className="h-3 w-3 text-accent" />
                <span>{c.outcome}</span>
                <span className="text-[7px]">· {c.review}</span>
              </div>
              <Button size="sm" className="h-7 text-[9px] rounded-xl w-full gap-1"><Play className="h-3 w-3" />Start Challenge</Button>
            </div>
          </div>
        ))}
      </div>
    </LaunchpadShell>
  );
}
