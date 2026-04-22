/**
 * Domain 32 React hooks. Wraps the SDK with TanStack Query, includes safe-fetch
 * fallbacks (so the existing UI never breaks when the API is offline), and
 * subscribes to Socket.IO `projects-browse.*` events for realtime updates.
 */
import { useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createProjectsBrowseDiscoveryClient,
  type ProjectBrowseFilters,
  type SavedProjectSearch,
  type ProposalDraft,
  type ProposalDecision,
} from '@gigvora/sdk/projects-browse-discovery';
import { realtime, useRealtimeEvent } from '@/lib/realtime/socket';

const client = createProjectsBrowseDiscoveryClient(fetch);

const FALLBACK_RESULTS = Array.from({ length: 8 }).map((_, i) => ({
  id: `fb-${i}`,
  title: ['E-commerce Platform Redesign', 'Mobile App for Fitness Tracking', 'Brand Identity & Guidelines', 'Data Pipeline Architecture'][i % 4],
  description: 'Detailed brief covering discovery, design, build, and handover.',
  client: { id: `c-${i}`, name: ['GreenLeaf Co.', 'FitPro Inc.', 'StartupXYZ', 'DataVault Ltd.'][i % 4], verified: i % 2 === 0 },
  budget: { min: 5_000 + i * 1500, max: 18_000 + i * 1500, currency: 'GBP' },
  engagement: (['fixed', 'milestone', 'hourly', 'retainer'] as const)[i % 4],
  durationBucket: (['1_4w', '1_3m', '3_6m'] as const)[i % 3],
  remote: (['remote', 'hybrid', 'onsite'] as const)[i % 3],
  location: ['Remote', 'London', 'Manchester'][i % 3],
  skills: ['React', 'TypeScript', 'Node.js', 'AWS'].slice(0, 3 + (i % 2)),
  categories: ['Web Development'],
  experienceLevel: (['intermediate', 'expert', 'entry'] as const)[i % 3],
  postedAt: new Date(Date.now() - i * 3600_000).toISOString(),
  proposals: 6 + i * 2,
  status: 'open' as const,
  hasNda: i % 4 === 0,
  views: 50 + i * 11,
  attachmentCount: i % 3 === 0 ? 1 : 0,
  saved: false,
  matchScore: 65 + i * 3,
}));

export function useProjectsBrowseSearch(filters: ProjectBrowseFilters) {
  const qc = useQueryClient();
  const key = ['projects-browse', 'search', filters];
  const q = useQuery({
    queryKey: key,
    queryFn: () => client.search(filters).catch(() => ({
      results: FALLBACK_RESULTS, total: FALLBACK_RESULTS.length,
      page: filters.page ?? 1, pageSize: filters.pageSize ?? 20,
      facets: null, rankingMode: 'fallback' as const, generatedAt: new Date().toISOString(),
    })),
    staleTime: 30_000,
  });
  useRealtimeEvent('projects-browse.bookmark.toggled', () => qc.invalidateQueries({ queryKey: ['projects-browse'] }));
  useRealtimeEvent('projects-browse.saved-search.upserted', () => qc.invalidateQueries({ queryKey: ['projects-browse', 'saved'] }));
  useRealtimeEvent('projects-browse.proposal.decided', () => qc.invalidateQueries({ queryKey: ['projects-browse', 'mine'] }));
  return q;
}

export function useProjectInsights() {
  return useQuery({
    queryKey: ['projects-browse', 'insights'],
    queryFn: () => client.insights().catch(() => ({
      totalOpen: 486, newToday: 32, remoteShare: 58, avgBudget: 18_000,
      avgProposals: 14, hotSkills: ['React', 'Node.js', 'Figma'], anomalyNote: null,
      generatedAt: new Date().toISOString(), mode: 'fallback',
    })),
    staleTime: 60_000,
  });
}

export function useSavedProjectSearches() {
  return useQuery({ queryKey: ['projects-browse', 'saved'], queryFn: () => client.listSaved().catch(() => []) });
}
export function useUpsertSavedProjectSearch() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (s: SavedProjectSearch) => client.upsertSaved(s),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['projects-browse', 'saved'] }),
  });
}
export function useRemoveSavedProjectSearch() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => client.removeSaved(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['projects-browse', 'saved'] }),
  });
}
export function useToggleProjectBookmark() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (projectId: string) => client.toggleBookmark(projectId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['projects-browse'] }),
  });
}
export function useDraftProposal() {
  return useMutation({ mutationFn: (d: ProposalDraft) => client.draftProposal(d) });
}
export function useSubmitProposal() {
  return useMutation({ mutationFn: (id: string) => client.submitProposal(id) });
}
export function useDecideProposal() {
  return useMutation({ mutationFn: (d: ProposalDecision) => client.decideProposal(d) });
}
export function useMyProposals() {
  return useQuery({ queryKey: ['projects-browse', 'mine'], queryFn: () => client.myProposals().catch(() => []) });
}

export function useProjectsBrowseRealtime(identityId: string | undefined) {
  useEffect(() => { if (identityId) realtime.connect(identityId); }, [identityId]);
}
