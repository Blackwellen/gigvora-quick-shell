/**
 * Domain 37 React hooks. Wraps the SDK with TanStack Query and provides
 * deterministic safe-fetch fallbacks so the workbench never empties when
 * the API is offline.
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createProjectWorkspacesHandoverClient,
  type WorkspaceRow, type WorkspaceStatus, type MilestoneStatus,
} from '@gigvora/sdk/project-workspaces-handover';

const client = createProjectWorkspacesHandoverClient(fetch);

const FALLBACK: WorkspaceRow[] = [
  { id: 'fb-w1', tenantId: 'fb', projectId: 'project-fb', contractId: 'fb-c1', title: 'Ops Dashboard MVP — Workspace', status: 'active',    createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), closedAt: null, version: 1 },
  { id: 'fb-w2', tenantId: 'fb', projectId: 'project-fb', contractId: 'fb-c2', title: 'Brand refresh — Workspace',     status: 'in-review', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), closedAt: null, version: 2 },
  { id: 'fb-w3', tenantId: 'fb', projectId: 'project-fb', contractId: 'fb-c3', title: 'Data migration — Workspace',    status: 'handover',  createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), closedAt: null, version: 4 },
];

export function useWorkspaces(filters?: { projectId?: string; contractId?: string; status?: WorkspaceStatus[] }) {
  return useQuery({
    queryKey: ['pwh', 'workspaces', filters],
    queryFn: () => client.list(filters).catch(() => FALLBACK),
    staleTime: 30_000,
  });
}

export function useWorkspaceDetail(id: string | null) {
  return useQuery({ queryKey: ['pwh', 'workspace', id], enabled: !!id, queryFn: () => client.detail(id!).catch(() => null) });
}

export function useMintWorkspaceFromContract() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: Parameters<typeof client.mintFromContract>[0]) => client.mintFromContract(vars),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['pwh'] }),
  });
}

export function useKickoffWorkspace() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: { workspaceId: string }) => client.kickoff(vars.workspaceId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['pwh'] }),
  });
}

export function useTransitionMilestone() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: { workspaceId: string; milestoneId: string; toStatus: MilestoneStatus; expectedVersion: number; note?: string }) =>
      client.transitionMilestone(vars),
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ['pwh', 'workspaces'] });
      qc.invalidateQueries({ queryKey: ['pwh', 'workspace', vars.workspaceId] });
    },
  });
}

export function useSubmitDeliverable() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: { workspaceId: string; milestoneId: string; title: string; url: string; notes?: string }) => client.submitDeliverable(vars),
    onSuccess: (_d, vars) => qc.invalidateQueries({ queryKey: ['pwh', 'workspace', vars.workspaceId] }),
  });
}

export function useReviewDeliverable() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: { workspaceId: string; deliverableId: string; decision: 'accepted' | 'changes-requested'; feedback?: string }) =>
      client.reviewDeliverable(vars),
    onSuccess: (_d, vars) => qc.invalidateQueries({ queryKey: ['pwh', 'workspace', vars.workspaceId] }),
  });
}

export function useStartHandover() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: { workspaceId: string }) => client.startHandover(vars.workspaceId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['pwh'] }),
  });
}

export function useCompleteChecklistItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: { workspaceId: string; itemId: string; note?: string }) => client.completeChecklistItem(vars),
    onSuccess: (_d, vars) => qc.invalidateQueries({ queryKey: ['pwh', 'workspace', vars.workspaceId] }),
  });
}

export function useCloseWorkspace() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: { workspaceId: string; finalReportMd: string }) => client.close(vars),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['pwh'] }),
  });
}

export function useHoldWorkspace() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: { workspaceId: string; reason: string }) => client.hold(vars.workspaceId, vars.reason),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['pwh'] }),
  });
}

export function useCancelWorkspace() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: { workspaceId: string; reason: string }) => client.cancel(vars.workspaceId, vars.reason),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['pwh'] }),
  });
}

export function usePwhInsights(projectId?: string) {
  return useQuery({
    queryKey: ['pwh', 'insights', projectId ?? null],
    queryFn: () => client.insights(projectId).catch(() => ({
      kickoff: 0, active: 1, inReview: 1, handover: 1, closed: 0, onHold: 0, cancelled: 0,
      total: 3, milestoneAcceptanceRatePct: 25, deliverableAcceptanceRatePct: 0,
      handoverReadinessPct: 0, avgCycleDays: 0,
      generatedAt: new Date().toISOString(), mode: 'fallback',
    })),
    staleTime: 60_000,
  });
}
