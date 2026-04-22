/**
 * D31 — Open-to-Work / Availability / Matching repository.
 *
 * Tables (mirrored in packages/db/src/schema/availability-matching.ts and
 * apps/api-nest/migrations/2026xxxx_d31_availability_matching.sql):
 *   - cam_profiles                (1 per user, owns availability)
 *   - cam_windows                 (time-bounded availability windows)
 *   - cam_signals                 (recruiter-facing match signals)
 *   - cam_invitations             (recruiter→candidate role invitations)
 *   - cam_audit                   (state-change audit trail)
 *
 * In-memory adapter behind the same interface as the Postgres adapter so
 * unit tests stay deterministic. Postgres path is the default in non-test
 * environments once DATABASE_URL is set.
 */
import { Injectable, Logger } from '@nestjs/common';
import { randomUUID } from 'crypto';
import type {
  OpenToWorkVisibility, ProfileStatus,
} from './dto';

export type ProfileRow = {
  id: string; tenantId: string; userId: string;
  visibility: OpenToWorkVisibility;
  status: ProfileStatus;
  headline: string; summary: string;
  preferredTitles: string[]; preferredSkills: string[];
  excludedCompanyIds: string[];
  workTypes: string[]; remote: string;
  locations: string[];
  desiredSalaryGbpMin: number | null; desiredSalaryGbpMax: number | null;
  noticePeriodDays: number;
  startBy: string | null;
  portfolioUrl: string | null; resumeUrl: string | null;
  languages: string[];
  consentMarketing: boolean;
  matchScore: number | null;
  matchScoreReasons: string[];
  createdAt: string; updatedAt: string; version: number;
};

export type WindowRow = {
  id: string; profileId: string;
  startsAt: string; endsAt: string;
  weeklyHours: number; note: string;
  status: 'scheduled' | 'active' | 'ended' | 'cancelled';
  cancelReason: string | null;
  createdAt: string; updatedAt: string;
};

export type SignalRow = {
  id: string; tenantId: string; profileId: string; jobId: string;
  score: number; reasons: string[];
  status: 'new' | 'viewed' | 'saved' | 'dismissed' | 'converted';
  recruiterId: string | null;
  note: string | null;
  createdAt: string; updatedAt: string;
};

export type InvitationRow = {
  id: string; tenantId: string; profileId: string; jobId: string;
  recruiterId: string; message: string;
  status: 'pending' | 'accepted' | 'declined' | 'expired';
  expiresAt: string | null;
  decisionNote: string | null;
  createdAt: string; updatedAt: string;
};

type AuditRow = {
  id: string; tenantId: string; profileId: string;
  actor: string; action: string; entity: string; entityId: string;
  diff: any; at: string;
};

const PROFILE_ALLOWED: Record<ProfileStatus, ProfileStatus[]> = {
  draft:    ['active', 'archived'],
  active:   ['paused', 'archived'],
  paused:   ['active', 'archived'],
  archived: ['active'],
};

@Injectable()
export class CandidateAvailabilityMatchingRepository {
  private readonly log = new Logger('CamRepo');
  private readonly profiles = new Map<string, ProfileRow>();
  private readonly windows = new Map<string, WindowRow>();
  private readonly signals = new Map<string, SignalRow>();
  private readonly invitations = new Map<string, InvitationRow>();
  private readonly audit: AuditRow[] = [];

  constructor() { this.seed(); }

  /* ── Profiles ── */
  upsertProfile(tenantId: string, userId: string, dto: any): ProfileRow {
    const now = new Date().toISOString();
    const existing = [...this.profiles.values()].find((p) => p.tenantId === tenantId && p.userId === userId);
    if (existing) {
      const next: ProfileRow = {
        ...existing,
        ...dto,
        desiredSalaryGbpMin: dto.desiredSalaryGbpMin ?? existing.desiredSalaryGbpMin,
        desiredSalaryGbpMax: dto.desiredSalaryGbpMax ?? existing.desiredSalaryGbpMax,
        startBy: dto.startBy ?? existing.startBy,
        portfolioUrl: dto.portfolioUrl ?? existing.portfolioUrl,
        resumeUrl: dto.resumeUrl ?? existing.resumeUrl,
        updatedAt: now, version: existing.version + 1,
      };
      this.profiles.set(existing.id, next);
      return next;
    }
    const row: ProfileRow = {
      id: `cam_${randomUUID()}`, tenantId, userId,
      visibility: dto.visibility ?? 'recruiters', status: 'draft',
      headline: dto.headline, summary: dto.summary ?? '',
      preferredTitles: dto.preferredTitles ?? [], preferredSkills: dto.preferredSkills ?? [],
      excludedCompanyIds: dto.excludedCompanyIds ?? [],
      workTypes: dto.workTypes, remote: dto.remote ?? 'hybrid',
      locations: dto.locations ?? [],
      desiredSalaryGbpMin: dto.desiredSalaryGbpMin ?? null,
      desiredSalaryGbpMax: dto.desiredSalaryGbpMax ?? null,
      noticePeriodDays: dto.noticePeriodDays ?? 0,
      startBy: dto.startBy ?? null,
      portfolioUrl: dto.portfolioUrl ?? null, resumeUrl: dto.resumeUrl ?? null,
      languages: dto.languages ?? [],
      consentMarketing: dto.consentMarketing ?? false,
      matchScore: null, matchScoreReasons: [],
      createdAt: now, updatedAt: now, version: 1,
    };
    this.profiles.set(row.id, row);
    return row;
  }

