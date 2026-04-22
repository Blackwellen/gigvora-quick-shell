import React from 'react';
import { DashboardLayout } from '@/components/shell/DashboardLayout';
import { SectionCard, KPICard, KPIBand } from '@/components/shell/EnterprisePrimitives';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Bookmark, Bell, BellOff, Trash2, Clock, Plus } from 'lucide-react';
import { useArchiveSavedSearch, useSavedSearches } from '@/hooks/useSearchData';
import { SearchEmptyState, SearchErrorState, SearchLoadingState } from '@/components/search/SearchStates';

export default function SavedSearchesPage() {
  const { data, isLoading, error } = useSavedSearches();
  const archive = useArchiveSavedSearch();
  const items = data?.items ?? [];
  const totalResults = items.reduce((sum, item) => sum + Number(item.lastCount ?? 0), 0);

  return (
    <DashboardLayout topStrip={<><Bookmark className="h-4 w-4 text-accent" /><span className="text-xs font-semibold">Saved Searches</span><div className="flex-1" /><Button size="sm" className="h-7 text-[10px] rounded-xl gap-1"><Plus className="h-3 w-3" />Save Current</Button></>}>
      <KPIBand className="mb-3">
        <KPICard label="Saved Searches" value={String(items.length)} className="!rounded-2xl" />
        <KPICard label="With Alerts" value={String(items.filter(s => s.notify).length)} className="!rounded-2xl" />
        <KPICard label="Total Results" value={String(totalResults)} className="!rounded-2xl" />
        <KPICard label="Pinned" value={String(items.filter(s => s.pinned).length)} className="!rounded-2xl" />
      </KPIBand>

      {isLoading ? <SearchLoadingState label="Loading saved searches…" /> : null}
      {error ? <SearchErrorState label={(error as Error).message} /> : null}
      {!isLoading && !error && items.length === 0 ? <SearchEmptyState label="No saved searches yet." /> : null}

      <div className="space-y-2.5">
        {items.map((s) => (
          <SectionCard key={s.id} className="!rounded-2xl">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                  <span className="text-[11px] font-bold">{s.query}</span>
                  <Badge variant="outline" className="text-[7px] rounded-md capitalize">{s.scope}</Badge>
                  {s.notify && <Badge className="text-[6px] bg-accent/10 text-accent border-0 rounded-md gap-0.5"><Bell className="h-2 w-2" />Alerts</Badge>}
                  {s.pinned && <Badge variant="secondary" className="text-[6px] rounded-md">Pinned</Badge>}
                </div>
                <div className="flex items-center gap-3 text-[8px] text-muted-foreground flex-wrap">
                  <span>{s.lastCount ?? 0} results</span>
                  <span className="flex items-center gap-0.5"><Clock className="h-2.5 w-2.5" />Last: {s.lastRunAt ? new Date(s.lastRunAt).toLocaleString() : 'Never'}</span>
                </div>
              </div>
              <div className="flex gap-1">
                <Button variant="outline" size="sm" className="h-6 text-[8px] rounded-lg gap-0.5">{s.notify ? <BellOff className="h-2.5 w-2.5" /> : <Bell className="h-2.5 w-2.5" />}</Button>
                <Button variant="outline" size="sm" className="h-6 text-[8px] rounded-lg gap-0.5 text-[hsl(var(--state-critical))]" onClick={() => archive.mutate(s.id)}><Trash2 className="h-2.5 w-2.5" /></Button>
              </div>
            </div>
          </SectionCard>
        ))}
      </div>
    </DashboardLayout>
  );
}