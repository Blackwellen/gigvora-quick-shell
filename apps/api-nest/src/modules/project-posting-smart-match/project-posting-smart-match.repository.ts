/**
 * Domain 33 repository — Project Posting Studio + Smart Match + Invites.
 *
 * In-memory backing store with seeded fixtures for projects, candidates,
 * invites, boost-credit ledger and audit. State machines are explicit so
 * the controller/service can refuse illegal transitions.
 *
 *   project:  draft → pending_review → active ↔ paused → expired → archived
 *                                          ↘ rejected | awarded | cancelled
 *   invite:   pending → sent → opened → accepted | declined | maybe | expired | revoked
 *   purchase: pending → paid | failed → refunded   (multi-step checkout)
 *   approval: open → approved | rejected | changes_requested
 */
import { Injectable, Logger } from '@nestjs/common';
import { randomUUID } from 'crypto';
import type { ProjectStudioDraft, ProjectStudioStatus } from './dto';

export type ProjectStudioRow = {
  id: string; tenantId: string; ownerId: string; ownerName: string;
  title: string; summary: string; description: string;
  engagement: 'fixed' | 'hourly' | 'milestone' | 'retainer';
  workplace: 'remote' | 'hybrid' | 'onsite';
  location: string;
  budgetMinCents: number | null; budgetMaxCents: number | null; currency: string;
  durationDays: number | null;
  startWindow: 'immediate' | 'this_week' | 'this_month' | 'flexible';
  skills: string[]; categories: string[];
  experienceLevel: 'entry' | 'intermediate' | 'expert';
  scopeSize: 'small' | 'medium' | 'large' | 'enterprise';
  launchpadFlags: string[];
  visibility: 'public' | 'private' | 'invite_only' | 'partner_network';
  promotionTier: 'none' | 'standard' | 'featured' | 'spotlight';
  ndaRequired: boolean;
  attachmentIds: string[];
  milestones: { id: string; title: string; amountCents: number; dueAt?: string }[];
  screeners: { id: string; text: string; required: boolean; knockout: boolean }[];
  status: ProjectStudioStatus;
  channels: string[];
  inviteCap: number;
  invitesSent: number;
  matchesGenerated: number;
  publishedAt: string | null; expiresAt: string | null;
  createdAt: string; updatedAt: string;
  version: number;
};

export type CandidateRow = {
  id: string; displayName: string; avatar: string; headline: string;
  hourlyRateCents: number; rating: number; jobsCompleted: number;
  skills: string[]; categories: string[];
  experienceLevel: 'entry' | 'intermediate' | 'expert';
  workplaces: ('remote' | 'hybrid' | 'onsite')[];
  availability: 'open' | 'busy' | 'limited';
  location: string;
};

export type InviteRow = {
  id: string; projectId: string; tenantId: string;
  candidateId: string; sentBy: string;
  channel: 'inapp' | 'email' | 'sms' | 'inapp+email';
  message: string | null;
  status: 'pending' | 'sent' | 'opened' | 'accepted' | 'declined' | 'maybe' | 'expired' | 'revoked';
  sentAt: string; openedAt: string | null; respondedAt: string | null; expiresAt: string;
  decisionNote: string | null;
};

export type BoostPack = { id: string; label: string; kind: 'boost' | 'invite_credits'; postings: number; invites: number; priceCents: number; currency: 'GBP' };
export const BOOST_PACKS: BoostPack[] = [
  { id: 'boost_starter_5',  label: 'Boost · 5 projects',     kind: 'boost',          postings: 5,   invites: 0,   priceCents:  4_900, currency: 'GBP' },
  { id: 'boost_growth_25',  label: 'Boost · 25 projects',    kind: 'boost',          postings: 25,  invites: 0,   priceCents: 19_900, currency: 'GBP' },
  { id: 'invite_pack_25',   label: 'Invite credits · 25',    kind: 'invite_credits', postings: 0,   invites: 25,  priceCents:  2_900, currency: 'GBP' },
  { id: 'invite_pack_100',  label: 'Invite credits · 100',   kind: 'invite_credits', postings: 0,   invites: 100, priceCents:  9_900, currency: 'GBP' },
];

