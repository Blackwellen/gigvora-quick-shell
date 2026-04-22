import React from 'react';
import { DashboardLayout } from '@/components/shell/DashboardLayout';
import { SectionCard } from '@/components/shell/EnterprisePrimitives';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Layers, Play, Clock, Users, Star, ChevronRight, Plus } from 'lucide-react';

const SERIES = [
  { id: '1', title: 'React Mastery Series', episodes: 8, totalDuration: '12h', views: 8500, rating: 4.8, description: 'From fundamentals to advanced patterns', status: 'complete' as const },
  { id: '2', title: 'Leadership in Tech', episodes: 5, totalDuration: '6h', views: 4200, rating: 4.6, description: 'Building and leading engineering teams', status: 'ongoing' as const },
  { id: '3', title: 'Design Engineering', episodes: 3, totalDuration: '4h', views: 2800, rating: 4.7, description: 'Where design meets code', status: 'ongoing' as const },
  { id: '4', title: 'Cloud Architecture', episodes: 6, totalDuration: '9h', views: 5600, rating: 4.5, description: 'Building scalable cloud-native systems', status: 'complete' as const },
];

export default function WebinarSeriesPage() {
  const topStrip = (
    <>
      <Layers className="h-4 w-4 text-muted-foreground" />
      <span className="text-xs font-semibold">Webinar Series & Albums</span>
      <div className="flex-1" />
      <Button size="sm" className="h-7 text-[10px] gap-1"><Plus className="h-3 w-3" />Create Series</Button>
    </>
  );

  return (
    <DashboardLayout topStrip={topStrip}>
      <div className="space-y-3">
        {SERIES.map(s => (
          <div key={s.id} className="rounded-2xl border bg-card overflow-hidden hover:shadow-sm transition-all cursor-pointer group">
            <div className="flex">
              <div className="w-40 bg-muted/50 flex items-center justify-center shrink-0">
                <div className="text-center">
                  <Layers className="h-8 w-8 text-muted-foreground/30 mx-auto mb-1" />
                  <div className="text-[9px] text-muted-foreground">{s.episodes} episodes</div>
                </div>
              </div>
              <div className="p-4 flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[12px] font-bold group-hover:text-accent transition-colors">{s.title}</span>
                  <Badge className={cn('text-[7px] border-0 rounded-lg', s.status === 'complete' ? 'bg-[hsl(var(--state-healthy)/0.1)] text-[hsl(var(--state-healthy))]' : 'bg-accent/10 text-accent')}>{s.status === 'complete' ? 'Complete' : 'Ongoing'}</Badge>
                </div>
                <div className="text-[9px] text-muted-foreground mb-2">{s.description}</div>
                <div className="flex items-center gap-3 text-[8px] text-muted-foreground">
                  <span className="flex items-center gap-0.5"><Play className="h-2.5 w-2.5" />{s.episodes} episodes</span>
                  <span className="flex items-center gap-0.5"><Clock className="h-2.5 w-2.5" />{s.totalDuration}</span>
                  <span className="flex items-center gap-0.5"><Users className="h-2.5 w-2.5" />{s.views.toLocaleString()} views</span>
                  <span className="flex items-center gap-0.5"><Star className="h-2.5 w-2.5 text-[hsl(var(--gigvora-amber))]" />{s.rating}</span>
                </div>
                <Button variant="outline" size="sm" className="h-6 text-[9px] rounded-lg gap-1 mt-2">View Series <ChevronRight className="h-2.5 w-2.5" /></Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </DashboardLayout>
  );
}
