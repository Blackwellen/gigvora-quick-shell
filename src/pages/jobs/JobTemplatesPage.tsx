import React, { useState } from 'react';
import { DashboardLayout } from '@/components/shell/DashboardLayout';
import { SectionCard, KPICard } from '@/components/shell/EnterprisePrimitives';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FileText, Plus, Copy, Edit, Trash2, Search, Clock } from 'lucide-react';

const TEMPLATES = [
  { id: 't1', title: 'Senior Frontend Developer', category: 'Engineering', lastUsed: '2d ago', uses: 8 },
  { id: 't2', title: 'Product Designer', category: 'Design', lastUsed: '1w ago', uses: 5 },
  { id: 't3', title: 'DevOps Engineer', category: 'Engineering', lastUsed: '2w ago', uses: 3 },
  { id: 't4', title: 'Marketing Manager', category: 'Marketing', lastUsed: '1mo ago', uses: 2 },
  { id: 't5', title: 'Data Scientist', category: 'Data', lastUsed: 'Never', uses: 0 },
];

export default function JobTemplatesPage() {
  const [search, setSearch] = useState('');
  const filtered = TEMPLATES.filter(t => t.title.toLowerCase().includes(search.toLowerCase()));

  return (
    <DashboardLayout
      topStrip={
        <div className="flex items-center gap-4 w-full">
          <FileText className="h-4 w-4 text-accent" />
          <h1 className="text-sm font-bold mr-4">Job Templates</h1>
          <KPICard label="Templates" value={String(TEMPLATES.length)} />
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
        {filtered.map(t => (
          <div key={t.id} className="flex items-center gap-4 p-3 rounded-xl border border-border/40 hover:border-accent/30 transition-all cursor-pointer mb-2">
            <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="text-[11px] font-semibold">{t.title}</div>
              <div className="flex items-center gap-3 text-[9px] text-muted-foreground">
                <Badge variant="outline" className="text-[7px] h-3.5">{t.category}</Badge>
                <span><Clock className="h-2.5 w-2.5 inline" /> {t.lastUsed}</span>
                <span>Used {t.uses}x</span>
              </div>
            </div>
            <div className="flex gap-1 shrink-0">
              <Button variant="outline" size="sm" className="h-6 text-[9px] gap-1"><Copy className="h-2.5 w-2.5" /> Use</Button>
              <Button variant="ghost" size="sm" className="h-6 w-6 p-0"><Edit className="h-2.5 w-2.5 text-muted-foreground" /></Button>
              <Button variant="ghost" size="sm" className="h-6 w-6 p-0"><Trash2 className="h-2.5 w-2.5 text-muted-foreground" /></Button>
            </div>
          </div>
        ))}
      </SectionCard>
    </DashboardLayout>
  );
}
