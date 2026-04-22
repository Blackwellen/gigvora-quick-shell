import React from 'react';
import { DashboardLayout } from '@/components/shell/DashboardLayout';
import { SectionCard, StatusBadge } from '@/components/shell/EnterprisePrimitives';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, ChevronLeft, ChevronRight, Filter } from 'lucide-react';

const PHASES = [
  { name: 'Planning', start: 0, width: 15, status: 'done' as const },
  { name: 'Design', start: 10, width: 20, status: 'done' as const },
  { name: 'Development', start: 25, width: 40, status: 'in-progress' as const },
  { name: 'Testing', start: 55, width: 20, status: 'upcoming' as const },
  { name: 'Launch', start: 75, width: 10, status: 'upcoming' as const },
];

const MILESTONES = [
  { name: 'Requirements Sign-off', position: 15, status: 'done' as const },
  { name: 'Design Approval', position: 30, status: 'done' as const },
  { name: 'Alpha Release', position: 55, status: 'upcoming' as const },
  { name: 'Beta Release', position: 70, status: 'upcoming' as const },
  { name: 'Go Live', position: 85, status: 'upcoming' as const },
];

const phaseColors = { done: 'bg-accent', 'in-progress': 'bg-[hsl(var(--gigvora-amber))]', upcoming: 'bg-muted-foreground/20' };
const statusMap = { done: 'healthy', 'in-progress': 'caution', upcoming: 'pending' } as const;

export default function ProjectTimelinePage() {
  return (
    <DashboardLayout
      topStrip={
        <div className="flex items-center gap-3 w-full">
          <Calendar className="h-4 w-4 text-accent" />
          <h1 className="text-sm font-bold">Timeline / Gantt</h1>
          <div className="flex-1" />
          <Button variant="ghost" size="sm" className="h-7 w-7 p-0"><ChevronLeft className="h-3 w-3" /></Button>
          <span className="text-[10px] font-medium">Apr 2026</span>
          <Button variant="ghost" size="sm" className="h-7 w-7 p-0"><ChevronRight className="h-3 w-3" /></Button>
          <Button variant="outline" size="sm" className="h-7 text-[10px] gap-1"><Filter className="h-3 w-3" /> Filter</Button>
        </div>
      }
    >
      <SectionCard title="Project Phases">
        <div className="relative mt-4 mb-8">
          {/* Timeline bar */}
          <div className="h-2 bg-muted rounded-full w-full mb-6" />
          {/* Phases */}
          <div className="relative h-40">
            {PHASES.map((p, i) => (
              <div key={i} className="absolute flex flex-col items-start" style={{ left: `${p.start}%`, width: `${p.width}%`, top: `${i * 30}px` }}>
                <div className={`h-6 w-full rounded-lg ${phaseColors[p.status]} opacity-80`} />
                <div className="flex items-center gap-1 mt-1">
                  <span className="text-[9px] font-medium">{p.name}</span>
                  <StatusBadge status={statusMap[p.status]} label={p.status} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </SectionCard>

      <SectionCard title="Milestones" className="mt-4">
        <div className="space-y-2">
          {MILESTONES.map((m, i) => (
            <div key={i} className="flex items-center gap-3 py-2 border-b border-border/30 last:border-0">
              <div className={`h-3 w-3 rounded-full ${m.status === 'done' ? 'bg-accent' : 'bg-muted-foreground/20'} shrink-0`} />
              <span className="text-[10px] font-medium flex-1">{m.name}</span>
              <StatusBadge status={statusMap[m.status]} label={m.status} />
              <span className="text-[9px] text-muted-foreground">Week {Math.ceil(m.position / 10)}</span>
            </div>
          ))}
        </div>
      </SectionCard>
    </DashboardLayout>
  );
}
