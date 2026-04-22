/**
 * Domain 30-hiring application service.
 *
 * Surfaces:
 *   - workspace CRUD with optimistic concurrency + state machine
 *   - membership upsert/remove with role-aware policies
 *   - chain-template CRUD + publish/archive
 *   - approval requests (create from template, decision flow, escalate, expire)
 *   - collaboration threads (post, mention, resolve, close)
 *   - dashboard analytics + ML-explained risk score
 *
 * Realtime via NotificationsGateway:
 *   workspace.created/updated/transitioned, member.upserted/removed,
 *   chain-template.created/updated/published/archived,
 *   approval.requested/decided/escalated/cancelled/expired,
 *   thread.created/message/resolved/closed
 *
 * Outbound webhook publishing + cross-domain bus emissions are wired through
 * D30HiringEmit (see domain-bus/domain-emissions.ts) on every meaningful
 * transition.
 */
import { ForbiddenException, Inject, Injectable, Logger, NotFoundException, Optional } from '@nestjs/common';
import { EnterpriseHiringWorkspaceRepository } from './enterprise-hiring-workspace.repository';
import { EnterpriseHiringWorkspaceMlService } from './enterprise-hiring-workspace.ml.service';
import { EnterpriseHiringWorkspaceAnalyticsService } from './enterprise-hiring-workspace.analytics.service';
import { D30HiringEmit } from '../domain-bus/d30-hiring-emissions';

@Injectable()
export class EnterpriseHiringWorkspaceService {
  private readonly log = new Logger('EHWSvc');
  constructor(
    private readonly repo: EnterpriseHiringWorkspaceRepository,
    private readonly ml: EnterpriseHiringWorkspaceMlService,
    private readonly analytics: EnterpriseHiringWorkspaceAnalyticsService,
    @Optional() @Inject('NOTIFICATIONS_GATEWAY') private readonly gateway?: {
      emitToTopic: (t: string, e: string, p: any) => void;
      emitToUser: (u: string, e: string, p: any) => void;
      emitToEntity: (k: string, id: string, e: string, p: any) => void;
    },
  ) {}

  /* ── Workspace ─── */
  list(tenantId: string, f: any) { return this.repo.listWorkspaces(tenantId, f); }
  detail(id: string) {
    const ws = this.repo.getWorkspace(id);
    if (!ws) throw new NotFoundException('workspace_not_found');
    const members = this.repo.listMembers(id);
    return { workspace: ws, members };
  }
  create(tenantId: string, actor: string, dto: any) {
    const ws = this.repo.createWorkspace(tenantId, actor, dto);
    this.repo.recordAudit({ tenantId, workspaceId: ws.id, actor, action: 'workspace.create', entity: 'workspace', entityId: ws.id, diff: dto });
    this.gateway?.emitToTopic(`tenant:${tenantId}`, 'workspace.created', { id: ws.id });
    void D30HiringEmit.workspaceCreated(tenantId, ws.id, { name: ws.name, hiringManagerId: ws.hiringManagerId });
    return ws;
  }
  update(id: string, expectedVersion: number, patch: any, actor: string) {
    const ws = this.repo.getWorkspace(id);
    if (!ws) throw new NotFoundException('workspace_not_found');
    const next = this.repo.updateWorkspace(id, expectedVersion, patch);
    this.repo.recordAudit({ tenantId: ws.tenantId, workspaceId: ws.id, actor, action: 'workspace.update', entity: 'workspace', entityId: ws.id, diff: patch });
    this.gateway?.emitToEntity('workspace', id, 'workspace.updated', next);
    void D30HiringEmit.workspaceUpdated(ws.tenantId, id, { fields: Object.keys(patch ?? {}) });
    return next;
  }
  transitionWorkspace(id: string, next: string, actor: string, reason?: string) {
    const ws = this.repo.getWorkspace(id);
    if (!ws) throw new NotFoundException('workspace_not_found');
    const updated = this.repo.transitionWorkspace(id, next as any);
    this.repo.recordAudit({ tenantId: ws.tenantId, workspaceId: ws.id, actor, action: `workspace.${next}`, entity: 'workspace', entityId: ws.id, diff: { reason } });
    this.gateway?.emitToEntity('workspace', id, 'workspace.transitioned', { from: ws.status, to: next, reason });
    void D30HiringEmit.workspaceTransitioned(ws.tenantId, id, { from: ws.status, to: next, reason: reason ?? null });
    return updated;
  }
  bulk(tenantId: string, actor: string, dto: any) {
    const results: Array<{ id: string; ok: boolean; error?: string }> = [];
    for (const id of dto.ids) {
      try {
        if (dto.action === 'archive') this.transitionWorkspace(id, 'archived', actor, dto.reason);
        else this.transitionWorkspace(id, 'active', actor, dto.reason);
        results.push({ id, ok: true });
      } catch (e) { results.push({ id, ok: false, error: (e as Error).message }); }
    }
    return { results };
  }

