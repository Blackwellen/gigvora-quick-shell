import React, { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { ExternalLink } from 'lucide-react';
import { SearchEmptyState, SearchErrorState, SearchLoadingState, SearchOfflineState } from './SearchStates';
import { useSearch, useTrackSearchClick, searchApiConfigured, type SearchFilters, type SearchResult } from '@/hooks/useSearchData';

interface Props {
  query: string;
  scope?: string;
  filters?: SearchFilters;
  fallback?: React.ReactNode;
}

function useDebounced<T>(value: T, delay = 250) {
  const [v, setV] = useState(value);
  useEffect(() => { const id = setTimeout(() => setV(value), delay); return () => clearTimeout(id); }, [value, delay]);
  return v;
}

export function LiveSearchResults({ query, scope, filters, fallback }: Props) {
  const debounced = useDebounced(query, 250);
  const apiOn = searchApiConfigured();
  const { data, isFetching, error } = useSearch(debounced, scope, filters, 25, 0);
  const track = useTrackSearchClick();

  if (!apiOn) {
    return (
      <div className="space-y-2">
        <SearchOfflineState />
        {fallback}
      </div>
    );
  }

  if (debounced.trim().length < 2) return <SearchEmptyState label="Type at least 2 characters to search." />;
  if (isFetching && !data) return <SearchLoadingState label="Searching…" />;
  if (error) return <SearchErrorState label={`Search failed: ${(error as Error).message}`} />;
  if (!data || data.items.length === 0) return <SearchEmptyState label={`No results for "${debounced}".`} />;

  const onClickResult = (r: SearchResult) => {
    track.mutate({ query: debounced, clickedId: r.id, clickedIndex: r.indexName, scope });
    if (r.url) window.open(r.url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-[9px] text-muted-foreground flex-wrap">
        <span>{data.total} results</span><span>·</span>
        <span>{data.ms}ms</span><span>·</span>
        <Badge variant="outline" className="text-[8px]">{data.source}</Badge>
        {data.rerank && <Badge variant="secondary" className="text-[8px]">{data.rerank.model}{data.rerank.fallback ? ' · fallback' : ''}</Badge>}
      </div>
      {data.items.map((r) => (
        <button key={`${r.indexName}:${r.id}`} onClick={() => onClickResult(r)} className="w-full text-left rounded-xl border border-border/40 hover:border-accent/40 transition-colors p-2.5 group">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <Badge variant="secondary" className="text-[8px] capitalize">{r.indexName}</Badge>
            <span className="text-[11px] font-semibold flex-1 truncate">{r.title}</span>
            {typeof r.rank === 'number' && <span className="text-[8px] text-muted-foreground">score {r.rank.toFixed(2)}</span>}
            <ExternalLink className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100" />
          </div>
          {r.body && <div className="text-[10px] text-muted-foreground line-clamp-2">{r.body}</div>}
          {r.reason && <div className="mt-1 text-[9px] text-accent">Why: {r.reason}</div>}
          {r.tags && r.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1.5">
              {r.tags.slice(0, 5).map((t) => <Badge key={t} variant="outline" className="text-[7px]">#{t}</Badge>)}
            </div>
          )}
        </button>
      ))}
    </div>
  );
}