/**
 * Domain 30-hiring repository — in-memory + seeded persistence aligned to the
 * Drizzle/Postgres schema in `packages/db/src/schema/hiring-workspace.ts` and
 * the migration in `apps/api-nest/migrations/2026xxxx_d30_hiring_workspace.sql`.
 *
 * Tables modelled:
 *   - ehw_workspaces
 *   - ehw_workspace_members
 *   - ehw_chain_templates
 *   - ehw_approval_requests
 *   - ehw_approval_steps
 *   - ehw_approval_decisions
 *   - ehw_threads
 *   - ehw_thread_messages
 *   - ehw_audit
 *
 * Postgres path lands behind the same interface (env-flag swap). Default in
 * non-test environments is the Postgres adapter once `DATABASE_URL` is set.
 */
import { Injectable, Logger } from '@nestjs/common';
import { randomUUID } from 'crypto';
import type {
  ApprovalRequestStatus, ApprovalStepStatus, ChainTemplateStatus,
  MemberRole, ThreadStatus, WorkspaceStatus, ApprovalSubjectKind,
} from './dto';

export type WorkspaceRow = {
  id: string; tenantId: string;
  name: string; department: string; description: string;
  status: WorkspaceStatus;
  hiringManagerId: string;
  defaultChainTemplateId: string | null;
  budgetAnnualGbp: number | null;
  targetHires: number;
  urgencyScore: number | null;
  createdAt: string; updatedAt: string; version: number; createdBy: string;
};

export type MembershipRow = {
  id: string; workspaceId: string; userId: string;
  role: MemberRole; displayName: string | null; addedAt: string;
};

export type ChainTemplateRow = {
  id: string; tenantId: string; workspaceId: string;
  name: string; description: string;
  status: ChainTemplateStatus;
  steps: Array<{
    key: string; label: string; approverIds: string[];
    rule: 'any' | 'all'; slaHours: number;
    escalateToId: string | null; required: boolean;
  }>;
  createdAt: string; updatedAt: string; version: number;
};

export type ApprovalStepRow = {
  id: string; requestId: string; key: string; label: string; position: number;
  approverIds: string[]; rule: 'any' | 'all'; slaHours: number;
  escalateToId: string | null; required: boolean;
  status: ApprovalStepStatus;
  decidedAt: string | null; decisionsCount: number;
};

export type ApprovalRequestRow = {
  id: string; tenantId: string; workspaceId: string; templateId: string;
  subjectKind: ApprovalSubjectKind; subjectId: string; subjectLabel: string;
  context: Record<string, unknown>;
  rationale: string;
  urgency: 'low' | 'normal' | 'high' | 'urgent';
  status: ApprovalRequestStatus;
  currentStepIdx: number;
  riskScore: number | null;
  riskReasons: string[];
  dueAt: string | null;
  cancelReason: string | null;
  createdAt: string; updatedAt: string; createdBy: string; version: number;
};

export type ApprovalDecisionRow = {
  id: string; requestId: string; stepId: string; approverId: string;
  decision: 'approve' | 'reject' | 'escalate' | 'request_changes';
  note: string | null; at: string;
};

export type ThreadRow = {
  id: string; tenantId: string; workspaceId: string;
  subjectKind: string; subjectId: string | null;
  title: string;
  status: ThreadStatus;
  participantIds: string[];
  privacy: 'workspace' | 'restricted';
  createdBy: string; createdAt: string; updatedAt: string;
  unreadCount: number;
};

export type ThreadMessageRow = {
  id: string; threadId: string; authorId: string;
  body: string; mentions: string[]; at: string;
};

type AuditRow = {
  id: string; tenantId: string; workspaceId: string | null;
  actor: string; action: string; entity: string; entityId: string;
  diff: any; at: string;
};