type LedgerEntry = { id: string; tenantId: string; kind: 'boost' | 'invite_credits'; delta: number; reason: string; ref: string | null; at: string };
type PurchaseRow = {
  id: string; tenantId: string; buyerId: string; packId: string;
  kind: 'boost' | 'invite_credits'; postings: number; invites: number;
  amountCents: number; currency: string;
  status: 'pending' | 'paid' | 'failed' | 'refunded';
  createdAt: string; confirmedAt: string | null; receiptUrl: string | null;
};
type ApprovalRow = {
  id: string; projectId: string; tenantId: string; submittedBy: string;
  status: 'open' | 'approved' | 'rejected' | 'changes_requested';
  reviewerId: string | null; note: string | null; createdAt: string; decidedAt: string | null;
};
type AuditRow = { id: string; projectId: string | null; tenantId: string; actor: string; action: string; diff: any; at: string };

@Injectable()
export class ProjectPostingSmartMatchRepository {
  private readonly log = new Logger('ProjectPostingSmartMatchRepo');
  private projects: ProjectStudioRow[] = [];
  private candidates: CandidateRow[] = [];
  private invites: InviteRow[] = [];
  private ledger: LedgerEntry[] = [];
  private purchases: PurchaseRow[] = [];
  private approvals: ApprovalRow[] = [];
  private audit: AuditRow[] = [];
  private boostBalance = new Map<string, number>();
  private inviteBalance = new Map<string, number>();
  private idempotencyKeys = new Map<string, string>();

  constructor() { this.seed(); }

  private seed() {
    const skillsPool = ['React', 'TypeScript', 'Node.js', 'Postgres', 'AWS', 'Python', 'Figma', 'GraphQL', 'Docker', 'Tailwind', 'Next.js', 'Swift', 'Kotlin'];
    const cats = ['Web Development', 'Mobile Apps', 'Design', 'Data Engineering', 'DevOps', 'Branding'];
    const seedNames: [string, string, string, string][] = [
      ['Sarah Chen', 'SC', 'Senior Full-Stack Developer', 'London'],
      ['Alex Rivera', 'AR', 'Product Designer & Developer', 'Berlin'],
      ['James Okoro', 'JO', 'Cloud Architecture Specialist', 'Lagos'],
      ['Priya Sharma', 'PS', 'Data Engineer', 'Bangalore'],
      ['Marcus Thompson', 'MT', 'Mobile & Web Developer', 'New York'],
      ['Elena Kowalski', 'EK', 'UX/UI Lead', 'Warsaw'],
      ['Diego Hernandez', 'DH', 'Backend Engineer', 'Madrid'],
      ['Mei Tanaka', 'MT', 'Frontend Engineer', 'Tokyo'],
      ['Olu Adebayo', 'OA', 'Mobile Engineer', 'Lagos'],
      ['Hugo Laurent', 'HL', 'DevOps Engineer', 'Paris'],
      ['Anna Schmidt', 'AS', 'Product Designer', 'Munich'],
      ['Ravi Kumar', 'RK', 'ML Engineer', 'Bangalore'],
    ];
    seedNames.forEach((n, i) => {
      this.candidates.push({
        id: randomUUID(),
        displayName: n[0], avatar: n[1], headline: n[2], location: n[3],
        hourlyRateCents: (60 + (i * 7) % 50) * 100,
        rating: Math.round((4.4 + (i % 7) * 0.07) * 10) / 10,
        jobsCompleted: 12 + (i * 11) % 80,
        skills: skillsPool.slice(i % 6, (i % 6) + 4),
        categories: [cats[i % cats.length]],
        experienceLevel: (['intermediate', 'expert', 'entry'] as const)[i % 3],
        workplaces: i % 3 === 0 ? ['remote'] : ['remote', 'hybrid'],
        availability: (['open', 'limited', 'busy'] as const)[i % 3],
      });
    });
    this.log.log(`seeded ${this.candidates.length} candidates`);
  }

