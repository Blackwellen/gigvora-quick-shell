import React, { useState } from 'react';
import { DashboardLayout } from '@/components/shell/DashboardLayout';
import { SectionCard } from '@/components/shell/EnterprisePrimitives';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Progress } from '@/components/ui/progress';
import {
  Play, Pause, SkipBack, SkipForward, Volume2, Repeat, Heart,
  Share2, Download, MessageSquare, Clock, BookOpen, ListMusic, Maximize,
} from 'lucide-react';

const EPISODE = {
  title: 'Why AI Agents Will Replace SaaS',
  show: 'AI Frontiers',
  host: 'Dr. Raj Patel',
  number: 78,
  duration: '42:15',
  image: '🤖',
  description: 'In this episode, we explore how autonomous AI agents are poised to disrupt traditional SaaS business models. We discuss the shift from tools-as-products to agents-as-services and what it means for founders, engineers, and investors.',
};

const CHAPTERS = [
  { time: '0:00', title: 'Introduction & Context' },
  { time: '3:45', title: 'What Are AI Agents?' },
  { time: '10:20', title: 'The SaaS Disruption Thesis' },
  { time: '18:30', title: 'Agent Architectures Today' },
  { time: '28:00', title: 'Business Model Implications' },
  { time: '35:15', title: 'Predictions & Closing Thoughts' },
];

const TRANSCRIPT = [
  { time: '0:00', speaker: 'Raj', text: 'Welcome back to AI Frontiers. Today we\'re tackling a provocative question: Will AI agents replace SaaS as we know it?' },
  { time: '0:15', speaker: 'Raj', text: 'I\'ve been thinking about this for months, and after speaking with dozens of founders and researchers, I believe the answer is more nuanced than a simple yes or no.' },
  { time: '0:32', speaker: 'Raj', text: 'Let me start by defining what we mean by AI agents in this context...' },
];

