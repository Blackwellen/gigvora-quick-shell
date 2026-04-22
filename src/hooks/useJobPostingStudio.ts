/**
 * Domain 24 React hooks. Wrap the SDK with TanStack Query, subscribe to
 * Socket.IO `job.*` and `credits.*` events, and provide deterministic
 * fallbacks so the existing studio UI never breaks.
 */
import { useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createJobPostingStudioClient, type ListFilters, type JobSummary } from '@gigvora/sdk/job-posting-studio';
import { realtime, useRealtimeEvent } from '@/lib/realtime/socket';

const client = createJobPostingStudioClient(fetch);

const FALLBACK_LIST = {
  items: [
    { id: 'fb-1', tenantId: 'tenant-demo', owner: { id: 'r1', name: 'Recruiter' }, title: 'Senior Backend Engineer', summary: '', description: '', employment: 'full_time', workplace: 'hybrid', location: 'London', salary: null, skills: ['ts'], benefits: [], applyUrl: null, visibility: 'public', promoted: false, promotionTier: 'none', status: 'active', channels: ['gigvora'], applications: 47, impressions: 3200, publishedAt: null, expiresAt: null, createdAt: '', updatedAt: '', version: 1 },
  ] as JobSummary[], total: 1, page: 1, pageSize: 20,
};

export function useStudioJobs(filters: ListFilters) {
  const qc = useQueryClient();
  const q = useQuery({
    queryKey: ['job-posting-studio', 'list', filters],
    queryFn: () => client.list(filters).catch(() => FALLBACK_LIST),
    staleTime: 30_000,
  });
  useRealtimeEvent('job.published', () => qc.invalidateQueries({ queryKey: ['job-posting-studio'] }));
  useRealtimeEvent('job.updated', () => qc.invalidateQueries({ queryKey: ['job-posting-studio'] }));
  useRealtimeEvent('job.approval.decided', () => qc.invalidateQueries({ queryKey: ['job-posting-studio'] }));
  return q;
}

export function useStudioJobDetail(id: string | undefined) {
  return useQuery({ queryKey: ['job-posting-studio', 'detail', id], queryFn: () => client.detail(id!), enabled: !!id });
}

export function useCreateJob() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (p: any) => client.create(p), onSuccess: () => qc.invalidateQueries({ queryKey: ['job-posting-studio'] }) });
}
export function useUpdateJob() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (p: { id: string; expectedVersion: number; patch: any }) => client.update(p.id, p.expectedVersion, p.patch), onSuccess: () => qc.invalidateQueries({ queryKey: ['job-posting-studio'] }) });
}
export function useJobQuality(id: string | undefined) {
  return useQuery({ queryKey: ['job-posting-studio', 'quality', id], queryFn: () => client.quality(id!), enabled: !!id });
}
export function useJobModeration(id: string | undefined) {
  return useQuery({ queryKey: ['job-posting-studio', 'moderate', id], queryFn: () => client.moderate(id!), enabled: !!id });
}

export function useSubmitForReview() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (id: string) => client.submit(id), onSuccess: () => qc.invalidateQueries({ queryKey: ['job-posting-studio'] }) });
}
export function useDecideJob() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (p: { id: string; decision: 'approve' | 'reject' | 'request_changes'; note?: string }) => client.decide(p.id, p.decision, p.note),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['job-posting-studio'] }),
  });
}

export function usePublishJob() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (p: { id: string; promotionTier?: string; durationDays?: number; channels?: string[]; idempotencyKey: string }) => client.publish(p.id, p),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['job-posting-studio'] }),
  });
}
export function usePauseJob() { const qc = useQueryClient(); return useMutation({ mutationFn: (id: string) => client.pause(id), onSuccess: () => qc.invalidateQueries({ queryKey: ['job-posting-studio'] }) }); }
export function useResumeJob() { const qc = useQueryClient(); return useMutation({ mutationFn: (id: string) => client.resume(id), onSuccess: () => qc.invalidateQueries({ queryKey: ['job-posting-studio'] }) }); }
export function useArchiveJob() { const qc = useQueryClient(); return useMutation({ mutationFn: (id: string) => client.archive(id), onSuccess: () => qc.invalidateQueries({ queryKey: ['job-posting-studio'] }) }); }

export function useApprovalQueue() {
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ['job-posting-studio', 'approvals'], queryFn: () => client.approvalQueue().catch(() => []) });
  useRealtimeEvent('job.approval.submitted', () => qc.invalidateQueries({ queryKey: ['job-posting-studio', 'approvals'] }));
  useRealtimeEvent('job.approval.decided', () => qc.invalidateQueries({ queryKey: ['job-posting-studio', 'approvals'] }));
  return q;
}

// Credits
export function useCreditPacks() { return useQuery({ queryKey: ['job-posting-studio', 'packs'], queryFn: () => client.packs().catch(() => []) }); }
export function useCreditBalance() {
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ['job-posting-studio', 'balance'], queryFn: () => client.balance().catch(() => ({ balance: 0, ledger: [] })) });
  useRealtimeEvent('credits.applied', () => qc.invalidateQueries({ queryKey: ['job-posting-studio', 'balance'] }));
  return q;
}
export function useCreateCreditPurchase() { return useMutation({ mutationFn: (packId: string) => client.createPurchase(packId as any) }); }
export function useConfirmCreditPurchase() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (p: Parameters<typeof client.confirmPurchase>[1] & { id: string }) => client.confirmPurchase(p.id, p),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['job-posting-studio', 'balance'] }); qc.invalidateQueries({ queryKey: ['job-posting-studio', 'purchases'] }); },
  });
}
export function useCreditPurchases() { return useQuery({ queryKey: ['job-posting-studio', 'purchases'], queryFn: () => client.listPurchases().catch(() => []) }); }

export function useStudioInsights() { return useQuery({ queryKey: ['job-posting-studio', 'insights'], queryFn: () => client.insights().catch(() => ({})) }); }

export function useStudioRealtime(identityId: string | undefined, tenantId = 'tenant-demo') {
  useEffect(() => {
    if (identityId) realtime.connect(identityId);
    realtime.joinRoom?.(`tenant:${tenantId}:jobs`);
    realtime.joinRoom?.(`tenant:${tenantId}:credits`);
    return () => { realtime.leaveRoom?.(`tenant:${tenantId}:jobs`); realtime.leaveRoom?.(`tenant:${tenantId}:credits`); };
  }, [identityId, tenantId]);
}
