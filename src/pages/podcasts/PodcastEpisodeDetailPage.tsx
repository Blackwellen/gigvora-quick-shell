import React from 'react';
import { DashboardLayout } from '@/components/shell/DashboardLayout';
import { SectionCard, KPICard } from '@/components/shell/EnterprisePrimitives';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Play, Clock, Calendar, Download, Share2, Heart, Bookmark, MessageSquare, ListPlus, ChevronRight } from 'lucide-react';

const CHAPTERS = [
  { title: 'Introduction', time: '0:00', duration: '2 min' },
  { title: 'The Problem with Current Approaches', time: '2:15', duration: '8 min' },
  { title: 'New Architecture Overview', time: '10:30', duration: '12 min' },
  { title: 'Performance Benchmarks', time: '22:45', duration: '10 min' },
  { title: 'Q&A Highlights', time: '32:50', duration: '9 min' },
];

export default function PodcastEpisodeDetailPage() {
  const topStrip = (
    <>
      <Play className="h-4 w-4 text-accent" />
      <span className="text-xs font-semibold">Episode Detail</span>
      <div className="flex-1" />
      <Badge variant="outline" className="text-[9px] rounded-lg gap-1"><Calendar className="h-3 w-3" />May 12, 2026</Badge>
      <Badge variant="outline" className="text-[9px] rounded-lg gap-1"><Clock className="h-3 w-3" />42 min</Badge>
    </>
  );

  const rightRail = (
    <div className="space-y-3">
      <SectionCard title="Show" className="!rounded-2xl">
        <div className="flex items-center gap-2 mb-2">
          <div className="h-10 w-10 rounded-xl bg-muted flex items-center justify-center text-lg">🤖</div>
          <div><div className="text-[10px] font-bold">AI Frontiers</div><div className="text-[8px] text-muted-foreground">Dr. Raj Patel</div></div>
        </div>
        <Button variant="outline" size="sm" className="w-full h-7 text-[9px] rounded-xl">View Show</Button>
      </SectionCard>
      <SectionCard title="Related Episodes" className="!rounded-2xl">
        {['LLM Fine-Tuning Deep Dive', 'AI Agents in Production', 'RAG Architecture Patterns'].map(ep => (
          <div key={ep} className="flex items-center gap-2 py-1.5 text-[9px] cursor-pointer hover:text-accent transition-colors">
            <Play className="h-2.5 w-2.5 shrink-0" /><span className="truncate">{ep}</span>
          </div>
        ))}
      </SectionCard>
    </div>
  );

  return (
    <DashboardLayout topStrip={topStrip} rightRail={rightRail} rightRailWidth="w-44">
      <div className="space-y-3">
        <SectionCard className="!rounded-2xl">
          <div className="text-[16px] font-bold mb-1">Why AI Agents Will Replace SaaS</div>
          <div className="text-[10px] text-muted-foreground mb-3">Season 3, Episode 14 · AI Frontiers with Dr. Raj Patel</div>
          <div className="flex items-center gap-2 mb-4">
            <Button className="h-9 gap-1.5 rounded-xl text-[10px]"><Play className="h-3.5 w-3.5" />Play Episode</Button>
            <Button variant="outline" size="sm" className="h-9 rounded-xl text-[10px] gap-1"><ListPlus className="h-3.5 w-3.5" />Add to Queue</Button>
            <Button variant="ghost" size="sm" className="h-9 w-9 p-0 rounded-xl"><Download className="h-3.5 w-3.5" /></Button>
            <Button variant="ghost" size="sm" className="h-9 w-9 p-0 rounded-xl"><Bookmark className="h-3.5 w-3.5" /></Button>
            <Button variant="ghost" size="sm" className="h-9 w-9 p-0 rounded-xl"><Share2 className="h-3.5 w-3.5" /></Button>
            <Button variant="ghost" size="sm" className="h-9 w-9 p-0 rounded-xl"><Heart className="h-3.5 w-3.5" /></Button>
          </div>
          <div className="text-[10px] text-muted-foreground leading-relaxed">
            In this episode, we explore the emerging thesis that autonomous AI agents will fundamentally reshape how software is built and consumed. Dr. Patel walks through real-world case studies, architectural patterns, and the economic forces driving this shift. We also discuss what this means for developers and product teams building in the current landscape.
          </div>
        </SectionCard>

        <SectionCard title="Chapters" className="!rounded-2xl">
          {CHAPTERS.map((ch, i) => (
            <div key={i} className="flex items-center gap-2.5 py-2 border-b border-border/30 last:border-0 cursor-pointer hover:bg-muted/30 rounded-lg px-1 transition-colors">
              <span className="text-[10px] text-accent font-mono w-10">{ch.time}</span>
              <div className="flex-1 min-w-0">
                <div className="text-[10px] font-medium">{ch.title}</div>
                <div className="text-[8px] text-muted-foreground">{ch.duration}</div>
              </div>
              <Play className="h-3 w-3 text-muted-foreground" />
            </div>
          ))}
        </SectionCard>

        <SectionCard title="Transcript Excerpt" className="!rounded-2xl">
          <div className="text-[9px] text-muted-foreground leading-relaxed space-y-2 max-h-40 overflow-y-auto">
            <p><span className="font-semibold text-foreground">Dr. Patel:</span> The key insight is that agents don't just automate tasks — they fundamentally change the economics of software delivery...</p>
            <p><span className="font-semibold text-foreground">Host:</span> So you're saying the SaaS model itself is what's being disrupted, not just individual products?</p>
            <p><span className="font-semibold text-foreground">Dr. Patel:</span> Exactly. When an agent can compose functionality on the fly, you no longer need a monolithic application...</p>
          </div>
          <Button variant="outline" size="sm" className="h-6 text-[8px] rounded-lg mt-2">View Full Transcript</Button>
        </SectionCard>
      </div>
    </DashboardLayout>
  );
}
