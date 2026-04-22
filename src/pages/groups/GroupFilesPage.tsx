import React, { useState } from 'react';
import { DashboardLayout } from '@/components/shell/DashboardLayout';
import { SectionCard, KPICard, KPIBand } from '@/components/shell/EnterprisePrimitives';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  FileText, Image, Video, Link2, Upload, Download,
  Search, FolderOpen, MoreHorizontal, Eye, Star,
  Clock, User,
} from 'lucide-react';

type FileType = 'document' | 'image' | 'video' | 'link';

interface GroupFile {
  id: string; name: string; type: FileType; size: string;
  author: string; uploadedAt: string; downloads: number; pinned: boolean;
}

const FILES: GroupFile[] = [
  { id: '1', name: 'Getting Started Guide.pdf', type: 'document', size: '2.4 MB', author: 'Sarah Kim', uploadedAt: '2d ago', downloads: 234, pinned: true },
  { id: '2', name: 'Community Rules.md', type: 'document', size: '12 KB', author: 'Sarah Kim', uploadedAt: '1w ago', downloads: 189, pinned: true },
  { id: '3', name: 'React Patterns Cheatsheet.pdf', type: 'document', size: '1.8 MB', author: 'Maya Chen', uploadedAt: '3d ago', downloads: 156, pinned: false },
  { id: '4', name: 'Design System Components.fig', type: 'image', size: '45 MB', author: 'Lisa Park', uploadedAt: '5d ago', downloads: 89, pinned: false },
  { id: '5', name: 'Workshop Recording — Apr 2026.mp4', type: 'video', size: '1.2 GB', author: 'Mike Liu', uploadedAt: '1w ago', downloads: 67, pinned: false },
  { id: '6', name: 'Useful React Libraries List', type: 'link', size: '—', author: 'James Rivera', uploadedAt: '2w ago', downloads: 312, pinned: true },
];

const TYPE_ICONS: Record<FileType, { icon: React.ElementType; color: string }> = {
  document: { icon: FileText, color: 'text-accent' },
  image: { icon: Image, color: 'text-[hsl(var(--gigvora-amber))]' },
  video: { icon: Video, color: 'text-destructive' },
  link: { icon: Link2, color: 'text-[hsl(var(--state-healthy))]' },
};

export default function GroupFilesPage() {
  const [typeFilter, setTypeFilter] = useState<'all' | FileType>('all');
  const filtered = FILES.filter(f => typeFilter === 'all' || f.type === typeFilter);

  const topStrip = (
    <>
      <FolderOpen className="h-4 w-4 text-muted-foreground" />
      <span className="text-xs font-semibold">React Developers — Files & Resources</span>
      <div className="flex-1" />
      <div className="flex items-center gap-1 bg-muted/40 rounded-xl p-0.5">
        {(['all', 'document', 'image', 'video', 'link'] as const).map(f => (
          <button key={f} onClick={() => setTypeFilter(f)} className={cn('px-2 py-1 rounded-lg text-[8px] font-medium transition-colors capitalize', typeFilter === f ? 'bg-card shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground')}>{f === 'all' ? 'All' : f + 's'}</button>
        ))}
      </div>
      <Button size="sm" className="h-7 text-[10px] gap-1"><Upload className="h-3 w-3" />Upload</Button>
    </>
  );

  const rightRail = (
    <div className="space-y-3">
      <SectionCard title="Storage" className="!rounded-2xl">
        <div className="space-y-1.5 text-[9px]">
          <div className="flex justify-between"><span className="text-muted-foreground">Total Files</span><span className="font-semibold">{FILES.length}</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Storage Used</span><span className="font-semibold">1.3 GB</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Pinned</span><span className="font-semibold">{FILES.filter(f => f.pinned).length}</span></div>
        </div>
      </SectionCard>
      <SectionCard title="Quick Links" className="!rounded-2xl">
        {FILES.filter(f => f.pinned).map(f => (
          <div key={f.id} className="flex items-center gap-1.5 text-[9px] py-1 cursor-pointer hover:text-accent">
            <Star className="h-2.5 w-2.5 text-[hsl(var(--gigvora-amber))] shrink-0" />
            <span className="truncate">{f.name}</span>
          </div>
        ))}
      </SectionCard>
    </div>
  );

  return (
    <DashboardLayout topStrip={topStrip} rightRail={rightRail} rightRailWidth="w-44">
      <KPIBand className="mb-3">
        <KPICard label="Total Files" value={String(FILES.length)} className="!rounded-2xl" />
        <KPICard label="Downloads" value={String(FILES.reduce((s, f) => s + f.downloads, 0))} className="!rounded-2xl" />
        <KPICard label="Pinned" value={String(FILES.filter(f => f.pinned).length)} className="!rounded-2xl" />
        <KPICard label="Contributors" value="5" className="!rounded-2xl" />
      </KPIBand>

      <div className="space-y-2">
        {filtered.map(f => {
          const ti = TYPE_ICONS[f.type];
          return (
            <div key={f.id} className="rounded-2xl border bg-card p-3.5 hover:shadow-sm transition-all flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-muted/50 flex items-center justify-center shrink-0">
                <ti.icon className={cn('h-4 w-4', ti.color)} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] font-bold truncate">{f.name}</span>
                  {f.pinned && <Badge className="text-[7px] h-3.5 bg-[hsl(var(--gigvora-amber)/0.1)] text-[hsl(var(--gigvora-amber))] border-0 gap-0.5 rounded-lg"><Star className="h-2 w-2" />Pinned</Badge>}
                </div>
                <div className="text-[8px] text-muted-foreground mt-0.5 flex items-center gap-2">
                  <span className="flex items-center gap-0.5"><User className="h-2.5 w-2.5" />{f.author}</span>
                  <span>·</span>
                  <span className="flex items-center gap-0.5"><Clock className="h-2.5 w-2.5" />{f.uploadedAt}</span>
                  <span>·</span>
                  <span>{f.size}</span>
                  <span>·</span>
                  <span className="flex items-center gap-0.5"><Download className="h-2.5 w-2.5" />{f.downloads}</span>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0 rounded-lg"><Eye className="h-3 w-3" /></Button>
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0 rounded-lg"><Download className="h-3 w-3" /></Button>
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0 rounded-lg"><MoreHorizontal className="h-3 w-3" /></Button>
              </div>
            </div>
          );
        })}
      </div>
    </DashboardLayout>
  );
}