  /* ── Members ─── */
  members(workspaceId: string) { return { items: this.repo.listMembers(workspaceId) }; }
  upsertMember(workspaceId: string, dto: any, actor: string) {
    const ws = this.repo.getWorkspace(workspaceId);
    if (!ws) throw new NotFoundException('workspace_not_found');
    // Owners (hiring manager) cannot self-demote
    if (dto.userId === ws.hiringManagerId && dto.role !== 'hiring_manager') {
      throw new ForbiddenException('hiring_manager_cannot_self_demote');
    }
    const m = this.repo.upsertMembership(workspaceId, dto);
    this.repo.recordAudit({ tenantId: ws.tenantId, workspaceId, actor, action: 'member.upsert', entity: 'member', entityId: m.id, diff: dto });
    this.gateway?.emitToEntity('workspace', workspaceId, 'member.upserted', m);
    void D30HiringEmit.memberUpserted(ws.tenantId, m.id, { workspaceId, userId: m.userId, role: m.role });
    return m;
  }
  removeMember(workspaceId: string, userId: string, actor: string) {
    const ws = this.repo.getWorkspace(workspaceId);
    if (!ws) throw new NotFoundException('workspace_not_found');
    if (userId === ws.hiringManagerId) throw new ForbiddenException('cannot_remove_hiring_manager');
    const ok = this.repo.removeMembership(workspaceId, userId);
    if (!ok) throw new NotFoundException('member_not_found');
    this.repo.recordAudit({ tenantId: ws.tenantId, workspaceId, actor, action: 'member.remove', entity: 'member', entityId: userId, diff: {} });
    this.gateway?.emitToEntity('workspace', workspaceId, 'member.removed', { userId });
    void D30HiringEmit.memberRemoved(ws.tenantId, `${workspaceId}:${userId}`, { workspaceId, userId });
    return { ok: true };
  }

  /* ── Chain templates ─── */
  listTemplates(tenantId: string, f: any) { return this.repo.listTemplates(tenantId, f); }
  templateDetail(id: string) {
    const t = this.repo.getTemplate(id);
    if (!t) throw new NotFoundException('template_not_found');
    return t;
  }
  createTemplate(tenantId: string, actor: string, dto: any) {
    const t = this.repo.createTemplate(tenantId, dto);
    this.repo.recordAudit({ tenantId, workspaceId: dto.workspaceId, actor, action: 'chain-template.create', entity: 'chain-template', entityId: t.id, diff: { name: t.name, steps: t.steps.length } });
    this.gateway?.emitToEntity('workspace', dto.workspaceId, 'chain-template.created', t);
    void D30HiringEmit.chainTemplateCreated(tenantId, t.id, { workspaceId: dto.workspaceId, steps: t.steps.length });
    return t;
  }
  updateTemplate(id: string, patch: any, actor: string) {
    const t = this.repo.getTemplate(id);
    if (!t) throw new NotFoundException('template_not_found');
    if (t.status === 'archived') throw new ForbiddenException('template_archived');
    const next = this.repo.updateTemplate(id, patch);
    this.repo.recordAudit({ tenantId: t.tenantId, workspaceId: t.workspaceId, actor, action: 'chain-template.update', entity: 'chain-template', entityId: id, diff: patch });
    this.gateway?.emitToEntity('workspace', t.workspaceId, 'chain-template.updated', next);
    void D30HiringEmit.chainTemplateUpdated(t.tenantId, id, { fields: Object.keys(patch ?? {}) });
    return next;
  }
  setTemplateStatus(id: string, status: 'draft' | 'published' | 'archived', actor: string) {
    const t = this.repo.getTemplate(id);
    if (!t) throw new NotFoundException('template_not_found');
    const next = this.repo.setTemplateStatus(id, status);
    this.repo.recordAudit({ tenantId: t.tenantId, workspaceId: t.workspaceId, actor, action: `chain-template.${status}`, entity: 'chain-template', entityId: id, diff: {} });
    this.gateway?.emitToEntity('workspace', t.workspaceId, `chain-template.${status}`, next);
    if (status === 'published') void D30HiringEmit.chainTemplatePublished(t.tenantId, id, { workspaceId: t.workspaceId });
    if (status === 'archived') void D30HiringEmit.chainTemplateArchived(t.tenantId, id, { workspaceId: t.workspaceId });
    return next;
  }

