import React, { useMemo, useState } from 'react';
import { DashboardLayout } from '@/components/shell/DashboardLayout';
import { SectionCard } from '@/components/shell/EnterprisePrimitives';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, X, SlidersHorizontal, Bookmark, TrendingUp, Clock } from 'lucide-react';
import { LiveSearchResults } from '@/components/search/LiveSearchResults';
import { SearchEmptyState, SearchOfflineState } from '@/components/search/SearchStates';
import { AdvancedFilterPanel, EXPLORE_JOBS_FILTERS, NAVIGATOR_LEADS_FILTERS, type FilterValues } from '@/components/shell/AdvancedFilterPanel';
import { searchApiConfigured, useCreateSavedSearch, useSavedSearches, useSearchRecent, useSearchTrending } from '@/hooks/useSearchData';

const CATEGORIES = ['All', 'People', 'Gigs', 'Services', 'Companies', 'Jobs', 'Projects', 'Events', 'Groups'];

export default function SearchCommandCenterPage() {
  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [showFilters, setShowFilters] = useState(true);
  const [filterValues, setFilterValues] = useState<FilterValues>({});
  const apiOn = searchApiConfigured();
  const saved = useSavedSearches();
  const recent = useSearchRecent();
  const trending = useSearchTrending();
  const createSaved = useCreateSavedSearch();

  const filters = useMemo(() => activeCategory === 'Jobs' ? EXPLORE_JOBS_FILTERS : NAVIGATOR_LEADS_FILTERS, [activeCategory]);

  return (
    <DashboardLayout
      topStrip={
        <div className="flex items-center gap-3 w-full">
          <Search className="h-4 w-4 text-accent" />
          <div className="relative flex-1 max-w-2xl">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search people, gigs, services, companies, jobs..." className="pl-9 h-9 text-sm" />
            {query && <Button variant="ghost" size="sm" className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0" onClick={() => setQuery('')}><X className="h-3 w-3" /></Button>}
          </div>
          <Button variant="outline" size="sm" className="h-7 text-[10px] gap-1" onClick={() => setShowFilters(!showFilters)}>
            <SlidersHorizontal className="h-3 w-3" /> Filters
          </Button>
          <Button variant="outline" size="sm" className="h-7 text-[10px] gap-1" onClick={() => createSaved.mutate({ name: query || 'Untitled search', query, scope: activeCategory === 'All' ? 'all' : activeCategory.toLowerCase(), filters: filterValues, notify: true })} disabled={!query.trim()}>
            <Bookmark className="h-3 w-3" /> Save
          </Button>
        </div>
      }
      rightRail={
        <div className="space-y-3">
          <SectionCard title="Saved Searches">
            {(saved.data?.items ?? []).slice(0, 6).map((s) => (
              <div key={s.id} className="flex items-center gap-2 py-1.5 border-b border-border/20 last:border-0 rounded-lg px-1">
                <Bookmark className="h-3 w-3 text-accent shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="text-[9px] font-medium truncate">{s.query}</div>
                  <div className="text-[8px] text-muted-foreground">{s.lastCount ?? 0} results</div>
                </div>
              </div>
            ))}
          </SectionCard>
          <SectionCard title="Recent Searches" icon={<Clock className="h-3 w-3 text-muted-foreground" />}>
            {(recent.data?.items ?? []).slice(0, 6).map((r, i) => (
              <button key={`${r.query}-${i}`} className="flex items-center gap-2 py-1 text-[9px] w-full text-left hover:text-accent" onClick={() => setQuery(r.query)}>
                <Clock className="h-2.5 w-2.5 text-muted-foreground" /><span>{r.query}</span>
              </button>
            ))}
          </SectionCard>
          <SectionCard title="Trending" icon={<TrendingUp className="h-3 w-3 text-muted-foreground" />}>
            {(trending.data?.items ?? []).slice(0, 6).map((t, i) => (
              <button key={`${t.query}-${i}`} className="flex items-center gap-2 py-1 text-[9px] w-full text-left hover:text-accent" onClick={() => setQuery(t.query)}>
                <TrendingUp className="h-2.5 w-2.5 text-muted-foreground" /><span>{t.query}</span>
              </button>
            ))}
          </SectionCard>
        </div>
      }
      rightRailWidth="w-48"
    >
      <div className="flex items-center gap-1.5 mb-4 flex-wrap">
        {CATEGORIES.map(c => (
          <Button key={c} variant={activeCategory === c ? 'default' : 'outline'} size="sm" className="h-7 text-[10px] rounded-full" onClick={() => setActiveCategory(c)}>{c}</Button>
        ))}
      </div>

      {showFilters && (
        <SectionCard title="Filters" className="mb-4">
          <AdvancedFilterPanel filters={filters} values={filterValues} onChange={setFilterValues} inline />
        </SectionCard>
      )}

      {!apiOn && !query ? <SearchOfflineState /> : null}
      {!query ? (
        <SearchEmptyState label="Search people, jobs, services, companies, and more." />
      ) : (
        <SectionCard title={`Results for "${query}"`}>
          <LiveSearchResults
            query={query}
            scope={activeCategory === 'All' ? undefined : activeCategory.toLowerCase()}
            filters={filterValues as any}
          />
        </SectionCard>
      )}
    </DashboardLayout>
  );
}