const REQ_ALLOWED: Record<ApprovalRequestStatus, ApprovalRequestStatus[]> = {
  pending: ['in_review', 'cancelled', 'expired'],
  in_review: ['approved', 'rejected', 'cancelled', 'expired'],
  approved: [], rejected: [], cancelled: [], expired: [],
};

const WS_ALLOWED: Record<WorkspaceStatus, WorkspaceStatus[]> = {
  draft: ['active', 'archived'],
  active: ['archived'],
  archived: ['active'],
};

@Injectable()
export class EnterpriseHiringWorkspaceRepository {
  private readonly log = new Logger('EHWRepo');
  private readonly workspaces = new Map<string, WorkspaceRow>();
  private readonly memberships = new Map<string, MembershipRow>();
  private readonly templates = new Map<string, ChainTemplateRow>();
  private readonly requests = new Map<string, ApprovalRequestRow>();
  private readonly steps = new Map<string, ApprovalStepRow>();
  private readonly decisions = new Map<string, ApprovalDecisionRow>();
  private readonly threads = new Map<string, ThreadRow>();
  private readonly messages = new Map<string, ThreadMessageRow>();
  private readonly audit: AuditRow[] = [];

  constructor() { this.seed(); }

  /* ── Workspace ─── */
  createWorkspace(tenantId: string, actor: string, dto: any): WorkspaceRow {
    const now = new Date().toISOString();
    const row: WorkspaceRow = {
      id: `ws_${randomUUID()}`, tenantId, name: dto.name, department: dto.department,
      description: dto.description ?? '', status: 'draft', hiringManagerId: dto.hiringManagerId,
      defaultChainTemplateId: dto.defaultChainTemplateId ?? null,
      budgetAnnualGbp: dto.budgetAnnualGbp ?? null,
      targetHires: dto.targetHires ?? 1,
      urgencyScore: null,
      createdAt: now, updatedAt: now, version: 1, createdBy: actor,
    };
    this.workspaces.set(row.id, row);
    // seed memberships
    this.upsertMembership(row.id, { userId: dto.hiringManagerId, role: 'hiring_manager' });
    for (const id of dto.recruiterIds ?? []) this.upsertMembership(row.id, { userId: id, role: 'recruiter' });
    for (const id of dto.approverIds ?? []) this.upsertMembership(row.id, { userId: id, role: 'approver' });
    for (const id of dto.observerIds ?? []) this.upsertMembership(row.id, { userId: id, role: 'observer' });
    this.log.log(`workspace.create ${row.id}`);
    return row;
  }

  updateWorkspace(id: string, expectedVersion: number, patch: any): WorkspaceRow | null {
    const row = this.workspaces.get(id);
    if (!row) return null;
    if (row.version !== expectedVersion) throw new Error(`version_conflict_expected_${row.version}`);
    const next: WorkspaceRow = { ...row, ...patch, updatedAt: new Date().toISOString(), version: row.version + 1 };
    this.workspaces.set(id, next);
    return next;
  }

  transitionWorkspace(id: string, next: WorkspaceStatus): WorkspaceRow | null {
    const row = this.workspaces.get(id);
    if (!row) return null;
    if (!WS_ALLOWED[row.status].includes(next)) throw new Error(`invalid_transition_${row.status}_to_${next}`);
    const updated = { ...row, status: next, updatedAt: new Date().toISOString(), version: row.version + 1 };
    this.workspaces.set(id, updated);
    return updated;
  }

  listWorkspaces(tenantId: string, f: any) {
    let items = [...this.workspaces.values()].filter((w) => w.tenantId === tenantId);
    if (f.status?.length) items = items.filter((w) => f.status.includes(w.status));
    if (f.department) items = items.filter((w) => w.department === f.department);
    if (f.hiringManagerId) items = items.filter((w) => w.hiringManagerId === f.hiringManagerId);
    if (f.q) {
      const q = String(f.q).toLowerCase();
      items = items.filter((w) => w.name.toLowerCase().includes(q) || w.description.toLowerCase().includes(q));
    }
    items.sort((a, b) => {
      if (f.sort === 'name') return a.name.localeCompare(b.name);
      if (f.sort === 'created') return b.createdAt.localeCompare(a.createdAt);
      if (f.sort === 'urgency') return (b.urgencyScore ?? 0) - (a.urgencyScore ?? 0);
      return b.updatedAt.localeCompare(a.updatedAt);
    });
    const total = items.length;
    const start = (f.page - 1) * f.pageSize;
    return { items: items.slice(start, start + f.pageSize), total, page: f.page, pageSize: f.pageSize };
  }

