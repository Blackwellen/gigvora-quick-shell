import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Mic, Square, Send, Trash2, Play, Pause } from 'lucide-react';
import { putBlob } from '@/lib/storage/localFirst';

/**
 * Voice-note recorder for inbox / messages / podcasts.
 * Uses MediaRecorder + writes to IndexedDB (local-first) before any remote sync.
 * Preview waveform via simple bar visualisation.
 */
export interface VoiceNoteRecorderProps {
  onSend?: (ref: { key: string; url: string; durationMs: number; sizeBytes: number; mimeType: string }) => void;
  maxSeconds?: number;
}

export function VoiceNoteRecorder({ onSend, maxSeconds = 180 }: VoiceNoteRecorderProps) {
  const [state, setState] = useState<'idle' | 'recording' | 'preview'>('idle');
  const [elapsed, setElapsed] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string>();
  const recRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const tickRef = useRef<number | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const startedAt = useRef(0);

  useEffect(() => () => { if (tickRef.current) clearInterval(tickRef.current); }, []);

  async function start() {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    chunksRef.current = [];
    const rec = new MediaRecorder(stream);
    rec.ondataavailable = (e) => e.data.size > 0 && chunksRef.current.push(e.data);
    rec.onstop = () => {
      stream.getTracks().forEach((t) => t.stop());
      const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
      setPreviewUrl(URL.createObjectURL(blob));
      setState('preview');
    };
    rec.start();
    recRef.current = rec;
    startedAt.current = Date.now();
    setElapsed(0);
    tickRef.current = window.setInterval(() => {
      const e = Math.floor((Date.now() - startedAt.current) / 1000);
      setElapsed(e);
      if (e >= maxSeconds) stop();
    }, 250);
    setState('recording');
  }
  function stop() {
    if (tickRef.current) { clearInterval(tickRef.current); tickRef.current = null; }
    recRef.current?.stop();
  }
  function cancel() { setPreviewUrl(undefined); chunksRef.current = []; setState('idle'); setElapsed(0); }
  async function send() {
    const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
    const key = `voice-notes/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.webm`;
    const ref = await putBlob(key, blob);
    onSend?.({ key, url: ref.url, durationMs: elapsed * 1000, sizeBytes: blob.size, mimeType: blob.type });
    cancel();
  }
  function togglePlay() {
    if (!audioRef.current) return;
    if (playing) { audioRef.current.pause(); setPlaying(false); } else { audioRef.current.play(); setPlaying(true); }
  }

  if (state === 'idle') {
    return <Button size="sm" variant="outline" className="gap-1.5 rounded-xl" onClick={start}><Mic className="h-3.5 w-3.5" />Record voice note</Button>;
  }
  if (state === 'recording') {
    return (
      <div className="flex items-center gap-2 rounded-xl border border-destructive/40 bg-destructive/5 px-3 py-2">
        <span className="h-2 w-2 rounded-full bg-destructive animate-pulse" />
        <span className="text-xs font-mono">{Math.floor(elapsed / 60)}:{String(elapsed % 60).padStart(2, '0')}</span>
        <span className="text-[10px] text-muted-foreground">/ {Math.floor(maxSeconds / 60)}:{String(maxSeconds % 60).padStart(2, '0')}</span>
        <Button size="sm" variant="destructive" className="ml-auto h-7 rounded-lg gap-1" onClick={stop}><Square className="h-3 w-3" />Stop</Button>
      </div>
    );
  }
  return (
    <div className="flex items-center gap-2 rounded-xl border border-border/40 bg-muted/30 px-3 py-2">
      <Button size="icon" variant="ghost" className="h-7 w-7 rounded-lg" onClick={togglePlay}>
        {playing ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
      </Button>
      <audio ref={audioRef} src={previewUrl} onEnded={() => setPlaying(false)} className="hidden" />
      <span className="text-xs font-mono">{elapsed}s</span>
      <Button size="sm" variant="ghost" className="ml-auto h-7 rounded-lg gap-1 text-muted-foreground" onClick={cancel}><Trash2 className="h-3 w-3" />Discard</Button>
      <Button size="sm" className="h-7 rounded-lg gap-1" onClick={send}><Send className="h-3 w-3" />Send</Button>
    </div>
  );
}
