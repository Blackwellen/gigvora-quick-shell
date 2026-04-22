import React, { useState } from 'react';
import { DashboardLayout } from '@/components/shell/DashboardLayout';
import { SectionCard, KPICard, KPIBand, StatusBadge } from '@/components/shell/EnterprisePrimitives';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { Archive, Eye, RotateCcw, Star, Calendar, DollarSign, Clock, Search, Download, GitBranch } from 'lucide-react';

const ARCHIVED_GIGS = [
  { id: 'GIG-210', title: 'Logo Design — Minimalist', versions: 4, lastActive: 'Mar 2026', totalOrders: 142, revenue: '$14,200', rating: 4.9, status: 'archived' as const },
  { id: 'GIG-185', title: 'Social Media Graphics Pack', versions: 3, lastActive: 'Feb 2026', totalOrders: 89, revenue: '$6,230', rating: 4.7, status: 'archived' as const },
  { id: 'GIG-152', title: 'Business Card Design', versions: 2, lastActive: 'Jan 2026', totalOrders: 56, revenue: '$2,800', rating: 4.8, status: 'archived' as const },
  { id: 'GIG-120', title: 'YouTube Thumbnail Pack', versions: 5, lastActive: 'Dec 2025', totalOrders: 210, revenue: '$8,400', rating: 4.6, status: 'suspended' as const },
];

const VERSION_HISTORY = [
  { version: 'v4', date: 'Mar 15, 2026', changes: 'Updated pricing tiers, added rush delivery add-on', author: 'You' },
  { version: 'v3', date: 'Feb 1, 2026', changes: 'New portfolio samples, revised description copy', author: 'You' },
  { version: 'v2', date: 'Dec 10, 2025', changes: 'Added Enterprise package, updated FAQs', author: 'You' },
  { version: 'v1', date: 'Oct 5, 2025', changes: 'Initial gig listing published', author: 'You' },
];

export default function GigArchivePage() {
  const [search, setSearch] = useState('');

  return (
    <DashboardLayout topStrip={<><Archive className="h-4 w-4 text-accent" /><span className="text-xs font-semibold">Gig Archive & Version History</span><div className="flex-1" /><Button variant="outline" size="sm" className="h-7 text-[10px] rounded-xl gap-1"><Download className="h-3 w-3" />Export</Button></>}>
      <div className="flex items-center gap-3 mb-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input placeholder="Search archived gigs..." value={search} onChange={e => setSearch(e.target.value)} className="pl-8 h-8 text-xs rounded-xl" />
        </div>
      </div>

      <KPIBand className="mb-3">
        <KPICard label="Archived Gigs" value={String(ARCHIVED_GIGS.length)} className="!rounded-2xl" />
        <KPICard label="Total Lifetime Orders" value="497" className="!rounded-2xl" />
        <KPICard label="Lifetime Revenue" value="$31.6K" className="!rounded-2xl" />
        <KPICard label="Avg Rating" value="4.75" className="!rounded-2xl" />
      </KPIBand>

      <div className="space-y-2.5 mb-4">
        {ARCHIVED_GIGS.map(g => (
          <SectionCard key={g.id} className="!rounded-2xl">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-[8px] text-muted-foreground font-mono">{g.id}</span>
                  <span className="text-[11px] font-bold">{g.title}</span>
                  <StatusBadge status={g.status === 'archived' ? 'pending' : 'blocked'} label={g.status} />
                </div>
                <div className="flex items-center gap-3 text-[8px] text-muted-foreground">
                  <span className="flex items-center gap-0.5"><GitBranch className="h-2.5 w-2.5" />{g.versions} versions</span>
                  <span className="flex items-center gap-0.5"><Calendar className="h-2.5 w-2.5" />Last active: {g.lastActive}</span>
                  <span className="flex items-center gap-0.5"><DollarSign className="h-2.5 w-2.5" />{g.revenue}</span>
                  <span>{g.totalOrders} orders</span>
                  <span className="flex items-center gap-0.5">{Array.from({ length: Math.floor(g.rating) }).map((_, j) => <Star key={j} className="h-2.5 w-2.5 text-[hsl(var(--gigvora-amber))] fill-[hsl(var(--gigvora-amber))]" />)} {g.rating}</span>
                </div>
              </div>
              <div className="flex gap-1">
                <Button variant="outline" size="sm" className="h-7 text-[9px] rounded-xl gap-0.5"><Eye className="h-3 w-3" />View</Button>
                <Button variant="outline" size="sm" className="h-7 text-[9px] rounded-xl gap-0.5"><RotateCcw className="h-3 w-3" />Restore</Button>
              </div>
            </div>
          </SectionCard>
        ))}
      </div>

      <SectionCard title="Version History — Logo Design" icon={<GitBranch className="h-3.5 w-3.5 text-muted-foreground" />} className="!rounded-2xl">
        <div className="space-y-2">
          {VERSION_HISTORY.map((v, i) => (
            <div key={i} className="flex items-start gap-2.5 py-2 border-b border-border/20 last:border-0">
              <div className={cn('h-6 w-6 rounded-full flex items-center justify-center text-[8px] font-bold shrink-0', i === 0 ? 'bg-accent text-accent-foreground' : 'bg-muted text-muted-foreground')}>{v.version}</div>
              <div className="flex-1">
                <div className="text-[10px] font-bold">{v.changes}</div>
                <div className="text-[8px] text-muted-foreground">{v.author} · {v.date}</div>
              </div>
              <Button variant="outline" size="sm" className="h-6 text-[7px] rounded-lg gap-0.5"><Eye className="h-2.5 w-2.5" />Diff</Button>
            </div>
          ))}
        </div>
      </SectionCard>
    </DashboardLayout>
  );
}
