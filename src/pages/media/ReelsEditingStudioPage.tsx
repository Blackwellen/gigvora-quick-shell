import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import {
  Upload, Play, Pause, Scissors, Type, Image, Music, Mic,
  Zap, Clock, Sparkles, Save, Send, Eye, ArrowLeft,
  Plus, Trash2, GripVertical, RotateCcw, RotateCw,
  ChevronLeft, ChevronRight, Layers, Palette, Volume2,
  Smartphone, Monitor, CheckCircle2, AlertCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface Clip { id: string; name: string; duration: number; trimStart: number; trimEnd: number; }
type EditorTab = 'clips' | 'text' | 'audio' | 'effects' | 'captions';

const FILTERS = ['None', 'Warm', 'Cool', 'Vintage', 'B&W', 'Vivid', 'Cinematic', 'Moody', 'Pastel'];
const TRANSITIONS = ['Cut', 'Fade', 'Slide', 'Zoom', 'Wipe', 'Dissolve'];
const SPEEDS = [0.5, 0.75, 1, 1.25, 1.5, 2];

export default function ReelsEditingStudioPage() {
  const navigate = useNavigate();
  const fileRef = useRef<HTMLInputElement>(null);
  const [clips, setClips] = useState<Clip[]>([
    { id: 'c1', name: 'Clip 1 — Intro.mp4', duration: 8, trimStart: 0, trimEnd: 8 },
    { id: 'c2', name: 'Clip 2 — Main.mp4', duration: 15, trimStart: 2, trimEnd: 13 },
    { id: 'c3', name: 'Clip 3 — Outro.mp4', duration: 5, trimStart: 0, trimEnd: 5 },
  ]);
  const [activeClip, setActiveClip] = useState('c1');
  const [playing, setPlaying] = useState(false);
  const [editorTab, setEditorTab] = useState<EditorTab>('clips');
  const [filter, setFilter] = useState('None');
  const [transition, setTransition] = useState('Cut');
  const [speed, setSpeed] = useState(1);
  const [showPublish, setShowPublish] = useState(false);
  const [caption, setCaption] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [commentsAllowed, setCommentsAllowed] = useState(true);

  const totalDuration = clips.reduce((a, c) => a + (c.trimEnd - c.trimStart), 0);

  const addClip = () => {
    const id = `c${Date.now()}`;
    setClips(p => [...p, { id, name: `New Clip ${p.length + 1}.mp4`, duration: 10, trimStart: 0, trimEnd: 10 }]);
    setActiveClip(id);
  };

  const removeClip = (id: string) => {
    setClips(p => p.filter(c => c.id !== id));
    if (activeClip === id && clips.length > 1) setActiveClip(clips[0].id);
  };

  const handlePublish = () => { toast.success('Reel published!'); navigate('/media/reels'); };

  if (showPublish) {
    return (
      <div className="min-h-screen bg-background flex">
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="w-full max-w-md space-y-5">
            <button onClick={() => setShowPublish(false)} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground mb-2"><ArrowLeft className="h-3.5 w-3.5" /> Back to Editor</button>
            <h2 className="text-lg font-bold">Publish Your Reel</h2>
            <div><label className="text-[10px] font-medium text-muted-foreground mb-1 block">Caption *</label><Input value={caption} onChange={e => setCaption(e.target.value)} placeholder="Write a caption..." className="rounded-xl" /></div>
            <div><label className="text-[10px] font-medium text-muted-foreground mb-1 block">Description</label><Textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Add more context..." className="rounded-xl min-h-[80px]" /></div>
            <div><label className="text-[10px] font-medium text-muted-foreground mb-1 block">Category</label>
              <Select value={category} onValueChange={setCategory}><SelectTrigger className="rounded-xl h-9 text-xs"><SelectValue placeholder="Select" /></SelectTrigger><SelectContent>{['Business', 'Dev', 'Design', 'AI', 'Marketing', 'Career', 'Lifestyle', 'Education'].map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select>
            </div>
            <div className="flex items-center justify-between"><div className="text-xs">Allow Comments</div><Switch checked={commentsAllowed} onCheckedChange={setCommentsAllowed} /></div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => { toast.success('Saved as draft'); navigate('/media/reels'); }} className="rounded-xl flex-1 gap-1"><Save className="h-3.5 w-3.5" /> Draft</Button>
              <Button onClick={handlePublish} disabled={!caption} className="rounded-xl flex-1 gap-1 bg-[hsl(var(--gigvora-purple))] hover:bg-[hsl(var(--gigvora-purple))]/90"><Send className="h-3.5 w-3.5" /> Publish</Button>
            </div>
          </div>
        </div>
        {/* Preview */}
        <div className="w-80 bg-black flex items-center justify-center p-4">
          <div className="w-56 aspect-[9/16] rounded-3xl bg-gradient-to-b from-[hsl(var(--gigvora-purple))]/30 via-black to-black flex items-center justify-center border border-white/10">
            <Play className="h-12 w-12 text-white/30" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-background/95 backdrop-blur-md border-b px-4 py-2">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="h-8 w-8 rounded-xl bg-muted/50 flex items-center justify-center hover:bg-muted"><ArrowLeft className="h-4 w-4" /></button>
          <Zap className="h-4 w-4 text-[hsl(var(--gigvora-purple))]" />
          <span className="text-sm font-semibold">Reel Studio</span>
          <Badge variant="outline" className="text-[9px] rounded-xl">{totalDuration.toFixed(1)}s total</Badge>
          <div className="flex-1" />
          <Button variant="outline" size="sm" className="h-7 text-[10px] rounded-xl gap-1"><Eye className="h-3 w-3" /> Preview</Button>
          <Button variant="outline" size="sm" className="h-7 text-[10px] rounded-xl gap-1"><Save className="h-3 w-3" /> Save Draft</Button>
          <Button size="sm" onClick={() => setShowPublish(true)} className="h-7 text-[10px] rounded-xl gap-1 bg-[hsl(var(--gigvora-purple))] hover:bg-[hsl(var(--gigvora-purple))]/90"><Send className="h-3 w-3" /> Next</Button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Left: Tool Panel */}
        <div className="w-64 border-r bg-card/50 flex flex-col">
          <div className="flex border-b">
            {[
              { id: 'clips' as const, icon: Layers, label: 'Clips' },
              { id: 'text' as const, icon: Type, label: 'Text' },
              { id: 'audio' as const, icon: Music, label: 'Audio' },
              { id: 'effects' as const, icon: Palette, label: 'FX' },
              { id: 'captions' as const, icon: Sparkles, label: 'AI' },
            ].map(t => (
              <button key={t.id} onClick={() => setEditorTab(t.id)} className={cn('flex-1 py-2.5 flex flex-col items-center gap-0.5 text-[9px] font-medium transition-colors', editorTab === t.id ? 'bg-accent/10 text-accent border-b-2 border-accent' : 'text-muted-foreground hover:text-foreground')}>
                <t.icon className="h-3.5 w-3.5" />{t.label}
              </button>
            ))}
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {editorTab === 'clips' && (
              <>
                <Button variant="outline" size="sm" onClick={addClip} className="w-full h-8 text-[10px] rounded-xl gap-1"><Plus className="h-3 w-3" /> Add Clip</Button>
                <input ref={fileRef} type="file" accept="video/*" multiple className="hidden" />
                {clips.map((c, i) => (
                  <div key={c.id} onClick={() => setActiveClip(c.id)} className={cn('rounded-xl border p-2.5 cursor-pointer transition-all', activeClip === c.id ? 'border-accent bg-accent/5 shadow-sm' : 'hover:bg-muted/50')}>
                    <div className="flex items-center gap-2">
                      <GripVertical className="h-3 w-3 text-muted-foreground/50 cursor-grab" />
                      <div className="flex-1 min-w-0">
                        <div className="text-[10px] font-medium truncate">{c.name}</div>
                        <div className="text-[8px] text-muted-foreground">{(c.trimEnd - c.trimStart).toFixed(1)}s / {c.duration}s</div>
                      </div>
                      <button onClick={e => { e.stopPropagation(); removeClip(c.id); }} className="h-5 w-5 rounded-lg hover:bg-destructive/10 flex items-center justify-center"><Trash2 className="h-3 w-3 text-muted-foreground hover:text-destructive" /></button>
                    </div>
                  </div>
                ))}
              </>
            )}
            {editorTab === 'text' && (
              <div className="space-y-3">
                <Button variant="outline" size="sm" className="w-full h-8 text-[10px] rounded-xl gap-1"><Type className="h-3 w-3" /> Add Text Overlay</Button>
                {['Title', 'Subtitle', 'Caption', 'Label'].map(t => (
                  <button key={t} className="w-full rounded-xl border p-3 text-center hover:bg-muted/50 transition-colors">
                    <span className={cn('text-xs font-medium', t === 'Title' && 'text-lg', t === 'Subtitle' && 'text-sm')}>{t}</span>
                  </button>
                ))}
              </div>
            )}
            {editorTab === 'audio' && (
              <div className="space-y-3">
                <Button variant="outline" size="sm" className="w-full h-8 text-[10px] rounded-xl gap-1"><Music className="h-3 w-3" /> Add Music Track</Button>
                <Button variant="outline" size="sm" className="w-full h-8 text-[10px] rounded-xl gap-1"><Mic className="h-3 w-3" /> Record Voiceover</Button>
                <div><label className="text-[10px] font-medium text-muted-foreground mb-1 block">Volume</label><Slider defaultValue={[80]} max={100} step={1} className="mt-2" /></div>
              </div>
            )}
            {editorTab === 'effects' && (
              <div className="space-y-3">
                <div><label className="text-[10px] font-medium text-muted-foreground mb-1 block">Filter</label>
                  <div className="grid grid-cols-3 gap-1.5">{FILTERS.map(f => (
                    <button key={f} onClick={() => setFilter(f)} className={cn('rounded-xl border p-1.5 text-[8px] font-medium transition-all', filter === f ? 'border-accent bg-accent/10 text-accent' : 'hover:bg-muted/50')}>{f}</button>
                  ))}</div>
                </div>
                <div><label className="text-[10px] font-medium text-muted-foreground mb-1 block">Transition</label>
                  <div className="grid grid-cols-3 gap-1.5">{TRANSITIONS.map(t => (
                    <button key={t} onClick={() => setTransition(t)} className={cn('rounded-xl border p-1.5 text-[8px] font-medium transition-all', transition === t ? 'border-accent bg-accent/10 text-accent' : 'hover:bg-muted/50')}>{t}</button>
                  ))}</div>
                </div>
                <div><label className="text-[10px] font-medium text-muted-foreground mb-1 block">Speed</label>
                  <div className="flex gap-1">{SPEEDS.map(s => (
                    <button key={s} onClick={() => setSpeed(s)} className={cn('flex-1 rounded-xl border py-1 text-[9px] font-medium transition-all', speed === s ? 'border-accent bg-accent/10 text-accent' : 'hover:bg-muted/50')}>{s}x</button>
                  ))}</div>
                </div>
              </div>
            )}
            {editorTab === 'captions' && (
              <div className="space-y-3">
                <Button className="w-full h-8 text-[10px] rounded-xl gap-1"><Sparkles className="h-3 w-3" /> Auto-Generate Captions</Button>
                <p className="text-[9px] text-muted-foreground">AI will analyze audio and generate subtitle overlays automatically.</p>
                <Button variant="outline" size="sm" className="w-full h-8 text-[10px] rounded-xl gap-1"><Type className="h-3 w-3" /> Manual Captions</Button>
              </div>
            )}
          </div>
        </div>

        {/* Center: Preview */}
        <div className="flex-1 flex items-center justify-center bg-muted/20 p-8">
          <div className="relative">
            <div className="w-64 aspect-[9/16] rounded-3xl bg-gradient-to-b from-[hsl(var(--gigvora-purple))]/20 via-black/80 to-black flex items-center justify-center border-2 border-white/5 shadow-2xl overflow-hidden">
              <button onClick={() => setPlaying(!playing)} className="h-16 w-16 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center text-white transition-all hover:scale-110">
                {playing ? <Pause className="h-7 w-7" /> : <Play className="h-7 w-7 ml-0.5" />}
              </button>
              {filter !== 'None' && <Badge className="absolute top-3 left-3 text-[7px] rounded-lg bg-black/50 text-white border-0">{filter}</Badge>}
              <div className="absolute bottom-3 left-3 right-3">
                <div className="text-[9px] text-white/70 font-mono">{speed !== 1 && `${speed}x · `}{totalDuration.toFixed(1)}s</div>
              </div>
            </div>
            <div className="flex items-center justify-center gap-3 mt-4">
              <Badge variant="outline" className="text-[8px] rounded-lg gap-1"><Smartphone className="h-2.5 w-2.5" /> Mobile</Badge>
              <Badge variant="outline" className="text-[8px] rounded-lg gap-1"><Monitor className="h-2.5 w-2.5" /> Desktop</Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom: Timeline */}
      <div className="border-t bg-card p-3">
        <div className="flex items-center gap-2 mb-2">
          <button onClick={() => setPlaying(!playing)} className="h-7 w-7 rounded-lg bg-muted flex items-center justify-center hover:bg-muted/80">
            {playing ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
          </button>
          <span className="text-[10px] font-mono text-muted-foreground">00:00 / {totalDuration.toFixed(1)}s</span>
          <div className="flex-1" />
          <button className="h-6 w-6 rounded-lg hover:bg-muted flex items-center justify-center"><RotateCcw className="h-3 w-3 text-muted-foreground" /></button>
          <button className="h-6 w-6 rounded-lg hover:bg-muted flex items-center justify-center"><RotateCw className="h-3 w-3 text-muted-foreground" /></button>
          <button className="h-6 w-6 rounded-lg hover:bg-muted flex items-center justify-center"><Scissors className="h-3 w-3 text-muted-foreground" /></button>
        </div>
        <div className="flex gap-1 h-12 rounded-xl overflow-hidden border bg-muted/30">
          {clips.map((c, i) => {
            const pct = ((c.trimEnd - c.trimStart) / totalDuration) * 100;
            return (
              <div key={c.id} onClick={() => setActiveClip(c.id)} style={{ width: `${pct}%` }} className={cn('rounded-lg flex items-center justify-center text-[8px] font-medium cursor-pointer transition-all', activeClip === c.id ? 'bg-[hsl(var(--gigvora-purple))]/30 border-2 border-[hsl(var(--gigvora-purple))] text-[hsl(var(--gigvora-purple))]' : 'bg-accent/10 text-muted-foreground hover:bg-accent/20')}>
                {c.name.slice(0, 12)}...
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
