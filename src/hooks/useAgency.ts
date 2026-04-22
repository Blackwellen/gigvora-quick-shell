/**
 * Domain 13 — TanStack Query hooks for agency envelopes.
 * Pages call these in place of inline mock arrays; when the API is not
 * configured (no VITE_GIGVORA_API_URL), `enabled` is false and pages
 * fall back to their local fixture (preserving the existing UI exactly).
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { agencyApi, agencyApiAvailable, type AgencyEnvelope } from '@/lib/api/agency';

const k = {
  list: (q: object) => ['agency', 'list', q] as const,
  detail: (id: string) => ['agency', 'detail', id] as const,
  services: (id: string) => ['agency', 'services', id] as const,
  team: (id: string) => ['agency', 'team', id] as const,
  caseStudies: (id: string) => ['agency', 'case-studies', id] as const,
  reviews: (id: string) => ['agency', 'reviews', id] as const,
  proofs: (id: string) => ['agency', 'proofs', id] as const,
  summary: (id: string) => ['agency', 'summary', id] as const,
  inquiries: (id: string) => ['agency', 'inquiries', id] as const,
};

const enabled = agencyApiAvailable();

export const useAgencyList = (q: Parameters<typeof agencyApi.list>[0] = {}) =>
  useQuery({ queryKey: k.list(q), queryFn: () => agencyApi.list(q), enabled, staleTime: 30_000 });

export const useAgency = (idOrSlug: string | undefined) =>
  useQuery({
    queryKey: k.detail(idOrSlug ?? ''), queryFn: () => agencyApi.detail(idOrSlug!),
    enabled: enabled && !!idOrSlug, staleTime: 30_000,
  });

export const useAgencyServices = (id: string | undefined) =>
  useQuery({ queryKey: k.services(id ?? ''), queryFn: () => agencyApi.services(id!), enabled: enabled && !!id });

export const useAgencyTeam = (id: string | undefined) =>
  useQuery({ queryKey: k.team(id ?? ''), queryFn: () => agencyApi.team(id!), enabled: enabled && !!id });

export const useAgencyCaseStudies = (id: string | undefined) =>
  useQuery({ queryKey: k.caseStudies(id ?? ''), queryFn: () => agencyApi.caseStudies(id!), enabled: enabled && !!id });

export const useAgencyReviews = (id: string | undefined) =>
  useQuery({ queryKey: k.reviews(id ?? ''), queryFn: () => agencyApi.reviews(id!), enabled: enabled && !!id });

export const useAgencyProofs = (id: string | undefined) =>
  useQuery({ queryKey: k.proofs(id ?? ''), queryFn: () => agencyApi.proofs(id!), enabled: enabled && !!id });

export const useAgencySummary = (id: string | undefined) =>
  useQuery({ queryKey: k.summary(id ?? ''), queryFn: () => agencyApi.summary(id!), enabled: enabled && !!id, staleTime: 60_000 });

export const useAgencyInquiries = (id: string | undefined) =>
  useQuery({ queryKey: k.inquiries(id ?? ''), queryFn: () => agencyApi.inquiries(id!), enabled: enabled && !!id });

// ---- mutations -------------------------------------------------------------
export function useAgencyFollow(id: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (follow: boolean) => follow ? agencyApi.follow(id!) : agencyApi.unfollow(id!),
    onSuccess: () => { if (id) qc.invalidateQueries({ queryKey: k.detail(id) }); },
  });
}

export function useCreateAgencyInquiry(id: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: Parameters<typeof agencyApi.createInquiry>[1]) => agencyApi.createInquiry(id!, body),
    onSuccess: () => { if (id) qc.invalidateQueries({ queryKey: k.inquiries(id) }); },
  });
}

export function useUpdateAgency(id: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (patch: Partial<AgencyEnvelope>) => agencyApi.update(id!, patch),
    onSuccess: () => { if (id) qc.invalidateQueries({ queryKey: k.detail(id) }); },
  });
}

export function useAgencyLifecycle(id: string | undefined) {
  const qc = useQueryClient();
  const inv = () => { if (id) qc.invalidateQueries({ queryKey: k.detail(id) }); };
  return {
    publish: useMutation({ mutationFn: () => agencyApi.publish(id!),  onSuccess: inv }),
    pause:   useMutation({ mutationFn: () => agencyApi.pause(id!),    onSuccess: inv }),
    archive: useMutation({ mutationFn: () => agencyApi.archive(id!),  onSuccess: inv }),
    restore: useMutation({ mutationFn: () => agencyApi.restore(id!),  onSuccess: inv }),
  };
}

export const agencyEnabled = enabled;
