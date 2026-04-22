import React, { useState } from 'react';
import { DashboardLayout } from '@/components/shell/DashboardLayout';
import { SectionCard } from '@/components/shell/EnterprisePrimitives';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import { Mic, Upload, Circle, Square, Pause, Scissors, Volume2, Settings, FileAudio } from 'lucide-react';

export default function PodcastRecorderPage() {
  const [mode, setMode] = useState<'idle' | 'recording' | 'upload'>('idle');

  const topStrip = (
    <>
      <Mic className="h-4 w-4 text-accent" />
      <span className="text-xs font-semibold">Recorder & Uploader</span>
      <div className="flex-1" />
      <div className="flex items-center gap-1 bg-muted/40 rounded-xl p-0.5">
        <button onClick={() => setMode('idle')} className={cn('px-2.5 py-1 rounded-lg text-[9px] font-medium transition-colors', mode !== 'upload' ? 'bg-card shadow-sm text-foreground' : 'text-muted-foreground')}>Record</button>
        <button onClick={() => setMode('upload')} className={cn('px-2.5 py-1 rounded-lg text-[9px] font-medium transition-colors', mode === 'upload' ? 'bg-card shadow-sm text-foreground' : 'text-muted-foreground')}>Upload</button>
      </div>
    </>
  );

  const rightRail = (
    <div className="space-y-3">
      <SectionCard title="Audio Settings" icon={<Settings className="h-3.5 w-3.5" />} className="!rounded-2xl">
        <div className="space-y-2.5 text-[9px]">
          {[
            { label: 'Noise Suppression', defaultChecked: true },
            { label: 'Echo Cancellation', defaultChecked: true },
            { label: 'Auto Gain Control', defaultChecked: false },
            { label: 'High Quality (48kHz)', defaultChecked: true },
          ].map(s => (
            <div key={s.label} className="flex items-center justify-between">
              <span>{s.label}</span><Switch defaultChecked={s.defaultChecked} />
            </div>
          ))}
        </div>
      </SectionCard>
      <SectionCard title="Input Device" className="!rounded-2xl">
        <div className="text-[9px]">
          <div className="font-semibold">Built-in Microphone</div>
          <div className="text-muted-foreground">48kHz · Stereo</div>
          <div className="flex items-center gap-1.5 mt-1.5"><Volume2 className="h-3 w-3 text-accent" /><Progress value={65} className="h-1 flex-1 rounded-full" /></div>
        </div>
      </SectionCard>
    </div>
  );

  return (
    <DashboardLayout topStrip={topStrip} rightRail={rightRail} rightRailWidth="w-44">
      {mode !== 'upload' ? (
        <div className="space-y-3">
          <SectionCard className="!rounded-2xl">
            <div className="text-center py-8">
              <div className={cn('h-20 w-20 rounded-full mx-auto mb-4 flex items-center justify-center transition-all', mode === 'recording' ? 'bg-destructive/10 animate-pulse' : 'bg-muted/50')}>
                {mode === 'recording' ? <Square className="h-8 w-8 text-destructive" /> : <Circle className="h-8 w-8 text-destructive" />}
              </div>
              {mode === 'recording' && (
                <div className="mb-3">
                  <div className="text-[18px] font-bold font-mono text-destructive">00:03:42</div>
                  <Badge className="bg-destructive/10 text-destructive text-[8px] border-0 rounded-lg gap-1 animate-pulse mt-1"><div className="h-1.5 w-1.5 rounded-full bg-destructive" />Recording</Badge>
                </div>
              )}
              <div className="flex items-center justify-center gap-2">
                {mode === 'idle' && <Button onClick={() => setMode('recording')} className="h-10 gap-1.5 rounded-xl text-[11px]"><Circle className="h-4 w-4" />Start Recording</Button>}
                {mode === 'recording' && (
                  <>
                    <Button variant="outline" className="h-10 gap-1 rounded-xl text-[10px]"><Pause className="h-3.5 w-3.5" />Pause</Button>
                    <Button variant="destructive" onClick={() => setMode('idle')} className="h-10 gap-1 rounded-xl text-[10px]"><Square className="h-3.5 w-3.5" />Stop</Button>
                    <Button variant="outline" className="h-10 gap-1 rounded-xl text-[10px]"><Scissors className="h-3.5 w-3.5" />Mark Chapter</Button>
                  </>
                )}
              </div>
            </div>
          </SectionCard>

          {mode === 'recording' && (
            <SectionCard title="Live Waveform" className="!rounded-2xl">
              <div className="h-16 bg-muted/30 rounded-xl flex items-center justify-center">
                <div className="flex items-end gap-0.5 h-10">
                  {Array.from({ length: 40 }).map((_, i) => (
                    <div key={i} className="w-1 bg-accent/60 rounded-full animate-pulse" style={{ height: `${Math.random() * 100}%`, animationDelay: `${i * 50}ms` }} />
                  ))}
                </div>
              </div>
            </SectionCard>
          )}
        </div>
      ) : (
        <SectionCard title="Upload Audio" icon={<Upload className="h-3.5 w-3.5 text-muted-foreground" />} className="!rounded-2xl">
          <div className="border-2 border-dashed border-border/50 rounded-2xl p-8 text-center">
            <Upload className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
            <div className="text-[12px] font-bold mb-1">Drop audio files here</div>
            <div className="text-[9px] text-muted-foreground mb-3">MP3, WAV, M4A, FLAC up to 500MB</div>
            <Button variant="outline" className="h-8 text-[10px] rounded-xl gap-1"><FileAudio className="h-3.5 w-3.5" />Browse Files</Button>
          </div>
          <div className="mt-3 space-y-2">
            <div className="text-[9px] font-semibold">Episode Details</div>
            {['Title', 'Description', 'Season', 'Episode Number'].map(f => (
              <div key={f}>
                <div className="text-[8px] text-muted-foreground mb-0.5">{f}</div>
                <input className="w-full h-8 rounded-xl border px-3 text-[10px]" placeholder={f} />
              </div>
            ))}
            <Button className="w-full h-8 text-[10px] rounded-xl mt-2">Upload & Process</Button>
          </div>
        </SectionCard>
      )}
    </DashboardLayout>
  );
}
