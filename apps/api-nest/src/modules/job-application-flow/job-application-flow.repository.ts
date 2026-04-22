/**
 * Domain 25 — Job Application Flow repository.
 *
 * In-memory + seeded persistence. Real persistence lives in Drizzle migrations
 * (job_application_forms, job_application_form_fields, job_applications,
 *  job_application_responses, job_application_attachments,
 *  job_application_reviews, job_application_audit, job_application_consents).
 *
 * State machines:
 *   Application: draft → submitted → under_review → interview ↔ on_hold →
 *                offered | rejected | withdrawn → archived
 *   Form: draft → published → archived
 *   Review: open → in_review → completed
 */
import { Injectable, Logger } from '@nestjs/common';
import { randomUUID } from 'crypto';
import type { ApplicationDraft, ApplicationStatus, FormField } from './dto';

export type FormTemplateRow = {
  id: string; tenantId: string; jobId: string;
  title: string; description: string;
  fields: FormField[];
  consents: { key: string; label: string; required: boolean }[];
  status: 'draft' | 'published' | 'archived';
  version: number;
  createdAt: string; updatedAt: string;
};

export type ApplicationRow = {
  id: string; tenantId: string; jobId: string; templateId: string;
  candidateId: string; candidateName: string; candidateEmail: string;
  responses: Record<string, unknown>;
  attachments: { key: string; fileName: string; storageUrl: string; sizeBytes: number; mime: string }[];
  acceptedConsents: string[];
  voluntary?: { diversity?: Record<string, string> };
  status: ApplicationStatus;
  qualityScore: number | null;
  matchScore: number | null;
  riskFlags: string[];
  submittedAt: string | null;
  decidedAt: string | null;
  withdrawnAt: string | null;
  withdrawReason: string | null;
  createdAt: string; updatedAt: string;
  version: number;
};

export type ReviewRow = {
  id: string; applicationId: string; tenantId: string;
  reviewerId: string; reviewerName: string;
  stage: 'screening' | 'interview' | 'final' | 'offer';
  status: 'open' | 'in_review' | 'completed';
  decision: 'advance' | 'reject' | 'hold' | 'offer' | 'withdraw_invite' | null;
  note: string | null;
  scorecard: Record<string, number> | null;
  createdAt: string; decidedAt: string | null;
};

type AuditRow = { id: string; applicationId: string | null; tenantId: string; actor: string; action: string; diff: any; at: string };

const ALLOWED: Record<ApplicationStatus, ApplicationStatus[]> = {
  draft: ['submitted', 'archived'],
  submitted: ['under_review', 'withdrawn'],
  under_review: ['interview', 'on_hold', 'rejected', 'offered', 'withdrawn'],
  interview: ['offered', 'rejected', 'on_hold', 'withdrawn'],
  on_hold: ['under_review', 'interview', 'rejected', 'withdrawn'],
  offered: ['archived', 'withdrawn'],
  rejected: ['archived'],
  withdrawn: ['archived'],
  archived: [],
};

@Injectable()
export class JobApplicationFlowRepository {
  private readonly log = new Logger('JobApplicationFlowRepo');
  private templates = new Map<string, FormTemplateRow>();
  private applications = new Map<string, ApplicationRow>();
  private reviews: ReviewRow[] = [];
  private audit: AuditRow[] = [];
  private idempotency = new Map<string, string>();

  constructor() { this.seed(); }

