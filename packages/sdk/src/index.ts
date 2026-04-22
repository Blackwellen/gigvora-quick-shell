/** Typed SDK consumed by web + mobile. Replaces direct Supabase calls. */
export interface SdkConfig {
  baseUrl: string;
  getToken?: () => string | null | Promise<string | null>;
}

// ---------------------------------------------------------------------------
// Cross-domain SDK type bridges.
// These types are produced by domain modules (network, feed) whose full
// shape lives in apps/api-nest. The SDK exposes intentionally permissive
// wire types so callers can refine them at the call site without coupling
// the SDK to backend internals. Each is a typed envelope, not `any`, so
// consumers still get autocompletion on common fields.
// ---------------------------------------------------------------------------
export type ConnectionRequestStatus = 'pending' | 'accepted' | 'declined' | 'cancelled' | 'withdrawn';
export interface ConnectionRequest {
  id: string;
  fromIdentityId: string;
  toIdentityId: string;
  status: ConnectionRequestStatus;
  message?: string | null;
  createdAt: string;
  respondedAt?: string | null;
}
export interface Connection {
  id: string;
  identityId: string;
  peerIdentityId: string;
  connectedAt: string;
  strength?: number;
}
export type Degree = 1 | 2 | 3;
export interface Suggestion {
  identityId: string;
  displayName: string;
  headline?: string | null;
  avatarUrl?: string | null;
  mutualCount: number;
  reason?: string;
}
export interface Block {
  identityId: string;
  blockedIdentityId: string;
  reason?: string | null;
  createdAt: string;
}

export type PostKind = 'text' | 'media' | 'link' | 'poll' | 'opportunity' | 'repost';
export type PostVisibility = 'public' | 'connections' | 'org' | 'private';
export type ReactionKind = 'like' | 'celebrate' | 'support' | 'insightful' | 'curious';
export interface Post {
  id: string;
  authorId: string;
  kind: PostKind;
  visibility: PostVisibility;
  body: string;
  tags?: string[];
  media?: unknown[];
  link?: unknown;
  poll?: unknown;
  opportunity?: unknown;
  orgId?: string | null;
  language?: string | null;
  createdAt: string;
  updatedAt?: string | null;
  reactionCount?: number;
  commentCount?: number;
}
export interface FeedItem {
  id: string;
  post: Post;
  rank?: number;
  reason?: string;
}
export interface PostComment {
  id: string;
  postId: string;
  authorId: string;
  body: string;
  createdAt: string;
  parentCommentId?: string | null;
}
export interface OpportunityCard {
  id: string;
  kind: 'job' | 'gig' | 'project' | 'event';
  title: string;
  summary?: string;
  url?: string;
  meta?: Record<string, unknown>;
}


export class GigvoraClient {
  constructor(private readonly cfg: SdkConfig) {}

