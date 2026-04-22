import React from 'react';
import { DashboardLayout } from '@/components/shell/DashboardLayout';
import { SectionCard, KPICard, KPIBand } from '@/components/shell/EnterprisePrimitives';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Calendar, Clock, Video, MessageSquare, Star, ChevronRight, Plus } from 'lucide-react';

const UPCOMING = [
  { mentor: 'Sarah Chen', topic: 'Portfolio review & career roadmap', date: 'Apr 18, 2026', time: '2:00 PM', duration: '45 min', type: 'Video' as const },
  { mentor: 'James Wilson', topic: 'System design fundamentals', date: 'Apr 22, 2026', time: '10:00 AM', duration: '30 min', type: 'Video' as const },
];

const PAST = [
  { mentor: 'Priya Sharma', topic: 'UX portfolio feedback', date: 'Apr 10, 2026', rating: 5, notes: 'Excellent feedback on case study structure. Action items: redesign Acme project...' },
  { mentor: 'Sarah Chen', topic: 'Interview preparation', date: 'Apr 5, 2026', rating: 5, notes: 'Practiced behavioral questions. Key takeaway: use STAR method consistently.' },
];

export default function MentorSessionsPage() {
  return (
    <DashboardLayout topStrip={<><Calendar className="h-4 w-4 text-accent" /><span className="text-xs font-semibold">Mentor Sessions</span><div className="flex-1" /><Button size="sm" className="h-7 text-[10px] rounded-xl gap-1"><Plus className="h-3 w-3" />Book Session</Button></>}>
      <KPIBand className="mb-3">
        <KPICard label="Upcoming" value={String(UPCOMING.length)} className="!rounded-2xl" />
        <KPICard label="Completed" value={String(PAST.length)} className="!rounded-2xl" />
        <KPICard label="Total Hours" value="4.5" className="!rounded-2xl" />
        <KPICard label="Avg Rating Given" value="5.0" className="!rounded-2xl" />
      </KPIBand>

      <SectionCard title="Upcoming Sessions" className="!rounded-2xl mb-3">
        {UPCOMING.map((s, i) => (
          <div key={i} className="flex items-center gap-3 py-2.5 border-b border-border/30 last:border-0">
            <Avatar className="h-9 w-9 rounded-lg shrink-0"><AvatarFallback className="rounded-lg bg-accent/10 text-accent text-[9px] font-bold">{s.mentor.split(' ').map(n => n[0]).join('')}</AvatarFallback></Avatar>
            <div className="flex-1 min-w-0">
              <div className="text-[10px] font-bold">{s.topic}</div>
              <div className="text-[8px] text-muted-foreground flex items-center gap-2">
                <span>with {s.mentor}</span>
                <span className="flex items-center gap-0.5"><Calendar className="h-2.5 w-2.5" />{s.date}</span>
                <span className="flex items-center gap-0.5"><Clock className="h-2.5 w-2.5" />{s.time} · {s.duration}</span>
              </div>
            </div>
            <Button size="sm" className="h-7 text-[9px] rounded-xl gap-0.5"><Video className="h-3 w-3" />Join</Button>
          </div>
        ))}
      </SectionCard>

      <SectionCard title="Past Sessions" className="!rounded-2xl">
        {PAST.map((s, i) => (
          <div key={i} className="py-2.5 border-b border-border/30 last:border-0">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold">{s.topic}</span>
                <div className="flex">{Array.from({ length: s.rating }).map((_, j) => <Star key={j} className="h-2.5 w-2.5 text-[hsl(var(--gigvora-amber))] fill-[hsl(var(--gigvora-amber))]" />)}</div>
              </div>
              <span className="text-[8px] text-muted-foreground">{s.date}</span>
            </div>
            <div className="text-[9px] text-muted-foreground flex items-center gap-1"><span className="font-medium text-foreground">{s.mentor}</span></div>
            <div className="text-[8px] text-muted-foreground mt-1 bg-muted/30 rounded-lg p-2">{s.notes}</div>
          </div>
        ))}
      </SectionCard>
    </DashboardLayout>
  );
}
