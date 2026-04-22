import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { DashboardLayout } from '@/components/shell/DashboardLayout';
import { SectionCard, KPICard, KPIBand } from '@/components/shell/EnterprisePrimitives';
import { cn } from '@/lib/utils';
import {
  Play, Clock, Download, Share2, MessageSquare,
  Bookmark, SkipForward, Volume2, Maximize, List,
} from 'lucide-react';

interface Chapter { title: string; timestamp: string; duration: string; }

const CHAPTERS: Chapter[] = [
  { title: 'Opening Keynote', timestamp: '00:00', duration: '15 min' },
  { title: 'Platform Engineering Deep Dive', timestamp: '15:00', duration: '25 min' },
  { title: 'Panel: Future of Enterprise', timestamp: '40:00', duration: '20 min' },
  { title: 'Q&A Session', timestamp: '60:00', duration: '15 min' },
  { title: 'Networking Breakout', timestamp: '75:00', duration: '10 min' },
  { title: 'Closing Remarks', timestamp: '85:00', duration: '5 min' },
];

const EventReplayPage: React.FC = () => {
  const topStrip = (
    <>
      <Play className="h-4 w-4 text-muted-foreground" />
      <span className="text-xs font-semibold">Event Replay — Tech Leaders Summit 2026</span>
      <div className="flex-1" />
      <Badge variant="outline" className="text-[9px] rounded-lg gap-1"><Clock className="h-3 w-3" />1h 30m</Badge>
      <Badge className="bg-accent/10 text-accent text-[9px] border-0 rounded-lg">Replay Available</Badge>
    </>
  );

  const rightRail = (
    <div className="space-y-3">
      <SectionCard title="Chapters" className="!rounded-2xl">
        <div className="space-y-1.5">
          {CHAPTERS.map((ch, i) => (
            <button key={ch.title} className={cn('w-full flex items-center gap-1.5 text-[9px] px-1.5 py-1 rounded-lg transition-colors', i === 1 ? 'bg-accent/10 text-accent' : 'hover:bg-muted/50')}>
              <span className="text-[8px] text-muted-foreground font-mono w-8">{ch.timestamp}</span>
              <span className="flex-1 text-left truncate">{ch.title}</span>
            </button>
          ))}
        </div>
      </SectionCard>
      <SectionCard title="Resources" className="!rounded-2xl">
        <div className="space-y-1.5">
          <Button variant="outline" size="sm" className="w-full h-7 text-[9px] rounded-xl gap-1 justify-start"><Download className="h-3 w-3" />Slide Deck (PDF)</Button>
          <Button variant="outline" size="sm" className="w-full h-7 text-[9px] rounded-xl gap-1 justify-start"><Download className="h-3 w-3" />Transcript</Button>
          <Button variant="outline" size="sm" className="w-full h-7 text-[9px] rounded-xl gap-1 justify-start"><List className="h-3 w-3" />Speaker Notes</Button>
        </div>
      </SectionCard>
    </div>
  );

  return (
    <DashboardLayout topStrip={topStrip} rightRail={rightRail} rightRailWidth="w-48">
      {/* Video player */}
      <div className="rounded-2xl bg-black/90 aspect-video flex items-center justify-center mb-3 relative overflow-hidden">
        <button className="h-16 w-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center hover:bg-white/30 transition-colors">
          <Play className="h-7 w-7 text-white ml-1" />
        </button>
        <div className="absolute bottom-0 left-0 right-0 p-3">
          <Progress value={35} className="h-1 rounded-full mb-2" />
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-white/80"><Play className="h-3.5 w-3.5" /></Button>
            <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-white/80"><SkipForward className="h-3.5 w-3.5" /></Button>
            <span className="text-[9px] text-white/60 font-mono">31:30 / 1:30:00</span>
            <div className="flex-1" />
            <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-white/80"><Volume2 className="h-3.5 w-3.5" /></Button>
            <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-white/80"><Maximize className="h-3.5 w-3.5" /></Button>
          </div>
        </div>
      </div>

      {/* Info */}
      <div className="rounded-2xl border bg-card p-4 mb-3">
        <div className="text-[14px] font-bold mb-1">Tech Leaders Summit 2026</div>
        <div className="text-[10px] text-muted-foreground mb-3">Recorded May 15, 2026 · 187 attendees · 1h 30m</div>
        <div className="flex gap-2 flex-wrap">
          <Button variant="outline" size="sm" className="h-7 text-[9px] rounded-xl gap-1"><Bookmark className="h-3 w-3" />Save</Button>
          <Button variant="outline" size="sm" className="h-7 text-[9px] rounded-xl gap-1"><Share2 className="h-3 w-3" />Share</Button>
          <Button variant="outline" size="sm" className="h-7 text-[9px] rounded-xl gap-1"><Download className="h-3 w-3" />Download</Button>
          <Button variant="outline" size="sm" className="h-7 text-[9px] rounded-xl gap-1"><MessageSquare className="h-3 w-3" />Comments (24)</Button>
        </div>
      </div>

      <KPIBand>
        <KPICard label="Total Views" value="1,247" change="Since published" className="!rounded-2xl" />
        <KPICard label="Avg Watch Time" value="52 min" change="58% of total" className="!rounded-2xl" />
        <KPICard label="Completion Rate" value="43%" change="Watched to end" className="!rounded-2xl" />
        <KPICard label="Saves" value="89" change="Bookmarked" className="!rounded-2xl" />
      </KPIBand>
    </DashboardLayout>
  );
};

export default EventReplayPage;