  private async req<T>(path: string, init: RequestInit = {}): Promise<T> {
    const token = await this.cfg.getToken?.();
    const r = await fetch(`${this.cfg.baseUrl}${path}`, {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(init.headers ?? {}),
      },
    });
    if (!r.ok) throw new Error(`${r.status} ${await r.text()}`);
    return r.json() as Promise<T>;
  }

  auth = {
    signup: (b: { email: string; password: string; name: string }) =>
      this.req<{ accessToken: string; refreshToken: string }>('/api/v1/auth/signup', { method: 'POST', body: JSON.stringify(b) }),
    login: (b: { email: string; password: string }) =>
      this.req<{ accessToken: string; refreshToken: string }>('/api/v1/auth/login', { method: 'POST', body: JSON.stringify(b) }),
    refresh: (refreshToken: string) =>
      this.req<{ accessToken: string; refreshToken: string }>('/api/v1/auth/refresh', { method: 'POST', body: JSON.stringify({ refreshToken }) }),
  };

  identity = {
    signup: (b: { email: string; password: string; displayName?: string; marketingOptIn?: boolean }) =>
      this.req<IdentityAuthResult>('/api/v1/identity/signup', { method: 'POST', body: JSON.stringify(b) }),
    login: (b: { email: string; password: string; mfaCode?: string; deviceLabel?: string }) =>
      this.req<IdentityAuthResult | { mfaRequired: true; riskBand: string }>('/api/v1/identity/login', { method: 'POST', body: JSON.stringify(b) }),
    refresh: (refreshToken: string) =>
      this.req<{ accessToken: string; refreshToken: string; expiresIn: number }>('/api/v1/identity/refresh', { method: 'POST', body: JSON.stringify({ refreshToken }) }),
    logout: (refreshToken?: string) =>
      this.req<{ ok: true }>('/api/v1/identity/logout', { method: 'POST', body: JSON.stringify({ refreshToken }) }),
    verifyEmail: (token: string) =>
      this.req<{ ok: true; email: string }>('/api/v1/identity/email/verify', { method: 'POST', body: JSON.stringify({ token }) }),
    resendVerification: (email: string) =>
      this.req<{ ok: true }>('/api/v1/identity/email/resend', { method: 'POST', body: JSON.stringify({ email }) }),
    forgotPassword: (email: string) =>
      this.req<{ ok: true; resetToken?: string }>('/api/v1/identity/password/forgot', { method: 'POST', body: JSON.stringify({ email }) }),
    resetPassword: (token: string, password: string) =>
      this.req<{ ok: true }>('/api/v1/identity/password/reset', { method: 'POST', body: JSON.stringify({ token, password }) }),
    me: () => this.req<{ userId: string }>('/api/v1/identity/me'),
    listSessions: () => this.req<IdentitySession[]>('/api/v1/identity/sessions'),
    revokeSession: (id: string) =>
      this.req<{ ok: true }>(`/api/v1/identity/sessions/${encodeURIComponent(id)}/revoke`, { method: 'POST' }),
    listMfa: () => this.req<MfaFactor[]>('/api/v1/identity/mfa'),
    enrollMfa: (b: { type: 'totp'|'sms'|'webauthn'; label?: string }) =>
      this.req<MfaFactor & { secret?: string }>('/api/v1/identity/mfa/enroll', { method: 'POST', body: JSON.stringify(b) }),
    verifyMfa: (b: { factorId: string; code: string }) =>
      this.req<{ ok: true }>('/api/v1/identity/mfa/verify', { method: 'POST', body: JSON.stringify(b) }),
    getOnboarding: () => this.req<OnboardingProgress | null>('/api/v1/identity/onboarding'),
    patchOnboarding: (b: Partial<OnboardingProgress>) =>
      this.req<OnboardingProgress>('/api/v1/identity/onboarding', { method: 'PATCH', body: JSON.stringify(b) }),
    listVerifications: () => this.req<IdentityVerification[]>('/api/v1/identity/verifications'),
    createVerification: (b: { kind: string; evidence?: Record<string, unknown> }) =>
      this.req<IdentityVerification>('/api/v1/identity/verifications', { method: 'POST', body: JSON.stringify(b) }),
  };

  habits = {
    list:   ()             => this.req<{ items: Habit[] }>('/api/v1/habits'),
    create: (b: NewHabit)  => this.req<Habit>('/api/v1/habits', { method: 'POST', body: JSON.stringify(b) }),
    log:    (id: string, date: string) => this.req<HabitLog>(`/api/v1/habits/${id}/logs`, { method: 'POST', body: JSON.stringify({ date }) }),
  };

  // NOTE: simple `profiles.me/update` was superseded by the extended
  // profiles namespace declared below (line ~228). Removed to avoid the
  // duplicate-property TS2300 error. Callers wanting just `me`/`update`
  // should use the extended namespace's getMe/updateMine equivalents.

  shell = {
    bootstrap: () => this.req<ShellBootstrap>('/api/v1/shell/bootstrap'),
    getPrefs:  () => this.req<ShellPrefs | null>('/api/v1/shell/prefs'),
    updatePrefs: (b: Partial<ShellPrefs>) =>
      this.req<ShellPrefs>('/api/v1/shell/prefs', { method: 'PATCH', body: JSON.stringify(b) }),
  };

  orgs = {
    list:   () => this.req<Org[]>('/api/v1/orgs'),
    create: (b: { name: string; slug: string; plan?: OrgPlan; logoUrl?: string }) =>
      this.req<Org>('/api/v1/orgs', { method: 'POST', body: JSON.stringify(b) }),
  };

  savedViews = {
    list:   () => this.req<SavedView[]>('/api/v1/saved-views'),
    create: (b: Omit<SavedView, 'id'>) =>
      this.req<SavedView>('/api/v1/saved-views', { method: 'POST', body: JSON.stringify(b) }),
    update: (id: string, b: Partial<SavedView>) =>
      this.req<SavedView>(`/api/v1/saved-views/${id}`, { method: 'PATCH', body: JSON.stringify(b) }),
    remove: (id: string) =>
      this.req<{ ok: true }>(`/api/v1/saved-views/${id}`, { method: 'DELETE' }),
  };

  recents = {
    list:  () => this.req<RecentItem[]>('/api/v1/recents'),
    track: (b: Omit<RecentItem, 'id' | 'visitedAt'>) =>
      this.req<{ ok: true }>('/api/v1/recents', { method: 'POST', body: JSON.stringify(b) }),
  };

  marketing = {
    listPages: (q: Partial<{ surface: string; status: string; locale: string; q: string; limit: number; offset: number }> = {}) => {
      const qs = new URLSearchParams(Object.entries(q).filter(([,v]) => v != null).map(([k,v]) => [k, String(v)])).toString();
      return this.req<MarketingPage[]>(`/api/v1/public/marketing/pages${qs ? `?${qs}` : ''}`);
    },
    getPage: (slug: string) => this.req<MarketingPage>(`/api/v1/public/marketing/pages/${encodeURIComponent(slug)}`),
    upsertPage: (b: UpsertMarketingPage) =>
      this.req<MarketingPage>('/api/v1/public/marketing/pages', { method: 'PUT', body: JSON.stringify(b) }),

    createLead: (b: CreateLead) =>
      this.req<{ id: string; email: string; status: LeadStatus; score: number; createdAt: string }>(
        '/api/v1/public/marketing/leads', { method: 'POST', body: JSON.stringify(b) }),
    listLeads: (q: { limit?: number; offset?: number; status?: LeadStatus } = {}) => {
      const qs = new URLSearchParams(Object.entries(q).filter(([,v]) => v != null).map(([k,v]) => [k, String(v)])).toString();
      return this.req<MarketingLead[]>(`/api/v1/public/marketing/leads${qs ? `?${qs}` : ''}`);
    },

    subscribe: (b: NewsletterSubscribe) =>
      this.req<{ email: string; status: NewsletterStatus; confirmToken?: string }>(
        '/api/v1/public/marketing/newsletter/subscribe', { method: 'POST', body: JSON.stringify(b) }),
    confirmNewsletter: (token: string) =>
      this.req<{ email: string }>(`/api/v1/public/marketing/newsletter/confirm/${encodeURIComponent(token)}`),
    unsubscribeNewsletter: (token: string) =>
      this.req<{ email: string }>(`/api/v1/public/marketing/newsletter/unsubscribe/${encodeURIComponent(token)}`),

    getExperiment: (key: string) =>
      this.req<CtaExperiment>(`/api/v1/public/marketing/cta/experiments/${encodeURIComponent(key)}`),
    recordCta: (b: CtaEventInput) =>
      this.req<{ ok: true }>('/api/v1/public/marketing/cta/events', { method: 'POST', body: JSON.stringify(b) }),
    ctaSummary: (experimentId: string) =>
      this.req<CtaSummaryRow[]>(`/api/v1/public/marketing/cta/experiments/${encodeURIComponent(experimentId)}/summary`),
  };

  overlays = {
    open: (b: OpenOverlayInput) =>
      this.req<OverlaySession>('/api/v1/overlays', { method: 'POST', body: JSON.stringify(b) }),
    listOpen: () => this.req<OverlaySession[]>('/api/v1/overlays'),
    get:   (id: string) => this.req<OverlaySession>(`/api/v1/overlays/${encodeURIComponent(id)}`),
    patch: (id: string, b: PatchOverlayInput) =>
      this.req<OverlaySession>(`/api/v1/overlays/${encodeURIComponent(id)}`, { method: 'PATCH', body: JSON.stringify(b) }),
    startWorkflow: (b: { templateKey: OverlayWorkflowTemplate; context?: Record<string, unknown> }) =>
      this.req<OverlayWorkflow>('/api/v1/overlays/workflows', { method: 'POST', body: JSON.stringify(b) }),
    listWorkflows: () => this.req<OverlayWorkflow[]>('/api/v1/overlays/workflows'),
    getWorkflow:   (id: string) => this.req<OverlayWorkflow>(`/api/v1/overlays/workflows/${encodeURIComponent(id)}`),
    advanceWorkflow: (id: string, b: { stepKey: string; data?: Record<string, unknown>; status?: OverlayStatus }) =>
      this.req<OverlayWorkflow>(`/api/v1/overlays/workflows/${encodeURIComponent(id)}/advance`, { method: 'POST', body: JSON.stringify(b) }),
    detachWindow: (b: { channelKey: string; surfaceKey: string; route: string; state?: Record<string, unknown> }) =>
      this.req<DetachedWindow>('/api/v1/overlays/windows', { method: 'POST', body: JSON.stringify(b) }),
    listWindows: () => this.req<DetachedWindow[]>('/api/v1/overlays/windows'),
    pingWindow:  (channel: string, b: { state?: Record<string, unknown> } = {}) =>
      this.req<DetachedWindow>(`/api/v1/overlays/windows/${encodeURIComponent(channel)}/ping`, { method: 'POST', body: JSON.stringify(b) }),
    closeWindow: (channel: string) =>
      this.req<{ ok: true }>(`/api/v1/overlays/windows/${encodeURIComponent(channel)}`, { method: 'DELETE' }),
  };

  settings = {
    list: (namespace?: SettingNamespace) =>
      this.req<Setting[]>(`/api/v1/settings${namespace ? `?namespace=${encodeURIComponent(namespace)}` : ''}`),
    get: (namespace: string, key: string) =>
      this.req<Setting | undefined>(`/api/v1/settings/${encodeURIComponent(namespace)}/${encodeURIComponent(key)}`),
    upsert: (b: { namespace: SettingNamespace; key: string; value: unknown; scope?: 'user'|'org'|'device'; orgId?: string }) =>
      this.req<Setting>('/api/v1/settings', { method: 'POST', body: JSON.stringify(b) }),
    bulkUpsert: (items: Array<{ namespace: SettingNamespace; key: string; value: unknown }>) =>
      this.req<{ updated: number; items: Setting[] }>('/api/v1/settings/bulk', { method: 'POST', body: JSON.stringify({ items }) }),
    resetNamespace: (namespace: SettingNamespace) =>
      this.req<{ key: string }[]>('/api/v1/settings/reset', { method: 'POST', body: JSON.stringify({ namespace }) }),
    audit: (limit = 50) => this.req<SettingsAuditEntry[]>(`/api/v1/settings/audit/log?limit=${limit}`),
    locales: () => this.req<Locale[]>('/api/v1/settings/catalogue/locales'),
    timezones: () => this.req<Timezone[]>('/api/v1/settings/catalogue/timezones'),
    listConnections: () => this.req<ConnectedAccount[]>('/api/v1/settings/connections'),
    createConnection: (b: { provider: string; externalId: string; displayName?: string; scopes?: string[]; metadata?: Record<string, unknown> }) =>
      this.req<ConnectedAccount>('/api/v1/settings/connections', { method: 'POST', body: JSON.stringify(b) }),
    revokeConnection: (id: string) =>
      this.req<{ id: string }[]>(`/api/v1/settings/connections/${encodeURIComponent(id)}`, { method: 'DELETE' }),
    listDataRequests: () => this.req<DataRequest[]>('/api/v1/settings/data-requests'),
    createDataRequest: (b: { kind: 'export'|'erasure'|'rectification'; reason?: string }) =>
      this.req<DataRequest>('/api/v1/settings/data-requests', { method: 'POST', body: JSON.stringify(b) }),
  };

  network = {
    sendRequest: (b: { recipientId: string; message?: string }) =>
      this.req<ConnectionRequest>('/api/v1/network/requests', { method: 'POST', body: JSON.stringify(b) }),
    incoming: (q?: { status?: ConnectionRequestStatus; limit?: number }) => {
      const params = new URLSearchParams();
      if (q?.status) params.set('status', q.status);
      if (q?.limit)  params.set('limit', String(q.limit));
      const qs = params.toString();
      return this.req<ConnectionRequest[]>(`/api/v1/network/requests/incoming${qs ? `?${qs}` : ''}`);
    },
    outgoing: (q?: { status?: ConnectionRequestStatus; limit?: number }) => {
      const params = new URLSearchParams();
      if (q?.status) params.set('status', q.status);
      if (q?.limit)  params.set('limit', String(q.limit));
      const qs = params.toString();
      return this.req<ConnectionRequest[]>(`/api/v1/network/requests/outgoing${qs ? `?${qs}` : ''}`);
    },
    respond: (id: string, decision: 'accept'|'decline') =>
      this.req<ConnectionRequest>(`/api/v1/network/requests/${encodeURIComponent(id)}/respond`, { method: 'POST', body: JSON.stringify({ decision }) }),
    withdraw: (id: string) =>
      this.req<ConnectionRequest>(`/api/v1/network/requests/${encodeURIComponent(id)}`, { method: 'DELETE' }),

    listConnections: (limit = 100) => this.req<Connection[]>(`/api/v1/network/connections?limit=${limit}`),
    countConnections: () => this.req<{ count: number }>('/api/v1/network/connections/count'),
    removeConnection: (id: string) => this.req<{ removed: boolean }>(`/api/v1/network/connections/${encodeURIComponent(id)}`, { method: 'DELETE' }),

    degree: (id: string) => this.req<Degree>(`/api/v1/network/degree/${encodeURIComponent(id)}`),
    mutuals: (id: string, limit = 20) => this.req<{ user_id: string }[]>(`/api/v1/network/mutuals/${encodeURIComponent(id)}?limit=${limit}`),
    suggestions: (q?: { limit?: number; maxDegree?: 2|3 }) => {
      const params = new URLSearchParams();
      if (q?.limit) params.set('limit', String(q.limit));
      if (q?.maxDegree) params.set('maxDegree', String(q.maxDegree));
      const qs = params.toString();
      return this.req<Suggestion[]>(`/api/v1/network/suggestions${qs ? `?${qs}` : ''}`);
    },

    block:   (id: string, reason?: string) => this.req<unknown>(`/api/v1/network/blocks/${encodeURIComponent(id)}`, { method: 'POST', body: JSON.stringify({ reason }) }),
    unblock: (id: string) => this.req<unknown[]>(`/api/v1/network/blocks/${encodeURIComponent(id)}`, { method: 'DELETE' }),
    blocks:  () => this.req<Block[]>('/api/v1/network/blocks'),
    recompute: () => this.req<{ ok: boolean }>('/api/v1/network/recompute', { method: 'POST' }),
  };

  profiles = {
    get: (identityId: string) => this.req<ProfileFull>(`/api/v1/profiles/${encodeURIComponent(identityId)}`),
    updateMine: (patch: Partial<ProfileExtended>) =>
      this.req<ProfileExtended>('/api/v1/profiles/me', { method: 'PATCH', body: JSON.stringify(patch) }),
    addExperience: (b: ProfileExperienceInput) =>
      this.req<ProfileExperience[]>('/api/v1/profiles/me/experience', { method: 'POST', body: JSON.stringify(b) }),
    removeExperience: (id: string) =>
      this.req<ProfileExperience[]>(`/api/v1/profiles/me/experience/${encodeURIComponent(id)}`, { method: 'DELETE' }),
    addEducation: (b: ProfileEducationInput) =>
      this.req<ProfileEducation[]>('/api/v1/profiles/me/education', { method: 'POST', body: JSON.stringify(b) }),
    addSkill: (b: { skill: string; level?: 'beginner'|'intermediate'|'expert' }) =>
      this.req<ProfileSkill[]>('/api/v1/profiles/me/skills', { method: 'POST', body: JSON.stringify(b) }),
    removeSkill: (id: string) =>
      this.req<ProfileSkill[]>(`/api/v1/profiles/me/skills/${encodeURIComponent(id)}`, { method: 'DELETE' }),
    endorse: (identityId: string, skillId: string) =>
      this.req<ProfileSkill>(`/api/v1/profiles/${encodeURIComponent(identityId)}/skills/${encodeURIComponent(skillId)}/endorse`, { method: 'POST' }),
    addPortfolio: (b: ProfilePortfolioInput) =>
      this.req<ProfilePortfolio[]>('/api/v1/profiles/me/portfolio', { method: 'POST', body: JSON.stringify(b) }),
    updatePortfolio: (id: string, b: Partial<ProfilePortfolioInput>) =>
      this.req<ProfilePortfolio>(`/api/v1/profiles/me/portfolio/${encodeURIComponent(id)}`, { method: 'PATCH', body: JSON.stringify(b) }),
    removePortfolio: (id: string) =>
      this.req<ProfilePortfolio[]>(`/api/v1/profiles/me/portfolio/${encodeURIComponent(id)}`, { method: 'DELETE' }),
    listReviews: (identityId: string) =>
      this.req<ProfileReview[]>(`/api/v1/profiles/${encodeURIComponent(identityId)}/reviews`),
    addReview: (b: { subjectId: string; rating: 1|2|3|4|5; body?: string; context?: 'project'|'gig'|'service'|'job'; contextId?: string }) =>
      this.req<ProfileReview>('/api/v1/profiles/reviews', { method: 'POST', body: JSON.stringify(b) }),
    listVerifications: () => this.req<ProfileVerification[]>('/api/v1/profiles/me/verifications'),
    requestVerification: (b: { kind: ProfileVerificationKind; evidenceUrl?: string }) =>
      this.req<ProfileVerification>('/api/v1/profiles/me/verifications', { method: 'POST', body: JSON.stringify(b) }),
    listBadges: (identityId: string) =>
      this.req<ProfileBadge[]>(`/api/v1/profiles/${encodeURIComponent(identityId)}/badges`),
    getReputation: (identityId: string) =>
      this.req<ProfileReputation | null>(`/api/v1/profiles/${encodeURIComponent(identityId)}/reputation`),
    recomputeReputation: () =>
      this.req<ProfileReputation>('/api/v1/profiles/me/reputation/recompute', { method: 'POST' }),
  };

  companies = {
    list: (q?: { q?: string; industry?: string; page?: number; pageSize?: number }) => {
      const p = new URLSearchParams();
      if (q?.q) p.set('q', q.q);
      if (q?.industry) p.set('industry', q.industry);
      if (q?.page) p.set('page', String(q.page));
      if (q?.pageSize) p.set('pageSize', String(q.pageSize));
      const qs = p.toString();
      return this.req<{ items: Company[]; total: number }>(`/api/v1/companies${qs ? `?${qs}` : ''}`);
    },
    get: (idOrSlug: string) => this.req<CompanyDetail>(`/api/v1/companies/${encodeURIComponent(idOrSlug)}`),
    create: (b: Partial<Company> & { slug: string; name: string }) =>
      this.req<Company>('/api/v1/companies', { method: 'POST', body: JSON.stringify(b) }),
    update: (id: string, b: Partial<Company>) =>
      this.req<Company>(`/api/v1/companies/${encodeURIComponent(id)}`, { method: 'PATCH', body: JSON.stringify(b) }),
    archive: (id: string) =>
      this.req<Company>(`/api/v1/companies/${encodeURIComponent(id)}`, { method: 'DELETE' }),

    listMembers: (id: string) => this.req<CompanyMember[]>(`/api/v1/companies/${encodeURIComponent(id)}/members`),
    invite: (id: string, b: { identityId: string; role?: CompanyMemberRole; title?: string; isPublic?: boolean }) =>
      this.req<CompanyMember[]>(`/api/v1/companies/${encodeURIComponent(id)}/members`, { method: 'POST', body: JSON.stringify(b) }),
    setMemberRole: (id: string, identityId: string, role: CompanyMemberRole) =>
      this.req<CompanyMember>(`/api/v1/companies/${encodeURIComponent(id)}/members/${encodeURIComponent(identityId)}`, { method: 'PATCH', body: JSON.stringify({ role }) }),
    removeMember: (id: string, identityId: string) =>
      this.req<CompanyMember[]>(`/api/v1/companies/${encodeURIComponent(id)}/members/${encodeURIComponent(identityId)}`, { method: 'DELETE' }),

    listLocations: (id: string) => this.req<CompanyLocation[]>(`/api/v1/companies/${encodeURIComponent(id)}/locations`),
    addLocation: (id: string, b: { label: string; city?: string; country?: string; isHq?: boolean; position?: number }) =>
      this.req<CompanyLocation[]>(`/api/v1/companies/${encodeURIComponent(id)}/locations`, { method: 'POST', body: JSON.stringify(b) }),
    removeLocation: (id: string, locId: string) =>
      this.req<CompanyLocation[]>(`/api/v1/companies/${encodeURIComponent(id)}/locations/${encodeURIComponent(locId)}`, { method: 'DELETE' }),

    listLinks: (id: string) => this.req<CompanyLink[]>(`/api/v1/companies/${encodeURIComponent(id)}/links`),
    upsertLink: (id: string, b: { kind: CompanyLinkKind; url: string; position?: number }) =>
      this.req<CompanyLink[]>(`/api/v1/companies/${encodeURIComponent(id)}/links`, { method: 'POST', body: JSON.stringify(b) }),
    removeLink: (id: string, kind: CompanyLinkKind) =>
      this.req<CompanyLink[]>(`/api/v1/companies/${encodeURIComponent(id)}/links/${encodeURIComponent(kind)}`, { method: 'DELETE' }),

    follow: (id: string) =>
      this.req<{ following: boolean; followerCount: number }>(`/api/v1/companies/${encodeURIComponent(id)}/follow`, { method: 'POST' }),
    unfollow: (id: string) =>
      this.req<{ following: boolean; followerCount: number }>(`/api/v1/companies/${encodeURIComponent(id)}/follow`, { method: 'DELETE' }),

    listPosts: (id: string) => this.req<CompanyPost[]>(`/api/v1/companies/${encodeURIComponent(id)}/posts`),
    addPost: (id: string, b: { body: string; media?: Record<string, unknown>[]; status?: 'draft'|'published'|'archived' }) =>
      this.req<CompanyPost>(`/api/v1/companies/${encodeURIComponent(id)}/posts`, { method: 'POST', body: JSON.stringify(b) }),
    updatePost: (id: string, postId: string, b: { body?: string; status?: 'draft'|'published'|'archived' }) =>
      this.req<CompanyPost>(`/api/v1/companies/${encodeURIComponent(id)}/posts/${encodeURIComponent(postId)}`, { method: 'PATCH', body: JSON.stringify(b) }),
    removePost: (id: string, postId: string) =>
      this.req<CompanyPost[]>(`/api/v1/companies/${encodeURIComponent(id)}/posts/${encodeURIComponent(postId)}`, { method: 'DELETE' }),

    getBrand: (id: string) => this.req<CompanyBrand | null>(`/api/v1/companies/${encodeURIComponent(id)}/brand`),
    setBrand: (id: string, b: Partial<CompanyBrand>) =>
      this.req<CompanyBrand>(`/api/v1/companies/${encodeURIComponent(id)}/brand`, { method: 'PATCH', body: JSON.stringify(b) }),
  };

  feed = {
    home: (q?: { limit?: number; reason?: 'follow'|'recommended'|'trending'|'opportunity' }) => {
      const params = new URLSearchParams();
      if (q?.limit)  params.set('limit', String(q.limit));
      if (q?.reason) params.set('reason', q.reason);
      const qs = params.toString();
      return this.req<FeedItem[]>(`/api/v1/feed/home${qs ? `?${qs}` : ''}`);
    },
    createPost: (b: { kind: PostKind; body: string; visibility?: PostVisibility; tags?: string[]; media?: unknown[]; link?: unknown; poll?: unknown; opportunity?: unknown; orgId?: string; language?: string }) =>
      this.req<Post>('/api/v1/feed/posts', { method: 'POST', body: JSON.stringify(b) }),
    getPost: (id: string) => this.req<Post>(`/api/v1/feed/posts/${encodeURIComponent(id)}`),
    updatePost: (id: string, b: { body?: string; visibility?: PostVisibility; tags?: string[] }) =>
      this.req<Post>(`/api/v1/feed/posts/${encodeURIComponent(id)}`, { method: 'PUT', body: JSON.stringify(b) }),
    archivePost: (id: string) =>
      this.req<{ id: string }[]>(`/api/v1/feed/posts/${encodeURIComponent(id)}`, { method: 'DELETE' }),
    authorTimeline: (id: string, limit = 20) =>
      this.req<Post[]>(`/api/v1/feed/authors/${encodeURIComponent(id)}/timeline?limit=${limit}`),
    react: (id: string, kind: ReactionKind) =>
      this.req<{ reaction_count: number }>(`/api/v1/feed/posts/${encodeURIComponent(id)}/reactions`, { method: 'POST', body: JSON.stringify({ kind }) }),
    unreact: (id: string) =>
      this.req<{ reaction_count: number }>(`/api/v1/feed/posts/${encodeURIComponent(id)}/reactions`, { method: 'DELETE' }),
    listComments: (id: string, limit = 50) =>
      this.req<PostComment[]>(`/api/v1/feed/posts/${encodeURIComponent(id)}/comments?limit=${limit}`),
    comment: (id: string, b: { body: string; parentId?: string }) =>
      this.req<PostComment>(`/api/v1/feed/posts/${encodeURIComponent(id)}/comments`, { method: 'POST', body: JSON.stringify(b) }),
    toggleSave: (id: string) =>
      this.req<{ saved: boolean }>(`/api/v1/feed/posts/${encodeURIComponent(id)}/saves`, { method: 'POST' }),
    listSaves: () => this.req<Post[]>('/api/v1/feed/saves'),
    follow: (id: string)   => this.req<unknown[]>(`/api/v1/feed/follows/${encodeURIComponent(id)}`, { method: 'POST' }),
    unfollow: (id: string) => this.req<unknown[]>(`/api/v1/feed/follows/${encodeURIComponent(id)}`, { method: 'DELETE' }),
    isFollowing: (id: string) => this.req<{ following: boolean }>(`/api/v1/feed/follows/${encodeURIComponent(id)}/check`),
    opportunityCards: (q?: { kind?: 'job'|'gig'|'service'|'project'|'event'; limit?: number }) => {
      const params = new URLSearchParams();
      if (q?.kind)  params.set('kind', q.kind);
      if (q?.limit) params.set('limit', String(q.limit));
      const qs = params.toString();
      return this.req<OpportunityCard[]>(`/api/v1/feed/opportunity-cards${qs ? `?${qs}` : ''}`);
    },
  };

  notifications = {
    list: (q: { unreadOnly?: boolean; topic?: string; status?: NotificationStatus; limit?: number; cursor?: string } = {}) => {
      const params = new URLSearchParams();
      if (q.unreadOnly) params.set('unreadOnly', 'true');
      if (q.topic)      params.set('topic', q.topic);
      if (q.status)     params.set('status', q.status);
      if (q.limit)      params.set('limit', String(q.limit));
      if (q.cursor)     params.set('cursor', q.cursor);
      const qs = params.toString();
      return this.req<Notification[]>(`/api/v1/notifications${qs ? `?${qs}` : ''}`);
    },
    unreadCount: () => this.req<{ count: number }>('/api/v1/notifications/unread-count'),
    create: (b: CreateNotificationInput) =>
      this.req<Notification>('/api/v1/notifications', { method: 'POST', body: JSON.stringify(b) }),
    markRead: (ids: string[]) =>
      this.req<{ updated: number; unreadCount: number }>('/api/v1/notifications/mark-read', { method: 'POST', body: JSON.stringify({ ids }) }),
    markAllRead: () =>
      this.req<{ updated: number; unreadCount: number }>('/api/v1/notifications/mark-all-read', { method: 'POST' }),
    dismiss: (id: string) =>
      this.req<Notification>(`/api/v1/notifications/${encodeURIComponent(id)}/dismiss`, { method: 'POST' }),
    deliveries: (id: string) =>
      this.req<NotificationDelivery[]>(`/api/v1/notifications/${encodeURIComponent(id)}/deliveries`),
    listPreferences: () => this.req<NotificationPreference[]>('/api/v1/notifications/prefs'),
    upsertPreference: (b: UpsertNotificationPreferenceInput) =>
      this.req<NotificationPreference>('/api/v1/notifications/prefs', { method: 'POST', body: JSON.stringify(b) }),
    listDevices: () => this.req<DeviceToken[]>('/api/v1/notifications/devices'),
    registerDevice: (b: { platform: 'web'|'ios'|'android'|'flutter'; token: string; label?: string }) =>
      this.req<DeviceToken>('/api/v1/notifications/devices', { method: 'POST', body: JSON.stringify(b) }),
    revokeDevice: (token: string) =>
      this.req<{ ok: true }>(`/api/v1/notifications/devices/${encodeURIComponent(token)}`, { method: 'DELETE' }),
    badges: () => this.req<BadgeCounter[]>('/api/v1/notifications/badges'),
    activity: (limit = 50) => this.req<ActivityEvent[]>(`/api/v1/notifications/activity?limit=${limit}`),
    emitActivity: (b: EmitActivityInput) =>
      this.req<ActivityEvent>('/api/v1/notifications/activity', { method: 'POST', body: JSON.stringify(b) }),
    listWebhooks: () => this.req<WebhookSubscription[]>('/api/v1/notifications/webhooks'),
    createWebhook: (b: { topicPattern: string; url: string }) =>
      this.req<WebhookSubscription & { secret: string }>('/api/v1/notifications/webhooks', { method: 'POST', body: JSON.stringify(b) }),
    revokeWebhook: (id: string) =>
      this.req<{ id: string }[]>(`/api/v1/notifications/webhooks/${encodeURIComponent(id)}`, { method: 'DELETE' }),
  };
}

