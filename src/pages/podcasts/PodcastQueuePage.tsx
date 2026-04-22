import React from 'react';
import { DashboardLayout } from '@/components/shell/DashboardLayout';
import { SectionCard, KPICard } from '@/components/shell/EnterprisePrimitives';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ListMusic, Play, Clock, GripVertical, X, Shuffle, SkipForward } from 'lucide-react';

const NOW_PLAYING = { title: 'Why AI Agents Will Replace SaaS', show: 'AI Frontiers', progress: 65, elapsed: '27:18', remaining: '14:42' };

const QUEUE = [
  { title: 'The State of LLM Fine-Tuning', show: 'AI Frontiers', duration: '38 min' },
  { title: 'React 21 Deep Dive', show: 'Code Review Radio', duration: '55 min' },
  { title: 'Salary Negotiation Tips', show: 'The Freelance Hour', duration: '42 min' },
  { title: 'Design Systems at Scale', show: 'Design Matters', duration: '48 min' },
  { title: 'Remote Team Culture', show: 'The Freelance Hour', duration: '35 min' },
];

export default function PodcastQueuePage() {
  const topStrip = (
    <>
      <ListMusic className="h-4 w-4 text-accent" />
      <span className="text-xs font-semibold">Queue / Up Next</span>
      <div className="flex-1" />
      <KPICard label="In Queue" value={String(QUEUE.length)} />
      <KPICard label="Total Time" value="3h 38m" />
      <Button variant="outline" size="sm" className="h-7 text-[9px] rounded-xl gap-1"><Shuffle className="h-3 w-3" />Shuffle</Button>
    </>
  );

  return (
    <DashboardLayout topStrip={topStrip}>
      <SectionCard title="Now Playing" className="!rounded-2xl mb-3">
        <div className="flex items-center gap-3">
          <Button className="h-10 w-10 p-0 rounded-xl shrink-0"><Play className="h-4 w-4" /></Button>
          <div className="flex-1 min-w-0">
            <div className="text-[12px] font-bold">{NOW_PLAYING.title}</div>
            <div className="text-[9px] text-muted-foreground">{NOW_PLAYING.show}</div>
            <div className="flex items-center gap-2 mt-1.5">
              <span className="text-[8px] text-muted-foreground">{NOW_PLAYING.elapsed}</span>
              <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-accent rounded-full transition-all" style={{ width: `${NOW_PLAYING.progress}%` }} />
              </div>
              <span className="text-[8px] text-muted-foreground">-{NOW_PLAYING.remaining}</span>
            </div>
          </div>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-xl"><SkipForward className="h-4 w-4" /></Button>
        </div>
      </SectionCard>

      <SectionCard title="Up Next" subtitle={`${QUEUE.length} episodes`} className="!rounded-2xl">
        {QUEUE.map((ep, i) => (
          <div key={i} className="flex items-center gap-2.5 py-2.5 border-b border-border/30 last:border-0 group">
            <GripVertical className="h-3.5 w-3.5 text-muted-foreground/40 cursor-grab shrink-0" />
            <span className="text-[10px] text-muted-foreground w-4 text-center font-mono">{i + 1}</span>
            <Button variant="outline" size="sm" className="h-7 w-7 p-0 rounded-lg shrink-0"><Play className="h-3 w-3" /></Button>
            <div className="flex-1 min-w-0">
              <div className="text-[10px] font-medium truncate">{ep.title}</div>
              <div className="text-[8px] text-muted-foreground">{ep.show} · <Clock className="h-2.5 w-2.5 inline" /> {ep.duration}</div>
            </div>
            <Button variant="ghost" size="sm" className="h-6 w-6 p-0 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"><X className="h-3 w-3" /></Button>
          </div>
        ))}
      </SectionCard>
    </DashboardLayout>
  );
}