  // ─── Projects ───────────────────────────────────────────────────────────
  list(tenantId: string) { return this.projects.filter((p) => p.tenantId === tenantId); }
  byId(id: string) { return this.projects.find((p) => p.id === id) ?? null; }

  createDraft(tenantId: string, ownerId: string, ownerName: string, draft: ProjectStudioDraft): ProjectStudioRow {
    const now = new Date().toISOString();
    const row: ProjectStudioRow = {
      id: randomUUID(), tenantId, ownerId, ownerName,
      title: draft.title, summary: draft.summary, description: draft.description,
      engagement: draft.engagement, workplace: draft.workplace, location: draft.location,
      budgetMinCents: draft.budgetMinCents ?? null, budgetMaxCents: draft.budgetMaxCents ?? null, currency: draft.currency,
      durationDays: draft.durationDays ?? null, startWindow: draft.startWindow,
      skills: draft.skills, categories: draft.categories,
      experienceLevel: draft.experienceLevel, scopeSize: draft.scopeSize,
      launchpadFlags: draft.launchpadFlags,
      visibility: draft.visibility, promotionTier: draft.promotionTier,
      ndaRequired: draft.ndaRequired,
      attachmentIds: draft.attachmentIds,
      milestones: draft.milestones.map((m) => ({ id: m.id ?? randomUUID(), title: m.title, amountCents: m.amountCents, dueAt: m.dueAt })),
      screeners: draft.screeners.map((s) => ({ id: s.id ?? randomUUID(), text: s.text, required: s.required, knockout: s.knockout })),
      status: 'draft', channels: [],
      inviteCap: 0, invitesSent: 0, matchesGenerated: 0,
      publishedAt: null, expiresAt: null,
      createdAt: now, updatedAt: now, version: 1,
    };
    this.projects.push(row);
    this.audit.push({ id: randomUUID(), projectId: row.id, tenantId, actor: ownerId, action: 'project.created', diff: { title: row.title }, at: now });
    return row;
  }

  update(id: string, expectedVersion: number, patch: Partial<ProjectStudioDraft>, actor: string): ProjectStudioRow {
    const row = this.byId(id);
    if (!row) throw new Error('not_found');
    if (row.version !== expectedVersion) throw new Error('version_conflict');
    Object.assign(row, patch, { updatedAt: new Date().toISOString(), version: row.version + 1 });
    this.audit.push({ id: randomUUID(), projectId: id, tenantId: row.tenantId, actor, action: 'project.updated', diff: patch, at: row.updatedAt });
    return row;
  }

  transition(id: string, next: ProjectStudioStatus, actor: string): ProjectStudioRow {
    const row = this.byId(id);
    if (!row) throw new Error('not_found');
    row.status = next; row.updatedAt = new Date().toISOString();
    this.audit.push({ id: randomUUID(), projectId: id, tenantId: row.tenantId, actor, action: `project.${next}`, diff: { from: row.status, to: next }, at: row.updatedAt });
    return row;
  }

  // ─── Candidates / Smart Match source set ───────────────────────────────
  candidatePool() { return this.candidates; }
  candidateById(id: string) { return this.candidates.find((c) => c.id === id) ?? null; }

  // ─── Invites ───────────────────────────────────────────────────────────
  invitesForProject(projectId: string) { return this.invites.filter((i) => i.projectId === projectId); }
  invitesForCandidate(candidateId: string) { return this.invites.filter((i) => i.candidateId === candidateId); }
  inviteById(id: string) { return this.invites.find((i) => i.id === id) ?? null; }

