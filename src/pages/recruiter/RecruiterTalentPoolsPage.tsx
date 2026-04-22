import React, { useState } from 'react';
import { DashboardLayout } from '@/components/shell/DashboardLayout';
import { SectionCard, KPICard } from '@/components/shell/EnterprisePrimitives';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Star, Plus, Search, Users, Bell, Clock, Eye, Edit2 } from 'lucide-react';

const MOCK_POOLS = [
  { id: '1', name: 'Senior Frontend — Bay Area', count: 142, newSignals: 8, lastUpdated: '2h ago', tags: ['Engineering', 'Frontend', 'Bay Area'] },
  { id: '2', name: 'Engineering Managers', count: 87, newSignals: 3, lastUpdated: '5h ago', tags: ['Leadership', 'Engineering'] },
  { id: '3', name: 'ML/AI Specialists', count: 234, newSignals: 12, lastUpdated: '1h ago', tags: ['AI/ML', 'Research'] },
  { id: '4', name: 'DevOps — Remote', count: 56, newSignals: 0, lastUpdated: '2d ago', tags: ['DevOps', 'Remote'] },
  { id: '5', name: 'Product Designers', count: 98, newSignals: 5, lastUpdated: '4h ago', tags: ['Design', 'Product'] },
  { id: '6', name: 'Referral Pipeline', count: 23, newSignals: 1, lastUpdated: '6h ago', tags: ['Referral'] },
];

export default function RecruiterTalentPoolsPage() {
  const [search, setSearch] = useState('');
  const filtered = MOCK_POOLS.filter(p => p.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <DashboardLayout
      topStrip={
        <div className="flex items-center gap-4 w-full">
          <Star className="h-4 w-4 text-[hsl(var(--gigvora-amber))]" />
          <h1 className="text-sm font-bold mr-4">Saved Talent Pools</h1>
          <KPICard label="Total Pools" value={String(MOCK_POOLS.length)} />
          <KPICard label="Total Talent" value="640" />
          <KPICard label="New Signals" value="29" change="today" trend="up" />
        </div>
      }
    >
      <SectionCard title="Talent Pools" action={<Button size="sm" className="h-7 text-[10px] gap-1"><Plus className="h-3 w-3" /> Create Pool</Button>}>
        <div className="relative max-w-xs mb-4">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input placeholder="Search pools..." value={search} onChange={e => setSearch(e.target.value)} className="pl-8 h-8 text-xs" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {filtered.map(pool => (
            <div key={pool.id} className="p-3.5 rounded-xl border border-border/40 hover:border-accent/30 hover:bg-accent/5 transition-all cursor-pointer group">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold">{pool.name}</span>
                    {pool.newSignals > 0 && <Badge className="text-[7px] h-3.5 bg-[hsl(var(--state-healthy)/0.1)] text-[hsl(var(--state-healthy))] border-0">{pool.newSignals} new</Badge>}
                  </div>
                  <div className="flex items-center gap-3 mt-1 text-[9px] text-muted-foreground">
                    <span className="flex items-center gap-0.5"><Users className="h-2.5 w-2.5" /> {pool.count} candidates</span>
                    <span className="flex items-center gap-0.5"><Clock className="h-2.5 w-2.5" /> Updated {pool.lastUpdated}</span>
                  </div>
                  <div className="flex items-center gap-1 mt-2">
                    {pool.tags.map(t => <Badge key={t} variant="outline" className="text-[8px] h-4 px-1.5">{t}</Badge>)}
                  </div>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0"><Eye className="h-3 w-3" /></Button>
                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0"><Edit2 className="h-3 w-3" /></Button>
                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0"><Bell className="h-3 w-3" /></Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </SectionCard>
    </DashboardLayout>
  );
}
