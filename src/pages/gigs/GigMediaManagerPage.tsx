import React, { useState } from 'react';
import { DashboardLayout } from '@/components/shell/DashboardLayout';
import { SectionCard, KPICard, KPIBand } from '@/components/shell/EnterprisePrimitives';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ImageIcon, Film, Upload, Trash2, GripVertical, Eye, Star, Plus } from 'lucide-react';

const MEDIA = [
  { id: 1, type: 'image' as const, name: 'Portfolio_Hero.jpg', size: '2.4 MB', dimensions: '1920×1080', position: 1, status: 'live' },
  { id: 2, type: 'image' as const, name: 'Logo_Sample_1.png', size: '1.1 MB', dimensions: '1200×800', position: 2, status: 'live' },
  { id: 3, type: 'video' as const, name: 'Process_Walkthrough.mp4', size: '18.2 MB', dimensions: '1920×1080', position: 3, status: 'live' },
  { id: 4, type: 'image' as const, name: 'Before_After.jpg', size: '3.6 MB', dimensions: '2400×1200', position: 4, status: 'live' },
  { id: 5, type: 'image' as const, name: 'Client_Testimonial.png', size: '0.8 MB', dimensions: '1080×1080', position: 5, status: 'processing' },
];

export default function GigMediaManagerPage() {
  const [coverIdx, setCoverIdx] = useState(0);

  return (
    <DashboardLayout topStrip={<><ImageIcon className="h-4 w-4 text-accent" /><span className="text-xs font-semibold">Media Manager</span><div className="flex-1" /><Button size="sm" className="h-7 text-[10px] rounded-xl gap-1"><Upload className="h-3 w-3" />Upload Media</Button></>}>
      <KPIBand className="mb-3">
        <KPICard label="Images" value="4" className="!rounded-2xl" />
        <KPICard label="Videos" value="1" className="!rounded-2xl" />
        <KPICard label="Total Size" value="26.1 MB" className="!rounded-2xl" />
        <KPICard label="Max Slots" value="5/10" className="!rounded-2xl" />
      </KPIBand>

      <SectionCard title="Gallery Order" action={<span className="text-[8px] text-muted-foreground">Drag to reorder · First item is the cover</span>} className="!rounded-2xl mb-3">
        <div className="space-y-2">
          {MEDIA.map((m, i) => (
            <div key={m.id} className={cn('rounded-2xl border p-3 flex items-center gap-3', i === coverIdx && 'border-accent ring-1 ring-accent/20')}>
              <GripVertical className="h-3.5 w-3.5 text-muted-foreground/40 cursor-grab shrink-0" />
              <div className="h-12 w-16 rounded-xl bg-muted/50 flex items-center justify-center shrink-0">
                {m.type === 'image' ? <ImageIcon className="h-5 w-5 text-muted-foreground/30" /> : <Film className="h-5 w-5 text-muted-foreground/30" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-[10px] font-bold truncate">{m.name}</span>
                  {i === coverIdx && <Badge className="text-[6px] bg-accent/10 text-accent border-0 rounded-md">Cover</Badge>}
                  <Badge className={`text-[6px] border-0 rounded-md ${m.status === 'live' ? 'bg-[hsl(var(--state-healthy)/0.1)] text-[hsl(var(--state-healthy))]' : 'bg-[hsl(var(--gigvora-amber)/0.1)] text-[hsl(var(--gigvora-amber))]'}`}>{m.status}</Badge>
                </div>
                <div className="text-[8px] text-muted-foreground">{m.type} · {m.size} · {m.dimensions}</div>
              </div>
              <div className="flex gap-1 shrink-0">
                {i !== coverIdx && <Button variant="outline" size="sm" className="h-6 text-[7px] rounded-lg gap-0.5" onClick={() => setCoverIdx(i)}><Star className="h-2.5 w-2.5" />Set Cover</Button>}
                <Button variant="outline" size="sm" className="h-6 text-[7px] rounded-lg gap-0.5"><Eye className="h-2.5 w-2.5" />Preview</Button>
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-destructive"><Trash2 className="h-3 w-3" /></Button>
              </div>
            </div>
          ))}
        </div>
      </SectionCard>

      <div className="grid grid-cols-2 gap-3">
        <SectionCard title="Upload Zone" className="!rounded-2xl">
          <div className="h-32 rounded-xl border-2 border-dashed border-border/50 flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-accent/50 transition-colors">
            <Upload className="h-6 w-6 text-muted-foreground/30" />
            <div className="text-[9px] text-muted-foreground text-center">Drag & drop or click to upload<br /><span className="text-[8px]">JPG, PNG, GIF, MP4 · Max 50 MB per file</span></div>
          </div>
        </SectionCard>
        <SectionCard title="Media Guidelines" className="!rounded-2xl">
          <div className="space-y-1.5 text-[9px] text-muted-foreground">
            <div>• Use 1920×1080 or higher resolution for images</div>
            <div>• Include at least 1 video for 30% more conversions</div>
            <div>• Show before/after samples when applicable</div>
            <div>• Avoid text-heavy images — buyers scan visually</div>
            <div>• First image (cover) gets 5× more views</div>
          </div>
        </SectionCard>
      </div>
    </DashboardLayout>
  );
}
