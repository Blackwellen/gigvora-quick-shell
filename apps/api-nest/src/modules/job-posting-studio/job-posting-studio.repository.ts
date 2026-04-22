/**
 * Domain 24 — Job Posting Studio repository.
 *
 * In-memory + seeded persistence for posting drafts, publication credits,
 * recruiter approval queues and audit trail. Real persistence lives in Drizzle
 * migrations (job_posts, job_post_versions, posting_credits, credit_ledger,
 * credit_purchases, posting_approvals, posting_audit). The in-memory store
 * mirrors that contract so the rest of the stack can run end-to-end now and
 * be flipped to Postgres without controller/service changes.
 *
 * State machines:
 *   Job:       draft → pending_review → active ↔ paused, active → expired → archived,
 *              pending_review → rejected
 *   Purchase:  pending → paid | failed → refunded (multi-step checkout per rule)
 *   Approval:  open → approved | rejected | changes_requested
 */
import { Injectable, Logger } from '@nestjs/common';
import { randomUUID } from 'crypto';
import type { JobDraft } from './dto';

export type JobRow = {
  id: string; tenantId: string; ownerId: string; ownerName: string;
  title: string; summary: string; description: string;
  employment: string; workplace: string; location: string;
  salaryMinCents: number | null; salaryMaxCents: number | null; currency: string;
  skills: string[]; benefits: string[]; applyUrl: string | null;
  visibility: string; promoted: boolean; promotionTier: string;
  status: 'draft' | 'pending_review' | 'active' | 'paused' | 'expired' | 'archived' | 'rejected';
  channels: string[];
  applications: number; impressions: number;
  publishedAt: string | null; expiresAt: string | null;
  createdAt: string; updatedAt: string;
  version: number;
};

export type CreditPack = { id: string; postings: number; priceCents: number; currency: 'GBP' };
export const CREDIT_PACKS: CreditPack[] = [
  { id: 'starter_5', postings: 5, priceCents: 9_900, currency: 'GBP' },
  { id: 'growth_25', postings: 25, priceCents: 39_900, currency: 'GBP' },
  { id: 'scale_100', postings: 100, priceCents: 129_900, currency: 'GBP' },
  { id: 'enterprise_500', postings: 500, priceCents: 499_900, currency: 'GBP' },
];

type LedgerEntry = { id: string; tenantId: string; delta: number; reason: string; ref: string | null; at: string };
type PurchaseRow = {
  id: string; tenantId: string; buyerId: string; packId: string;
  postings: number; amountCents: number; currency: string;
  status: 'pending' | 'paid' | 'failed' | 'refunded';
  createdAt: string; confirmedAt: string | null; receiptUrl: string | null;
};
type ApprovalRow = {
  id: string; jobId: string; tenantId: string; submittedBy: string;
  status: 'open' | 'approved' | 'rejected' | 'changes_requested';
  reviewerId: string | null; note: string | null; createdAt: string; decidedAt: string | null;
};
type AuditRow = { id: string; jobId: string | null; tenantId: string; actor: string; action: string; diff: any; at: string };

@Injectable()
export class JobPostingStudioRepository {
  private readonly log = new Logger('JobPostingStudioRepo');
  private jobs: JobRow[] = [];
  private credits = new Map<string, number>(); // tenantId -> balance
  private ledger: LedgerEntry[] = [];
  private purchases = new Map<string, PurchaseRow>();
  private approvals = new Map<string, ApprovalRow>();
  private audit: AuditRow[] = [];
  private idempotency = new Map<string, string>();

  constructor() { this.seed(); }

