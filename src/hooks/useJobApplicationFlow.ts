/**
 * Domain 25 React hooks. Wrap the SDK with TanStack Query, subscribe to
 * Socket.IO `application.*` and `review.*` events, and provide deterministic
 * fallbacks so application UIs never go blank.
 */
import { useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createJobApplicationFlowClient,
  type Application,
  type ApplicationListFilters,
  type FormTemplate,
} from '@gigvora/sdk/job-application-flow';
import { realtime, useRealtimeEvent } from '@/lib/realtime/socket';

const client = createJobApplicationFlowClient(fetch);

const FALLBACK_LIST = {
  items: [
    {
      id: 'fb-app-1', tenantId: 'tenant-demo', jobId: 'job-be-1', templateId: 'tpl-1',
      candidate: { id: 'c-1', name: 'Sam Patel', email: 'sam@example.com' },
      responses: {}, attachments: [], acceptedConsents: ['data_processing'], voluntary: null,
      status: 'submitted', qualityScore: 72, matchScore: 65, riskFlags: [],
      submittedAt: new Date().toISOString(), decidedAt: null, withdrawnAt: null, withdrawReason: null,
      createdAt: '', updatedAt: '', version: 1,
    } as Application,
  ],
  total: 1, page: 1, pageSize: 20,
};

export function useApplicationsList(filters: ApplicationListFilters) {
  const qc = useQueryClient();
  const q = useQuery({
    queryKey: ['job-application-flow', 'list', filters],
    queryFn: () => client.list(filters).catch(() => FALLBACK_LIST),
    staleTime: 30_000,
  });
  useRealtimeEvent('application.submitted', () => qc.invalidateQueries({ queryKey: ['job-application-flow'] }));
  useRealtimeEvent('application.updated', () => qc.invalidateQueries({ queryKey: ['job-application-flow'] }));
  useRealtimeEvent('review.decision', () => qc.invalidateQueries({ queryKey: ['job-application-flow'] }));
  useRealtimeEvent('application.withdrawn', () => qc.invalidateQueries({ queryKey: ['job-application-flow'] }));
  return q;
}

export function useApplicationDetail(id: string | undefined) {
  return useQuery({
    queryKey: ['job-application-flow', 'detail', id],
    queryFn: () => client.detail(id!),
    enabled: !!id,
  });
}

export function useApplicationTemplates(jobId?: string) {
  return useQuery<{ items: FormTemplate[] }>({
    queryKey: ['job-application-flow', 'templates', jobId],
    queryFn: () => client.listTemplates(jobId).catch(() => ({ items: [] })),
  });
}

export function useApplicationTemplate(id: string | undefined) {
  return useQuery({
    queryKey: ['job-application-flow', 'template', id],
    queryFn: () => client.template(id!),
    enabled: !!id,
  });
}

export function useCreateTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (p: Parameters<typeof client.createTemplate>[0]) => client.createTemplate(p),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['job-application-flow', 'templates'] }),
  });
}

export function usePublishTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => client.publishTemplate(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['job-application-flow', 'templates'] }),
  });
}

export function useCreateApplicationDraft() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (p: Parameters<typeof client.createDraft>[0]) => client.createDraft(p),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['job-application-flow'] }),
  });
}

export function useUpdateApplication() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (p: { id: string; expectedVersion: number; patch: any }) =>
      client.update(p.id, p.expectedVersion, p.patch),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['job-application-flow'] }),
  });
}

export function useSubmitApplication() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (p: { id: string; idempotencyKey: string }) => client.submit(p.id, p.idempotencyKey),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['job-application-flow'] }),
  });
}

export function useWithdrawApplication() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (p: { id: string; reason?: string }) => client.withdraw(p.id, p.reason),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['job-application-flow'] }),
  });
}

export function useReviewQueue() {
  const qc = useQueryClient();
  const q = useQuery({
    queryKey: ['job-application-flow', 'queue'],
    queryFn: () => client.reviewQueue().catch(() => ({ items: [] as Application[] })),
  });
  useRealtimeEvent('application.submitted', () => qc.invalidateQueries({ queryKey: ['job-application-flow', 'queue'] }));
  useRealtimeEvent('review.decision', () => qc.invalidateQueries({ queryKey: ['job-application-flow', 'queue'] }));
  useRealtimeEvent('review.bulk', () => qc.invalidateQueries({ queryKey: ['job-application-flow', 'queue'] }));
  return q;
}

export function useDecideApplication() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (p: Parameters<typeof client.decide>[1] & { id: string }) => client.decide(p.id, p),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['job-application-flow'] }),
  });
}

export function useBulkApplicationAction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (p: Parameters<typeof client.bulk>[0]) => client.bulk(p),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['job-application-flow'] }),
  });
}

export function useApplicationInsights(jobId?: string) {
  return useQuery({
    queryKey: ['job-application-flow', 'insights', jobId],
    queryFn: () => client.insights(jobId).catch(() => ({})),
  });
}

export function useApplicationFlowRealtime(identityId: string | undefined, tenantId = 'tenant-demo') {
  useEffect(() => {
    if (identityId) realtime.connect(identityId);
    realtime.joinRoom?.(`tenant:${tenantId}:applications`);
    return () => { realtime.leaveRoom?.(`tenant:${tenantId}:applications`); };
  }, [identityId, tenantId]);
}
