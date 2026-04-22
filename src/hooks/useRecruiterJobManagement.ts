/**
 * Domain 26 React hooks. Wrap the SDK with TanStack Query, subscribe to
 * Socket.IO `requisition.*`, `approval.*`, `job.*` events, and provide
 * deterministic fallbacks so the recruiter dashboard never goes blank.
 */
import { useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createRecruiterJobManagementClient,
  type ManagedJob,
  type Requisition,
  type RequisitionListFilters,
  type JobListFilters,
} from '@gigvora/sdk/recruiter-job-management';
import { realtime, useRealtimeEvent } from '@/lib/realtime/socket';

const client = createRecruiterJobManagementClient(fetch);

const FALLBACK = { items: [] as Requisition[], total: 0, page: 1, pageSize: 20 };

export function useRequisitions(filters: RequisitionListFilters) {
  const qc = useQueryClient();
  const q = useQuery({
    queryKey: ['recruiter-job-management', 'list', filters],
    queryFn: () => client.list(filters).catch(() => FALLBACK),
    staleTime: 30_000,
  });
  useRealtimeEvent('requisition.created', () => qc.invalidateQueries({ queryKey: ['recruiter-job-management'] }));
  useRealtimeEvent('requisition.updated', () => qc.invalidateQueries({ queryKey: ['recruiter-job-management'] }));
  useRealtimeEvent('requisition.transitioned', () => qc.invalidateQueries({ queryKey: ['recruiter-job-management'] }));
  useRealtimeEvent('approval.decision', () => qc.invalidateQueries({ queryKey: ['recruiter-job-management'] }));
  useRealtimeEvent('requisition.bulk', () => qc.invalidateQueries({ queryKey: ['recruiter-job-management'] }));
  useRealtimeEvent('requisition.published', () => qc.invalidateQueries({ queryKey: ['recruiter-job-management'] }));
  useRealtimeEvent('job.transitioned', () => qc.invalidateQueries({ queryKey: ['recruiter-job-management'] }));
  return q;
}

export function useRequisition(id: string | undefined) {
  return useQuery({
    queryKey: ['recruiter-job-management', 'detail', id],
    queryFn: () => client.detail(id!),
    enabled: !!id,
  });
}

export function useCreateRequisition() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (p: Parameters<typeof client.create>[0]) => client.create(p),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['recruiter-job-management'] }),
  });
}

export function useUpdateRequisition() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (p: { id: string; expectedVersion: number; patch: any }) =>
      client.update(p.id, p.expectedVersion, p.patch),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['recruiter-job-management'] }),
  });
}

export function useTransitionRequisition() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (p: { id: string; next: any; reason?: string }) => client.transition(p.id, p.next, p.reason),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['recruiter-job-management'] }),
  });
}

export function useApproveRequisition() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (p: { id: string; decision: 'approve' | 'reject' | 'escalate'; note?: string }) =>
      client.approve(p.id, p.decision, p.note),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['recruiter-job-management'] }),
  });
}

export function useAssignRecruiters() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (p: { id: string; recruiterIds: string[] }) => client.assign(p.id, p.recruiterIds),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['recruiter-job-management'] }),
  });
}

export function usePublishRequisition() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (p: { id: string; idempotencyKey: string; channels?: string[] }) =>
      client.publish(p.id, p.idempotencyKey, p.channels),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['recruiter-job-management'] }),
  });
}

export function useBulkRequisitionAction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (p: Parameters<typeof client.bulk>[0]) => client.bulk(p),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['recruiter-job-management'] }),
  });
}

export function useManagedJobs(filters: JobListFilters) {
  const qc = useQueryClient();
  const q = useQuery({
    queryKey: ['recruiter-job-management', 'jobs', filters],
    queryFn: () => client.listJobs(filters).catch(() => ({ items: [] as ManagedJob[], total: 0, page: 1, pageSize: 20 })),
    staleTime: 30_000,
  });
  useRealtimeEvent('job.transitioned', () => qc.invalidateQueries({ queryKey: ['recruiter-job-management', 'jobs'] }));
  return q;
}

export function useJobTransition() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (p: { id: string; next: any }) => client.jobTransition(p.id, p.next),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['recruiter-job-management'] }),
  });
}

export function useRecruiterDashboard() {
  return useQuery({
    queryKey: ['recruiter-job-management', 'dashboard'],
    queryFn: () => client.dashboard().catch(() => ({})),
    refetchInterval: 60_000,
  });
}

export function useRecruiterJobMgmtRealtime(identityId: string | undefined, tenantId = 'tenant-demo') {
  useEffect(() => {
    if (identityId) realtime.connect(identityId);
    realtime.joinRoom?.(`tenant:${tenantId}:requisitions`);
    return () => { realtime.leaveRoom?.(`tenant:${tenantId}:requisitions`); };
  }, [identityId, tenantId]);
}
