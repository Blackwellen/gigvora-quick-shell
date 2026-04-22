import React from 'react';
import { DashboardLayout } from '@/components/shell/DashboardLayout';
import { SectionCard } from '@/components/shell/EnterprisePrimitives';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Layers, Play, Clock, Users, Star, ChevronRight, Plus } from 'lucide-react';

const SERIES = [
  { title: 'AI Deep Dives', show: 'AI Frontiers', episodes: 12, duration: '9h 30m', rating: 4.9, status: 'ongoing' as const },
  { title: 'React Patterns Series', show: 'Code Review Radio', episodes: 8, duration: '7h 15m', rating: 4.7, status: 'complete' as const },
  { title: 'Freelance Masterclass', show: 'The Freelance Hour', episodes: 6, duration: '4h 20m', rating: 4.8, status: 'complete' as const },
  { title: 'Design Leadership', show: 'Design Matters', episodes: 4, duration: '3h 45m', rating: 4.6, status: 'ongoing' as const },
];

export default function PodcastSeriesPage() {
  const topStrip = (
    <>
      <Layers className="h-4 w-4 text-accent" />
      <span className="text-xs font-semibold">Albums & Series</span>
      <div className="flex-1" />
      <Button size="sm" className="h-7 text-[10px] gap-1 rounded-xl"><Plus className="h-3 w-3" />Create Series</Button>
    </>
  );

  return (
    <DashboardLayout topStrip={topStrip}>
      <div className="space-y-3">
        {SERIES.map(s => (
          <div key={s.title} className="rounded-2xl border bg-card overflow-hidden hover:shadow-sm transition-all cursor-pointer group">
            <div className="flex">
              <div className="w-36 bg-muted/50 flex items-center justify-center shrink-0">
                <div className="text-center"><Layers className="h-7 w-7 text-muted-foreground/30 mx-auto mb-1" /><div className="text-[8px] text-muted-foreground">{s.episodes} episodes</div></div>
              </div>
              <div className="p-3.5 flex-1">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-[12px] font-bold group-hover:text-accent transition-colors">{s.title}</span>
                  <Badge className={`text-[7px] border-0 rounded-lg ${s.status === 'complete' ? 'bg-[hsl(var(--state-healthy)/0.1)] text-[hsl(var(--state-healthy))]' : 'bg-accent/10 text-accent'}`}>{s.status === 'complete' ? 'Complete' : 'Ongoing'}</Badge>
                </div>
                <div className="text-[9px] text-muted-foreground mb-1.5">{s.show}</div>
                <div className="flex items-center gap-3 text-[8px] text-muted-foreground">
                  <span className="flex items-center gap-0.5"><Play className="h-2.5 w-2.5" />{s.episodes} eps</span>
                  <span className="flex items-center gap-0.5"><Clock className="h-2.5 w-2.5" />{s.duration}</span>
                  <span className="flex items-center gap-0.5"><Star className="h-2.5 w-2.5 text-[hsl(var(--gigvora-amber))]" />{s.rating}</span>
                </div>
                <Button variant="outline" size="sm" className="h-6 text-[8px] rounded-lg gap-1 mt-2">View Series <ChevronRight className="h-2.5 w-2.5" /></Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </DashboardLayout>
  );
}
