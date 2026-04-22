import React, { useState } from 'react';
import { SectionCard } from '@/components/shell/EnterprisePrimitives';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import {
  Video, Sparkles, Download, Play, Clock, Settings, Upload, Zap,
  Film, MonitorPlay, Smartphone, Square, RectangleHorizontal,
  Mic, FileText, RotateCcw, Pause, Bookmark, Share2, Eye
} from 'lucide-react';

const VIDEOS = [
  { prompt: 'Product demo with smooth transitions and kinetic typography', duration: '10s', resolution: '1080p', created: '3h ago', status: 'complete' as const, progress: 100 },
  { prompt: 'Animated logo reveal with particle effects', duration: '5s', resolution: '1080p', created: '6h ago', status: 'complete' as const, progress: 100 },
  { prompt: 'Social media reel — product unboxing aesthetic', duration: '10s', resolution: '1080p', created: 'Yesterday', status: 'processing' as const, progress: 67 },
  { prompt: 'Webinar promo teaser with text overlays', duration: '15s', resolution: '1080p', created: '2d ago', status: 'queued' as const, progress: 0 },
];

const PURPOSES = ['Promo Reel', 'Service Intro', 'Explainer', 'Ad Creative', 'Social Snippet', 'Webinar Promo', 'Logo Reveal', 'Testimonial'];
const DURATIONS = ['5s', '10s', '15s', '30s'];
const ASPECTS = [
  { label: '16:9', icon: RectangleHorizontal, desc: 'Landscape' },
  { label: '9:16', icon: Smartphone, desc: 'Portrait' },
  { label: '1:1', icon: Square, desc: 'Square' },
];
const STYLES = ['Cinematic', 'Motion Graphics', 'Minimal', 'Bold', 'Neon', 'Organic', 'Corporate'];