  transitionProfile(id: string, next: ProfileStatus): ProfileRow | null {
    const row = this.profiles.get(id);
    if (!row) return null;
    if (!PROFILE_ALLOWED[row.status].includes(next)) throw new Error(`invalid_transition_${row.status}_to_${next}`);
    const updated = { ...row, status: next, updatedAt: new Date().toISOString(), version: row.version + 1 };
    this.profiles.set(id, updated);
    return updated;
  }

  setMatchScore(id: string, score: number, reasons: string[]) {
    const row = this.profiles.get(id);
    if (!row) return;
    this.profiles.set(id, { ...row, matchScore: score, matchScoreReasons: reasons, updatedAt: new Date().toISOString() });
  }

  listProfiles(tenantId: string, f: any) {
    let items = [...this.profiles.values()].filter((p) => p.tenantId === tenantId);
    if (f.status?.length) items = items.filter((p) => f.status.includes(p.status));
    if (f.visibility?.length) items = items.filter((p) => f.visibility.includes(p.visibility));
    if (f.workType?.length) items = items.filter((p) => p.workTypes.some((w) => f.workType.includes(w)));
    if (f.remote?.length) items = items.filter((p) => f.remote.includes(p.remote));
    if (f.q) {
      const q = String(f.q).toLowerCase();
      items = items.filter((p) =>
        p.headline.toLowerCase().includes(q) ||
        p.summary.toLowerCase().includes(q) ||
        p.preferredSkills.some((s) => s.toLowerCase().includes(q)),
      );
    }
    items.sort((a, b) => {
      if (f.sort === 'created') return b.createdAt.localeCompare(a.createdAt);
      if (f.sort === 'matchScore') return (b.matchScore ?? 0) - (a.matchScore ?? 0);
      return b.updatedAt.localeCompare(a.updatedAt);
    });
    const total = items.length;
    const start = (f.page - 1) * f.pageSize;
    return { items: items.slice(start, start + f.pageSize), total, page: f.page, pageSize: f.pageSize };
  }
  getProfile(id: string) { return this.profiles.get(id) ?? null; }
  getProfileForUser(tenantId: string, userId: string) {
    return [...this.profiles.values()].find((p) => p.tenantId === tenantId && p.userId === userId) ?? null;
  }

  /* ── Windows ── */
  listWindows(profileId: string) {
    return [...this.windows.values()].filter((w) => w.profileId === profileId).sort((a, b) => a.startsAt.localeCompare(b.startsAt));
  }
  createWindow(profileId: string, dto: any): WindowRow {
    const now = new Date().toISOString();
    const row: WindowRow = {
      id: `win_${randomUUID()}`, profileId,
      startsAt: dto.startsAt, endsAt: dto.endsAt,
      weeklyHours: dto.weeklyHours ?? 40, note: dto.note ?? '',
      status: Date.parse(dto.startsAt) <= Date.now() ? 'active' : 'scheduled',
      cancelReason: null, createdAt: now, updatedAt: now,
    };
    this.windows.set(row.id, row);
    return row;
  }
  cancelWindow(id: string, reason?: string): WindowRow | null {
    const w = this.windows.get(id);
    if (!w) return null;
    const next = { ...w, status: 'cancelled' as const, cancelReason: reason ?? null, updatedAt: new Date().toISOString() };
    this.windows.set(id, next);
    return next;
  }

