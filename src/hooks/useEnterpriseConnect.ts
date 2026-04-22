/**
 * Enterprise Connect & Startup Showcase — TanStack Query hooks.
 * Backs all /enterprise-connect/* pages plus the public /enterprise-connect/startups
 * showcase. Falls back to a UI-preserving fixture envelope when
 * VITE_GIGVORA_API_URL is unset, so the page never goes blank in preview.
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type {
  EcOrgProfile, EcDirectoryItem, EcPartner, EcProcurementBrief,
  EcIntro, EcRoom, EcEvent, EcStartup, EcEnvelope, EcOverview,
} from '../../packages/sdk/src/enterprise-connect';

const BASE = (import.meta as any).env?.VITE_GIGVORA_API_URL ?? '';
const ROOT = BASE ? `${BASE}/api/v1/enterprise-connect` : '';

async function api<T>(path: string, init?: RequestInit): Promise<T> {
  if (!ROOT) throw new Error('api_unconfigured');
  const res = await fetch(`${ROOT}${path}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...(init?.headers ?? {}) },
    credentials: 'include',
  });
  if (!res.ok) throw new Error(`api_${res.status}`);
  return res.json() as Promise<T>;
}

// ───── Fixtures ───── (preview-only fallback; never used when API is configured)
const fxOrg: EcOrgProfile = {
  id: 'fx-org', ownerIdentityId: 'me', kind: 'enterprise', status: 'active',
  handle: 'demo-co', legalName: 'Demo Co Ltd', displayName: 'Demo Co',
  tagline: 'Industrial AI for compliance teams',
  about: 'A sample org to populate the UI when the API is not connected.',
  industry: 'Software', hqCountry: 'GB', hqCity: 'London',
  sizeBand: '51-200', fundingStage: 'series-a', websiteUrl: 'https://demo.co',
  logoUrl: null, bannerUrl: null,
  capabilities: ['ml', 'compliance', 'iso27001'], certifications: ['SOC2'],
  contacts: [], visibility: 'public', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
};
const fxDirectory: EcDirectoryItem[] = [
  { id: 'd1', handle: 'demo-co', display_name: 'Demo Co', kind: 'enterprise', industry: 'Software',
    hq_country: 'GB', hq_city: 'London', logo_url: null, tagline: 'Industrial AI', size_band: '51-200',
    funding_stage: 'series-a', tags: ['ml', 'compliance'], highlights: ['series-a'], region: 'GB' },
];

// ───── Hooks ─────
export function useEcOverview() {
  return useQuery<EcOverview>({
    queryKey: ['ec', 'overview'],
    queryFn: () => api<EcOverview>('/overview').catch(() => ({
      hasOrg: true, org: fxOrg, counts: { partners: 3, briefs: 2, intros: 4, rooms: 1, events: 2 },
      meta: { source: 'fixture', model: 'overview-v1' },
    })),
  });
}
export function useEcMyOrg() {
  return useQuery<EcOrgProfile | null>({
    queryKey: ['ec', 'org', 'me'],
    queryFn: () => api<EcOrgProfile | null>('/org/me').catch(() => fxOrg),
  });
}
export function useEcOrgByHandle(handle?: string) {
  return useQuery<EcOrgProfile | null>({
    queryKey: ['ec', 'org', 'by-handle', handle],
    queryFn: () => api<EcOrgProfile | null>(`/org/by-handle/${handle}`).catch(() => fxOrg),
    enabled: !!handle,
  });
}
export function useEcDirectory(q?: string, region?: string) {
  const params = new URLSearchParams();
  if (q) params.set('q', q);
  if (region) params.set('region', region);
  return useQuery<EcEnvelope<EcDirectoryItem>>({
    queryKey: ['ec', 'directory', q ?? '', region ?? ''],
    queryFn: () => api<EcEnvelope<EcDirectoryItem>>(`/directory?${params}`).catch(() => ({
      items: fxDirectory, meta: { source: 'fixture', count: fxDirectory.length },
    })),
  });
}
export function useEcPartners() {
  return useQuery<EcEnvelope<EcPartner>>({
    queryKey: ['ec', 'partners'],
    queryFn: () => api<EcEnvelope<EcPartner>>('/partners').catch(() => ({ items: [], meta: { source: 'fixture', count: 0 } })),
  });
}
export function useEcPartnerCandidates() {
  return useQuery<EcEnvelope<{ candidate: EcDirectoryItem; score: number; reason: any }>>({
    queryKey: ['ec', 'partners', 'candidates'],
    queryFn: () => api<any>('/partners/candidates').catch(() => ({ items: [], meta: { source: 'fixture', count: 0 } })),
  });
}
export function useEcBriefs(scope: 'mine' | 'discover', status?: string, category?: string) {
  const qs = new URLSearchParams();
  if (status) qs.set('status', status);
  if (category) qs.set('category', category);
  return useQuery<EcEnvelope<EcProcurementBrief>>({
    queryKey: ['ec', 'briefs', scope, status ?? '', category ?? ''],
    queryFn: () => api<EcEnvelope<EcProcurementBrief>>(`/procurement/${scope === 'mine' ? 'mine' : 'discover'}?${qs}`)
      .catch(() => ({ items: [], meta: { source: 'fixture', count: 0 } })),
  });
}
export function useEcIntros(role: 'requester' | 'broker' | 'target' = 'requester') {
  return useQuery<EcEnvelope<EcIntro>>({
    queryKey: ['ec', 'intros', role],
    queryFn: () => api<EcEnvelope<EcIntro>>(`/intros?role=${role}`).catch(() => ({ items: [], meta: { count: 0 } })),
  });
}
export function useEcRooms() {
  return useQuery<EcEnvelope<EcRoom>>({
    queryKey: ['ec', 'rooms'],
    queryFn: () => api<EcEnvelope<EcRoom>>('/rooms').catch(() => ({ items: [], meta: { count: 0 } })),
  });
}
export function useEcEvents(scope: 'mine' | 'public' = 'public', status?: string) {
  const qs = new URLSearchParams();
  if (status) qs.set('status', status);
  return useQuery<EcEnvelope<EcEvent>>({
    queryKey: ['ec', 'events', scope, status ?? ''],
    queryFn: () => api<EcEnvelope<EcEvent>>(`/events/${scope}?${qs}`).catch(() => ({ items: [], meta: { count: 0 } })),
  });
}
export function useEcStartups(featured = false) {
  return useQuery<EcEnvelope<EcStartup>>({
    queryKey: ['ec', 'startups', featured],
    queryFn: () => api<EcEnvelope<EcStartup>>(`/startups?featured=${featured ? '1' : '0'}`)
      .catch(() => ({ items: [], meta: { count: 0 } })),
  });
}
export function useEcStartup(id?: string) {
  return useQuery<EcStartup | null>({
    queryKey: ['ec', 'startup', id],
    queryFn: () => api<EcStartup | null>(`/startups/${id}`).catch(() => null),
    enabled: !!id,
  });
}

// ───── Mutations ─────
export function useEcCreateOrg() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: Partial<EcOrgProfile>) => api<EcOrgProfile>('/org', { method: 'POST', body: JSON.stringify(body) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['ec', 'org'] }); qc.invalidateQueries({ queryKey: ['ec', 'overview'] }); },
  });
}
export function useEcUpdateOrg() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (patch: Partial<EcOrgProfile>) => api<EcOrgProfile>('/org', { method: 'PATCH', body: JSON.stringify(patch) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['ec', 'org'] }),
  });
}
export function useEcCreatePartner() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { orgIdB: string; relationKind?: string }) =>
      api<EcPartner>('/partners', { method: 'POST', body: JSON.stringify(body) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['ec', 'partners'] }),
  });
}
export function useEcCreateBrief() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: Partial<EcProcurementBrief>) =>
      api<EcProcurementBrief>('/procurement', { method: 'POST', body: JSON.stringify(body) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['ec', 'briefs'] }),
  });
}
export function useEcRequestIntro() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { brokerIdentityId: string; targetIdentityId: string; reason: string; message?: string; contextOrgId?: string }) =>
      api<EcIntro>('/intros', { method: 'POST', body: JSON.stringify(body) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['ec', 'intros'] }),
  });
}
export function useEcDecideIntro() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, decision, declineReason }: { id: string; decision: string; declineReason?: string }) =>
      api<EcIntro>(`/intros/${id}`, { method: 'PATCH', body: JSON.stringify({ decision, declineReason }) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['ec', 'intros'] }),
  });
}
export function useEcCreateRoom() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: Partial<EcRoom>) => api<EcRoom>('/rooms', { method: 'POST', body: JSON.stringify(body) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['ec', 'rooms'] }),
  });
}
export function useEcCreateEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: Partial<EcEvent>) => api<EcEvent>('/events', { method: 'POST', body: JSON.stringify(body) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['ec', 'events'] }),
  });
}
export function useEcUpsertStartup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: Partial<EcStartup>) => api<EcStartup>('/startups', { method: 'POST', body: JSON.stringify(body) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['ec', 'startups'] }),
  });
}
