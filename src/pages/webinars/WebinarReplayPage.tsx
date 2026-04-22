import React, { useState } from 'react';
import { DashboardLayout } from '@/components/shell/DashboardLayout';
import { SectionCard } from '@/components/shell/EnterprisePrimitives';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Play, Pause, SkipBack, SkipForward, Volume2, Maximize, Download,
  Share2, BookOpen, MessageSquare, Clock, Heart,
} from 'lucide-react';

const CHAPTERS = [
  { time: '0:00', title: 'Welcome & Introduction' },
  { time: '10:15', title: 'GPU Fleet Management at Scale' },
  { time: '35:30', title: 'Model Serving Architectures' },
  { time: '55:45', title: 'Cost Optimization Strategies' },
  { time: '1:10:00', title: 'Q&A Session' },
];

export default function WebinarReplayPage() {
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState([42]);
  const [tab, setTab] = useState('chapters');

  return (
    <DashboardLayout
      rightRail={
        <div className="space-y-3">
          <SectionCard title="Replay Info">
            <div className="space-y-1.5 text-[9px]">
              <div className="flex justify-between"><span className="text-muted-foreground">Duration</span><span className="font-medium">1:30:00</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Recorded</span><span className="font-medium">Apr 22, 2026</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Views</span><span className="font-medium">1,240</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Rating</span><span className="font-medium">4.8/5</span></div>
            </div>
          </SectionCard>
          <SectionCard title="Resources">
            {['Slide Deck (PDF)', 'Code Samples (GitHub)', 'Reference Architecture'].map((r, i) => (
              <div key={i} className="flex items-center gap-2 py-1.5 border-b border-border/30 last:border-0">
                <Download className="h-2.5 w-2.5 text-muted-foreground" />
                <span className="text-[9px] cursor-pointer hover:text-accent">{r}</span>
              </div>
            ))}
          </SectionCard>
        </div>
      }
      rightRailWidth="w-48"
    >
      {/* Video Player */}
      <div className="aspect-video rounded-2xl bg-[hsl(var(--card))] border overflow-hidden relative group mb-4">
        <div className="absolute inset-0 bg-gradient-to-b from-black/10 to-black/50 flex items-center justify-center">
          <Button size="lg" className="h-16 w-16 rounded-full p-0" onClick={() => setPlaying(!playing)}>
            {playing ? <Pause className="h-7 w-7" /> : <Play className="h-7 w-7 ml-1" />}
          </Button>
        </div>
        <div className="absolute top-3 left-3">
          <Badge className="text-[8px] bg-black/50 text-white border-0">Replay</Badge>
        </div>
        <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/80">
          <Slider value={progress} onValueChange={setProgress} max={100} step={1} className="w-full mb-2" />
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-white"><SkipBack className="h-3 w-3" /></Button>
            <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-white" onClick={() => setPlaying(!playing)}>
              {playing ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
            </Button>
            <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-white"><SkipForward className="h-3 w-3" /></Button>
            <span className="text-[9px] text-white/60 flex-1">37:48 / 1:30:00</span>
            <Badge variant="outline" className="text-[8px] h-4 text-white border-white/30 cursor-pointer">1.5x</Badge>
            <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-white"><Volume2 className="h-3 w-3" /></Button>
            <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-white"><Maximize className="h-3 w-3" /></Button>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3 mb-4">
        <h2 className="text-sm font-bold flex-1">Scaling AI Infrastructure: From Prototype to Production</h2>
        <Button variant="ghost" size="sm" className="h-8 text-[10px] gap-1"><Heart className="h-3 w-3" /> Like</Button>
        <Button variant="ghost" size="sm" className="h-8 text-[10px] gap-1"><Share2 className="h-3 w-3" /> Share</Button>
        <Button variant="ghost" size="sm" className="h-8 text-[10px] gap-1"><Download className="h-3 w-3" /> Download</Button>
      </div>

      <Tabs value={tab} onValueChange={setTab} className="mb-3">
        <TabsList className="h-7">
          <TabsTrigger value="chapters" className="text-[10px] h-5 px-2">Chapters</TabsTrigger>
          <TabsTrigger value="transcript" className="text-[10px] h-5 px-2">Transcript</TabsTrigger>
          <TabsTrigger value="qa" className="text-[10px] h-5 px-2">Q&A Archive</TabsTrigger>
        </TabsList>
      </Tabs>

      {tab === 'chapters' && (
        <SectionCard>
          {CHAPTERS.map((ch, i) => (
            <div key={i} className={`flex items-center gap-3 py-2.5 border-b border-border/30 last:border-0 cursor-pointer hover:text-accent ${i === 1 ? 'text-accent font-medium' : ''}`}>
              <span className="text-[10px] text-muted-foreground font-mono w-12 shrink-0">{ch.time}</span>
              <span className="text-[10px]">{ch.title}</span>
            </div>
          ))}
        </SectionCard>
      )}

      {tab === 'transcript' && (
        <SectionCard title="Transcript">
          {[
            { time: '0:00', speaker: 'Raj', text: 'Welcome everyone to today\'s webinar on scaling AI infrastructure...' },
            { time: '0:45', speaker: 'Raj', text: 'We\'re going to cover four major topics: GPU fleet management, model serving, cost optimization, and observability...' },
          ].map((t, i) => (
            <div key={i} className="py-2 border-b border-border/30 last:border-0">
              <span className="text-[8px] text-muted-foreground font-mono">{t.time}</span>
              <span className="text-[9px] font-semibold text-accent ml-2">{t.speaker}</span>
              <p className="text-[10px] text-muted-foreground mt-0.5">{t.text}</p>
            </div>
          ))}
        </SectionCard>
      )}

      {tab === 'qa' && (
        <SectionCard title="Q&A from Live Session">
          {[
            { q: 'How do you handle model versioning?', a: 'We use a Git-like versioning system for model artifacts...', votes: 12 },
            { q: 'Recommended GPU-to-model ratio for inference?', a: 'It depends on the model size, but for 7B models we typically...', votes: 8 },
          ].map((qa, i) => (
            <div key={i} className="py-3 border-b border-border/30 last:border-0">
              <p className="text-[10px] font-medium mb-1">Q: {qa.q}</p>
              <p className="text-[9px] text-muted-foreground">A: {qa.a}</p>
            </div>
          ))}
        </SectionCard>
      )}
    </DashboardLayout>
  );
}