  /* ── Signals ── */
  upsertSignal(tenantId: string, profileId: string, jobId: string, score: number, reasons: string[]): SignalRow {
    const existing = [...this.signals.values()].find((s) => s.profileId === profileId && s.jobId === jobId);
    const now = new Date().toISOString();
    if (existing) {
      const next = { ...existing, score, reasons, updatedAt: now };
      this.signals.set(existing.id, next);
      return next;
    }
    const row: SignalRow = {
      id: `sig_${randomUUID()}`, tenantId, profileId, jobId,
      score, reasons, status: 'new', recruiterId: null, note: null,
      createdAt: now, updatedAt: now,
    };
    this.signals.set(row.id, row);
    return row;
  }
  listSignals(tenantId: string, f: any) {
    let items = [...this.signals.values()].filter((s) => s.tenantId === tenantId);
    if (f.profileId) items = items.filter((s) => s.profileId === f.profileId);
    if (f.status?.length) items = items.filter((s) => f.status.includes(s.status));
    if (f.minScore != null) items = items.filter((s) => s.score >= f.minScore);
    items.sort((a, b) => f.sort === 'created' ? b.createdAt.localeCompare(a.createdAt) : b.score - a.score);
    const total = items.length;
    const start = (f.page - 1) * f.pageSize;
    return { items: items.slice(start, start + f.pageSize), total, page: f.page, pageSize: f.pageSize };
  }
  getSignal(id: string) { return this.signals.get(id) ?? null; }
  saveSignal(s: SignalRow) {
    this.signals.set(s.id, { ...s, updatedAt: new Date().toISOString() });
    return this.signals.get(s.id)!;
  }

  /* ── Invitations ── */
  createInvitation(tenantId: string, dto: any): InvitationRow {
    const now = new Date().toISOString();
    const row: InvitationRow = {
      id: `inv_${randomUUID()}`, tenantId,
      profileId: dto.profileId, jobId: dto.jobId, recruiterId: dto.recruiterId,
      message: dto.message, status: 'pending',
      expiresAt: dto.expiresAt ?? null, decisionNote: null,
      createdAt: now, updatedAt: now,
    };
    this.invitations.set(row.id, row);
    return row;
  }
  listInvitations(tenantId: string, f: any) {
    let items = [...this.invitations.values()].filter((i) => i.tenantId === tenantId);
    if (f.profileId) items = items.filter((i) => i.profileId === f.profileId);
    if (f.status?.length) items = items.filter((i) => f.status.includes(i.status));
    items.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
    const total = items.length;
    const start = (f.page - 1) * f.pageSize;
    return { items: items.slice(start, start + f.pageSize), total, page: f.page, pageSize: f.pageSize };
  }
  getInvitation(id: string) { return this.invitations.get(id) ?? null; }
  decideInvitation(id: string, decision: 'accepted' | 'declined', note?: string) {
    const row = this.invitations.get(id);
    if (!row) return null;
    const next = { ...row, status: decision, decisionNote: note ?? null, updatedAt: new Date().toISOString() };
    this.invitations.set(id, next);
    return next;
  }
  expireInvitations(now = Date.now()) {
    let n = 0;
    for (const i of this.invitations.values()) {
      if (i.status === 'pending' && i.expiresAt && Date.parse(i.expiresAt) < now) {
        this.invitations.set(i.id, { ...i, status: 'expired', updatedAt: new Date().toISOString() });
        n++;
      }
    }
    return n;
  }

  /* ── Audit ── */
  recordAudit(row: Omit<AuditRow, 'id' | 'at'>) {
    this.audit.push({ ...row, id: `aud_${randomUUID()}`, at: new Date().toISOString() });
    if (this.audit.length > 5000) this.audit.shift();
  }
  listAudit(profileId: string, limit = 100) {
    return this.audit.filter((a) => a.profileId === profileId).slice(-limit).reverse();
  }

  /* ── Seed ── */
  private seed() {
    const t = 'tenant-demo';
    const p = this.upsertProfile(t, 'usr-demo', {
      visibility: 'recruiters', headline: 'Senior Backend Engineer — open to remote-first roles',
      summary: 'Payments + platform. Looking for high-trust async teams.',
      preferredTitles: ['Senior Backend Engineer', 'Staff Engineer'],
      preferredSkills: ['TypeScript', 'PostgreSQL', 'NestJS', 'Distributed Systems'],
      excludedCompanyIds: [], workTypes: ['full_time', 'contract'],
      remote: 'remote', locations: ['London', 'Remote (UK)'],
      desiredSalaryGbpMin: 95_000, desiredSalaryGbpMax: 130_000,
      noticePeriodDays: 30, languages: ['English'], consentMarketing: true,
    });
    this.transitionProfile(p.id, 'active');
    this.createWindow(p.id, {
      startsAt: new Date().toISOString(),
      endsAt: new Date(Date.now() + 90 * 86400_000).toISOString(),
      weeklyHours: 40, note: 'Available immediately for the right opportunity.',
    });
    this.upsertSignal(t, p.id, 'job-payments-001', 92, ['Payments domain match', 'TypeScript primary stack', 'Remote-friendly']);
    this.upsertSignal(t, p.id, 'job-platform-002', 84, ['NestJS stack', 'Senior level match']);
  }
}