  private seed() {
    const tenantId = 'tenant-demo';
    this.credits.set(tenantId, 12);
    const samples = [
      { title: 'Senior Backend Engineer', status: 'active' as const, applications: 47, impressions: 3200 },
      { title: 'Product Designer', status: 'active' as const, applications: 23, impressions: 1900 },
      { title: 'Growth Marketer (Contract)', status: 'paused' as const, applications: 18, impressions: 1240 },
      { title: 'Junior DevOps', status: 'pending_review' as const, applications: 0, impressions: 0 },
      { title: 'Head of Sales', status: 'draft' as const, applications: 0, impressions: 0 },
    ];
    samples.forEach((s, i) => {
      const now = Date.now() - i * 86_400_000;
      this.jobs.push({
        id: randomUUID(), tenantId, ownerId: 'recruiter-1', ownerName: 'Alex Recruiter',
        title: s.title, summary: `${s.title} — hiring at Gigvora demo`, description: 'Full description…',
        employment: 'full_time', workplace: 'hybrid', location: 'London, UK',
        salaryMinCents: 60_000_00, salaryMaxCents: 95_000_00, currency: 'GBP',
        skills: ['typescript', 'node'], benefits: ['equity', 'remote'],
        applyUrl: null, visibility: 'public', promoted: i === 0, promotionTier: i === 0 ? 'featured' : 'none',
        status: s.status, channels: ['gigvora', 'linkedin'].slice(0, i === 0 ? 2 : 1),
        applications: s.applications, impressions: s.impressions,
        publishedAt: s.status === 'active' || s.status === 'paused' ? new Date(now).toISOString() : null,
        expiresAt: s.status === 'active' ? new Date(now + 30 * 86_400_000).toISOString() : null,
        createdAt: new Date(now - 86_400_000).toISOString(), updatedAt: new Date(now).toISOString(),
        version: 1,
      });
    });
    if (samples.find((s) => s.status === 'pending_review')) {
      const j = this.jobs.find((j) => j.status === 'pending_review')!;
      this.approvals.set(j.id, {
        id: randomUUID(), jobId: j.id, tenantId, submittedBy: j.ownerId,
        status: 'open', reviewerId: null, note: null,
        createdAt: new Date().toISOString(), decidedAt: null,
      });
    }
    this.log.log(`seeded ${this.jobs.length} jobs, ${this.credits.get(tenantId)} credits`);
  }

  // ---- Jobs ----
  list(tenantId: string) { return this.jobs.filter((j) => j.tenantId === tenantId); }
  byId(id: string) { return this.jobs.find((j) => j.id === id); }
  filter(tenantId: string, f: { q?: string; status?: string[] }) {
    return this.list(tenantId).filter((j) => {
      if (f.q && !`${j.title} ${j.summary} ${j.skills.join(' ')}`.toLowerCase().includes(f.q.toLowerCase())) return false;
      if (f.status?.length && !f.status.includes(j.status)) return false;
      return true;
    });
  }

  createDraft(tenantId: string, ownerId: string, ownerName: string, payload: JobDraft): JobRow {
    const now = new Date().toISOString();
    const row: JobRow = {
      id: randomUUID(), tenantId, ownerId, ownerName,
      title: payload.title, summary: payload.summary, description: payload.description,
      employment: payload.employment, workplace: payload.workplace, location: payload.location,
      salaryMinCents: payload.salaryMinCents ?? null, salaryMaxCents: payload.salaryMaxCents ?? null, currency: payload.currency,
      skills: payload.skills, benefits: payload.benefits, applyUrl: payload.applyUrl ?? null,
      visibility: payload.visibility, promoted: payload.promoted, promotionTier: payload.promotionTier,
      status: 'draft', channels: [], applications: 0, impressions: 0,
      publishedAt: null, expiresAt: null, createdAt: now, updatedAt: now, version: 1,
    };
    this.jobs.unshift(row);
    this.audit.push({ id: randomUUID(), jobId: row.id, tenantId, actor: ownerId, action: 'job.created', diff: { title: row.title }, at: now });
    return row;
  }

  update(id: string, expectedVersion: number, patch: Partial<JobDraft>, actorId: string): JobRow {
    const j = this.byId(id); if (!j) throw new Error('not_found');
    if (j.version !== expectedVersion) throw new Error('version_conflict');
    Object.assign(j, patch, { updatedAt: new Date().toISOString(), version: j.version + 1 });
    this.audit.push({ id: randomUUID(), jobId: id, tenantId: j.tenantId, actor: actorId, action: 'job.updated', diff: patch, at: j.updatedAt });
    return j;
  }

  transition(id: string, next: JobRow['status'], actorId: string): JobRow {
    const j = this.byId(id); if (!j) throw new Error('not_found');
    const allowed: Record<JobRow['status'], JobRow['status'][]> = {
      draft: ['pending_review', 'archived'],
      pending_review: ['active', 'rejected', 'draft'],
      active: ['paused', 'expired', 'archived'],
      paused: ['active', 'archived'],
      expired: ['archived', 'active'],
      rejected: ['draft', 'archived'],
      archived: [],
    };
    if (!allowed[j.status].includes(next)) throw new Error(`invalid_transition:${j.status}->${next}`);
    j.status = next; j.updatedAt = new Date().toISOString(); j.version += 1;
    if (next === 'active' && !j.publishedAt) j.publishedAt = j.updatedAt;
    this.audit.push({ id: randomUUID(), jobId: id, tenantId: j.tenantId, actor: actorId, action: `job.${next}`, diff: null, at: j.updatedAt });
    return j;
  }

