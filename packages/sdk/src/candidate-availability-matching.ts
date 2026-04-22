/**
 * D31 SDK — typed client for Open-to-Work, Availability, Matching Signals.
 * Mirrors apps/api-nest/src/modules/candidate-availability-matching/dto.ts.
 */
import { z } from 'zod';

export type ProfileStatus = 'draft' | 'active' | 'paused' | 'archived';
export type OpenToWorkVisibility = 'private' | 'recruiters' | 'network' | 'public';
export type WorkType = 'full_time' | 'contract' | 'part_time' | 'freelance' | 'internship';
export type RemotePosture = 'onsite' | 'hybrid' | 'remote' | 'remote_global';
export type WindowStatus = 'scheduled' | 'active' | 'ended' | 'cancelled';
export type SignalStatus = 'new' | 'viewed' | 'saved' | 'dismissed' | 'converted';
export type InvitationStatus = 'pending' | 'accepted' | 'declined' | 'expired';

export interface AvailabilityProfile {
  id: string; tenantId: string; userId: string;
  visibility: OpenToWorkVisibility; status: ProfileStatus;
  headline: string; summary: string;
  preferredTitles: string[]; preferredSkills: string[];
  excludedCompanyIds: string[];
  workTypes: WorkType[]; remote: RemotePosture;
  locations: string[];
  desiredSalaryGbpMin: number | null; desiredSalaryGbpMax: number | null;
  noticePeriodDays: number;
  startBy: string | null;
  portfolioUrl: string | null; resumeUrl: string | null;
  languages: string[];
  consentMarketing: boolean;
  matchScore: number | null; matchScoreReasons: string[];
  createdAt: string; updatedAt: string; version: number;
}

export interface AvailabilityWindow {
  id: string; profileId: string;
  startsAt: string; endsAt: string;
  weeklyHours: number; note: string;
  status: WindowStatus; cancelReason: string | null;
  createdAt: string; updatedAt: string;
}

export interface MatchSignal {
  id: string; tenantId: string; profileId: string; jobId: string;
  score: number; reasons: string[];
  status: SignalStatus; recruiterId: string | null; note: string | null;
  createdAt: string; updatedAt: string;
}

export interface MatchInvitation {
  id: string; tenantId: string; profileId: string; jobId: string;
  recruiterId: string; message: string;
  status: InvitationStatus;
  expiresAt: string | null; decisionNote: string | null;
  createdAt: string; updatedAt: string;
}

export interface PaginatedEnvelope<T> {
  items: T[]; total: number; page: number; pageSize: number;
}

const BASE = '/api/v1/candidate-availability-matching';