  /* ── Approval requests ─── */
  listRequests(tenantId: string, f: any) { return this.repo.listRequests(tenantId, f); }
  async requestDetail(id: string) {
    const r = this.repo.getRequest(id);
    if (!r) throw new NotFoundException('request_not_found');
    return {
      request: r,
      steps: this.repo.listSteps(id),
      decisions: this.repo.listDecisions(id),
    };
  }
  async createRequest(tenantId: string, actor: string, dto: any) {
    const tpl = this.repo.getTemplate(dto.templateId);
    if (!tpl) throw new NotFoundException('template_not_found');
    if (tpl.status !== 'published') throw new ForbiddenException('template_not_published');
    const r = this.repo.createRequest(tenantId, actor, dto, tpl);
    // ML risk score (non-blocking but awaited briefly with timeout fallback)
    try {
      const score = await this.ml.scoreApproval({
        request: { urgency: r.urgency, subjectKind: r.subjectKind, context: r.context, dueAt: r.dueAt, createdAt: r.createdAt },
        template: { steps: tpl.steps },
      });
      this.repo.setRiskScore(r.id, score.score, score.reasons);
    } catch (e) { this.log.warn(`ml.scoreApproval failed: ${(e as Error).message}`); }
    this.repo.recordAudit({ tenantId, workspaceId: dto.workspaceId, actor, action: 'approval.request', entity: 'approval-request', entityId: r.id, diff: { templateId: dto.templateId, subjectKind: dto.subjectKind } });
    this.gateway?.emitToEntity('workspace', dto.workspaceId, 'approval.requested', r);
    void D30HiringEmit.approvalRequested(tenantId, r.id, { workspaceId: dto.workspaceId, subjectKind: dto.subjectKind, subjectId: dto.subjectId, urgency: r.urgency });
    // Notify first-step approvers
    const firstStep = this.repo.listSteps(r.id)[0];
    if (firstStep) for (const a of firstStep.approverIds) this.gateway?.emitToUser(a, 'approval.assigned', { requestId: r.id, stepId: firstStep.id });
    return this.repo.getRequest(r.id);
  }

