import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { DashboardLayout } from '@/components/shell/DashboardLayout';
import { SectionCard } from '@/components/shell/EnterprisePrimitives';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import {
  Film, Upload, Scissors, Type, Music, Sparkles, Eye, Send,
  Clock, Save, ArrowRight, ChevronLeft, ChevronRight, Image,
  Layers, Palette, Play, Pause, Volume2, SkipBack, SkipForward,
  CheckCircle2, AlertTriangle, Tag, Globe, Users, Calendar,
  Wand2, RotateCcw, Maximize2, Trash2, Copy, Plus, Hash,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const STEPS = [
  { id: 'upload', label: 'Upload', icon: Upload },
  { id: 'edit', label: 'Edit & Trim', icon: Scissors },
  { id: 'text', label: 'Text & Captions', icon: Type },
  { id: 'audio', label: 'Audio & Music', icon: Music },
  { id: 'metadata', label: 'Metadata', icon: Tag },
  { id: 'preview', label: 'Preview', icon: Eye },
  { id: 'publish', label: 'Publish', icon: Send },
];

export default function ReelBuilderPage() {
  const [step, setStep] = useState(0);

  return (
    <DashboardLayout topStrip={
      <>
        <Film className="h-4 w-4 text-[hsl(var(--gigvora-purple))]" />
        <span className="text-xs font-semibold">Reel Builder</span>
        <div className="flex-1" />
        <Button variant="outline" size="sm" className="h-7 text-[10px] gap-1 rounded-xl"><Save className="h-3 w-3" /> Save Draft</Button>
        <Link to="/creation-studio" className="text-[9px] text-accent font-medium flex items-center gap-0.5 hover:underline">
          Studio <ArrowRight className="h-2.5 w-2.5" />
        </Link>
      </>
    }>
      {/* Wizard Stepper */}
      <div className="flex items-center gap-1 mb-4 overflow-x-auto pb-1">
        {STEPS.map((s, i) => {
          const done = i < step;
          const active = i === step;
          return (
            <React.Fragment key={s.id}>
              {i > 0 && <div className={cn('h-px w-4 shrink-0', done ? 'bg-accent' : 'bg-border')} />}
              <button onClick={() => setStep(i)} className={cn(
                'flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-[9px] font-medium whitespace-nowrap transition-all shrink-0',
                active ? 'bg-accent/10 text-accent ring-1 ring-accent/30' :
                done ? 'bg-[hsl(var(--state-healthy))]/10 text-[hsl(var(--state-healthy))]' :
                'text-muted-foreground hover:bg-muted/50'
              )}>
                {done ? <CheckCircle2 className="h-3 w-3" /> : <s.icon className="h-3 w-3" />}
                {s.label}
              </button>
            </React.Fragment>
          );
        })}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        {/* Main Builder Area */}
        <div className="xl:col-span-2">
          {step === 0 && (
            <SectionCard title="Upload Clips" icon={<Upload className="h-3.5 w-3.5 text-accent" />}>
              <div className="rounded-2xl border-2 border-dashed border-border/40 p-10 text-center hover:border-accent/30 transition-all">
                <Upload className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-xs font-semibold">Drop video clips here</p>
                <p className="text-[9px] text-muted-foreground mt-1">MP4, MOV, WebM · Max 500 MB · Recommended 9:16 for reels</p>
                <Button size="sm" className="mt-4 h-8 text-[10px] rounded-xl gap-1"><Upload className="h-3 w-3" /> Browse Files</Button>
              </div>
              <div className="mt-3 space-y-2">
                <div className="text-[9px] font-semibold text-muted-foreground">Or start from:</div>
                <div className="flex gap-2">
                  {['Asset Library', 'Camera', 'Screen Record', 'AI Generate'].map(s => (
                    <Button key={s} variant="outline" size="sm" className="h-7 text-[9px] rounded-xl gap-1">
                      <Sparkles className="h-3 w-3" /> {s}
                    </Button>
                  ))}
                </div>
              </div>
            </SectionCard>
          )}

          {step === 1 && (
            <SectionCard title="Edit & Trim" icon={<Scissors className="h-3.5 w-3.5 text-accent" />}>
              <div className="relative aspect-[9/16] max-h-[500px] mx-auto rounded-2xl bg-gradient-to-b from-[hsl(var(--gigvora-purple))]/20 to-black flex items-center justify-center mb-4">
                <Play className="h-12 w-12 text-white/40" />
                <div className="absolute bottom-4 left-4 right-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-white/70"><SkipBack className="h-3 w-3" /></Button>
                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-white/70"><Play className="h-3 w-3" /></Button>
                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-white/70"><SkipForward className="h-3 w-3" /></Button>
                    <div className="flex-1 h-1 bg-white/20 rounded-full"><div className="h-full w-1/3 bg-accent rounded-full" /></div>
                    <span className="text-[8px] text-white/60 font-mono">0:12 / 0:45</span>
                  </div>
                </div>
              </div>
              {/* Timeline */}
              <div className="p-3 rounded-xl bg-muted/30 border border-border/30">
                <div className="text-[9px] font-semibold mb-2">Timeline</div>
                <div className="flex gap-1 h-12">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="flex-1 rounded-lg bg-accent/10 border border-accent/20 flex items-center justify-center text-[8px] text-accent cursor-pointer hover:bg-accent/20 transition-all">
                      Clip {i}
                    </div>
                  ))}
                  <button className="h-12 w-12 rounded-lg border-2 border-dashed border-border/40 flex items-center justify-center text-muted-foreground hover:border-accent/30 transition-all">
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
                <div className="flex gap-2 mt-2">
                  <Button variant="outline" size="sm" className="h-6 text-[8px] rounded-lg gap-0.5"><Scissors className="h-2.5 w-2.5" /> Split</Button>
                  <Button variant="outline" size="sm" className="h-6 text-[8px] rounded-lg gap-0.5"><RotateCcw className="h-2.5 w-2.5" /> Undo</Button>
                  <Button variant="outline" size="sm" className="h-6 text-[8px] rounded-lg gap-0.5"><Trash2 className="h-2.5 w-2.5" /> Delete</Button>
                </div>
              </div>
            </SectionCard>
          )}

          {step === 2 && (
            <SectionCard title="Text & Captions" icon={<Type className="h-3.5 w-3.5 text-accent" />}>
              <div className="space-y-3">
                <div>
                  <label className="text-[9px] font-semibold text-muted-foreground">Title Text</label>
                  <Input placeholder="Add title overlay..." className="h-8 text-xs mt-1" />
                </div>
                <div>
                  <label className="text-[9px] font-semibold text-muted-foreground">Captions</label>
                  <Textarea placeholder="Auto-generate or type captions..." className="min-h-[100px] text-xs mt-1" />
                  <Button variant="outline" size="sm" className="h-6 text-[8px] rounded-lg gap-0.5 mt-2"><Wand2 className="h-2.5 w-2.5" /> Auto-Generate Captions</Button>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {['Bold', 'Minimal', 'Neon', 'Typewriter', 'Gradient', 'Outline'].map(s => (
                    <button key={s} className="p-3 rounded-xl border border-border/30 hover:border-accent/30 text-[9px] font-semibold text-center transition-all">{s}</button>
                  ))}
                </div>
              </div>
            </SectionCard>
          )}

          {step === 3 && (
            <SectionCard title="Audio & Music" icon={<Music className="h-3.5 w-3.5 text-accent" />}>
              <div className="space-y-3">
                <div className="flex items-center gap-2 p-3 rounded-xl border border-border/30">
                  <Volume2 className="h-4 w-4 text-muted-foreground" />
                  <div className="flex-1">
                    <div className="text-[10px] font-semibold">Original Audio</div>
                    <div className="h-1 bg-muted rounded-full mt-1"><div className="h-full w-3/4 bg-accent rounded-full" /></div>
                  </div>
                  <span className="text-[8px] text-muted-foreground">75%</span>
                </div>
                <div className="text-[9px] font-semibold">Add Background Music</div>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { name: 'Lofi Coding', duration: '2:30', bpm: 85 },
                    { name: 'Upbeat Corporate', duration: '1:45', bpm: 120 },
                    { name: 'Ambient Focus', duration: '3:00', bpm: 70 },
                    { name: 'Synthwave', duration: '2:15', bpm: 128 },
                  ].map(m => (
                    <div key={m.name} className="flex items-center gap-2 p-2.5 rounded-xl border border-border/30 hover:border-accent/30 cursor-pointer transition-all">
                      <Play className="h-3.5 w-3.5 text-accent shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="text-[9px] font-semibold truncate">{m.name}</div>
                        <div className="text-[7px] text-muted-foreground">{m.duration} · {m.bpm} BPM</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </SectionCard>
          )}

          {step === 4 && (
            <SectionCard title="Metadata & Tags" icon={<Tag className="h-3.5 w-3.5 text-accent" />}>
              <div className="space-y-3">
                <div>
                  <label className="text-[9px] font-semibold text-muted-foreground">Title</label>
                  <Input placeholder="Reel title..." className="h-8 text-xs mt-1" />
                </div>
                <div>
                  <label className="text-[9px] font-semibold text-muted-foreground">Description</label>
                  <Textarea placeholder="Write a compelling description..." className="min-h-[80px] text-xs mt-1" />
                </div>
                <div>
                  <label className="text-[9px] font-semibold text-muted-foreground">Tags</label>
                  <div className="flex gap-1 flex-wrap mt-1">
                    {['design', 'tutorial', 'tips'].map(t => (
                      <Badge key={t} variant="secondary" className="text-[8px] h-5 gap-0.5">{t} <button className="ml-0.5">×</button></Badge>
                    ))}
                    <Input placeholder="Add tag..." className="h-5 text-[8px] w-20" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[9px] font-semibold text-muted-foreground">Category</label>
                    <Input defaultValue="Design" className="h-8 text-xs mt-1" />
                  </div>
                  <div>
                    <label className="text-[9px] font-semibold text-muted-foreground">Visibility</label>
                    <Input defaultValue="Public" className="h-8 text-xs mt-1" />
                  </div>
                </div>
                <div>
                  <label className="text-[9px] font-semibold text-muted-foreground">Thumbnail</label>
                  <div className="flex gap-2 mt-1">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="h-16 w-12 rounded-xl bg-gradient-to-br from-accent/10 to-muted/30 flex items-center justify-center cursor-pointer border border-border/30 hover:border-accent/30 transition-all">
                        <Image className="h-4 w-4 text-muted-foreground/40" />
                      </div>
                    ))}
                    <button className="h-16 w-12 rounded-xl border-2 border-dashed border-border/40 flex items-center justify-center text-muted-foreground hover:border-accent/30 transition-all">
                      <Upload className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            </SectionCard>
          )}

          {step === 5 && (
            <SectionCard title="Preview" icon={<Eye className="h-3.5 w-3.5 text-accent" />}>
              <div className="relative aspect-[9/16] max-h-[500px] mx-auto rounded-2xl bg-gradient-to-b from-[hsl(var(--gigvora-purple))]/20 to-black flex items-center justify-center">
                <Play className="h-12 w-12 text-white/40" />
                <Badge className="absolute top-3 left-3 text-[8px] bg-accent/80 text-white border-0">Preview</Badge>
              </div>
            </SectionCard>
          )}

          {step === 6 && (
            <SectionCard title="Publish" icon={<Send className="h-3.5 w-3.5 text-accent" />}>
              <div className="space-y-3">
                <div className="p-4 rounded-xl bg-[hsl(var(--state-healthy))]/5 border border-[hsl(var(--state-healthy))]/20">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle2 className="h-4 w-4 text-[hsl(var(--state-healthy))]" />
                    <span className="text-xs font-bold">Ready to Publish</span>
                  </div>
                  <div className="space-y-1 text-[9px] text-muted-foreground">
                    {['Video uploaded & processed', 'Captions added', 'Metadata complete', 'Thumbnail selected'].map(c => (
                      <div key={c} className="flex items-center gap-1.5"><CheckCircle2 className="h-2.5 w-2.5 text-[hsl(var(--state-healthy))]" />{c}</div>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[9px] font-semibold text-muted-foreground">Destination</label>
                    <div className="flex gap-1 mt-1">
                      {['Feed', 'Media', 'Profile'].map(d => (
                        <Badge key={d} variant="outline" className="text-[8px] h-5 cursor-pointer hover:bg-accent/10">{d}</Badge>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="text-[9px] font-semibold text-muted-foreground">Schedule</label>
                    <div className="flex gap-1 mt-1">
                      <Button variant="outline" size="sm" className="h-6 text-[8px] rounded-lg gap-0.5"><Send className="h-2.5 w-2.5" /> Now</Button>
                      <Button variant="outline" size="sm" className="h-6 text-[8px] rounded-lg gap-0.5"><Calendar className="h-2.5 w-2.5" /> Schedule</Button>
                    </div>
                  </div>
                </div>
                <Button className="w-full h-10 rounded-xl gap-1"><Send className="h-4 w-4" /> Publish Reel</Button>
              </div>
            </SectionCard>
          )}
        </div>

        {/* Right Rail — Checklist & Quick Actions */}
        <div>
          <SectionCard title="Publish Checklist">
            <div className="space-y-1.5">
              {[
                { label: 'Video uploaded', done: step >= 1 },
                { label: 'Trimmed & edited', done: step >= 2 },
                { label: 'Captions added', done: step >= 3 },
                { label: 'Audio finalized', done: step >= 4 },
                { label: 'Metadata complete', done: step >= 5 },
                { label: 'Preview approved', done: step >= 6 },
              ].map(c => (
                <div key={c.label} className="flex items-center gap-1.5 text-[9px]">
                  {c.done ? <CheckCircle2 className="h-3 w-3 text-[hsl(var(--state-healthy))]" /> : <div className="h-3 w-3 rounded-full border border-border" />}
                  <span className={cn(c.done ? 'text-foreground' : 'text-muted-foreground')}>{c.label}</span>
                </div>
              ))}
            </div>
          </SectionCard>

          <SectionCard title="AI Assist" className="mt-3">
            <div className="space-y-1.5">
              {['Generate captions', 'Suggest hashtags', 'Write description', 'Recommend music', 'Auto-trim highlights'].map(a => (
                <Button key={a} variant="outline" size="sm" className="w-full h-7 text-[9px] rounded-lg gap-1 justify-start"><Wand2 className="h-3 w-3 text-accent" />{a}</Button>
              ))}
            </div>
          </SectionCard>
        </div>
      </div>

      {/* Bottom Nav */}
      <div className="flex items-center justify-between mt-4 pt-3 border-t">
        <Button variant="outline" size="sm" onClick={() => setStep(Math.max(0, step - 1))} disabled={step === 0} className="gap-1 text-[10px] rounded-xl">
          <ChevronLeft className="h-3.5 w-3.5" /> Back
        </Button>
        <div className="flex items-center gap-1.5">
          <span className="text-[9px] text-muted-foreground">Step {step + 1} of {STEPS.length}</span>
          <Progress value={((step + 1) / STEPS.length) * 100} className="h-1 w-16" />
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="text-[10px] rounded-xl">Save Draft</Button>
          {step < STEPS.length - 1 ? (
            <Button size="sm" onClick={() => setStep(step + 1)} className="gap-1 text-[10px] rounded-xl">
              Next <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          ) : (
            <Button size="sm" className="gap-1 text-[10px] rounded-xl bg-[hsl(var(--state-healthy))] hover:bg-[hsl(var(--state-healthy))]/80">
              <Send className="h-3.5 w-3.5" /> Publish
            </Button>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