async function call<T>(method: string, path: string, body?: unknown, query?: Record<string, any>): Promise<T> {
  const url = new URL(`${BASE}${path}`, typeof window === 'undefined' ? 'http://localhost' : window.location.origin);
  if (query) for (const [k, v] of Object.entries(query)) {
    if (v == null) continue;
    if (Array.isArray(v)) for (const x of v) url.searchParams.append(k, String(x));
    else url.searchParams.set(k, String(v));
  }
  const res = await fetch(url.pathname + url.search, {
    method, headers: { 'content-type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
    credentials: 'include',
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`cam_sdk_${res.status}: ${text || res.statusText}`);
  }
  return res.json();
}

/* Validators (re-exported for callers that want client-side validation) */
export const ProfileUpsertInput = z.object({
  visibility: z.enum(['private', 'recruiters', 'network', 'public']).optional(),
  headline: z.string().min(1).max(160),
  summary: z.string().max(4000).optional(),
  preferredTitles: z.array(z.string()).max(10).optional(),
  preferredSkills: z.array(z.string()).max(50).optional(),
  workTypes: z.array(z.enum(['full_time', 'contract', 'part_time', 'freelance', 'internship'])).min(1),
  remote: z.enum(['onsite', 'hybrid', 'remote', 'remote_global']).optional(),
  locations: z.array(z.string()).max(15).optional(),
  desiredSalaryGbpMin: z.number().int().min(0).optional(),
  desiredSalaryGbpMax: z.number().int().min(0).optional(),
  noticePeriodDays: z.number().int().min(0).max(365).optional(),
  startBy: z.string().datetime().optional(),
  portfolioUrl: z.string().url().optional(),
  resumeUrl: z.string().url().optional(),
  languages: z.array(z.string()).max(10).optional(),
  consentMarketing: z.boolean().optional(),
});

export const candidateAvailabilityMatching = {
  listProfiles: (q: { status?: ProfileStatus[]; visibility?: OpenToWorkVisibility[]; workType?: WorkType[]; remote?: RemotePosture[]; q?: string; page?: number; pageSize?: number; sort?: 'updated' | 'created' | 'matchScore' } = {}) =>
    call<PaginatedEnvelope<AvailabilityProfile>>('GET', '/profiles', undefined, q),
  myProfile: () => call<AvailabilityProfile | null>('GET', '/profiles/me'),
  upsertProfile: (body: z.infer<typeof ProfileUpsertInput>) =>
    call<AvailabilityProfile>('POST', '/profiles', body),
  detail: (id: string) => call<{ profile: AvailabilityProfile; windows: AvailabilityWindow[] }>('GET', `/profiles/${id}`),
  transition: (id: string, next: ProfileStatus, reason?: string) =>
    call<AvailabilityProfile>('POST', `/profiles/${id}/transition`, { next, reason }),

  listWindows: (profileId: string) => call<{ items: AvailabilityWindow[] }>('GET', `/profiles/${profileId}/windows`),
  createWindow: (profileId: string, body: { startsAt: string; endsAt: string; weeklyHours?: number; note?: string }) =>
    call<AvailabilityWindow>('POST', `/profiles/${profileId}/windows`, body),
  cancelWindow: (profileId: string, windowId: string, reason?: string) =>
    call<AvailabilityWindow>('DELETE', `/profiles/${profileId}/windows/${windowId}`, { reason }),

  listSignals: (q: { profileId?: string; status?: SignalStatus[]; minScore?: number; page?: number; pageSize?: number; sort?: 'score' | 'created' } = {}) =>
    call<PaginatedEnvelope<MatchSignal>>('GET', '/signals', undefined, q),
  actOnSignal: (signalId: string, action: 'view' | 'save' | 'dismiss' | 'convert', note?: string) =>
    call<MatchSignal>('POST', `/signals/${signalId}/action`, { action, note }),
  generateSignal: (profileId: string, job: { id: string; title: string; skills: string[]; remote: RemotePosture; workType: WorkType; location?: string; salaryGbpMin?: number; salaryGbpMax?: number }) =>
    call<MatchSignal | null>('POST', '/signals/generate', { profileId, job }),

  listInvitations: (q: { profileId?: string; status?: InvitationStatus[]; page?: number; pageSize?: number } = {}) =>
    call<PaginatedEnvelope<MatchInvitation>>('GET', '/invitations', undefined, q),
  createInvitation: (body: { profileId: string; jobId: string; recruiterId: string; message: string; expiresAt?: string }) =>
    call<MatchInvitation>('POST', '/invitations', body),
  decideInvitation: (id: string, decision: 'accept' | 'decline', note?: string) =>
    call<MatchInvitation>('POST', `/invitations/${id}/decision`, { decision, note }),

  talentSearch: (body: { q?: string; skills?: string[]; workType?: WorkType[]; remote?: RemotePosture[]; locations?: string[]; maxNoticeDays?: number; salaryGbpMax?: number; visibilityMin?: OpenToWorkVisibility; page?: number; pageSize?: number }) =>
    call<PaginatedEnvelope<AvailabilityProfile>>('POST', '/talent-search', body),
  dashboard: () => call<{ generatedAt: string; insights: any }>('GET', '/dashboard'),
  audit: (profileId: string, limit?: number) =>
    call<{ items: any[] }>('GET', `/profiles/${profileId}/audit`, undefined, { limit }),
};

export type CandidateAvailabilityMatchingSdk = typeof candidateAvailabilityMatching;