  createInvite(projectId: string, candidateId: string, sentBy: string, channel: InviteRow['channel'], message: string | undefined, expiresInDays: number): InviteRow {
    const project = this.byId(projectId);
    if (!project) throw new Error('not_found');
    const dup = this.invites.find((i) => i.projectId === projectId && i.candidateId === candidateId && (i.status === 'pending' || i.status === 'sent' || i.status === 'opened'));
    if (dup) return dup;
    const now = new Date();
    const row: InviteRow = {
      id: randomUUID(), projectId, tenantId: project.tenantId,
      candidateId, sentBy, channel, message: message ?? null,
      status: 'sent', sentAt: now.toISOString(), openedAt: null, respondedAt: null,
      expiresAt: new Date(now.getTime() + expiresInDays * 86_400_000).toISOString(),
      decisionNote: null,
    };
    this.invites.push(row);
    project.invitesSent += 1;
    this.audit.push({ id: randomUUID(), projectId, tenantId: project.tenantId, actor: sentBy, action: 'invite.sent', diff: { candidateId }, at: row.sentAt });
    return row;
  }

  decideInvite(inviteId: string, decision: 'accept' | 'decline' | 'maybe', note?: string): InviteRow {
    const inv = this.inviteById(inviteId);
    if (!inv) throw new Error('not_found');
    if (inv.status === 'accepted' || inv.status === 'declined' || inv.status === 'expired' || inv.status === 'revoked') return inv;
    inv.status = decision === 'accept' ? 'accepted' : decision === 'decline' ? 'declined' : 'maybe';
    inv.respondedAt = new Date().toISOString();
    inv.decisionNote = note ?? null;
    this.audit.push({ id: randomUUID(), projectId: inv.projectId, tenantId: inv.tenantId, actor: inv.candidateId, action: `invite.${inv.status}`, diff: { note }, at: inv.respondedAt });
    return inv;
  }

  revokeInvite(inviteId: string, actor: string): InviteRow {
    const inv = this.inviteById(inviteId); if (!inv) throw new Error('not_found');
    if (inv.status === 'accepted' || inv.status === 'declined') return inv;
    inv.status = 'revoked'; inv.respondedAt = new Date().toISOString();
    this.audit.push({ id: randomUUID(), projectId: inv.projectId, tenantId: inv.tenantId, actor, action: 'invite.revoked', diff: {}, at: inv.respondedAt });
    return inv;
  }

  // ─── Boost-credit + invite-credit ledger ───────────────────────────────
  boostBalanceOf(tenantId: string) { return this.boostBalance.get(tenantId) ?? 0; }
  inviteBalanceOf(tenantId: string) { return this.inviteBalance.get(tenantId) ?? 0; }

  createPurchase(tenantId: string, buyerId: string, packId: string): PurchaseRow {
    const pack = BOOST_PACKS.find((p) => p.id === packId);
    if (!pack) throw new Error('unknown_pack');
    const row: PurchaseRow = {
      id: randomUUID(), tenantId, buyerId, packId,
      kind: pack.kind, postings: pack.postings, invites: pack.invites,
      amountCents: pack.priceCents, currency: pack.currency,
      status: 'pending',
      createdAt: new Date().toISOString(), confirmedAt: null, receiptUrl: null,
    };
    this.purchases.push(row);
    return row;
  }

  confirmPurchase(purchaseId: string, idempotencyKey: string): PurchaseRow {
    const idemHit = this.idempotencyKeys.get(`confirm:${idempotencyKey}`);
    if (idemHit) {
      const existing = this.purchases.find((p) => p.id === idemHit);
      if (existing) return existing;
    }
    const p = this.purchases.find((x) => x.id === purchaseId);
    if (!p) throw new Error('not_found');
    if (p.status === 'paid') return p;
    p.status = 'paid'; p.confirmedAt = new Date().toISOString();
    p.receiptUrl = `https://receipts.gigvora.example/${p.id}.pdf`;
    if (p.kind === 'boost') {
      this.boostBalance.set(p.tenantId, this.boostBalanceOf(p.tenantId) + p.postings);
      this.ledger.push({ id: randomUUID(), tenantId: p.tenantId, kind: 'boost', delta: p.postings, reason: `purchase:${p.id}`, ref: p.id, at: p.confirmedAt });
    } else {
      this.inviteBalance.set(p.tenantId, this.inviteBalanceOf(p.tenantId) + p.invites);
      this.ledger.push({ id: randomUUID(), tenantId: p.tenantId, kind: 'invite_credits', delta: p.invites, reason: `purchase:${p.id}`, ref: p.id, at: p.confirmedAt });
    }
    this.idempotencyKeys.set(`confirm:${idempotencyKey}`, p.id);
    return p;
  }

