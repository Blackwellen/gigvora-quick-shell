import React, { useState } from 'react';
import { DashboardLayout } from '@/components/shell/DashboardLayout';
import { SectionCard } from '@/components/shell/EnterprisePrimitives';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { LayoutTemplate, Plus, Copy, Edit, Trash2, Search, Clock } from 'lucide-react';

const TEMPLATES = [
  { id: 'pt1', title: 'Web App MVP', tasks: 24, phases: 4, lastUsed: '3d ago', uses: 12 },
  { id: 'pt2', title: 'Brand Identity Project', tasks: 18, phases: 3, lastUsed: '1w ago', uses: 8 },
  { id: 'pt3', title: 'API Integration', tasks: 12, phases: 2, lastUsed: '2w ago', uses: 5 },
  { id: 'pt4', title: 'Mobile App Development', tasks: 32, phases: 5, lastUsed: '1mo ago', uses: 3 },
];

export default function ProjectTemplatesPage() {
  const [search, setSearch] = useState('');
  const filtered = TEMPLATES.filter(t => t.title.toLowerCase().includes(search.toLowerCase()));

  return (
    <DashboardLayout
      topStrip={
        <div className="flex items-center gap-3 w-full">
          <LayoutTemplate className="h-4 w-4 text-accent" />
          <h1 className="text-sm font-bold">Project Templates</h1>
          <div className="flex-1" />
          <Button size="sm" className="h-7 text-[10px] gap-1"><Plus className="h-3 w-3" /> New Template</Button>
        </div>
      }
    >
      <SectionCard>
        <div className="relative max-w-sm mb-4">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input placeholder="Search templates..." value={search} onChange={e => setSearch(e.target.value)} className="pl-8 h-8 text-xs" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {filtered.map(t => (
            <div key={t.id} className="p-4 rounded-xl border border-border/40 hover:border-accent/30 transition-all cursor-pointer">
              <div className="flex items-center gap-2 mb-2">
                <LayoutTemplate className="h-4 w-4 text-accent" />
                <span className="text-xs font-bold">{t.title}</span>
              </div>
              <div className="flex items-center gap-3 text-[9px] text-muted-foreground mb-3">
                <span>{t.tasks} tasks</span>
                <span>{t.phases} phases</span>
                <span><Clock className="h-2.5 w-2.5 inline" /> {t.lastUsed}</span>
                <span>Used {t.uses}x</span>
              </div>
              <div className="flex gap-2">
                <Button size="sm" className="h-6 text-[9px] gap-1 flex-1"><Copy className="h-2.5 w-2.5" /> Use Template</Button>
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0"><Edit className="h-2.5 w-2.5 text-muted-foreground" /></Button>
              </div>
            </div>
          ))}
        </div>
      </SectionCard>
    </DashboardLayout>
  );
}
