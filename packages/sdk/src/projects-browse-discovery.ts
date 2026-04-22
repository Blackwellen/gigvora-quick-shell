/**
 * Typed SDK surface for Domain 32 — Projects Browse, Search, and
 * Discovery Marketplace. Consumed by the web hooks, the Flutter mobile
 * client, and any connector publishing/consuming D32 contracts.
 *
 * Wire format mirrors the controller envelopes 1:1.
 */
export type Currency = 'USD' | 'EUR' | 'GBP';
export type ProjectStatus = 'draft' | 'open' | 'in_review' | 'awarded' | 'paused' | 'completed' | 'cancelled';
export type ProposalStatus = 'draft' | 'submitted' | 'shortlisted' | 'rejected' | 'accepted' | 'withdrawn' | 'changes_requested';
export type Engagement = 'fixed' | 'hourly' | 'milestone' | 'retainer';
export type DurationBucket = 'lt_1w' | '1_4w' | '1_3m' | '3_6m' | '6m_plus';
export type Experience = 'entry' | 'intermediate' | 'expert';
export type Remote = 'any' | 'remote' | 'hybrid' | 'onsite';

export interface ProjectBrowseFilters {
  q?: string;
  page?: number;
  pageSize?: number;
  sort?: 'relevance' | 'newest' | 'budget_desc' | 'budget_asc' | 'proposals_asc' | 'match' | 'ending_soon';
  budgetMin?: number;
  budgetMax?: number;
  currency?: Currency;
  durationBuckets?: DurationBucket[];
  engagement?: Engagement[];
  remote?: Remote;
  location?: string;
  skills?: string[];
  categories?: string[];
  experienceLevel?: Experience[];
  postedWithinDays?: number;
  proposalsBelow?: number;
  clientVerified?: boolean;
  hasNda?: boolean;
  status?: ProjectStatus[];
  facetMode?: 'none' | 'compact' | 'full';
}

export interface ProjectBrowseResult {
  id: string;
  title: string;
  description: string;
  client: { id: string; name: string; verified: boolean };
  budget: { min: number; max: number; currency: string };
  engagement: Engagement;
  durationBucket: DurationBucket;
  remote: 'remote' | 'hybrid' | 'onsite';
  location: string;
  skills: string[];
  categories: string[];
  experienceLevel: Experience;
  postedAt: string;
  proposals: number;
  status: ProjectStatus;
  hasNda: boolean;
  views: number;
  attachmentCount: number;
  saved: boolean;
  matchScore: number;
}

export interface ProjectBrowseEnvelope {
  results: ProjectBrowseResult[];
  total: number;
  page: number;
  pageSize: number;
  facets: null | {
    engagement: { value: string; count: number }[];
    durationBucket: { value: string; count: number }[];
    remote: { value: string; count: number }[];
    experienceLevel: { value: string; count: number }[];
    categories: { value: string; count: number }[];
    topSkills: { value: string; count: number }[];
  };
  rankingMode: 'ml' | 'fallback' | 'recency';
  generatedAt: string;
}

export interface SavedProjectSearch {
  id?: string;
  label: string;
  filters: ProjectBrowseFilters;
  alertsEnabled: boolean;
  alertCadence: 'off' | 'realtime' | 'daily' | 'weekly';
  pinned: boolean;
  channel: 'inapp' | 'email' | 'inapp+email';
}

export interface ProposalDraft {
  projectId: string;
  coverLetter: string;
  proposedAmount: number;
  currency: Currency;
  engagement: Engagement;
  durationDays?: number;
  milestones?: { title: string; amount: number; dueAt?: string }[];
  attachmentIds?: string[];
}

export interface ProposalDecision {
  proposalId: string;
  decision: 'shortlist' | 'reject' | 'accept' | 'request_changes';
  note?: string;
}

export interface ProjectInsights {
  totalOpen: number;
  newToday: number;
  remoteShare: number;
  avgBudget: number;
  avgProposals: number;
  hotSkills: string[];
  anomalyNote: string | null;
  generatedAt: string;
  mode: string;
}

export interface ProjectsBrowseDiscoveryClient {
  search(f: ProjectBrowseFilters): Promise<ProjectBrowseEnvelope>;
  insights(): Promise<ProjectInsights>;
  detail(id: string): Promise<{ project: any; proposals: any[] } | null>;
  toggleBookmark(projectId: string): Promise<{ projectId: string; saved: boolean }>;
  bookmarks(): Promise<string[]>;
  listSaved(): Promise<SavedProjectSearch[]>;
  upsertSaved(s: SavedProjectSearch): Promise<SavedProjectSearch>;
  removeSaved(id: string): Promise<{ removed: boolean }>;
  draftProposal(d: ProposalDraft): Promise<any>;
  submitProposal(id: string): Promise<any>;
  withdrawProposal(id: string): Promise<any>;
  decideProposal(d: ProposalDecision): Promise<any>;
  myProposals(): Promise<any[]>;
  transitionProject(id: string, status: ProjectStatus): Promise<any>;
  flagProject(b: { projectId: string; reason: string; detail?: string }): Promise<any>;
  inviteToProject(b: { projectId: string; toIdentityId: string; message?: string }): Promise<any>;
}

export const createProjectsBrowseDiscoveryClient = (
  fetcher: typeof fetch,
  base = '/api/v1/projects-browse',
): ProjectsBrowseDiscoveryClient => {
  const j = async (path: string, init?: RequestInit) => {
    const r = await fetcher(`${base}${path}`, { ...init, headers: { 'content-type': 'application/json', ...(init?.headers ?? {}) } });
    if (!r.ok) throw new Error(`projects-browse ${path} ${r.status}`);
    return r.json();
  };
  const qs = (f: ProjectBrowseFilters) => {
    const p = new URLSearchParams();
    Object.entries(f).forEach(([k, v]) => v !== undefined && (Array.isArray(v) ? v.forEach((x) => p.append(k, String(x))) : p.set(k, String(v))));
    return p.toString();
  };
  return {
    search: (f) => j(`/search?${qs(f)}`),
    insights: () => j('/insights'),
    detail: (id) => j(`/projects/${id}`),
    toggleBookmark: (id) => j(`/projects/${id}/save`, { method: 'POST' }),
    bookmarks: () => j('/bookmarks'),
    listSaved: () => j('/saved'),
    upsertSaved: (s) => j('/saved', { method: 'POST', body: JSON.stringify(s) }),
    removeSaved: (id) => j(`/saved/${id}`, { method: 'DELETE' }),
    draftProposal: (d) => j('/proposals', { method: 'POST', body: JSON.stringify(d) }),
    submitProposal: (id) => j(`/proposals/${id}/submit`, { method: 'POST' }),
    withdrawProposal: (id) => j(`/proposals/${id}/withdraw`, { method: 'POST' }),
    decideProposal: (d) => j('/proposals/decision', { method: 'POST', body: JSON.stringify(d) }),
    myProposals: () => j('/proposals/mine'),
    transitionProject: (id, status) => j(`/projects/${id}/transition`, { method: 'POST', body: JSON.stringify({ status }) }),
    flagProject: (b) => j('/flag', { method: 'POST', body: JSON.stringify(b) }),
    inviteToProject: (b) => j('/invite', { method: 'POST', body: JSON.stringify(b) }),
  };
};
