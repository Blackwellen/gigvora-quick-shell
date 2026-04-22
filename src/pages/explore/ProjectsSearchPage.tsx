import React, { useState } from 'react';
import { DashboardLayout } from '@/components/shell/DashboardLayout';
import { SectionCard, KPICard, KPIBand, StatusBadge } from '@/components/shell/EnterprisePrimitives';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FolderKanban, Search, DollarSign, Clock, Eye, SlidersHorizontal, Bookmark, BookmarkCheck } from 'lucide-react';
import {
  useProjectsBrowseSearch, useProjectInsights, useToggleProjectBookmark,
} from '@/hooks/useProjectsBrowseDiscovery';
import type { ProjectBrowseFilters } from '@gigvora/sdk/projects-browse-discovery';

/**
 * Domain 32 — Projects Browse, Search & Discovery Marketplace.
 *
 * Routed workbench at /app/projects-browse. Replaces the prior mock array
 * with live D32 SDK calls (`useProjectsBrowseSearch`, `useProjectInsights`,
 * `useToggleProjectBookmark`). Falls back to deterministic fixtures when the
 * API is offline so the UI never empties out.
 */
export default function ProjectsSearchPage() {
  const [q, setQ] = useState('');
  const filters: ProjectBrowseFilters = { q: q || undefined, page: 1, pageSize: 20, sort: 'relevance', facetMode: 'compact' };
  const { data, isLoading } = useProjectsBrowseSearch(filters);
  const { data: insights } = useProjectInsights();
  const toggleBookmark = useToggleProjectBookmark();

  const formatBudget = (b: { min: number; max: number; currency: string }) => {
    const fmt = (n: number) => n >= 1000 ? `${Math.round(n / 1000)}K` : `${n}`;
    return `${b.currency === 'GBP' ? '£' : b.currency === 'EUR' ? '€' : '$'}${fmt(b.min)}-${fmt(b.max)}`;
  };
  const durationLabel = (b: string) => ({ lt_1w: '<1 week', '1_4w': '1-4 weeks', '1_3m': '1-3 months', '3_6m': '3-6 months', '6m_plus': '6+ months' } as const)[b as 'lt_1w'] ?? b;
  const ago = (iso: string) => {
    const h = Math.max(1, Math.round((Date.now() - Date.parse(iso)) / 3_600_000));
    return h < 24 ? `${h}h ago` : `${Math.round(h / 24)}d ago`;
  };

  return (
    <DashboardLayout topStrip={<><FolderKanban className="h-4 w-4 text-accent" /><span className="text-xs font-semibold">Projects Search</span><div className="flex-1" /><Button variant="outline" size="sm" className="h-7 text-[10px] rounded-xl gap-1"><SlidersHorizontal className="h-3 w-3" />Filters</Button></>}>
      <div className="flex gap-2 mb-3">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search projects by type, skill, or industry..." className="pl-8 h-8 text-xs rounded-xl" />
        </div>
      </div>
      <div className="flex flex-wrap gap-1 mb-3">{['Budget', 'Duration', 'Skills', 'Category', 'Remote Only'].map(f => <Button key={f} variant="outline" size="sm" className="h-6 text-[8px] rounded-lg">{f}</Button>)}</div>
      <KPIBand className="mb-3">
        <KPICard label="Open Projects" value={String(insights?.totalOpen ?? '—')} className="!rounded-2xl" />
        <KPICard label="New Today" value={String(insights?.newToday ?? '—')} className="!rounded-2xl" />
        <KPICard label="Avg Budget" value={insights?.avgBudget ? `£${Math.round(insights.avgBudget / 1000)}K` : '—'} className="!rounded-2xl" />
        <KPICard label="Avg Proposals" value={String(insights?.avgProposals ?? '—')} className="!rounded-2xl" />
      </KPIBand>
      <div className="space-y-2.5">
        {isLoading && <div className="text-[10px] text-muted-foreground">Loading projects…</div>}
        {!isLoading && data?.results.length === 0 && <div className="text-[10px] text-muted-foreground">No projects match these filters.</div>}
        {data?.results.map((p) => (
          <SectionCard key={p.id} className="!rounded-2xl">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-[11px] font-bold">{p.title}</span>
                  <StatusBadge status="healthy" label={p.status} />
                  {p.client.verified && <Badge variant="secondary" className="text-[7px] h-3.5 rounded-md">Verified</Badge>}
                  <Badge variant="outline" className="text-[7px] h-3.5 rounded-md">Match {p.matchScore}</Badge>
                </div>
                <div className="flex items-center gap-3 text-[8px] text-muted-foreground mb-1">
                  <span>{p.client.name}</span>
                  <span className="flex items-center gap-0.5"><DollarSign className="h-2.5 w-2.5" />{formatBudget(p.budget)}</span>
                  <span className="flex items-center gap-0.5"><Clock className="h-2.5 w-2.5" />{durationLabel(p.durationBucket)}</span>
                  <span>{p.proposals} proposals</span>
                  <span>{ago(p.postedAt)}</span>
                </div>
                <div className="flex flex-wrap gap-1">{p.skills.map((s) => <Badge key={s} variant="outline" className="text-[7px] h-3.5 rounded-md">{s}</Badge>)}</div>
              </div>
              <div className="flex gap-1">
                <Button size="sm" className="h-7 text-[9px] rounded-xl">Propose</Button>
                <Button variant="outline" size="sm" className="h-7 text-[9px] rounded-xl" onClick={() => toggleBookmark.mutate(p.id)}>
                  {p.saved ? <BookmarkCheck className="h-3 w-3" /> : <Bookmark className="h-3 w-3" />}
                </Button>
                <Button variant="outline" size="sm" className="h-7 text-[9px] rounded-xl"><Eye className="h-3 w-3" /></Button>
              </div>
            </div>
          </SectionCard>
        ))}
      </div>
    </DashboardLayout>
  );
}