// ---------- Notifications contracts (Domain 07) ----------
export type NotificationChannel = 'in_app'|'email'|'push'|'sms'|'webhook'|'slack';
export type NotificationPriority = 'low'|'normal'|'high'|'urgent';
export type NotificationStatus =
  | 'pending'|'queued'|'sent'|'delivered'|'read'|'dismissed'|'failed'|'suppressed';
export type DeliveryStatus = 'pending'|'sent'|'delivered'|'failed'|'bounced'|'dropped';

export interface Notification {
  id: string;
  identityId: string;
  topic: string;
  title: string;
  body: string | null;
  priority: NotificationPriority;
  status: NotificationStatus;
  entityType: string | null;
  entityId: string | null;
  actionUrl: string | null;
  category: string | null;
  groupKey: string | null;
  data: Record<string, unknown>;
  createdAt: string;
  readAt: string | null;
  dismissedAt: string | null;
  expiresAt: string | null;
}
export interface CreateNotificationInput {
  identityId: string;
  topic: string;
  title: string;
  body?: string;
  priority?: NotificationPriority;
  entityType?: string;
  entityId?: string;
  actionUrl?: string;
  category?: string;
  groupKey?: string;
  data?: Record<string, unknown>;
  channels?: NotificationChannel[];
}
export interface NotificationDelivery {
  id: string;
  notificationId: string;
  channel: NotificationChannel;
  status: DeliveryStatus;
  provider: string | null;
  providerMsgId: string | null;
  attempts: number;
  lastAttemptAt: string | null;
  deliveredAt: string | null;
  error: string | null;
  payload: Record<string, unknown>;
}
export interface NotificationPreference {
  id: string;
  identityId: string;
  topic: string;
  channels: NotificationChannel[];
  quietHours: Record<string, unknown>;
  digest: 'realtime'|'hourly'|'daily'|'off';
  updatedAt: string;
}
export interface UpsertNotificationPreferenceInput {
  topic: string;
  channels: NotificationChannel[];
  digest?: 'realtime'|'hourly'|'daily'|'off';
  quietHours?: Record<string, unknown>;
}
export interface DeviceToken {
  id: string;
  identityId: string;
  platform: 'web'|'ios'|'android'|'flutter';
  token: string;
  label: string | null;
  lastSeenAt: string;
  revokedAt: string | null;
}
export interface BadgeCounter {
  id: string;
  identityId: string;
  surfaceKey: string;
  count: number;
  variant: 'default'|'warning'|'urgent';
  updatedAt: string;
}
export interface ActivityEvent {
  id: string;
  actorId: string | null;
  identityId: string | null;
  topic: string;
  verb: string;
  entityType: string;
  entityId: string;
  surfaceKeys: string[];
  data: Record<string, unknown>;
  occurredAt: string;
}
export interface EmitActivityInput {
  topic: string;
  verb: string;
  entityType: string;
  entityId: string;
  identityId?: string;
  surfaceKeys?: string[];
  data?: Record<string, unknown>;
}
export interface WebhookSubscription {
  id: string;
  identityId: string | null;
  topicPattern: string;
  url: string;
  active: boolean;
  createdAt: string;
  lastDeliveredAt: string | null;
  failureCount: number;
}

