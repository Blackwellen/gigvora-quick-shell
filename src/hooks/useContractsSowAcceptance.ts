/**
 * Domain 36 React hooks. Wraps the SDK with TanStack Query and provides
 * deterministic safe-fetch fallbacks so the workbench never empties when
 * the API is offline.
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createContractsSowAcceptanceClient,
  type ContractRow, type ContractStatus, type PartyRole,
} from '@gigvora/sdk/contracts-sow-acceptance';

const client = createContractsSowAcceptanceClient(fetch);

const FALLBACK_CONTRACTS: ContractRow[] = [
  { id: 'fb-c1', tenantId: 'fb', projectId: 'project-fb', proposalId: 'fb-p1', awardId: 'award-fb-1', title: 'Ops Dashboard MVP — SoW', governingLaw: 'UK', status: 'sent',             expiresAt: new Date(Date.now() + 14 * 86_400_000).toISOString(), amendsContractId: null, supersededByContractId: null, contentHash: 'fb-hash-1', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), activatedAt: null, closedAt: null, version: 1 },
  { id: 'fb-c2', tenantId: 'fb', projectId: 'project-fb', proposalId: 'fb-p2', awardId: 'award-fb-2', title: 'Brand refresh — SoW',      governingLaw: 'UK', status: 'partially-signed', expiresAt: new Date(Date.now() + 10 * 86_400_000).toISOString(), amendsContractId: null, supersededByContractId: null, contentHash: 'fb-hash-2', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), activatedAt: null, closedAt: null, version: 2 },
  { id: 'fb-c3', tenantId: 'fb', projectId: 'project-fb', proposalId: 'fb-p3', awardId: 'award-fb-3', title: 'Data migration — SoW',     governingLaw: 'UK', status: 'active',           expiresAt: new Date(Date.now() + 60 * 86_400_000).toISOString(), amendsContractId: null, supersededByContractId: null, contentHash: 'fb-hash-3', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), activatedAt: new Date().toISOString(), closedAt: null, version: 3 },
];

export function useContracts(filters?: { projectId?: string; proposalId?: string; status?: ContractStatus[] }) {
  return useQuery({
    queryKey: ['csa', 'contracts', filters],
    queryFn: () => client.list(filters).catch(() => FALLBACK_CONTRACTS),
    staleTime: 30_000,
  });
}

export function useContractDetail(id: string | null) {
  return useQuery({ queryKey: ['csa', 'contract', id], enabled: !!id, queryFn: () => client.detail(id!).catch(() => null) });
}

export function useMintContractFromAward() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: {
      awardId: string; proposalId: string; projectId: string; title: string;
      parties: { partyId: string; role: PartyRole; displayName: string; email?: string; signOrder: number }[];
    }) => client.mintFromAward(vars),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['csa'] }),
  });
}

export function useSendContract() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: { contractId: string; message?: string }) => client.send(vars.contractId, vars.message),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['csa'] }),
  });
}

export function useSignContract() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: { contractId: string; partyId: string; typedName: string }) =>
      client.sign({ ...vars, capturedUa: typeof navigator !== 'undefined' ? navigator.userAgent : undefined }),
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ['csa', 'contracts'] });
      qc.invalidateQueries({ queryKey: ['csa', 'contract', vars.contractId] });
    },
  });
}

export function useRejectContract() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: { contractId: string; partyId: string; reason: string }) => client.reject(vars.contractId, vars.partyId, vars.reason),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['csa'] }),
  });
}

export function useVoidContract() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: { contractId: string; reason: string }) => client.voidContract(vars.contractId, vars.reason),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['csa'] }),
  });
}

export function useAmendContract() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: { contractId: string; changeSummary: string; newExpiresInDays?: number }) =>
      client.amend(vars.contractId, vars.changeSummary, vars.newExpiresInDays),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['csa'] }),
  });
}

export function useVerifyContractHash() {
  return useMutation({
    mutationFn: (vars: { contractId: string }) => client.verifyHash(vars.contractId),
  });
}

export function useCsaInsights(projectId?: string) {
  return useQuery({
    queryKey: ['csa', 'insights', projectId ?? null],
    queryFn: () => client.insights(projectId).catch(() => ({
      draft: 0, sent: 1, partiallySigned: 1, signed: 0, active: 1, rejected: 0,
      cancelled: 0, expired: 0, superseded: 0, total: 3,
      avgTimeToSignHours: 0, integrityOkPct: 100,
      generatedAt: new Date().toISOString(), mode: 'fallback',
    })),
    staleTime: 60_000,
  });
}