  getWorkspace(id: string) { return this.workspaces.get(id) ?? null; }
  setUrgencyScore(id: string, score: number) {
    const row = this.workspaces.get(id);
    if (!row) return;
    this.workspaces.set(id, { ...row, urgencyScore: score, updatedAt: new Date().toISOString() });
  }

  /* ── Memberships ─── */
  listMembers(workspaceId: string) {
    return [...this.memberships.values()].filter((m) => m.workspaceId === workspaceId);
  }
  upsertMembership(workspaceId: string, m: any): MembershipRow {
    const existing = [...this.memberships.values()].find((x) => x.workspaceId === workspaceId && x.userId === m.userId);
    if (existing) {
      const next = { ...existing, role: m.role as MemberRole, displayName: m.displayName ?? existing.displayName };
      this.memberships.set(existing.id, next);
      return next;
    }
    const row: MembershipRow = {
      id: `mb_${randomUUID()}`, workspaceId, userId: m.userId, role: m.role as MemberRole,
      displayName: m.displayName ?? null, addedAt: new Date().toISOString(),
    };
    this.memberships.set(row.id, row);
    return row;
  }
  removeMembership(workspaceId: string, userId: string) {
    const existing = [...this.memberships.values()].find((x) => x.workspaceId === workspaceId && x.userId === userId);
    if (!existing) return false;
    this.memberships.delete(existing.id);
    return true;
  }

  /* ── Chain templates ─── */
  createTemplate(tenantId: string, dto: any): ChainTemplateRow {
    const now = new Date().toISOString();
    const row: ChainTemplateRow = {
      id: `tpl_${randomUUID()}`, tenantId, workspaceId: dto.workspaceId,
      name: dto.name, description: dto.description ?? '',
      status: 'draft',
      steps: (dto.steps as any[]).map((s) => ({
        key: s.key, label: s.label, approverIds: s.approverIds,
        rule: s.rule ?? 'any', slaHours: s.slaHours ?? 48,
        escalateToId: s.escalateToId ?? null, required: s.required ?? true,
      })),
      createdAt: now, updatedAt: now, version: 1,
    };
    this.templates.set(row.id, row);
    return row;
  }
  updateTemplate(id: string, patch: any): ChainTemplateRow | null {
    const row = this.templates.get(id);
    if (!row) return null;
    const next: ChainTemplateRow = {
      ...row, ...patch,
      steps: patch.steps ? (patch.steps as any[]).map((s) => ({
        key: s.key, label: s.label, approverIds: s.approverIds,
        rule: s.rule ?? 'any', slaHours: s.slaHours ?? 48,
        escalateToId: s.escalateToId ?? null, required: s.required ?? true,
      })) : row.steps,
      updatedAt: new Date().toISOString(), version: row.version + 1,
    };
    this.templates.set(id, next);
    return next;
  }
  setTemplateStatus(id: string, status: ChainTemplateStatus): ChainTemplateRow | null {
    const row = this.templates.get(id);
    if (!row) return null;
    const next = { ...row, status, updatedAt: new Date().toISOString() };
    this.templates.set(id, next);
    return next;
  }
  listTemplates(tenantId: string, f: any) {
    let items = [...this.templates.values()].filter((t) => t.tenantId === tenantId);
    if (f.workspaceId) items = items.filter((t) => t.workspaceId === f.workspaceId);
    if (f.status?.length) items = items.filter((t) => f.status.includes(t.status));
    if (f.q) {
      const q = String(f.q).toLowerCase();
      items = items.filter((t) => t.name.toLowerCase().includes(q));
    }
    items.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
    const total = items.length;
    const start = (f.page - 1) * f.pageSize;
    return { items: items.slice(start, start + f.pageSize), total, page: f.page, pageSize: f.pageSize };
  }
  getTemplate(id: string) { return this.templates.get(id) ?? null; }