// ---------- Overlays contracts (Domain 06) ----------
export type OverlayKind =
  | 'modal'|'drawer'|'sheet'|'popover'|'hovercard'|'toast'|'wizard'
  | 'inspector'|'detached_window'|'quick_preview'|'confirmation';
export type OverlayStatus =
  | 'pending'|'open'|'dismissed'|'completed'|'expired'|'failed'|'escalated';
export type OverlayOrigin = 'user'|'system'|'workflow'|'notification'|'deeplink'|'admin';
export type OverlayWorkflowTemplate =
  | 'purchase_followup'|'mfa_recovery'|'onboarding_continue'|'publish_object';
export type OverlayWorkflowStatus =
  | 'draft'|'active'|'paused'|'completed'|'failed'|'cancelled'|'expired';

export interface OverlaySession {
  id: string;
  identityId: string | null;
  kind: OverlayKind;
  surfaceKey: string;
  status: OverlayStatus;
  origin: OverlayOrigin;
  route: string | null;
  entityType: string | null;
  entityId: string | null;
  payload: Record<string, unknown>;
  result: Record<string, unknown> | null;
  openedAt: string;
  closedAt: string | null;
  expiresAt: string | null;
}
export interface OpenOverlayInput {
  kind: OverlayKind; surfaceKey: string; route?: string;
  entityType?: string; entityId?: string;
  payload?: Record<string, unknown>; origin?: OverlayOrigin;
}
export interface PatchOverlayInput {
  payload?: Record<string, unknown>;
  status?: OverlayStatus;
  result?: Record<string, unknown>;
}
export interface OverlayWorkflowStep {
  id: string; workflowId: string; stepKey: string;
  position: number; status: OverlayStatus;
  data: Record<string, unknown>;
  enteredAt: string | null; exitedAt: string | null;
}
export interface OverlayWorkflow {
  id: string;
  identityId: string;
  templateKey: OverlayWorkflowTemplate;
  status: OverlayWorkflowStatus;
  currentStep: string;
  totalSteps: number;
  context: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
  completedAt: string | null;
  steps?: OverlayWorkflowStep[];
}
export interface DetachedWindow {
  id: string;
  identityId: string;
  channelKey: string;
  surfaceKey: string;
  route: string;
  state: Record<string, unknown>;
  openedAt: string;
  lastPingAt: string;
  closedAt: string | null;
}

// ---------- Marketing contracts ----------
export type MarketingPageStatus = 'draft'|'scheduled'|'published'|'archived';
export type MarketingSurface = 'showcase'|'landing'|'pricing'|'about'|'legal'|'solution'|'industry';
export type LeadStatus = 'new'|'qualified'|'nurturing'|'converted'|'disqualified';
export type NewsletterStatus = 'pending'|'confirmed'|'unsubscribed'|'bounced';
export type CtaEventType = 'impression'|'click'|'convert';

export interface MarketingPage {
  id: string; slug: string; surface: MarketingSurface; title: string;
  tagline?: string | null; description?: string | null; heroImage?: string | null;
  body?: Record<string, unknown>; seo?: Record<string, unknown>;
  status: MarketingPageStatus; publishedAt?: string | null; locale: string;
  version: number; updatedAt: string;
}
export interface UpsertMarketingPage {
  slug: string; surface: MarketingSurface; title: string;
  tagline?: string; description?: string; heroImage?: string;
  body?: Record<string, unknown>; seo?: Record<string, unknown>;
  status?: MarketingPageStatus; locale?: string;
}
export interface CreateLead {
  email: string; fullName?: string; company?: string; role?: string; useCase?: string;
  sourcePage?: string; sourceCta?: string;
  utm?: Record<string, unknown>; consent?: Record<string, unknown>;
}
export interface MarketingLead {
  id: string; email: string; fullName?: string | null; company?: string | null;
  role?: string | null; sourcePage?: string | null; status: LeadStatus; score: number; createdAt: string;
}
export interface NewsletterSubscribe {
  email: string; topics?: string[]; source?: string; utm?: Record<string, unknown>;
}
export interface CtaVariant { id: string; label: string; payload: Record<string, unknown>; weight: number; }
export interface CtaExperiment { id: string; key: string; name: string; status: 'draft'|'running'|'paused'|'completed'; variants: CtaVariant[]; }
export interface CtaEventInput {
  experimentKey: string; variantLabel?: string; eventType: CtaEventType;
  visitorId?: string; page?: string; meta?: Record<string, unknown>;
}
export interface CtaSummaryRow { variantId: string; label: string; impressions: number; clicks: number; conversions: number; }

