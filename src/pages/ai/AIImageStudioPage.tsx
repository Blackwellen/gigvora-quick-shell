import React, { useState } from 'react';
import { SectionCard } from '@/components/shell/EnterprisePrimitives';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  Image, Sparkles, Download, Share2, Bookmark, RotateCcw, Maximize2,
  Wand2, Palette, Upload, Copy, Zap, Settings, Trash2, Heart,
  ZoomIn, ArrowUpRight, Minus, Plus, Crop
} from 'lucide-react';

const GALLERY = [
  { prompt: 'Futuristic city skyline at sunset with neon lights', style: 'Photorealistic', size: '1024×1024', created: '2h ago', quality: 'HD' },
  { prompt: 'Abstract geometric pattern in teal and coral', style: 'Abstract', size: '512×512', created: '5h ago', quality: 'Standard' },
  { prompt: 'Professional studio headshot background with bokeh', style: 'Studio', size: '1024×1024', created: 'Yesterday', quality: 'HD' },
  { prompt: 'Product mockup on marble surface with plants', style: 'Product', size: '1024×768', created: 'Yesterday', quality: 'HD' },
  { prompt: 'Watercolor landscape with mountains and lake', style: 'Watercolor', size: '1024×1024', created: '2d ago', quality: 'Standard' },
  { prompt: 'Minimalist logo concept for tech startup', style: '3D Render', size: '512×512', created: '3d ago', quality: 'HD' },
];

const STYLES = ['Photorealistic', 'Illustration', 'Abstract', 'Watercolor', 'Anime', 'Oil Painting', '3D Render', 'Pixel Art', 'Cinematic', 'Line Art'];
const SIZES = ['512×512', '768×768', '1024×1024', '1024×768', '768×1024', '1920×1080'];
const QUALITY_TIERS = ['Standard', 'HD', 'Ultra HD'];