  applyBoost(projectId: string, tier: 'standard' | 'featured' | 'spotlight' | 'none', durationDays: number, idempotencyKey: string, actor: string) {
    const idemHit = this.idempotencyKeys.get(`boost:${idempotencyKey}`);
    if (idemHit) return this.byId(idemHit)!;
    const row = this.byId(projectId); if (!row) throw new Error('not_found');
    if (this.boostBalanceOf(row.tenantId) < 1) throw new Error('insufficient_boost_credits');
    this.boostBalance.set(row.tenantId, this.boostBalanceOf(row.tenantId) - 1);
    this.ledger.push({ id: randomUUID(), tenantId: row.tenantId, kind: 'boost', delta: -1, reason: `boost:${projectId}`, ref: projectId, at: new Date().toISOString() });
    row.promotionTier = tier;
    row.expiresAt = new Date(Date.now() + durationDays * 86_400_000).toISOString();
    row.updatedAt = new Date().toISOString();
    this.audit.push({ id: randomUUID(), projectId, tenantId: row.tenantId, actor, action: 'project.boosted', diff: { tier, durationDays }, at: row.updatedAt });
    this.idempotencyKeys.set(`boost:${idempotencyKey}`, projectId);
    return row;
  }

  ledgerFor(tenantId: string) { return this.ledger.filter((l) => l.tenantId === tenantId).slice(-50); }
  purchasesFor(tenantId: string) { return this.purchases.filter((p) => p.tenantId === tenantId); }

  // ─── Approval queue ────────────────────────────────────────────────────
  submitForReview(projectId: string, submittedBy: string): ApprovalRow {
    const row = this.byId(projectId); if (!row) throw new Error('not_found');
    row.status = 'pending_review'; row.updatedAt = new Date().toISOString();
    const ap: ApprovalRow = { id: randomUUID(), projectId, tenantId: row.tenantId, submittedBy, status: 'open', reviewerId: null, note: null, createdAt: row.updatedAt, decidedAt: null };
    this.approvals.push(ap);
    this.audit.push({ id: randomUUID(), projectId, tenantId: row.tenantId, actor: submittedBy, action: 'approval.submitted', diff: {}, at: row.updatedAt });
    return ap;
  }
  approvalQueue(tenantId: string) { return this.approvals.filter((a) => a.tenantId === tenantId && a.status === 'open'); }
  approvalForProject(projectId: string) { return this.approvals.filter((a) => a.projectId === projectId); }
  decideApproval(projectId: string, decision: 'approve' | 'reject' | 'request_changes', reviewerId: string, note?: string): ApprovalRow {
    const ap = this.approvals.find((a) => a.projectId === projectId && a.status === 'open');
    if (!ap) throw new Error('not_found');
    ap.status = decision === 'approve' ? 'approved' : decision === 'reject' ? 'rejected' : 'changes_requested';
    ap.reviewerId = reviewerId; ap.note = note ?? null; ap.decidedAt = new Date().toISOString();
    const proj = this.byId(projectId);
    if (proj) {
      if (ap.status === 'approved') proj.status = 'active';
      if (ap.status === 'rejected') proj.status = 'rejected';
      proj.updatedAt = ap.decidedAt;
    }
    return ap;
  }

  consumeIdempotency(key: string, value: string) {
    const hit = this.idempotencyKeys.get(key);
    if (hit) return hit;
    this.idempotencyKeys.set(key, value);
    return value;
  }

  auditFor(projectId: string) { return this.audit.filter((a) => a.projectId === projectId); }
}