  private seed() {
    const tenantId = 'tenant-demo';
    const jobs = [
      { jobId: 'job-be-1', title: 'Senior Backend Engineer' },
      { jobId: 'job-pd-1', title: 'Product Designer' },
    ];
    jobs.forEach((j, idx) => {
      const tplId = randomUUID();
      const tpl: FormTemplateRow = {
        id: tplId, tenantId, jobId: j.jobId,
        title: `${j.title} — Application`, description: 'Tell us about your experience.',
        fields: [
          { key: 'fullName', label: 'Full name', type: 'short_text', required: true, visibility: 'public', maxLength: 120 },
          { key: 'email', label: 'Email', type: 'email', required: true, visibility: 'public' },
          { key: 'phone', label: 'Phone', type: 'phone', required: false, visibility: 'public' },
          { key: 'linkedin', label: 'LinkedIn URL', type: 'url', required: false, visibility: 'public' },
          { key: 'coverLetter', label: 'Why are you interested?', type: 'long_text', required: true, visibility: 'public', maxLength: 4000 },
          { key: 'cv', label: 'CV / Resume', type: 'file', required: true, visibility: 'public', acceptMime: ['application/pdf', 'application/msword'] },
          { key: 'noticePeriod', label: 'Notice period', type: 'select', required: false, options: ['Immediate', '2 weeks', '1 month', '3 months'], visibility: 'public' },
          { key: 'salaryExpectation', label: 'Salary expectation (annual GBP)', type: 'number', required: false, visibility: 'public' },
        ],
        consents: [
          { key: 'data_processing', label: 'I consent to processing my application under GDPR.', required: true },
          { key: 'talent_pool', label: 'Add me to the talent pool for future roles.', required: false },
        ],
        status: 'published', version: 1,
        createdAt: new Date(Date.now() - 10 * 86_400_000).toISOString(),
        updatedAt: new Date(Date.now() - 5 * 86_400_000).toISOString(),
      };
      this.templates.set(tplId, tpl);

      const sampleApps: Array<{ name: string; email: string; status: ApplicationStatus; score: number }> = [
        { name: 'Sam Patel', email: 'sam@example.com', status: 'submitted', score: 78 },
        { name: 'Jordan Reyes', email: 'jordan@example.com', status: 'under_review', score: 82 },
        { name: 'Avery Chen', email: 'avery@example.com', status: 'interview', score: 88 },
        { name: 'Lee Morgan', email: 'lee@example.com', status: 'rejected', score: 41 },
      ];
      sampleApps.forEach((a, i) => {
        const id = randomUUID();
        const submittedAt = new Date(Date.now() - (i + 1 + idx * 2) * 86_400_000).toISOString();
        this.applications.set(id, {
          id, tenantId, jobId: j.jobId, templateId: tplId,
          candidateId: `cand-${id.slice(0, 8)}`, candidateName: a.name, candidateEmail: a.email,
          responses: { fullName: a.name, email: a.email, coverLetter: 'I am excited to apply…', noticePeriod: '1 month' },
          attachments: [{ key: 'cv', fileName: `${a.name.replace(/\s/g, '_')}.pdf`, storageUrl: `local://applications/${id}/cv.pdf`, sizeBytes: 184_320, mime: 'application/pdf' }],
          acceptedConsents: ['data_processing'],
          status: a.status,
          qualityScore: a.score, matchScore: Math.max(0, a.score - 6), riskFlags: [],
          submittedAt: a.status === 'draft' ? null : submittedAt,
          decidedAt: a.status === 'rejected' || a.status === 'offered' ? new Date().toISOString() : null,
          withdrawnAt: null, withdrawReason: null,
          createdAt: submittedAt, updatedAt: submittedAt, version: 1,
        });
        if (a.status === 'under_review' || a.status === 'interview') {
          this.reviews.push({
            id: randomUUID(), applicationId: id, tenantId,
            reviewerId: 'recruiter-1', reviewerName: 'Alex Recruiter',
            stage: a.status === 'interview' ? 'interview' : 'screening',
            status: 'in_review', decision: null, note: null, scorecard: null,
            createdAt: new Date().toISOString(), decidedAt: null,
          });
        }
      });
    });
    this.log.log(`seeded ${this.templates.size} templates, ${this.applications.size} applications`);
  }

  // -------- Templates --------
  listTemplates(tenantId: string, jobId?: string) {
    return [...this.templates.values()].filter((t) => t.tenantId === tenantId && (!jobId || t.jobId === jobId));
  }
  template(id: string) { return this.templates.get(id); }
  createTemplate(tenantId: string, payload: any): FormTemplateRow {
    const now = new Date().toISOString();
    const row: FormTemplateRow = {
      id: randomUUID(), tenantId,
      jobId: payload.jobId, title: payload.title, description: payload.description ?? '',
      fields: payload.fields, consents: payload.consents ?? [],
      status: 'draft', version: 1, createdAt: now, updatedAt: now,
    };
    this.templates.set(row.id, row); return row;
  }
  updateTemplate(id: string, patch: any): FormTemplateRow {
    const t = this.templates.get(id); if (!t) throw new Error('not_found');
    Object.assign(t, patch, { updatedAt: new Date().toISOString(), version: t.version + 1 });
    return t;
  }
  publishTemplate(id: string): FormTemplateRow {
    const t = this.templates.get(id); if (!t) throw new Error('not_found');
    t.status = 'published'; t.updatedAt = new Date().toISOString(); return t;
  }
  archiveTemplate(id: string): FormTemplateRow {
    const t = this.templates.get(id); if (!t) throw new Error('not_found');
    t.status = 'archived'; t.updatedAt = new Date().toISOString(); return t;
  }

  // -------- Applications --------
  listApplications(tenantId: string, f: { jobId?: string; status?: ApplicationStatus[]; q?: string }) {
    return [...this.applications.values()].filter((a) => {
      if (a.tenantId !== tenantId) return false;
      if (f.jobId && a.jobId !== f.jobId) return false;
      if (f.status?.length && !f.status.includes(a.status)) return false;
      if (f.q) {
        const blob = `${a.candidateName} ${a.candidateEmail} ${JSON.stringify(a.responses)}`.toLowerCase();
        if (!blob.includes(f.q.toLowerCase())) return false;
      }
      return true;
    });
  }
  application(id: string) { return this.applications.get(id); }