  decide(requestId: string, approverId: string, dto: any) {
    const r = this.repo.getRequest(requestId);
    if (!r) throw new NotFoundException('request_not_found');
    if (r.status !== 'in_review' && r.status !== 'pending') throw new ForbiddenException(`request_${r.status}`);
    const steps = this.repo.listSteps(requestId);
    const current = steps[r.currentStepIdx];
    if (!current) throw new NotFoundException('current_step_missing');
    if (!current.approverIds.includes(approverId)) throw new ForbiddenException('not_an_approver_for_step');
    const decision = this.repo.recordDecision({
      id: `dec_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      requestId, stepId: current.id, approverId,
      decision: dto.decision, note: dto.note ?? null, at: new Date().toISOString(),
    });
    let stepNext = { ...current, decisionsCount: current.decisionsCount + 1 } as any;

    if (dto.decision === 'reject') {
      stepNext.status = 'rejected'; stepNext.decidedAt = decision.at;
      this.repo.saveStep(stepNext);
      const updated = this.repo.saveRequest({ ...r, status: 'rejected' });
      this.repo.recordAudit({ tenantId: r.tenantId, workspaceId: r.workspaceId, actor: approverId, action: 'approval.rejected', entity: 'approval-request', entityId: requestId, diff: { stepKey: current.key } });
      this.gateway?.emitToEntity('approval-request', requestId, 'approval.decided', { decision: 'rejected', step: current.key });
      void D30HiringEmit.approvalDecided(r.tenantId, requestId, { decision: 'rejected', step: current.key, approverId });
      return updated;
    }
    if (dto.decision === 'escalate') {
      stepNext.status = 'escalated'; stepNext.decidedAt = decision.at;
      this.repo.saveStep(stepNext);
      this.repo.recordAudit({ tenantId: r.tenantId, workspaceId: r.workspaceId, actor: approverId, action: 'approval.escalated', entity: 'approval-request', entityId: requestId, diff: { stepKey: current.key, escalateToId: current.escalateToId } });
      if (current.escalateToId) this.gateway?.emitToUser(current.escalateToId, 'approval.escalated', { requestId, stepId: current.id });
      void D30HiringEmit.approvalEscalated(r.tenantId, requestId, { stepKey: current.key, escalateToId: current.escalateToId });
      return this.repo.getRequest(requestId);
    }
    if (dto.decision === 'request_changes') {
      this.repo.recordAudit({ tenantId: r.tenantId, workspaceId: r.workspaceId, actor: approverId, action: 'approval.changes_requested', entity: 'approval-request', entityId: requestId, diff: { note: dto.note } });
      this.gateway?.emitToUser(r.createdBy, 'approval.changes_requested', { requestId, stepId: current.id, note: dto.note });
      void D30HiringEmit.approvalChangesRequested(r.tenantId, requestId, { stepKey: current.key, approverId });
      return r;
    }
    // approve
    const isApproved = current.rule === 'any' || stepNext.decisionsCount >= current.approverIds.length;
    if (isApproved) {
      stepNext.status = 'approved'; stepNext.decidedAt = decision.at;
      this.repo.saveStep(stepNext);
      const nextIdx = r.currentStepIdx + 1;
      if (nextIdx >= steps.length) {
        const updated = this.repo.saveRequest({ ...r, status: 'approved', currentStepIdx: nextIdx });
        this.repo.recordAudit({ tenantId: r.tenantId, workspaceId: r.workspaceId, actor: approverId, action: 'approval.approved', entity: 'approval-request', entityId: requestId, diff: {} });
        this.gateway?.emitToEntity('approval-request', requestId, 'approval.decided', { decision: 'approved' });
        void D30HiringEmit.approvalDecided(r.tenantId, requestId, { decision: 'approved', step: current.key, approverId });
        return updated;
      }
      // promote next step
      const nextStep = steps[nextIdx];
      this.repo.saveStep({ ...nextStep, status: 'in_review' });
      const updated = this.repo.saveRequest({ ...r, currentStepIdx: nextIdx });
      this.repo.recordAudit({ tenantId: r.tenantId, workspaceId: r.workspaceId, actor: approverId, action: 'approval.step.advanced', entity: 'approval-request', entityId: requestId, diff: { from: current.key, to: nextStep.key } });
      for (const a of nextStep.approverIds) this.gateway?.emitToUser(a, 'approval.assigned', { requestId, stepId: nextStep.id });
      void D30HiringEmit.approvalStepAdvanced(r.tenantId, requestId, { from: current.key, to: nextStep.key });
      return updated;
    }
    // partial approval (rule='all')
    this.repo.saveStep(stepNext);
    return r;
  }

  cancelRequest(id: string, actor: string, reason?: string) {
    const r = this.repo.getRequest(id);
    if (!r) throw new NotFoundException('request_not_found');
    if (r.createdBy !== actor) throw new ForbiddenException('only_requester_can_cancel');
    const next = this.repo.cancelRequest(id, reason);
    this.repo.recordAudit({ tenantId: r.tenantId, workspaceId: r.workspaceId, actor, action: 'approval.cancelled', entity: 'approval-request', entityId: id, diff: { reason } });
    this.gateway?.emitToEntity('approval-request', id, 'approval.cancelled', next);
    void D30HiringEmit.approvalCancelled(r.tenantId, id, { reason: reason ?? null });
    return next;
  }

  expireDue() {
    const before = Date.now();
    const n = this.repo.expireRequests(before);
    if (n) this.log.log(`expired ${n} approval requests`);
    return { expired: n };
  }

  /* ── Threads ─── */
  listThreads(tenantId: string, f: any) { return this.repo.listThreads(tenantId, f); }
  threadDetail(id: string) {
    const t = this.repo.getThread(id);
    if (!t) throw new NotFoundException('thread_not_found');
    return { thread: t, messages: this.repo.listMessages(id) };
  }
  createThread(tenantId: string, actor: string, dto: any) {
    const t = this.repo.createThread(tenantId, actor, dto);
    this.repo.postMessage(t.id, actor, { body: dto.body, mentions: [] });
    this.repo.recordAudit({ tenantId, workspaceId: dto.workspaceId, actor, action: 'thread.create', entity: 'thread', entityId: t.id, diff: { title: dto.title, subjectKind: dto.subjectKind } });
    this.gateway?.emitToEntity('workspace', dto.workspaceId, 'thread.created', t);
    for (const p of t.participantIds) if (p !== actor) this.gateway?.emitToUser(p, 'thread.invited', { threadId: t.id });
    void D30HiringEmit.threadCreated(tenantId, t.id, { workspaceId: dto.workspaceId, subjectKind: dto.subjectKind, subjectId: dto.subjectId ?? null });
    return t;
  }
  postMessage(threadId: string, actor: string, dto: any) {
    const t = this.repo.getThread(threadId);
    if (!t) throw new NotFoundException('thread_not_found');
    if (t.privacy === 'restricted' && !t.participantIds.includes(actor)) throw new ForbiddenException('not_a_participant');
    const m = this.repo.postMessage(threadId, actor, dto);
    this.gateway?.emitToEntity('thread', threadId, 'thread.message', m);
    for (const u of dto.mentions ?? []) this.gateway?.emitToUser(u, 'thread.mention', { threadId, messageId: m?.id });
    void D30HiringEmit.threadMessage(t.tenantId, m?.id ?? threadId, { threadId, authorId: actor, mentions: dto.mentions ?? [] });
    return m;
  }
  setThreadStatus(threadId: string, status: 'open' | 'resolved' | 'closed', actor: string, reason?: string) {
    const t = this.repo.getThread(threadId);
    if (!t) throw new NotFoundException('thread_not_found');
    const next = this.repo.setThreadStatus(threadId, status);
    this.repo.recordAudit({ tenantId: t.tenantId, workspaceId: t.workspaceId, actor, action: `thread.${status}`, entity: 'thread', entityId: threadId, diff: { reason } });
    this.gateway?.emitToEntity('thread', threadId, `thread.${status}`, next);
    if (status === 'resolved') void D30HiringEmit.threadResolved(t.tenantId, threadId, { reason: reason ?? null });
    if (status === 'closed') void D30HiringEmit.threadClosed(t.tenantId, threadId, { reason: reason ?? null });
    return next;
  }

  /* ── Audit + dashboard ─── */
  async dashboard(tenantId: string, workspaceId?: string) {
    const wsList = this.repo.listWorkspaces(tenantId, { page: 1, pageSize: 200, sort: 'updated' }).items;
    const reqList = this.repo.listRequests(tenantId, { page: 1, pageSize: 500, sort: 'updated', workspaceId }).items;
    const threads = this.repo.listThreads(tenantId, { page: 1, pageSize: 500, workspaceId }).items;
    const steps = reqList.flatMap((r) => this.repo.listSteps(r.id));
    const insights = await this.analytics.insights({ workspaces: wsList, requests: reqList, steps, threads });
    return { generatedAt: new Date().toISOString(), insights };
  }
  audit(workspaceId: string, limit = 100) { return { items: this.repo.listAudit(workspaceId, limit) }; }
}
