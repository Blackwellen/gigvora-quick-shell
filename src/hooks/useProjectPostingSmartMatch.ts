/**
 * Domain 33 React hooks. Wraps the SDK with TanStack Query, includes a
 * deterministic safe-fetch fallback so the wizard's Match & Invite step
 * never empties when the API is offline (mandatory degraded state).
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createProjectPostingSmartMatchClient,
  type ProjectStudioDraft,
  type SmartMatchItem,
  type BoostPackId,
  type PromotionTier,
  type InviteChannel,
} from '@gigvora/sdk/project-posting-smart-match';

const client = createProjectPostingSmartMatchClient(fetch);

const FALLBACK_MATCHES: SmartMatchItem[] = [
  { candidateId: 'fb-1', displayName: 'Sarah Chen', avatar: 'SC', headline: 'Senior Full-Stack Developer', location: 'London',
    hourlyRateCents: 8500, rating: 4.9, jobsCompleted: 47, skills: ['React','Node.js','PostgreSQL'], availability: 'open',
    matchScore: 96, reasons: ['3/3 skills match', 'Top rated (4.9)', 'Available now'] },
  { candidateId: 'fb-2', displayName: 'Alex Rivera', avatar: 'AR', headline: 'Product Designer & Developer', location: 'Berlin',
    hourlyRateCents: 7500, rating: 4.8, jobsCompleted: 32, skills: ['React','Figma','TypeScript'], availability: 'open',
    matchScore: 91, reasons: ['2/3 skills match', 'Top rated (4.8)'] },
  { candidateId: 'fb-3', displayName: 'James Okoro', avatar: 'JO', headline: 'Cloud Architecture Specialist', location: 'Lagos',
    hourlyRateCents: 9500, rating: 5.0, jobsCompleted: 61, skills: ['AWS','Docker','DevOps'], availability: 'limited',
    matchScore: 87, reasons: ['Top rated (5.0)', 'Remote ready'] },
  { candidateId: 'fb-4', displayName: 'Priya Sharma', avatar: 'PS', headline: 'Data Engineer', location: 'Bangalore',
    hourlyRateCents: 9000, rating: 4.7, jobsCompleted: 28, skills: ['Python','PostgreSQL','AWS'], availability: 'open',
    matchScore: 82, reasons: ['Available now'] },
  { candidateId: 'fb-5', displayName: 'Marcus Thompson', avatar: 'MT', headline: 'Mobile & Web Developer', location: 'New York',
    hourlyRateCents: 7000, rating: 4.6, jobsCompleted: 19, skills: ['React Native','TypeScript','Node.js'], availability: 'open',
    matchScore: 78, reasons: ['Mobile + web stack'] },
  { candidateId: 'fb-6', displayName: 'Elena Kowalski', avatar: 'EK', headline: 'UX/UI Lead', location: 'Warsaw',
    hourlyRateCents: 8000, rating: 4.9, jobsCompleted: 55, skills: ['Figma','UI/UX Design','React'], availability: 'limited',
    matchScore: 74, reasons: ['Top rated (4.9)'] },
];

export function useSmartMatch(projectId: string | null, opts?: { topK?: number; diversify?: boolean; minScore?: number; excludeInvited?: boolean }) {
  return useQuery({
    queryKey: ['pps', 'match', projectId, opts],
    enabled: !!projectId,
    queryFn: () =>
      client.smartMatch({ projectId: projectId!, topK: opts?.topK ?? 12, diversify: opts?.diversify ?? true, minScore: opts?.minScore ?? 60, excludeInvited: opts?.excludeInvited ?? false })
        .catch(() => ({ projectId: projectId!, mode: 'fallback' as const, generatedAt: new Date().toISOString(), items: FALLBACK_MATCHES })),
    staleTime: 30_000,
  });
}

export function useDraftMatchPreview(opts?: { topK?: number }) {
  // For the wizard: returns deterministic fallback matches for users who
  // haven't yet persisted a draft (no projectId yet). Lets the Match & Invite
  // step render before "Save Draft" creates the row server-side.
  return useQuery({
    queryKey: ['pps', 'match-preview', opts],
    queryFn: () => Promise.resolve({ projectId: 'preview', mode: 'fallback' as const, generatedAt: new Date().toISOString(), items: FALLBACK_MATCHES.slice(0, opts?.topK ?? 6) }),
    staleTime: Infinity,
  });
}

export function useCreateProjectStudio() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (d: ProjectStudioDraft) => client.create(d),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['pps'] }),
  });
}

export function useUpdateProjectStudio() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: { id: string; expectedVersion: number; patch: Partial<ProjectStudioDraft> }) =>
      client.update(vars.id, vars.expectedVersion, vars.patch),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['pps'] }),
  });
}

export function usePublishProjectStudio() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: { id: string; promotionTier?: PromotionTier; durationDays?: number; channels?: string[]; inviteCap?: number }) => {
      const idempotencyKey = `pps-pub-${vars.id}-${Date.now()}`;
      return client.publish(vars.id, { ...vars, idempotencyKey });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['pps'] }),
  });
}

export function useInviteCandidate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (b: { projectId: string; candidateId: string; channel?: InviteChannel; message?: string; expiresInDays?: number }) => client.invite(b),
    onSuccess: (_d, vars) => qc.invalidateQueries({ queryKey: ['pps', 'invites', vars.projectId] }),
  });
}

export function useBulkInvite() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (b: { projectId: string; candidateIds: string[]; channel?: InviteChannel; message?: string; expiresInDays?: number }) => client.inviteBulk(b),
    onSuccess: (_d, vars) => qc.invalidateQueries({ queryKey: ['pps', 'invites', vars.projectId] }),
  });
}

export function useBoostPacks() {
  return useQuery({
    queryKey: ['pps', 'boost-packs'],
    queryFn: () => client.boostPacks().catch(() => ([
      { id: 'boost_starter_5' as BoostPackId, label: 'Boost · 5 projects',  kind: 'boost' as const,          postings: 5,   invites: 0,   priceCents:  4_900, currency: 'GBP' as const },
      { id: 'boost_growth_25' as BoostPackId, label: 'Boost · 25 projects', kind: 'boost' as const,          postings: 25,  invites: 0,   priceCents: 19_900, currency: 'GBP' as const },
      { id: 'invite_pack_25' as BoostPackId,  label: 'Invite credits · 25', kind: 'invite_credits' as const, postings: 0,   invites: 25,  priceCents:  2_900, currency: 'GBP' as const },
      { id: 'invite_pack_100' as BoostPackId, label: 'Invite credits · 100',kind: 'invite_credits' as const, postings: 0,   invites: 100, priceCents:  9_900, currency: 'GBP' as const },
    ])),
    staleTime: 5 * 60_000,
  });
}

export function useBoostBalance() {
  return useQuery({
    queryKey: ['pps', 'boost-balance'],
    queryFn: () => client.boostBalance().catch(() => ({ boostBalance: 0, inviteBalance: 0, ledger: [], purchases: [] })),
  });
}

export function useCreateBoostPurchase() {
  return useMutation({ mutationFn: (packId: BoostPackId) => client.createBoostPurchase(packId) });
}

export function useConfirmBoostPurchase() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: { purchaseId: string; paymentMethod: 'card' | 'invoice' | 'wallet'; billing: { name: string; email: string; country: string; vatId?: string } }) => {
      const idempotencyKey = `pps-confirm-${vars.purchaseId}-${Date.now()}`;
      return client.confirmBoostPurchase(vars.purchaseId, { paymentMethod: vars.paymentMethod, billing: vars.billing, acceptTos: true, idempotencyKey });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['pps', 'boost-balance'] }),
  });
}

export function useApplyBoost() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: { projectId: string; promotionTier: PromotionTier; durationDays?: number }) => {
      const idempotencyKey = `pps-apply-${vars.projectId}-${Date.now()}`;
      return client.applyBoost({ ...vars, idempotencyKey });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['pps'] }),
  });
}

export function useStudioInsights() {
  return useQuery({
    queryKey: ['pps', 'insights'],
    queryFn: () => client.insights().catch(() => ({
      drafts: 0, active: 0, pending: 0, totalInvitesSent: 0, accepted: 0, declined: 0, acceptRate: 0,
      boostBalance: 0, inviteBalance: 0, anomalyNote: null, generatedAt: new Date().toISOString(), mode: 'fallback',
    })),
  });
}