  /* ── Approval requests + steps ─── */
  createRequest(tenantId: string, actor: string, dto: any, template: ChainTemplateRow): ApprovalRequestRow {
    const now = new Date().toISOString();
    const id = `apr_${randomUUID()}`;
    const row: ApprovalRequestRow = {
      id, tenantId, workspaceId: dto.workspaceId, templateId: dto.templateId,
      subjectKind: dto.subjectKind, subjectId: dto.subjectId, subjectLabel: dto.subjectLabel,
      context: dto.context ?? {}, rationale: dto.rationale ?? '',
      urgency: dto.urgency ?? 'normal', status: 'pending',
      currentStepIdx: 0, riskScore: null, riskReasons: [],
      dueAt: dto.dueAt ?? null, cancelReason: null,
      createdAt: now, updatedAt: now, createdBy: actor, version: 1,
    };
    this.requests.set(id, row);
    template.steps.forEach((s, idx) => {
      const stepId = `aps_${randomUUID()}`;
      this.steps.set(stepId, {
        id: stepId, requestId: id, key: s.key, label: s.label, position: idx,
        approverIds: s.approverIds, rule: s.rule, slaHours: s.slaHours,
        escalateToId: s.escalateToId, required: s.required,
        status: idx === 0 ? 'in_review' : 'pending',
        decidedAt: null, decisionsCount: 0,
      });
    });
    if (template.steps.length) {
      row.status = 'in_review';
      this.requests.set(id, row);
    }
    return row;
  }

  listRequests(tenantId: string, f: any) {
    let items = [...this.requests.values()].filter((r) => r.tenantId === tenantId);
    if (f.workspaceId) items = items.filter((r) => r.workspaceId === f.workspaceId);
    if (f.status?.length) items = items.filter((r) => f.status.includes(r.status));
    if (f.subjectKind?.length) items = items.filter((r) => f.subjectKind.includes(r.subjectKind));
    if (f.urgency) items = items.filter((r) => r.urgency === f.urgency);
    if (f.approverId) {
      const stepReqIds = new Set(
        [...this.steps.values()]
          .filter((s) => s.approverIds.includes(f.approverId) && s.status !== 'pending')
          .map((s) => s.requestId),
      );
      items = items.filter((r) => stepReqIds.has(r.id));
    }
    if (f.q) {
      const q = String(f.q).toLowerCase();
      items = items.filter((r) => r.subjectLabel.toLowerCase().includes(q) || r.rationale.toLowerCase().includes(q));
    }
    items.sort((a, b) => {
      if (f.sort === 'created') return b.createdAt.localeCompare(a.createdAt);
      if (f.sort === 'due') return (a.dueAt ?? '').localeCompare(b.dueAt ?? '');
      if (f.sort === 'urgency') {
        const order = { urgent: 0, high: 1, normal: 2, low: 3 } as const;
        return order[a.urgency] - order[b.urgency];
      }
      return b.updatedAt.localeCompare(a.updatedAt);
    });
    const total = items.length;
    const start = (f.page - 1) * f.pageSize;
    return { items: items.slice(start, start + f.pageSize), total, page: f.page, pageSize: f.pageSize };
  }