  // ---- Credits ----
  balance(tenantId: string) { return this.credits.get(tenantId) ?? 0; }
  applyCredit(tenantId: string, delta: number, reason: string, ref: string | null) {
    const cur = this.balance(tenantId);
    if (cur + delta < 0) throw new Error('insufficient_credits');
    this.credits.set(tenantId, cur + delta);
    const entry: LedgerEntry = { id: randomUUID(), tenantId, delta, reason, ref, at: new Date().toISOString() };
    this.ledger.push(entry); return entry;
  }
  ledgerFor(tenantId: string) { return this.ledger.filter((e) => e.tenantId === tenantId).slice(-100).reverse(); }

  // Multi-step credit purchase
  createPurchase(tenantId: string, buyerId: string, packId: string): PurchaseRow {
    const pack = CREDIT_PACKS.find((p) => p.id === packId); if (!pack) throw new Error('unknown_pack');
    const row: PurchaseRow = {
      id: randomUUID(), tenantId, buyerId, packId,
      postings: pack.postings, amountCents: pack.priceCents, currency: pack.currency,
      status: 'pending', createdAt: new Date().toISOString(), confirmedAt: null, receiptUrl: null,
    };
    this.purchases.set(row.id, row); return row;
  }
  confirmPurchase(purchaseId: string, buyerId: string): PurchaseRow {
    const p = this.purchases.get(purchaseId); if (!p || p.buyerId !== buyerId) throw new Error('not_found');
    if (p.status !== 'pending') throw new Error(`invalid_state:${p.status}`);
    p.status = 'paid'; p.confirmedAt = new Date().toISOString();
    p.receiptUrl = `local://receipts/job-credits-${p.id}.pdf`;
    this.applyCredit(p.tenantId, p.postings, `purchase:${p.packId}`, p.id);
    return p;
  }
  listPurchases(tenantId: string) { return [...this.purchases.values()].filter((p) => p.tenantId === tenantId); }

  // ---- Approvals ----
  submitForReview(jobId: string, actorId: string): ApprovalRow {
    const j = this.byId(jobId); if (!j) throw new Error('not_found');
    this.transition(jobId, 'pending_review', actorId);
    const row: ApprovalRow = {
      id: randomUUID(), jobId, tenantId: j.tenantId, submittedBy: actorId,
      status: 'open', reviewerId: null, note: null,
      createdAt: new Date().toISOString(), decidedAt: null,
    };
    this.approvals.set(jobId, row); return row;
  }
  decide(jobId: string, reviewerId: string, decision: 'approve' | 'reject' | 'request_changes', note?: string): ApprovalRow {
    const a = this.approvals.get(jobId); if (!a) throw new Error('not_found');
    a.reviewerId = reviewerId; a.note = note ?? null; a.decidedAt = new Date().toISOString();
    if (decision === 'approve') { a.status = 'approved'; this.transition(jobId, 'active', reviewerId); }
    else if (decision === 'reject') { a.status = 'rejected'; this.transition(jobId, 'rejected', reviewerId); }
    else { a.status = 'changes_requested'; this.transition(jobId, 'draft', reviewerId); }
    return a;
  }
  approvalQueue(tenantId: string) {
    return [...this.approvals.values()].filter((a) => a.tenantId === tenantId && a.status === 'open');
  }
  approvalFor(jobId: string) { return this.approvals.get(jobId) ?? null; }

  // ---- Idempotency ----
  consumeIdempotency(key: string, value: string): string {
    const existing = this.idempotency.get(key);
    if (existing) return existing;
    this.idempotency.set(key, value); return value;
  }

  // ---- Audit ----
  audit_push(entry: Omit<AuditRow, 'id' | 'at'>) {
    this.audit.push({ ...entry, id: randomUUID(), at: new Date().toISOString() });
  }
  auditFor(jobId: string) { return this.audit.filter((a) => a.jobId === jobId).slice(-50).reverse(); }
}