// ---------- Identity contracts (Domain 03) ----------
export type IdentityStatus = 'active' | 'pending' | 'locked' | 'suspended' | 'deleted';
export type MfaFactorType = 'totp' | 'sms' | 'webauthn';
export type OnboardingStatus = 'not_started' | 'in_progress' | 'completed' | 'skipped';
export type VerificationKind =
  | 'id_document' | 'address' | 'company' | 'badge_professional' | 'badge_enterprise';
export type VerificationStatus = 'pending' | 'approved' | 'rejected' | 'escalated';
export type RiskBand = 'low' | 'medium' | 'high';

export interface IdentityUser {
  id: string;
  email: string;
  emailVerified: boolean;
  displayName?: string | null;
  status: IdentityStatus;
}
export interface IdentityAuthResult {
  user: IdentityUser;
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  riskBand?: RiskBand;
  mfaRequired?: boolean;
}
export interface IdentitySession {
  id: string;
  deviceLabel: string | null;
  ip: string | null;
  userAgent: string | null;
  riskBand: RiskBand;
  createdAt: string;
  lastSeenAt: string;
  current: boolean;
}
export interface MfaFactor {
  id: string;
  type: MfaFactorType;
  label: string | null;
  verified: boolean;
  createdAt: string;
}
export interface OnboardingProgress {
  identityId: string;
  status: OnboardingStatus;
  currentStep: string | null;
  payload: Record<string, unknown>;
  startedAt: string;
  completedAt: string | null;
}
export interface IdentityVerification {
  id: string;
  identityId: string;
  kind: VerificationKind;
  status: VerificationStatus;
  evidence: Record<string, unknown>;
  decidedAt: string | null;
  reviewerNote: string | null;
}

export interface Habit { id: string; name: string; description: string; color: string; position: number; createdAt: string; }
export interface NewHabit { name: string; description?: string; color?: string; }
export interface HabitLog { id: string; habitId: string; date: string; }
export interface Profile { id: string; displayName: string | null; avatarUrl: string | null; }

// ---------- Shell / workspace contracts ----------
export type OrgPlan = 'free' | 'pro' | 'team' | 'enterprise';
export type OrgRole = 'owner' | 'admin' | 'member' | 'viewer' | 'guest';
export type RecentKind = 'page'|'profile'|'project'|'job'|'gig'|'service'|'message'|'order'|'event'|'group';

export interface Org {
  id: string; slug: string; name: string; logoUrl?: string | null;
  plan: OrgPlan; status: 'active'|'paused'|'archived'|'suspended'; role: OrgRole;
}
export interface SavedView {
  id: string; label: string; route: string; icon?: string | null;
  pinned: boolean; position: number; filters?: Record<string, unknown>;
}
export interface RecentItem {
  id: string; kind: RecentKind; label: string; route: string;
  meta?: Record<string, unknown>; visitedAt: string;
}
export interface ShellPrefs {
  userId: string;
  activeRole: string;
  activeOrgId: string | null;
  sidebarCollapsed: boolean;
  rightRailOpen: boolean;
  density: 'compact' | 'comfortable' | 'cozy';
  theme: 'light' | 'dark' | 'system';
  shortcuts: Record<string, unknown>;
}
export interface ShellBootstrap {
  orgs: Org[];
  prefs: ShellPrefs;
  savedViews: SavedView[];
  recents: RecentItem[];
  nav: unknown;
  version: number;
}

// ---------- Settings contracts (Domain 08) ----------
export type SettingNamespace = 'general'|'locale'|'accessibility'|'privacy'|'profile'|'connections';
export type SettingScope = 'user'|'org'|'device';
export interface Setting {
  id: string;
  identityId: string | null;
  orgId: string | null;
  scope: SettingScope;
  namespace: SettingNamespace;
  key: string;
  value: unknown;
  updatedAt: string;
  updatedBy: string | null;
}
export interface Locale {
  code: string;
  label: string;
  nativeLabel: string;
  enabled: boolean;
  rtl: boolean;
}
export interface Timezone {
  code: string;
  label: string;
  utcOffset: string;
  enabled: boolean;
}
export interface ConnectedAccount {
  id: string;
  identityId: string;
  provider: string;
  externalId: string;
  displayName: string | null;
  scopes: string[];
  connectedAt: string;
  lastUsedAt: string | null;
  revokedAt: string | null;
  metadata: Record<string, unknown>;
}
export interface SettingsAuditEntry {
  id: string;
  identityId: string;
  actorId: string | null;
  namespace: SettingNamespace;
  key: string;
  oldValue: unknown;
  newValue: unknown;
  source: 'web'|'mobile'|'admin'|'api';
  occurredAt: string;
}
export type DataRequestKind = 'export'|'erasure'|'rectification';
export type DataRequestStatus = 'pending'|'processing'|'ready'|'delivered'|'failed'|'cancelled';
export interface DataRequest {
  id: string;
  identityId: string;
  kind: DataRequestKind;
  status: DataRequestStatus;
  requestedAt: string;
  completedAt: string | null;
  downloadUrl: string | null;
  reason: string | null;
}

// ───────── Domain 11 — Profiles, Identity & Reputation ─────────
export type ProfileVisibility = 'public'|'network'|'private';
export type ProfileStatus = 'active'|'paused'|'archived';
export type SkillLevel = 'beginner'|'intermediate'|'expert';
export type PortfolioStatus = 'draft'|'published'|'archived';
export type ProfileVerificationKind = 'email'|'phone'|'id_document'|'company'|'linkedin'|'github';
export type ProfileVerificationStatus = 'pending'|'active'|'failed'|'expired'|'revoked';
export type ReputationBand = 'new'|'rising'|'trusted'|'top';

export interface ProfileExtended {
  identityId: string;
  handle: string;
  displayName: string;
  headline?: string;
  summary?: string;
  location?: string;
  website?: string | null;
  coverUrl?: string | null;
  avatarUrl?: string | null;
  pronouns?: string;
  openToWork?: boolean;
  openToFreelance?: boolean;
  openToMentoring?: boolean;
  hourlyRateCents?: number;
  currency?: string;
  timezone?: string;
  visibility: ProfileVisibility;
  status: ProfileStatus;
  createdAt: string;
  updatedAt: string;
}

export interface ProfileExperienceInput {
  title: string; company: string; location?: string;
  startDate: string; endDate?: string | null;
  isCurrent?: boolean; description?: string; position?: number;
}
export interface ProfileExperience extends ProfileExperienceInput { id: string; }

export interface ProfileEducationInput {
  institution: string; degree?: string; field?: string;
  startYear?: number; endYear?: number; position?: number;
}
export interface ProfileEducation extends ProfileEducationInput { id: string; }

export interface ProfileSkill {
  id: string; skill: string; level: SkillLevel;
  endorsementCount: number; position: number;
}

export interface ProfilePortfolioInput {
  title: string; description?: string;
  coverUrl?: string | null; externalUrl?: string | null;
  media?: Record<string, unknown>[]; tags?: string[];
  status?: PortfolioStatus; position?: number;
}
export interface ProfilePortfolio extends ProfilePortfolioInput { id: string; }

export interface ProfileReview {
  id: string; subjectId: string; reviewerId: string;
  rating: 1|2|3|4|5; body: string;
  context?: 'project'|'gig'|'service'|'job'; contextId?: string;
  status: 'pending'|'published'|'flagged'|'removed';
  createdAt: string;
}

export interface ProfileBadge {
  id: string; code: string; label: string;
  awardedAt: string; expiresAt?: string | null;
  meta?: Record<string, unknown>;
}

export interface ProfileVerification {
  id: string; kind: ProfileVerificationKind; status: ProfileVerificationStatus;
  evidenceUrl?: string; verifiedAt?: string; expiresAt?: string;
  reviewerId?: string; notes?: string; createdAt: string;
}

export interface ProfileReputation {
  identityId: string; score: number; band: ReputationBand;
  components: { reviews: number; completion: number; verifications: number; activity: number; endorsements: number };
  computedAt: string;
}

export interface ProfileFull {
  profile: ProfileExtended;
  tabs: {
    overview: { headline?: string; summary?: string };
    activity: unknown[];
    services: unknown[];
    gigs: unknown[];
    projects: unknown[];
    reviews: ProfileReview[];
    media: ProfilePortfolio[];
    experience: ProfileExperience[];
    education: ProfileEducation[];
    skills: ProfileSkill[];
    endorsements: { skillId: string; endorserId: string }[];
  };
  badges: ProfileBadge[];
  verifications: ProfileVerification[];
  reputation: ProfileReputation | null;
}

// ───────── Domain 12 — Companies, Employer Presence, Brand ─────────
export type CompanyVisibility = 'public'|'unlisted'|'private';
export type CompanyStatus = 'draft'|'active'|'paused'|'archived';
export type CompanyMemberRole = 'owner'|'admin'|'recruiter'|'editor'|'employee';
export type CompanyLinkKind = 'linkedin'|'twitter'|'github'|'careers'|'press';

export interface Company {
  id: string; slug: string; name: string;
  tagline?: string; about?: string; industry?: string;
  sizeBand?: '1-10'|'11-50'|'51-200'|'201-1000'|'1001-5000'|'5000+';
  foundedYear?: number; headquarters?: string; website?: string;
  logoUrl?: string | null; coverUrl?: string | null; brandColor?: string;
  visibility: CompanyVisibility; status: CompanyStatus; verified: boolean;
  followerCount: number; employeeCount: number; openRolesCount: number;
  createdBy: string; createdAt: string; updatedAt: string;
}
export interface CompanyMember {
  id: string; companyId: string; identityId: string;
  role: CompanyMemberRole; title?: string;
  isPublic: boolean; status: 'active'|'invited'|'removed'; joinedAt: string;
}
export interface CompanyLocation { id: string; label: string; city?: string; country?: string; isHq: boolean; position: number; }
export interface CompanyLink { id: string; kind: CompanyLinkKind; url: string; position: number; }
export interface CompanyBrand {
  companyId: string; primaryColor?: string; secondaryColor?: string;
  textColor?: string; fontFamily?: string; heroUrl?: string | null;
  values: string[]; perks: string[]; updatedAt: string;
}
export interface CompanyPost {
  id: string; companyId: string; authorId: string;
  body: string; media: Record<string, unknown>[];
  status: 'draft'|'published'|'archived'; publishedAt: string; reactionCount: number;
}
export interface CompanyDetail {
  company: Company; members: CompanyMember[]; locations: CompanyLocation[];
  links: CompanyLink[]; brand: CompanyBrand | null; posts: CompanyPost[];
  viewer: { isFollowing: boolean; role: CompanyMemberRole | null };
}