  getRequest(id: string) { return this.requests.get(id) ?? null; }
  listSteps(requestId: string) {
    return [...this.steps.values()].filter((s) => s.requestId === requestId).sort((a, b) => a.position - b.position);
  }
  listDecisions(requestId: string) {
    return [...this.decisions.values()].filter((d) => d.requestId === requestId).sort((a, b) => a.at.localeCompare(b.at));
  }
  getStep(id: string) { return this.steps.get(id) ?? null; }
  saveStep(s: ApprovalStepRow) { this.steps.set(s.id, s); return s; }
  saveRequest(r: ApprovalRequestRow) { this.requests.set(r.id, { ...r, updatedAt: new Date().toISOString(), version: r.version + 1 }); return this.requests.get(r.id)!; }
  recordDecision(d: ApprovalDecisionRow) { this.decisions.set(d.id, d); return d; }

  setRiskScore(requestId: string, score: number, reasons: string[]) {
    const r = this.requests.get(requestId);
    if (!r) return;
    this.requests.set(requestId, { ...r, riskScore: score, riskReasons: reasons, updatedAt: new Date().toISOString() });
  }

  cancelRequest(id: string, reason?: string) {
    const r = this.requests.get(id);
    if (!r) return null;
    if (!REQ_ALLOWED[r.status].includes('cancelled')) throw new Error(`invalid_transition_${r.status}_to_cancelled`);
    const next = { ...r, status: 'cancelled' as const, cancelReason: reason ?? null, updatedAt: new Date().toISOString(), version: r.version + 1 };
    this.requests.set(id, next);
    // mark remaining steps skipped
    for (const s of this.listSteps(id)) {
      if (s.status === 'pending' || s.status === 'in_review') this.steps.set(s.id, { ...s, status: 'skipped' });
    }
    return next;
  }

  expireRequests(now = Date.now()) {
    let expired = 0;
    for (const r of this.requests.values()) {
      if ((r.status === 'pending' || r.status === 'in_review') && r.dueAt && Date.parse(r.dueAt) < now) {
        this.requests.set(r.id, { ...r, status: 'expired', updatedAt: new Date().toISOString(), version: r.version + 1 });
        for (const s of this.listSteps(r.id)) {
          if (s.status === 'pending' || s.status === 'in_review') this.steps.set(s.id, { ...s, status: 'skipped' });
        }
        expired++;
      }
    }
    return expired;
  }

  /* ── Threads ─── */
  createThread(tenantId: string, actor: string, dto: any): ThreadRow {
    const now = new Date().toISOString();
    const row: ThreadRow = {
      id: `thr_${randomUUID()}`, tenantId, workspaceId: dto.workspaceId,
      subjectKind: dto.subjectKind, subjectId: dto.subjectId ?? null,
      title: dto.title, status: 'open',
      participantIds: Array.from(new Set([actor, ...(dto.participantIds ?? [])])),
      privacy: dto.privacy ?? 'workspace',
      createdBy: actor, createdAt: now, updatedAt: now, unreadCount: 0,
    };
    this.threads.set(row.id, row);
    return row;
  }
  postMessage(threadId: string, authorId: string, dto: any): ThreadMessageRow | null {
    const t = this.threads.get(threadId);
    if (!t) return null;
    const m: ThreadMessageRow = {
      id: `msg_${randomUUID()}`, threadId, authorId,
      body: dto.body, mentions: dto.mentions ?? [], at: new Date().toISOString(),
    };
    this.messages.set(m.id, m);
    this.threads.set(threadId, { ...t, updatedAt: m.at, unreadCount: t.unreadCount + 1 });
    return m;
  }
  setThreadStatus(threadId: string, next: ThreadStatus): ThreadRow | null {
    const t = this.threads.get(threadId);
    if (!t) return null;
    const updated = { ...t, status: next, updatedAt: new Date().toISOString() };
    this.threads.set(threadId, updated);
    return updated;
  }
  listThreads(tenantId: string, f: any) {
    let items = [...this.threads.values()].filter((t) => t.tenantId === tenantId);
    if (f.workspaceId) items = items.filter((t) => t.workspaceId === f.workspaceId);
    if (f.subjectKind) items = items.filter((t) => t.subjectKind === f.subjectKind);
    if (f.subjectId) items = items.filter((t) => t.subjectId === f.subjectId);
    if (f.status?.length) items = items.filter((t) => f.status.includes(t.status));
    if (f.participantId) items = items.filter((t) => t.participantIds.includes(f.participantId));
    if (f.q) {
      const q = String(f.q).toLowerCase();
      items = items.filter((t) => t.title.toLowerCase().includes(q));
    }
    items.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
    const total = items.length;
    const start = (f.page - 1) * f.pageSize;
    return { items: items.slice(start, start + f.pageSize), total, page: f.page, pageSize: f.pageSize };
  }
  getThread(id: string) { return this.threads.get(id) ?? null; }
  listMessages(threadId: string) {
    return [...this.messages.values()].filter((m) => m.threadId === threadId).sort((a, b) => a.at.localeCompare(b.at));
  }