export default function PodcastPlayerPage() {
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState([35]);
  const [volume, setVolume] = useState([75]);
  const [tab, setTab] = useState<'chapters' | 'transcript' | 'notes'>('chapters');

  return (
    <DashboardLayout
      rightRail={
        <div className="space-y-3">
          <SectionCard title="Up Next" icon={<ListMusic className="h-3 w-3 text-muted-foreground" />}>
            {[
              { title: 'The State of LLM Fine-Tuning', show: 'AI Frontiers', duration: '38 min' },
              { title: 'React 21 Deep Dive', show: 'Code Review Radio', duration: '55 min' },
              { title: 'Salary Negotiation Tips', show: 'The Freelance Hour', duration: '42 min' },
            ].map((ep, i) => (
              <div key={i} className="flex items-center gap-2 py-2 border-b border-border/30 last:border-0 cursor-pointer hover:text-accent">
                <Button variant="ghost" size="sm" className="h-5 w-5 p-0"><Play className="h-2.5 w-2.5" /></Button>
                <div className="flex-1 min-w-0">
                  <div className="text-[9px] font-medium truncate">{ep.title}</div>
                  <div className="text-[8px] text-muted-foreground">{ep.show} · {ep.duration}</div>
                </div>
              </div>
            ))}
          </SectionCard>
          <SectionCard title="Episode Info">
            <div className="space-y-1.5 text-[9px]">
              <div className="flex justify-between"><span className="text-muted-foreground">Show</span><span className="font-medium">{EPISODE.show}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Episode</span><span className="font-medium">#{EPISODE.number}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Duration</span><span className="font-medium">{EPISODE.duration}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Host</span><span className="font-medium">{EPISODE.host}</span></div>
            </div>
          </SectionCard>
        </div>
      }
      rightRailWidth="w-52"
    >
      {/* Now Playing */}
      <SectionCard>
        <div className="flex items-center gap-5 py-4">
          <div className="h-24 w-24 rounded-2xl bg-muted flex items-center justify-center text-5xl shrink-0">{EPISODE.image}</div>
          <div className="flex-1 min-w-0">
            <Badge variant="outline" className="text-[8px] h-3.5 mb-1">Episode #{EPISODE.number}</Badge>
            <h2 className="text-lg font-bold">{EPISODE.title}</h2>
            <div className="text-sm text-muted-foreground">{EPISODE.show} · {EPISODE.host}</div>
            <p className="text-[10px] text-muted-foreground mt-2 leading-relaxed line-clamp-2">{EPISODE.description}</p>
          </div>
        </div>

        {/* Progress */}
        <div className="mt-4 space-y-2">
          <Slider value={progress} onValueChange={setProgress} max={100} step={1} className="w-full" />
          <div className="flex justify-between text-[9px] text-muted-foreground">
            <span>14:47</span>
            <span>-27:28</span>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center gap-4 mt-4">
          <Button variant="ghost" size="sm" className="h-10 w-10 p-0 rounded-full"><Repeat className="h-4 w-4" /></Button>
          <Button variant="ghost" size="sm" className="h-10 w-10 p-0 rounded-full"><SkipBack className="h-4 w-4" /></Button>
          <Button size="lg" className="h-14 w-14 p-0 rounded-full" onClick={() => setPlaying(!playing)}>
            {playing ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6 ml-0.5" />}
          </Button>
          <Button variant="ghost" size="sm" className="h-10 w-10 p-0 rounded-full"><SkipForward className="h-4 w-4" /></Button>
          <div className="flex items-center gap-2 ml-2">
            <Volume2 className="h-4 w-4 text-muted-foreground" />
            <Slider value={volume} onValueChange={setVolume} max={100} step={1} className="w-20" />
          </div>
        </div>

        {/* Action bar */}
        <div className="flex items-center justify-center gap-3 mt-4 pt-4 border-t border-border/30">
          <Button variant="ghost" size="sm" className="h-8 text-[10px] gap-1"><Heart className="h-3 w-3" /> Like</Button>
          <Button variant="ghost" size="sm" className="h-8 text-[10px] gap-1"><Download className="h-3 w-3" /> Download</Button>
          <Button variant="ghost" size="sm" className="h-8 text-[10px] gap-1"><Share2 className="h-3 w-3" /> Share</Button>
          <Button variant="ghost" size="sm" className="h-8 text-[10px] gap-1"><MessageSquare className="h-3 w-3" /> Comments</Button>
          <Badge variant="outline" className="text-[8px] h-5 px-2 cursor-pointer">1.5x</Badge>
        </div>
      </SectionCard>

      {/* Tabs: Chapters / Transcript / Notes */}
      <div className="flex items-center gap-2 mt-4 mb-3">
        {(['chapters', 'transcript', 'notes'] as const).map(t => (
          <Button key={t} variant={tab === t ? 'default' : 'outline'} size="sm" className="h-7 text-[10px] capitalize" onClick={() => setTab(t)}>{t}</Button>
        ))}
      </div>

      {tab === 'chapters' && (
        <SectionCard title="Chapters" icon={<BookOpen className="h-3 w-3 text-muted-foreground" />}>
          {CHAPTERS.map((ch, i) => (
            <div key={i} className={`flex items-center gap-3 py-2.5 border-b border-border/30 last:border-0 cursor-pointer hover:text-accent ${i === 1 ? 'text-accent font-medium' : ''}`}>
              <span className="text-[10px] text-muted-foreground font-mono w-10 shrink-0">{ch.time}</span>
              <span className="text-[10px]">{ch.title}</span>
            </div>
          ))}
        </SectionCard>
      )}

      {tab === 'transcript' && (
        <SectionCard title="Transcript" icon={<MessageSquare className="h-3 w-3 text-muted-foreground" />}>
          {TRANSCRIPT.map((t, i) => (
            <div key={i} className="py-2 border-b border-border/30 last:border-0">
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-[8px] text-muted-foreground font-mono">{t.time}</span>
                <span className="text-[9px] font-semibold text-accent">{t.speaker}</span>
              </div>
              <p className="text-[10px] text-muted-foreground leading-relaxed">{t.text}</p>
            </div>
          ))}
        </SectionCard>
      )}

      {tab === 'notes' && (
        <SectionCard title="Your Notes">
          <textarea placeholder="Add notes about this episode..." className="w-full h-32 rounded-lg border bg-background px-3 py-2 text-xs resize-none" />
          <Button size="sm" className="h-7 text-[10px] mt-2">Save Notes</Button>
        </SectionCard>
      )}
    </DashboardLayout>
  );
}