declare module './index' {}

// Augment the client with a companies namespace via prototype patching style
// is not possible; consumers should access .companies on the GigvoraClient.
// (The runtime methods are added below by extending the class.)

// ───────── Domain 16 — Trust SDK namespace ─────────
// Re-export trust types so callers can `import type { TrustReview } from '@gigvora/sdk'`.
export type {
  TrustReview, TrustSummary, TrustScore, TrustSubjectKind,
  TrustReviewStatus, TrustBadgeKey,
} from './trust';
import type {
  TrustReview as _TR, TrustSummary as _TS, TrustScore as _TSc,
  TrustSubjectKind as _TSK, TrustReviewStatus as _TRStatus, TrustBadgeKey as _TBK,
} from './trust';

export interface TrustReference { id: string; refereeName: string; refereeEmail: string; refereeRole?: string; relationship?: string; status: 'pending'|'verified'|'expired'|'declined'; verifiedAt?: string; createdAt: string; body?: string; rating?: number }
export interface TrustVerification { id: string; kind: 'identity'|'email'|'phone'|'skills'|'background'|'portfolio'|'payment'|'address'; status: 'not_started'|'pending'|'verified'|'failed'; evidence?: Record<string, unknown>; verifiedAt?: string; createdAt: string }
export interface TrustBadge { id: string; subjectKind: _TSK; subjectId: string; key: _TBK; awardedAt: string; reason?: string }
export interface TrustModerationEntry { id: string; reviewId: string; action: 'hold'|'approve'|'reject'|'flag'|'restore'; actorId: string; notes?: string; createdAt: string }

// ───────── Domain 17 — Inbox SDK namespace ─────────
export type {
  InboxThread, InboxMessage, InboxThreadKind, InboxThreadState, InboxPriority,
  InboxMessageKind, InboxMessageStatus, InboxContextKind, InboxAttachment,
  InboxParticipant, InboxThreadContext, InboxUnreadDigest,
} from './inbox';
import type {
  InboxThread as _IT, InboxMessage as _IM, InboxThreadKind as _ITK,
  InboxThreadState as _ITS, InboxPriority as _IP, InboxUnreadDigest as _IUD,
  InboxContextKind as _ICK,
} from './inbox';

// Augment GigvoraClient with trust + inbox runtime namespaces via prototype.
// We declare merging here so TS surfaces `.trust.*` / `.inbox.*` on instances.
declare module './index' {
  interface GigvoraClient {
    trust: {
      listReviews: (q?: { subjectKind?: _TSK; subjectId?: string; authorId?: string; direction?: 'received'|'given'; status?: _TRStatus; minRating?: number; q?: string; page?: number; pageSize?: number; sort?: 'recent'|'rating'|'helpful' }) => Promise<{ items: _TR[]; total: number; page: number; pageSize: number; hasMore: boolean }>;
      getReview: (id: string) => Promise<_TR>;
      createReview: (b: { subjectKind: _TSK; subjectId: string; rating: number; title: string; body: string; pros?: string[]; cons?: string[]; projectRef?: string; contactEmail?: string }) => Promise<_TR>;
      updateReview: (id: string, b: Partial<{ rating: number; title: string; body: string; pros: string[]; cons: string[] }>) => Promise<_TR>;
      respond: (id: string, body: string) => Promise<_TR>;
      dispute: (id: string, reason: string) => Promise<_TR>;
      helpful: (id: string, helpful: boolean) => Promise<{ helpful: number; unhelpful: number }>;
      moderate: (id: string, action: 'hold'|'approve'|'reject'|'flag'|'restore', notes?: string) => Promise<_TR>;
      moderationLog: (q?: { limit?: number }) => Promise<TrustModerationEntry[]>;
      summary: (q: { subjectKind: _TSK; subjectId: string }) => Promise<_TS>;
      score: (q: { subjectKind: _TSK; subjectId: string }) => Promise<_TSc>;
      badges: (q: { subjectKind: _TSK; subjectId: string }) => Promise<TrustBadge[]>;
      awardBadge: (b: { subjectKind: _TSK; subjectId: string; badge: _TBK; reason?: string }) => Promise<TrustBadge>;
      listReferences: () => Promise<TrustReference[]>;
      requestReference: (b: { refereeName: string; refereeEmail: string; refereeRole?: string; relationship?: string; message?: string }) => Promise<TrustReference>;
      submitReference: (b: { token: string; body: string; rating?: number }) => Promise<TrustReference>;
      listVerifications: () => Promise<TrustVerification[]>;
      startVerification: (b: { kind: TrustVerification['kind']; evidence?: Record<string, unknown> }) => Promise<TrustVerification>;
    };
    inbox: {
      listThreads: (q?: { read?: 'all'|'unread'|'mentions'; state?: _ITS; kind?: _ITK; priority?: _IP; participantId?: string; q?: string; page?: number; pageSize?: number; sort?: 'recent'|'unread'|'priority' }) => Promise<{ items: _IT[]; total: number; page: number; pageSize: number; hasMore: boolean }>;
      getThread: (id: string) => Promise<_IT>;
      createThread: (b: { kind?: _ITK; title?: string; participantIds: string[]; contextKind?: _ICK; contextId?: string; initialMessage?: string }) => Promise<_IT>;
      setState: (id: string, state: _ITS) => Promise<_IT>;
      setPriority: (id: string, priority: _IP) => Promise<_IT>;
      listMessages: (threadId: string, q?: { cursor?: string; limit?: number; direction?: 'before'|'after' }) => Promise<{ items: _IM[]; nextCursor: string | null; hasMore: boolean }>;
      send: (threadId: string, b: { body?: string; kind?: _IM['kind']; attachments?: Array<{ name: string; size: number; mime: string; url?: string; storageKey?: string }>; replyToId?: string; payload?: Record<string, unknown>; clientNonce?: string }) => Promise<_IM>;
      edit: (threadId: string, messageId: string, body: string) => Promise<_IM>;
      remove: (threadId: string, messageId: string) => Promise<_IM>;
      react: (threadId: string, messageId: string, emoji: string) => Promise<_IM>;
      markRead: (threadId: string, uptoMessageId: string) => Promise<{ ok: true } | unknown>;
      mute: (threadId: string, muted: boolean) => Promise<unknown>;
      addParticipants: (threadId: string, participantIds: string[], role?: 'owner'|'member'|'guest'|'observer') => Promise<unknown>;
      removeParticipant: (threadId: string, userId: string) => Promise<unknown>;
      linkContext: (threadId: string, b: { kind: _ICK; id: string; label: string }) => Promise<_IT>;
      unlinkContext: (threadId: string, kind: _ICK, id: string) => Promise<_IT>;
      typing: (threadId: string, isTyping: boolean) => Promise<{ ok: true; recipients: string[] }>;
      presence: (userIds: string[]) => Promise<Array<{ userId: string; online: boolean; lastSeen: string | null }>>;
      sharedFiles: (threadId: string) => Promise<Array<{ id: string; name: string; size: number; mime: string; url?: string; messageId: string; sharedAt: string; byUserId: string }>>;
      search: (q: { q: string; threadId?: string; participantId?: string; limit?: number }) => Promise<Array<_IM & { threadTitle?: string }>>;
      unreadDigest: () => Promise<_IUD>;
      insights: () => Promise<Array<{ key: string; priority: 'low'|'medium'|'high'; title: string; action: string }>>;
    };
  }
}

// ── Runtime: attach trust + inbox namespaces to GigvoraClient.prototype ──
function _qs(q: Record<string, unknown> = {}): string {
  const usp = new URLSearchParams();
  for (const [k, v] of Object.entries(q)) {
    if (v == null || v === '') continue;
    usp.set(k, String(v));
  }
  const s = usp.toString();
  return s ? `?${s}` : '';
}

Object.defineProperty(GigvoraClient.prototype, 'trust', {
  get(this: GigvoraClient) {
    const self = this as unknown as { req: <T>(p: string, init?: RequestInit) => Promise<T> };
    return {
      listReviews: (q: any = {}) => self.req(`/api/v1/trust/reviews${_qs(q)}`),
      getReview: (id: string) => self.req(`/api/v1/trust/reviews/${encodeURIComponent(id)}`),
      createReview: (b: any) => self.req('/api/v1/trust/reviews', { method: 'POST', body: JSON.stringify(b) }),
      updateReview: (id: string, b: any) => self.req(`/api/v1/trust/reviews/${encodeURIComponent(id)}`, { method: 'PATCH', body: JSON.stringify(b) }),
      respond: (id: string, body: string) => self.req(`/api/v1/trust/reviews/${encodeURIComponent(id)}/response`, { method: 'POST', body: JSON.stringify({ body }) }),
      dispute: (id: string, reason: string) => self.req(`/api/v1/trust/reviews/${encodeURIComponent(id)}/dispute`, { method: 'POST', body: JSON.stringify({ reason }) }),
      helpful: (id: string, helpful: boolean) => self.req(`/api/v1/trust/reviews/${encodeURIComponent(id)}/helpful`, { method: 'POST', body: JSON.stringify({ helpful }) }),
      moderate: (id: string, action: string, notes?: string) => self.req(`/api/v1/trust/reviews/${encodeURIComponent(id)}/moderate`, { method: 'POST', body: JSON.stringify({ action, notes }) }),
      moderationLog: (q: any = {}) => self.req(`/api/v1/trust/moderation/log${_qs(q)}`),
      summary: (q: any) => self.req(`/api/v1/trust/summary${_qs(q)}`),
      score: (q: any) => self.req(`/api/v1/trust/score${_qs(q)}`),
      badges: (q: any) => self.req(`/api/v1/trust/badges${_qs(q)}`),
      awardBadge: (b: any) => self.req('/api/v1/trust/badges', { method: 'POST', body: JSON.stringify(b) }),
      listReferences: () => self.req('/api/v1/trust/references'),
      requestReference: (b: any) => self.req('/api/v1/trust/references', { method: 'POST', body: JSON.stringify(b) }),
      submitReference: (b: any) => self.req('/api/v1/trust/references/submit', { method: 'POST', body: JSON.stringify(b) }),
      listVerifications: () => self.req('/api/v1/trust/verifications'),
      startVerification: (b: any) => self.req('/api/v1/trust/verifications', { method: 'POST', body: JSON.stringify(b) }),
    };
  },
  configurable: true,
});

