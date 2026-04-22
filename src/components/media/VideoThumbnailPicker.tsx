import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Image as ImageIcon, Camera, Check, Loader2 } from 'lucide-react';
import { putBlob } from '@/lib/storage/localFirst';

/**
 * Lets the uploader pick a preview thumbnail for a video:
 *   1. Auto-extracts 6 evenly spaced frames as candidate scenes.
 *   2. User can click any frame to select it as the cover.
 *   3. User can also upload a custom image.
 *
 * Stores the chosen thumbnail in local-first storage (IndexedDB) and emits
 * { key, url, source: 'scene' | 'upload' }.
 */
export interface VideoThumbnailPickerProps {
  videoUrl: string;
  videoKey: string;                                  // for naming derived thumb keys
  scenes?: number;
  onSelect?: (ref: { key: string; url: string; source: 'scene' | 'upload'; sceneIndex?: number }) => void;
}

export function VideoThumbnailPicker({ videoUrl, videoKey, scenes = 6, onSelect }: VideoThumbnailPickerProps) {
  const [frames, setFrames] = useState<string[]>([]);
  const [busy, setBusy] = useState(true);
  const [active, setActive] = useState<number | 'upload' | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setBusy(true);
      const v = document.createElement('video');
      v.src = videoUrl; v.crossOrigin = 'anonymous'; v.muted = true; v.playsInline = true;
      await new Promise<void>((res) => { v.onloadedmetadata = () => res(); });
      const out: string[] = [];
      const canvas = document.createElement('canvas');
      canvas.width = 320; canvas.height = Math.round((v.videoHeight / v.videoWidth) * 320) || 180;
      const ctx = canvas.getContext('2d')!;
      for (let i = 0; i < scenes; i++) {
        const t = (v.duration / (scenes + 1)) * (i + 1);
        v.currentTime = t;
        await new Promise<void>((res) => { v.onseeked = () => res(); });
        ctx.drawImage(v, 0, 0, canvas.width, canvas.height);
        out.push(canvas.toDataURL('image/jpeg', 0.82));
      }
      if (!cancelled) { setFrames(out); setBusy(false); }
    })().catch(() => setBusy(false));
    return () => { cancelled = true; };
  }, [videoUrl, scenes]);

  async function chooseScene(i: number) {
    setActive(i);
    const blob = await (await fetch(frames[i])).blob();
    const key = `thumbnails/${videoKey}-scene-${i}.jpg`;
    const ref = await putBlob(key, blob);
    onSelect?.({ key, url: ref.url, source: 'scene', sceneIndex: i });
  }
  async function chooseUpload(file: File) {
    setActive('upload');
    const key = `thumbnails/${videoKey}-custom-${Date.now()}.${file.name.split('.').pop() ?? 'jpg'}`;
    const ref = await putBlob(key, file);
    onSelect?.({ key, url: ref.url, source: 'upload' });
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <ImageIcon className="h-4 w-4 text-muted-foreground" />
        <span className="text-xs font-semibold">Choose a preview thumbnail</span>
        {busy && <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />}
      </div>
      <div className="grid grid-cols-3 gap-2">
        {frames.map((f, i) => (
          <button
            key={i}
            type="button"
            onClick={() => chooseScene(i)}
            className={`relative aspect-video rounded-lg overflow-hidden border-2 transition ${active === i ? 'border-primary ring-2 ring-primary/30' : 'border-transparent hover:border-border'}`}
          >
            <img src={f} alt={`Scene ${i + 1}`} className="w-full h-full object-cover" />
            {active === i && (
              <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                <Check className="h-5 w-5 text-primary-foreground bg-primary rounded-full p-1" />
              </div>
            )}
            <div className="absolute bottom-1 left-1 rounded bg-black/60 px-1 text-[8px] text-white">Scene {i + 1}</div>
          </button>
        ))}
      </div>
      <div className="flex items-center gap-2">
        <input
          ref={fileRef} type="file" accept="image/*" className="hidden"
          onChange={(e) => e.target.files?.[0] && chooseUpload(e.target.files[0])}
        />
        <Button size="sm" variant="outline" className="gap-1.5 rounded-xl" onClick={() => fileRef.current?.click()}>
          <Camera className="h-3.5 w-3.5" />Upload custom
        </Button>
        {active === 'upload' && <span className="text-[10px] text-primary">Custom image selected</span>}
      </div>
    </div>
  );
}