export default function AIVideoStudioPage() {
  const [purpose, setPurpose] = useState('Promo Reel');
  const [duration, setDuration] = useState('10s');
  const [aspect, setAspect] = useState('16:9');
  const [style, setStyle] = useState('Cinematic');

  return (
    <div className="flex gap-4">
      <div className="flex-1 min-w-0 space-y-4">
        {/* Purpose selector */}
        <div className="flex flex-wrap gap-1.5">
          {PURPOSES.map(p => (
            <button key={p} onClick={() => setPurpose(p)} className={cn('px-3 py-1.5 rounded-xl text-[10px] font-medium transition-all border', purpose === p ? 'border-accent bg-accent/10 text-accent shadow-sm' : 'border-border hover:bg-muted/30 text-muted-foreground')}>
              {p}
            </button>
          ))}
        </div>

        {/* Prompt area */}
        <SectionCard className="!rounded-2xl">
          <div className="space-y-3">
            <div>
              <label className="text-[9px] font-medium mb-1 block">Video Description</label>
              <textarea className="w-full h-20 rounded-xl border bg-background px-3 py-2.5 text-[11px] resize-none focus:outline-none focus:ring-1 focus:ring-accent" placeholder="Describe the video you want to create... Include visual style, mood, key scenes, and any text overlays." />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[9px] font-medium mb-1 block">Voiceover Script (optional)</label>
                <textarea className="w-full h-14 rounded-xl border bg-background px-3 py-2 text-[10px] resize-none focus:outline-none focus:ring-1 focus:ring-accent" placeholder="Script for voiceover narration..." />
              </div>
              <div>
                <label className="text-[9px] font-medium mb-1 block">Scene Notes (optional)</label>
                <textarea className="w-full h-14 rounded-xl border bg-background px-3 py-2 text-[10px] resize-none focus:outline-none focus:ring-1 focus:ring-accent" placeholder="Scene 1: Logo intro\nScene 2: Product showcase..." />
              </div>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <Button className="h-9 text-[11px] rounded-xl gap-1.5 px-5"><Sparkles className="h-3.5 w-3.5" />Generate Video</Button>
              <Button variant="outline" className="h-9 text-[11px] rounded-xl gap-1.5"><Upload className="h-3.5 w-3.5" />Upload Reference</Button>
              <div className="flex-1" />
              <span className="text-[9px] text-muted-foreground flex items-center gap-1"><Zap className="h-3 w-3" />~25 credits · 2-5 min</span>
            </div>
          </div>
        </SectionCard>

        {/* Video outputs */}
        <div>
          <h2 className="text-[13px] font-bold mb-3">Recent Videos</h2>
          <div className="space-y-3">
            {VIDEOS.map((v, i) => (
              <div key={i} className="rounded-2xl border bg-card overflow-hidden hover:shadow-md transition-all duration-300">
                <div className="flex flex-col sm:flex-row">
                  <div className="w-full sm:w-48 aspect-video bg-gradient-to-br from-muted/80 to-muted/30 flex items-center justify-center shrink-0 relative">
                    {v.status === 'complete' ? (
                      <Button variant="ghost" className="h-12 w-12 p-0 rounded-full bg-black/40 text-white hover:bg-black/60"><Play className="h-6 w-6" /></Button>
                    ) : v.status === 'processing' ? (
                      <div className="text-center">
                        <div className="h-8 w-8 rounded-full border-2 border-accent border-t-transparent animate-spin mx-auto mb-1" />
                        <span className="text-[8px] text-muted-foreground">Rendering...</span>
                      </div>
                    ) : (
                      <Clock className="h-6 w-6 text-muted-foreground/30" />
                    )}
                    <Badge className="absolute bottom-2 right-2 text-[7px] bg-black/60 text-white border-0 rounded-lg">{v.duration}</Badge>
                  </div>
                  <div className="p-3.5 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[11px] font-bold truncate flex-1">{v.prompt}</span>
                      <Badge className={cn('text-[7px] border-0 rounded-lg shrink-0',
                        v.status === 'complete' ? 'bg-[hsl(var(--state-healthy)/0.1)] text-[hsl(var(--state-healthy))]' :
                        v.status === 'processing' ? 'bg-accent/10 text-accent animate-pulse' :
                        'bg-muted text-muted-foreground'
                      )}>
                        {v.status === 'complete' ? 'Ready' : v.status === 'processing' ? 'Rendering' : 'Queued'}
                      </Badge>
                    </div>
                    <div className="text-[9px] text-muted-foreground flex items-center gap-2 mb-2">
                      <span>{v.resolution}</span><span>·</span><span>{v.created}</span>
                    </div>
                    {v.status === 'processing' && <Progress value={v.progress} className="h-1.5 rounded-full mb-2" />}
                    {v.status === 'complete' && (
                      <div className="flex gap-1">
                        <Button variant="outline" size="sm" className="h-7 text-[9px] rounded-xl gap-1"><Play className="h-3 w-3" />Preview</Button>
                        <Button variant="outline" size="sm" className="h-7 text-[9px] rounded-xl gap-1"><Download className="h-3 w-3" />Download</Button>
                        <Button variant="outline" size="sm" className="h-7 text-[9px] rounded-xl gap-1"><Bookmark className="h-3 w-3" />Save</Button>
                        <Button variant="outline" size="sm" className="h-7 text-[9px] rounded-xl gap-1"><Share2 className="h-3 w-3" />Share</Button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right rail */}
      <div className="hidden lg:flex flex-col w-[200px] shrink-0 space-y-3">
        <SectionCard title="Duration" className="!rounded-2xl">
          <div className="flex flex-wrap gap-1">
            {DURATIONS.map(d => (
              <button key={d} onClick={() => setDuration(d)} className={cn('px-3 py-1.5 rounded-lg text-[9px] font-medium transition-all border', duration === d ? 'border-accent bg-accent/10 text-accent' : 'border-transparent text-muted-foreground hover:bg-muted/30')}>{d}</button>
            ))}
          </div>
        </SectionCard>

        <SectionCard title="Aspect Ratio" className="!rounded-2xl">
          <div className="space-y-1">
            {ASPECTS.map(a => (
              <button key={a.label} onClick={() => setAspect(a.label)} className={cn('w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-[9px] transition-all', aspect === a.label ? 'bg-accent/10 text-accent font-medium' : 'text-muted-foreground hover:bg-muted/30')}>
                <a.icon className="h-3.5 w-3.5" />
                <span>{a.label}</span>
                <span className="text-[7px] opacity-60 ml-auto">{a.desc}</span>
              </button>
            ))}
          </div>
        </SectionCard>

        <SectionCard title="Style" className="!rounded-2xl">
          <div className="flex flex-wrap gap-1">
            {STYLES.map(s => (
              <button key={s} onClick={() => setStyle(s)} className={cn('px-2 py-1 rounded-lg text-[8px] font-medium transition-all border', style === s ? 'border-accent bg-accent/10 text-accent' : 'border-transparent text-muted-foreground hover:bg-muted/30')}>{s}</button>
            ))}
          </div>
        </SectionCard>

        <SectionCard title="Settings" className="!rounded-2xl">
          <div className="space-y-1.5 text-[9px]">
            <div className="flex justify-between"><span className="text-muted-foreground">Resolution</span><span className="font-medium">1080p</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">FPS</span><span className="font-medium">30</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Format</span><span className="font-medium">MP4</span></div>
          </div>
          <Button variant="outline" size="sm" className="w-full h-7 text-[8px] rounded-xl gap-1 mt-2"><Settings className="h-3 w-3" />Configure</Button>
        </SectionCard>
      </div>
    </div>
  );
}