Object.defineProperty(GigvoraClient.prototype, 'inbox', {
  get(this: GigvoraClient) {
    const self = this as unknown as { req: <T>(p: string, init?: RequestInit) => Promise<T> };
    const enc = encodeURIComponent;
    return {
      listThreads: (q: any = {}) => self.req(`/api/v1/inbox/threads${_qs(q)}`),
      getThread: (id: string) => self.req(`/api/v1/inbox/threads/${enc(id)}`),
      createThread: (b: any) => self.req('/api/v1/inbox/threads', { method: 'POST', body: JSON.stringify(b) }),
      setState: (id: string, state: string) => self.req(`/api/v1/inbox/threads/${enc(id)}/state`, { method: 'PATCH', body: JSON.stringify({ state }) }),
      setPriority: (id: string, priority: string) => self.req(`/api/v1/inbox/threads/${enc(id)}/priority`, { method: 'PATCH', body: JSON.stringify({ priority }) }),
      listMessages: (id: string, q: any = {}) => self.req(`/api/v1/inbox/threads/${enc(id)}/messages${_qs(q)}`),
      send: (id: string, b: any) => self.req(`/api/v1/inbox/threads/${enc(id)}/messages`, { method: 'POST', body: JSON.stringify(b) }),
      edit: (id: string, messageId: string, body: string) => self.req(`/api/v1/inbox/threads/${enc(id)}/messages/${enc(messageId)}`, { method: 'PATCH', body: JSON.stringify({ body }) }),
      remove: (id: string, messageId: string) => self.req(`/api/v1/inbox/threads/${enc(id)}/messages/${enc(messageId)}`, { method: 'DELETE' }),
      react: (id: string, messageId: string, emoji: string) => self.req(`/api/v1/inbox/threads/${enc(id)}/messages/${enc(messageId)}/react`, { method: 'POST', body: JSON.stringify({ emoji }) }),
      markRead: (id: string, uptoMessageId: string) => self.req(`/api/v1/inbox/threads/${enc(id)}/read`, { method: 'POST', body: JSON.stringify({ uptoMessageId }) }),
      mute: (id: string, muted: boolean) => self.req(`/api/v1/inbox/threads/${enc(id)}/mute`, { method: 'POST', body: JSON.stringify({ muted }) }),
      addParticipants: (id: string, participantIds: string[], role = 'member') => self.req(`/api/v1/inbox/threads/${enc(id)}/participants`, { method: 'POST', body: JSON.stringify({ participantIds, role }) }),
      removeParticipant: (id: string, userId: string) => self.req(`/api/v1/inbox/threads/${enc(id)}/participants/${enc(userId)}`, { method: 'DELETE' }),
      linkContext: (id: string, b: any) => self.req(`/api/v1/inbox/threads/${enc(id)}/contexts`, { method: 'POST', body: JSON.stringify(b) }),
      unlinkContext: (id: string, kind: string, ctxId: string) => self.req(`/api/v1/inbox/threads/${enc(id)}/contexts/${enc(kind)}/${enc(ctxId)}`, { method: 'DELETE' }),
      typing: (id: string, isTyping: boolean) => self.req(`/api/v1/inbox/threads/${enc(id)}/typing`, { method: 'POST', body: JSON.stringify({ isTyping }) }),
      presence: (userIds: string[]) => self.req(`/api/v1/inbox/presence?userIds=${enc(userIds.join(','))}`),
      sharedFiles: (id: string) => self.req(`/api/v1/inbox/threads/${enc(id)}/files`),
      search: (q: any) => self.req(`/api/v1/inbox/search/messages${_qs(q)}`),
      unreadDigest: () => self.req('/api/v1/inbox/digest/unread'),
      insights: () => self.req('/api/v1/inbox/insights'),
    };
  },
  configurable: true,
});

Object.defineProperty(GigvoraClient.prototype, 'calls', {
  get(this: GigvoraClient) {
    const self = this as unknown as { req: <T>(p: string, init?: RequestInit) => Promise<T> };
    const enc = encodeURIComponent;
    return {
      list: (q: any = {}) => self.req(`/api/v1/calls${_qs(q)}`),
      get: (id: string) => self.req(`/api/v1/calls/${enc(id)}`),
      create: (b: any) => self.req('/api/v1/calls', { method: 'POST', body: JSON.stringify(b) }),
      update: (id: string, b: any) => self.req(`/api/v1/calls/${enc(id)}`, { method: 'PATCH', body: JSON.stringify(b) }),
      reschedule: (id: string, b: { scheduledAt: string; reason?: string }) => self.req(`/api/v1/calls/${enc(id)}/reschedule`, { method: 'POST', body: JSON.stringify(b) }),
      cancel: (id: string) => self.req(`/api/v1/calls/${enc(id)}/cancel`, { method: 'POST' }),
      end: (id: string, b: { durationSeconds: number; recordingUrl?: string }) => self.req(`/api/v1/calls/${enc(id)}/end`, { method: 'POST', body: JSON.stringify(b) }),
      presence: (userIds: string[]) => self.req(`/api/v1/calls/presence/snapshot?userIds=${enc(userIds.join(','))}`),
      setPresence: (b: { state: string; customStatus?: string; device?: string }) => self.req('/api/v1/calls/presence', { method: 'POST', body: JSON.stringify(b) }),
      listWindows: () => self.req('/api/v1/calls/windows/list'),
      upsertWindow: (id: string | null, b: any) => self.req(`/api/v1/calls/windows${id ? `/${enc(id)}` : ''}`, { method: id ? 'PATCH' : 'POST', body: JSON.stringify(b) }),
      deleteWindow: (id: string) => self.req(`/api/v1/calls/windows/${enc(id)}`, { method: 'DELETE' }),
      insights: () => self.req('/api/v1/calls/insights'),
      // ML
      scoreQuality: (b: { callId: string; bitrateKbps?: number; packetLossPct?: number; jitterMs?: number; rttMs?: number; durationSec?: number }) => self.req('/api/v1/calls/ml/score-quality', { method: 'POST', body: JSON.stringify(b) }),
      noShowRisk: (b: { appointmentId: string; minutesUntil: number; rescheduleCount?: number; inviteeConfirmed?: boolean; pastNoShows?: number }) => self.req('/api/v1/calls/ml/no-show-risk', { method: 'POST', body: JSON.stringify(b) }),
    };
  },
  configurable: true,
});

Object.defineProperty(GigvoraClient.prototype, 'booking', {
  get(this: GigvoraClient) {
    const self = this as unknown as { req: <T>(p: string, init?: RequestInit) => Promise<T> };
    const enc = encodeURIComponent;
    return {
      listLinks: () => self.req('/api/v1/booking/links'),
      getLink: (id: string) => self.req(`/api/v1/booking/links/${enc(id)}`),
      publicLink: (slug: string) => self.req(`/api/v1/booking/public/${enc(slug)}`),
      createLink: (b: any) => self.req('/api/v1/booking/links', { method: 'POST', body: JSON.stringify(b) }),
      updateLink: (id: string, b: any) => self.req(`/api/v1/booking/links/${enc(id)}`, { method: 'PATCH', body: JSON.stringify(b) }),
      archiveLink: (id: string) => self.req(`/api/v1/booking/links/${enc(id)}`, { method: 'DELETE' }),
      availability: (q: { linkId: string; from: string; to: string; inviteeTimezone?: string }) =>
        self.req(`/api/v1/booking/availability${_qs(q)}`),
      listAppointments: (q: any = {}) => self.req(`/api/v1/booking/appointments${_qs(q)}`),
      getAppointment: (id: string) => self.req(`/api/v1/booking/appointments/${enc(id)}`),
      book: (b: any) => self.req('/api/v1/booking/appointments', { method: 'POST', body: JSON.stringify(b) }),
      approve: (id: string) => self.req(`/api/v1/booking/appointments/${enc(id)}/approve`, { method: 'POST' }),
      reject: (id: string, reason?: string) => self.req(`/api/v1/booking/appointments/${enc(id)}/reject`, { method: 'POST', body: JSON.stringify({ reason }) }),
      reschedule: (id: string, b: { startAt: string; reason?: string }) => self.req(`/api/v1/booking/appointments/${enc(id)}/reschedule`, { method: 'POST', body: JSON.stringify(b) }),
      cancel: (id: string, reason?: string) => self.req(`/api/v1/booking/appointments/${enc(id)}/cancel`, { method: 'POST', body: JSON.stringify({ reason }) }),
      complete: (id: string) => self.req(`/api/v1/booking/appointments/${enc(id)}/complete`, { method: 'POST' }),
      noShow: (id: string) => self.req(`/api/v1/booking/appointments/${enc(id)}/no-show`, { method: 'POST' }),
      insights: () => self.req('/api/v1/booking/insights'),
      // ML
      rankSlots: (b: { inviteeTimezone?: string; preferMorning?: boolean; slots: { id: string; startAt: string; hourLocal: number }[] }) => self.req('/api/v1/booking/ml/rank-slots', { method: 'POST', body: JSON.stringify(b) }),
      cancellationRisk: (id: string) => self.req(`/api/v1/booking/appointments/${enc(id)}/cancellation-risk`),
    };
  },
  configurable: true,
});

// Suppress "unused" warnings — these aliases are imported for the declare-module merge above.
void (null as unknown as _TR | _TS | _TSc | _TSK | _TRStatus | _TBK | _IT | _IM | _ITK | _ITS | _IP | _IUD | _ICK);