  /* ── Audit ─── */
  recordAudit(row: Omit<AuditRow, 'id' | 'at'>) {
    this.audit.push({ ...row, id: `aud_${randomUUID()}`, at: new Date().toISOString() });
    if (this.audit.length > 5000) this.audit.shift();
  }
  listAudit(workspaceId: string, limit = 100) {
    return this.audit.filter((a) => a.workspaceId === workspaceId).slice(-limit).reverse();
  }

  /* ── Seed for demo + tests ─── */
  private seed() {
    const tenantId = 'tenant-demo';
    const ws = this.createWorkspace(tenantId, 'rec-alex', {
      name: 'Engineering Hiring Q2', department: 'Engineering',
      description: 'Backend + platform hires for FY26 Q2.',
      hiringManagerId: 'usr-hm-1',
      recruiterIds: ['rec-alex', 'rec-jordan'],
      approverIds: ['usr-vp-eng', 'usr-cfo'],
      observerIds: ['usr-cto'],
      budgetAnnualGbp: 850_000, targetHires: 6,
    });
    this.transitionWorkspace(ws.id, 'active');
    const tpl = this.createTemplate(tenantId, {
      workspaceId: ws.id, name: 'Standard 3-step approval',
      description: 'Hiring Manager → VP Eng → CFO',
      steps: [
        { key: 'hm', label: 'Hiring Manager review', approverIds: ['usr-hm-1'], rule: 'any', slaHours: 24, required: true },
        { key: 'vp', label: 'VP Engineering sign-off', approverIds: ['usr-vp-eng'], rule: 'any', slaHours: 48, required: true },
        { key: 'cfo', label: 'CFO budget approval', approverIds: ['usr-cfo'], rule: 'any', slaHours: 72, required: true },
      ],
    });
    this.setTemplateStatus(tpl.id, 'published');
    this.workspaces.set(ws.id, { ...this.workspaces.get(ws.id)!, defaultChainTemplateId: tpl.id });

    const r = this.createRequest(tenantId, 'rec-alex', {
      workspaceId: ws.id, templateId: tpl.id,
      subjectKind: 'requisition', subjectId: 'req-001',
      subjectLabel: 'Senior Backend Engineer (London)',
      context: { headcount: 1, salaryBand: '£95k–£120k' },
      rationale: 'Backfill for departure + scope growth on payments.',
      urgency: 'high',
    }, tpl);
    void r;

    const t = this.createThread(tenantId, 'rec-alex', {
      workspaceId: ws.id, subjectKind: 'requisition', subjectId: 'req-001',
      title: 'Headcount rationale for Senior Backend Engineer',
      body: 'Posting before sign-off to gather feedback.',
      participantIds: ['usr-hm-1', 'usr-vp-eng'], privacy: 'workspace',
    });
    this.postMessage(t.id, 'usr-hm-1', { body: 'Strong support. Looping in VP for the budget conversation.', mentions: ['usr-vp-eng'] });
  }
}
