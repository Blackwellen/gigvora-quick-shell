import React, { useState } from 'react';
import { DashboardLayout } from '@/components/shell/DashboardLayout';
import { SectionCard, KPICard } from '@/components/shell/EnterprisePrimitives';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FolderOpen, Upload, Download, File, Image, FileText, Film, Search, Plus, Eye, Trash2 } from 'lucide-react';
import { Input } from '@/components/ui/input';

const FILES = [
  { name: 'Brand_Guidelines_v3.pdf', type: 'pdf', size: '2.4 MB', uploaded: 'Apr 12, 2026', by: 'Sarah K.', deliverable: true },
  { name: 'Homepage_Mockup.fig', type: 'design', size: '12 MB', uploaded: 'Apr 11, 2026', by: 'Lisa P.', deliverable: false },
  { name: 'API_Documentation.md', type: 'doc', size: '340 KB', uploaded: 'Apr 10, 2026', by: 'Mike L.', deliverable: true },
  { name: 'Demo_Video.mp4', type: 'video', size: '45 MB', uploaded: 'Apr 8, 2026', by: 'James R.', deliverable: true },
  { name: 'Database_Schema.sql', type: 'code', size: '28 KB', uploaded: 'Apr 7, 2026', by: 'Sarah K.', deliverable: false },
];

const typeIcons: Record<string, React.ReactNode> = {
  pdf: <FileText className="h-4 w-4 text-red-400" />,
  design: <Image className="h-4 w-4 text-purple-400" />,
  doc: <FileText className="h-4 w-4 text-blue-400" />,
  video: <Film className="h-4 w-4 text-green-400" />,
  code: <File className="h-4 w-4 text-accent" />,
};

export default function ProjectFilesPage() {
  const [tab, setTab] = useState('all');

  return (
    <DashboardLayout
      topStrip={
        <div className="flex items-center gap-4 w-full">
          <FolderOpen className="h-4 w-4 text-accent" />
          <h1 className="text-sm font-bold mr-4">Files & Deliverables</h1>
          <KPICard label="Files" value={String(FILES.length)} />
          <KPICard label="Deliverables" value={String(FILES.filter(f => f.deliverable).length)} />
          <KPICard label="Total Size" value="60 MB" />
          <div className="flex-1" />
          <Button size="sm" className="h-7 text-[10px] gap-1"><Upload className="h-3 w-3" /> Upload</Button>
        </div>
      }
    >
      <Tabs value={tab} onValueChange={setTab} className="mb-4">
        <TabsList className="h-8">
          <TabsTrigger value="all" className="text-[10px] px-3">All Files</TabsTrigger>
          <TabsTrigger value="deliverables" className="text-[10px] px-3">Deliverables</TabsTrigger>
          <TabsTrigger value="internal" className="text-[10px] px-3">Internal</TabsTrigger>
        </TabsList>
      </Tabs>

      <SectionCard>
        {(tab === 'all' ? FILES : FILES.filter(f => tab === 'deliverables' ? f.deliverable : !f.deliverable)).map((f, i) => (
          <div key={i} className="flex items-center gap-3 p-3 rounded-xl border border-border/40 hover:border-accent/30 transition-all cursor-pointer mb-2">
            {typeIcons[f.type]}
            <div className="flex-1 min-w-0">
              <div className="text-[11px] font-medium truncate">{f.name}</div>
              <div className="flex items-center gap-2 text-[9px] text-muted-foreground">
                <span>{f.size}</span>
                <span>{f.uploaded}</span>
                <span>by {f.by}</span>
              </div>
            </div>
            {f.deliverable && <Badge className="text-[7px] h-3.5 bg-accent/10 text-accent border-0">Deliverable</Badge>}
            <div className="flex gap-1">
              <Button variant="ghost" size="sm" className="h-6 w-6 p-0"><Eye className="h-2.5 w-2.5" /></Button>
              <Button variant="ghost" size="sm" className="h-6 w-6 p-0"><Download className="h-2.5 w-2.5" /></Button>
            </div>
          </div>
        ))}
      </SectionCard>
    </DashboardLayout>
  );
}