/* ── Domain 20 — Media Viewer, File Preview, Gallery & Attachments ── */
Object.defineProperty(GigvoraClient.prototype, 'media', {
  get(this: GigvoraClient) {
    const self = this as unknown as { req: <T>(p: string, init?: RequestInit) => Promise<T> };
    const enc = encodeURIComponent;
    return {
      // Assets
      list: (q: any = {}) => self.req(`/api/v1/media/assets${_qs(q)}`),
      detail: (id: string) => self.req(`/api/v1/media/assets/${enc(id)}`),
      create: (b: any) => self.req('/api/v1/media/assets', { method: 'POST', body: JSON.stringify(b) }),
      update: (id: string, b: any) => self.req(`/api/v1/media/assets/${enc(id)}`, { method: 'PATCH', body: JSON.stringify(b) }),
      archive: (id: string) => self.req(`/api/v1/media/assets/${enc(id)}/archive`, { method: 'POST' }),
      restore: (id: string) => self.req(`/api/v1/media/assets/${enc(id)}/restore`, { method: 'POST' }),
      retry: (id: string) => self.req(`/api/v1/media/assets/${enc(id)}/retry`, { method: 'POST' }),
      view: (id: string) => self.req(`/api/v1/media/assets/${enc(id)}/view`, { method: 'POST' }),
      like: (id: string) => self.req(`/api/v1/media/assets/${enc(id)}/like`, { method: 'POST' }),
      unlike: (id: string) => self.req(`/api/v1/media/assets/${enc(id)}/unlike`, { method: 'POST' }),
      // Signed URLs
      signUpload: (b: any) => self.req('/api/v1/media/sign/upload', { method: 'POST', body: JSON.stringify(b) }),
      signDownload: (id: string) => self.req(`/api/v1/media/sign/download/${enc(id)}`),
      // Galleries
      listGalleries: (q: any = {}) => self.req(`/api/v1/media/galleries${_qs(q)}`),
      getGallery: (id: string) => self.req(`/api/v1/media/galleries/${enc(id)}`),
      publicGallery: (slug: string) => self.req(`/api/v1/media/public/galleries/${enc(slug)}`),
      createGallery: (b: any) => self.req('/api/v1/media/galleries', { method: 'POST', body: JSON.stringify(b) }),
      updateGallery: (id: string, b: any) => self.req(`/api/v1/media/galleries/${enc(id)}`, { method: 'PATCH', body: JSON.stringify(b) }),
      deleteGallery: (id: string) => self.req(`/api/v1/media/galleries/${enc(id)}`, { method: 'DELETE' }),
      // Attachments
      listAttachments: (q: any = {}) => self.req(`/api/v1/media/attachments${_qs(q)}`),
      attach: (b: { assetId: string; contextKind: string; contextId: string; pinned?: boolean }) =>
        self.req('/api/v1/media/attachments', { method: 'POST', body: JSON.stringify(b) }),
      detach: (id: string) => self.req(`/api/v1/media/attachments/${enc(id)}`, { method: 'DELETE' }),
      pin: (id: string) => self.req(`/api/v1/media/attachments/${enc(id)}/pin`, { method: 'POST' }),
      unpin: (id: string) => self.req(`/api/v1/media/attachments/${enc(id)}/unpin`, { method: 'POST' }),
      // Insights & ML
      insights: () => self.req('/api/v1/media/insights'),
      scoreQuality: (b: { assetId: string; bitrateKbps?: number }) =>
        self.req('/api/v1/media/ml/score-quality', { method: 'POST', body: JSON.stringify(b) }),
      rankGallery: (id: string) => self.req(`/api/v1/media/ml/rank-gallery/${enc(id)}`),
      moderationHint: (id: string) => self.req(`/api/v1/media/ml/moderation-hint/${enc(id)}`),
    };
  },
  configurable: true,
});


/* Domain 21 — Podcasts SDK namespace */
Object.defineProperty(GigvoraClient.prototype, 'podcasts', {
  get(): any {
    const self: any = this;
    const enc = encodeURIComponent;
    return {
      // Discovery & shows
      discover: (q: any = {}) => self.req(`/api/v1/podcasts/discover${_qs(q)}`),
      listShows: (q: any = {}) => self.req(`/api/v1/podcasts/shows${_qs(q)}`),
      getShow: (idOrSlug: string) => self.req(`/api/v1/podcasts/shows/${enc(idOrSlug)}`),
      createShow: (b: any) => self.req('/api/v1/podcasts/shows', { method: 'POST', body: JSON.stringify(b) }),
      updateShow: (id: string, b: any) => self.req(`/api/v1/podcasts/shows/${enc(id)}`, { method: 'PATCH', body: JSON.stringify(b) }),
      publishShow: (id: string) => self.req(`/api/v1/podcasts/shows/${enc(id)}/publish`, { method: 'POST' }),
      pauseShow: (id: string) => self.req(`/api/v1/podcasts/shows/${enc(id)}/pause`, { method: 'POST' }),
      archiveShow: (id: string) => self.req(`/api/v1/podcasts/shows/${enc(id)}/archive`, { method: 'POST' }),
      // Episodes
      listEpisodes: (q: any = {}) => self.req(`/api/v1/podcasts/episodes${_qs(q)}`),
      getEpisode: (id: string) => self.req(`/api/v1/podcasts/episodes/${enc(id)}`),
      createEpisode: (b: any) => self.req('/api/v1/podcasts/episodes', { method: 'POST', body: JSON.stringify(b) }),
      updateEpisode: (id: string, b: any) => self.req(`/api/v1/podcasts/episodes/${enc(id)}`, { method: 'PATCH', body: JSON.stringify(b) }),
      publishEpisode: (id: string) => self.req(`/api/v1/podcasts/episodes/${enc(id)}/publish`, { method: 'POST' }),
      pauseEpisode: (id: string) => self.req(`/api/v1/podcasts/episodes/${enc(id)}/pause`, { method: 'POST' }),
      archiveEpisode: (id: string) => self.req(`/api/v1/podcasts/episodes/${enc(id)}/archive`, { method: 'POST' }),
      play: (id: string) => self.req(`/api/v1/podcasts/episodes/${enc(id)}/play`, { method: 'POST' }),
      like: (id: string) => self.req(`/api/v1/podcasts/episodes/${enc(id)}/like`, { method: 'POST' }),
      unlike: (id: string) => self.req(`/api/v1/podcasts/episodes/${enc(id)}/unlike`, { method: 'POST' }),
      comment: (id: string) => self.req(`/api/v1/podcasts/episodes/${enc(id)}/comment`, { method: 'POST' }),
      // Signed URLs
      signUpload: (b: { filename: string; mimeType: string; sizeBytes: number }) =>
        self.req('/api/v1/podcasts/sign/upload', { method: 'POST', body: JSON.stringify(b) }),
      signDownload: (episodeId: string) => self.req(`/api/v1/podcasts/sign/download/${enc(episodeId)}`),
      // Albums
      listAlbums: (q: any = {}) => self.req(`/api/v1/podcasts/albums${_qs(q)}`),
      getAlbum: (id: string) => self.req(`/api/v1/podcasts/albums/${enc(id)}`),
      createAlbum: (b: any) => self.req('/api/v1/podcasts/albums', { method: 'POST', body: JSON.stringify(b) }),
      updateAlbum: (id: string, b: any) => self.req(`/api/v1/podcasts/albums/${enc(id)}`, { method: 'PATCH', body: JSON.stringify(b) }),
      deleteAlbum: (id: string) => self.req(`/api/v1/podcasts/albums/${enc(id)}`, { method: 'DELETE' }),
      // Library / queue / subs
      library: () => self.req('/api/v1/podcasts/library'),
      subscribe: (showId: string) => self.req(`/api/v1/podcasts/library/subscribe/${enc(showId)}`, { method: 'POST' }),
      unsubscribe: (showId: string) => self.req(`/api/v1/podcasts/library/unsubscribe/${enc(showId)}`, { method: 'POST' }),
      favourite: (showId: string) => self.req(`/api/v1/podcasts/library/favourite/${enc(showId)}`, { method: 'POST' }),
      queue: () => self.req('/api/v1/podcasts/queue'),
      enqueue: (episodeId: string) => self.req(`/api/v1/podcasts/queue/${enc(episodeId)}`, { method: 'POST' }),
      dequeue: (queueItemId: string) => self.req(`/api/v1/podcasts/queue/${enc(queueItemId)}`, { method: 'DELETE' }),
      reorderQueue: (ids: string[]) => self.req('/api/v1/podcasts/queue/reorder', { method: 'POST', body: JSON.stringify({ ids }) }),
      // Recordings
      listRecordings: () => self.req('/api/v1/podcasts/recordings'),
      startRecording: (b: { title: string; showId?: string }) =>
        self.req('/api/v1/podcasts/recordings/start', { method: 'POST', body: JSON.stringify(b) }),
      finishRecording: (id: string, b: { durationSec: number; audioKey: string }) =>
        self.req(`/api/v1/podcasts/recordings/${enc(id)}/finish`, { method: 'POST', body: JSON.stringify(b) }),
      // Purchases (multi-step checkout backend)
      listPurchases: () => self.req('/api/v1/podcasts/purchases'),
      createPurchase: (b: { kind: 'episode'|'show'|'album'|'subscription'|'donation'; refId: string; amountCents: number; currency?: string; provider?: 'stripe'|'paddle'|'manual' }) =>
        self.req('/api/v1/podcasts/purchases', { method: 'POST', body: JSON.stringify(b) }),
      confirmPurchase: (id: string, providerRef?: string) =>
        self.req(`/api/v1/podcasts/purchases/${enc(id)}/confirm`, { method: 'POST', body: JSON.stringify({ providerRef }) }),
      refundPurchase: (id: string) => self.req(`/api/v1/podcasts/purchases/${enc(id)}/refund`, { method: 'POST' }),
      // ML + Insights
      insights: () => self.req('/api/v1/podcasts/insights'),
      recommendNext: () => self.req('/api/v1/podcasts/ml/recommend-next'),
    };
  },
  configurable: true,
});

// Domain 66 — Internal Admin Shell.
export * from './internal-admin-shell';

// Domain 67 — Customer Service.
export * from './customer-service';

// Domain 68 — Finance Admin.
export * from './finance-admin';

// Domain 69 — Dispute Ops.
export * from './dispute-ops';

// Domain 70 — Moderator Dashboard.
export * as ModeratorDashboardTypes from './moderator-dashboard';

// Domain 71 — Trust & Safety / ML / Fraud / Risk Decisions.
export * as TrustSafetyMlTypes from './trust-safety-ml';

// Domain 72 — Ads Ops / Policy Review / Geo+Keyword Moderation / Campaign Controls.
export * as AdsOpsTypes from './ads-ops';

// Domain 73 — Verification, Compliance, and Identity Review Dashboard.
export * as VerificationComplianceTypes from './verification-compliance';

// Domain 74 — Super Admin Command Center, Feature Flags, Audit, Platform Overrides.
export * as SuperAdminCommandCenterTypes from './super-admin-command-center';
export * as MasterSettingsTypes from './master-settings-backbone';

// Domain 23 — Search, indexers, saved search, autocomplete, and admin search ops.
export * from './search';