  createDraft(tenantId: string, candidateId: string, candidateName: string, candidateEmail: string, payload: ApplicationDraft): ApplicationRow {
    const now = new Date().toISOString();
    const row: ApplicationRow = {
      id: randomUUID(), tenantId, jobId: payload.jobId, templateId: payload.templateId,
      candidateId, candidateName, candidateEmail,
      responses: payload.responses ?? {}, attachments: payload.attachments ?? [],
      acceptedConsents: payload.acceptedConsents ?? [], voluntary: payload.voluntary,
      status: 'draft', qualityScore: null, matchScore: null, riskFlags: [],
      submittedAt: null, decidedAt: null, withdrawnAt: null, withdrawReason: null,
      createdAt: now, updatedAt: now, version: 1,
    };
    this.applications.set(row.id, row);
    this.audit.push({ id: randomUUID(), applicationId: row.id, tenantId, actor: candidateId, action: 'application.created', diff: { jobId: row.jobId }, at: now });
    return row;
  }

  updateApplication(id: string, expectedVersion: number, patch: Partial<ApplicationDraft>, actorId: string): ApplicationRow {
    const a = this.application(id); if (!a) throw new Error('not_found');
    if (a.version !== expectedVersion) throw new Error('version_conflict');
    if (a.status !== 'draft') throw new Error('immutable_after_submit');
    Object.assign(a, patch, { updatedAt: new Date().toISOString(), version: a.version + 1 });
    this.audit.push({ id: randomUUID(), applicationId: id, tenantId: a.tenantId, actor: actorId, action: 'application.updated', diff: patch, at: a.updatedAt });
    return a;
  }

  transition(id: string, next: ApplicationStatus, actorId: string): ApplicationRow {
    const a = this.application(id); if (!a) throw new Error('not_found');
    if (!ALLOWED[a.status].includes(next)) throw new Error(`invalid_transition:${a.status}->${next}`);
    a.status = next; a.updatedAt = new Date().toISOString(); a.version += 1;
    if (next === 'submitted' && !a.submittedAt) a.submittedAt = a.updatedAt;
    if (next === 'offered' || next === 'rejected') a.decidedAt = a.updatedAt;
    if (next === 'withdrawn' && !a.withdrawnAt) a.withdrawnAt = a.updatedAt;
    this.audit.push({ id: randomUUID(), applicationId: id, tenantId: a.tenantId, actor: actorId, action: `application.${next}`, diff: null, at: a.updatedAt });
    return a;
  }

  setScores(id: string, qualityScore: number, matchScore: number, riskFlags: string[]) {
    const a = this.application(id); if (!a) return;
    a.qualityScore = qualityScore; a.matchScore = matchScore; a.riskFlags = riskFlags;
    a.updatedAt = new Date().toISOString();
  }

  consumeIdempotency(key: string, value: string): string {
    const existing = this.idempotency.get(key);
    if (existing) return existing;
    this.idempotency.set(key, value); return value;
  }

  // -------- Reviews --------
  addReview(applicationId: string, reviewerId: string, reviewerName: string, stage: ReviewRow['stage']): ReviewRow {
    const a = this.application(applicationId); if (!a) throw new Error('not_found');
    const r: ReviewRow = {
      id: randomUUID(), applicationId, tenantId: a.tenantId, reviewerId, reviewerName,
      stage, status: 'in_review', decision: null, note: null, scorecard: null,
      createdAt: new Date().toISOString(), decidedAt: null,
    };
    this.reviews.push(r); return r;
  }

  decideReview(applicationId: string, reviewerId: string, decision: ReviewRow['decision'], note: string | null, scorecard: Record<string, number> | null): ReviewRow {
    let r = [...this.reviews].reverse().find((x) => x.applicationId === applicationId && x.status !== 'completed');
    if (!r) {
      const a = this.application(applicationId); if (!a) throw new Error('not_found');
      r = this.addReview(applicationId, reviewerId, 'Reviewer', 'screening');
    }
    r.decision = decision; r.note = note; r.scorecard = scorecard;
    r.status = 'completed'; r.decidedAt = new Date().toISOString();
    return r;
  }

  reviewsFor(applicationId: string) {
    return this.reviews.filter((r) => r.applicationId === applicationId).sort((a, b) => +new Date(a.createdAt) - +new Date(b.createdAt));
  }

  reviewQueue(tenantId: string) {
    return [...this.applications.values()]
      .filter((a) => a.tenantId === tenantId && (a.status === 'submitted' || a.status === 'under_review' || a.status === 'on_hold'))
      .sort((a, b) => (b.qualityScore ?? 0) - (a.qualityScore ?? 0));
  }

  auditFor(applicationId: string) { return this.audit.filter((a) => a.applicationId === applicationId).slice(-50).reverse(); }
}
