import React, { useState } from 'react';
import { DashboardLayout } from '@/components/shell/DashboardLayout';
import { SectionCard, KPICard, KPIBand, StatusBadge } from '@/components/shell/EnterprisePrimitives';
import { Button } from '@/components/ui/button';
import { Archive, Eye, RotateCcw, Star, Calendar, DollarSign, CheckCircle, Clock, Search, Filter, Download } from 'lucide-react';
import { Input } from '@/components/ui/input';

const ARCHIVED = [
  { id: 'PRJ-102', title: 'E-Commerce Platform Rebuild', client: 'RetailCo', status: 'completed' as const, budget: '$45,000', rating: 5, completedDate: 'Mar 2026', duration: '12 weeks', tasks: 64, deliverables: 18, milestones: 6 },
  { id: 'PRJ-089', title: 'Mobile App MVP', client: 'StartupX', status: 'completed' as const, budget: '$22,000', rating: 4, completedDate: 'Feb 2026', duration: '8 weeks', tasks: 38, deliverables: 10, milestones: 4 },
  { id: 'PRJ-076', title: 'CRM Integration', client: 'Acme Corp', status: 'cancelled' as const, budget: '$15,000', rating: 0, completedDate: 'Jan 2026', duration: '4 weeks (partial)', tasks: 12, deliverables: 3, milestones: 1 },
  { id: 'PRJ-065', title: 'Brand Strategy Workshop', client: 'DesignLab', status: 'completed' as const, budget: '$8,000', rating: 5, completedDate: 'Dec 2025', duration: '3 weeks', tasks: 18, deliverables: 5, milestones: 3 },
];

const REVIEW_HISTORY = [
  { event: 'Final review approved', reviewer: 'Sarah K.', date: 'Mar 28, 2026', detail: 'All deliverables accepted — project closed' },
  { event: 'Client satisfaction survey', reviewer: 'RetailCo', date: 'Mar 30, 2026', detail: '5/5 stars — "Exceptional quality and communication"' },
  { event: 'Post-mortem completed', reviewer: 'Team', date: 'Apr 1, 2026', detail: '3 lessons learned documented, 2 process improvements identified' },
];

export default function ProjectArchivePage() {
  const [search, setSearch] = useState('');

  return (
    <DashboardLayout topStrip={<><Archive className="h-4 w-4 text-accent" /><span className="text-xs font-semibold">Archive & Review History</span><div className="flex-1" /><Button variant="outline" size="sm" className="h-7 text-[10px] rounded-xl gap-1"><Download className="h-3 w-3" />Export All</Button></>}>
      <div className="flex items-center gap-3 mb-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input placeholder="Search archived projects..." value={search} onChange={e => setSearch(e.target.value)} className="pl-8 h-8 text-xs rounded-xl" />
        </div>
        <Button variant="outline" size="sm" className="h-7 text-[10px] rounded-xl gap-1"><Filter className="h-3 w-3" />Filter</Button>
      </div>

      <KPIBand className="mb-3">
        <KPICard label="Archived Projects" value={String(ARCHIVED.length)} className="!rounded-2xl" />
        <KPICard label="Completed" value="3" className="!rounded-2xl" />
        <KPICard label="Cancelled" value="1" className="!rounded-2xl" />
        <KPICard label="Avg Rating" value="4.7" className="!rounded-2xl" />
      </KPIBand>

      <div className="space-y-2.5 mb-4">
        {ARCHIVED.map(p => (
          <SectionCard key={p.id} className="!rounded-2xl">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-[8px] text-muted-foreground font-mono">{p.id}</span>
                  <span className="text-[11px] font-bold">{p.title}</span>
                  <StatusBadge status={p.status === 'completed' ? 'healthy' : 'blocked'} label={p.status} />
                </div>
                <div className="flex items-center gap-3 text-[8px] text-muted-foreground mb-1">
                  <span>Client: <span className="font-medium text-foreground">{p.client}</span></span>
                  <span className="flex items-center gap-0.5"><DollarSign className="h-2.5 w-2.5" />{p.budget}</span>
                  <span className="flex items-center gap-0.5"><Calendar className="h-2.5 w-2.5" />{p.completedDate}</span>
                  <span className="flex items-center gap-0.5"><Clock className="h-2.5 w-2.5" />{p.duration}</span>
                </div>
                <div className="flex items-center gap-3 text-[8px] text-muted-foreground">
                  <span>{p.tasks} tasks</span>
                  <span>{p.deliverables} deliverables</span>
                  <span>{p.milestones} milestones</span>
                  {p.rating > 0 && <span className="flex items-center gap-0.5">{Array.from({ length: p.rating }).map((_, j) => <Star key={j} className="h-2.5 w-2.5 text-[hsl(var(--gigvora-amber))] fill-[hsl(var(--gigvora-amber))]" />)}</span>}
                </div>
              </div>
              <div className="flex gap-1">
                <Button variant="outline" size="sm" className="h-7 text-[9px] rounded-xl gap-0.5"><Eye className="h-3 w-3" />Review</Button>
                <Button variant="outline" size="sm" className="h-7 text-[9px] rounded-xl gap-0.5"><RotateCcw className="h-3 w-3" />Clone</Button>
              </div>
            </div>
          </SectionCard>
        ))}
      </div>

      <SectionCard title="Recent Review History" className="!rounded-2xl">
        <div className="space-y-2">
          {REVIEW_HISTORY.map((r, i) => (
            <div key={i} className="flex items-start gap-2.5 py-2 border-b border-border/20 last:border-0">
              <CheckCircle className="h-3.5 w-3.5 text-[hsl(var(--state-healthy))] mt-0.5 shrink-0" />
              <div className="flex-1">
                <div className="text-[10px] font-bold">{r.event}</div>
                <div className="text-[8px] text-muted-foreground">{r.detail}</div>
              </div>
              <div className="text-right shrink-0">
                <div className="text-[8px] font-medium">{r.reviewer}</div>
                <div className="text-[7px] text-muted-foreground">{r.date}</div>
              </div>
            </div>
          ))}
        </div>
      </SectionCard>
    </DashboardLayout>
  );
}