export default function AIImageStudioPage() {
  const [style, setStyle] = useState('Photorealistic');
  const [size, setSize] = useState('1024×1024');
  const [quality, setQuality] = useState('HD');
  const [count, setCount] = useState(4);

  return (
    <div className="flex gap-4">
      <div className="flex-1 min-w-0 space-y-4">
        {/* Prompt area */}
        <SectionCard className="!rounded-2xl">
          <div className="space-y-3">
            <div>
              <label className="text-[9px] font-medium mb-1 block">Image Prompt</label>
              <textarea className="w-full h-20 rounded-xl border bg-background px-3 py-2.5 text-[11px] resize-none focus:outline-none focus:ring-1 focus:ring-accent" placeholder="Describe the image you want to create in detail... e.g. 'A futuristic city skyline at golden hour with flying vehicles and holographic billboards'" />
            </div>
            <div>
              <label className="text-[9px] font-medium mb-1 block">Negative Prompt (optional)</label>
              <input className="w-full h-9 rounded-xl border bg-background px-3 text-[11px] focus:outline-none focus:ring-1 focus:ring-accent" placeholder="Things to exclude... e.g. 'blurry, low quality, text, watermark'" />
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <Button className="h-9 text-[11px] rounded-xl gap-1.5 px-5"><Sparkles className="h-3.5 w-3.5" />Generate {count} Images</Button>
              <Button variant="outline" className="h-9 text-[11px] rounded-xl gap-1.5"><Wand2 className="h-3.5 w-3.5" />Edit Existing</Button>
              <Button variant="outline" className="h-9 text-[11px] rounded-xl gap-1.5"><Upload className="h-3.5 w-3.5" />Upload Reference</Button>
              <div className="flex-1" />
              <span className="text-[9px] text-muted-foreground flex items-center gap-1"><Zap className="h-3 w-3" />~{count * 3} credits · {quality}</span>
            </div>
          </div>
        </SectionCard>

        {/* Generated gallery */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-[13px] font-bold">Generated Images</h2>
            <span className="text-[9px] text-muted-foreground">{GALLERY.length} images</span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {GALLERY.map((img, i) => (
              <div key={i} className="rounded-2xl border overflow-hidden group cursor-pointer hover:shadow-lg transition-all duration-300">
                <div className="aspect-square bg-gradient-to-br from-muted/80 to-muted/30 flex items-center justify-center relative">
                  <Image className="h-10 w-10 text-muted-foreground/15" />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-all duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100">
                    <div className="flex gap-1.5">
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-white hover:bg-white/20 rounded-xl"><Maximize2 className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-white hover:bg-white/20 rounded-xl"><Download className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-white hover:bg-white/20 rounded-xl"><Bookmark className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-white hover:bg-white/20 rounded-xl"><Wand2 className="h-4 w-4" /></Button>
                    </div>
                  </div>
                  <Badge className="absolute top-2 right-2 text-[7px] bg-black/60 text-white border-0 rounded-lg">{img.quality}</Badge>
                </div>
                <div className="p-2.5">
                  <div className="text-[10px] font-medium truncate mb-0.5">{img.prompt}</div>
                  <div className="flex items-center gap-2 text-[8px] text-muted-foreground">
                    <Badge variant="outline" className="text-[7px] rounded-md h-4">{img.style}</Badge>
                    <span>{img.size}</span>
                    <span>{img.created}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right rail */}
      <div className="hidden lg:flex flex-col w-[200px] shrink-0 space-y-3">
        <SectionCard title="Style" icon={<Palette className="h-3 w-3 text-muted-foreground" />} className="!rounded-2xl">
          <div className="flex flex-wrap gap-1">
            {STYLES.map(s => (
              <button key={s} onClick={() => setStyle(s)} className={cn('px-2 py-1 rounded-lg text-[8px] font-medium transition-all border', style === s ? 'border-accent bg-accent/10 text-accent shadow-sm' : 'border-transparent text-muted-foreground hover:bg-muted/30')}>{s}</button>
            ))}
          </div>
        </SectionCard>

        <SectionCard title="Size" className="!rounded-2xl">
          <div className="space-y-1">
            {SIZES.map(s => (
              <button key={s} onClick={() => setSize(s)} className={cn('w-full text-left px-2 py-1.5 rounded-lg text-[9px] transition-all', size === s ? 'bg-accent/10 text-accent font-medium' : 'text-muted-foreground hover:bg-muted/30')}>{s}</button>
            ))}
          </div>
        </SectionCard>

        <SectionCard title="Quality" className="!rounded-2xl">
          <div className="space-y-1">
            {QUALITY_TIERS.map(q => (
              <button key={q} onClick={() => setQuality(q)} className={cn('w-full text-left px-2 py-1.5 rounded-lg text-[9px] transition-all', quality === q ? 'bg-accent/10 text-accent font-medium' : 'text-muted-foreground hover:bg-muted/30')}>{q}</button>
            ))}
          </div>
        </SectionCard>

        <SectionCard title="Count" className="!rounded-2xl">
          <div className="flex items-center justify-between px-1">
            <Button variant="outline" size="sm" className="h-6 w-6 p-0 rounded-lg" onClick={() => setCount(Math.max(1, count - 1))}><Minus className="h-3 w-3" /></Button>
            <span className="text-[12px] font-bold">{count}</span>
            <Button variant="outline" size="sm" className="h-6 w-6 p-0 rounded-lg" onClick={() => setCount(Math.min(8, count + 1))}><Plus className="h-3 w-3" /></Button>
          </div>
        </SectionCard>

        <SectionCard title="Quick Actions" className="!rounded-2xl">
          <div className="space-y-1">
            {[
              { label: 'Create Variations', icon: Copy },
              { label: 'Upscale', icon: ZoomIn },
              { label: 'Crop & Resize', icon: Crop },
              { label: 'Insert into Gig', icon: ArrowUpRight },
            ].map(a => (
              <button key={a.label} className="w-full flex items-center gap-2 text-[9px] px-2 py-1.5 rounded-lg hover:bg-muted/40 transition-colors text-muted-foreground hover:text-foreground">
                <a.icon className="h-3 w-3" />{a.label}
              </button>
            ))}
          </div>
        </SectionCard>
      </div>
    </div>
  );
}
