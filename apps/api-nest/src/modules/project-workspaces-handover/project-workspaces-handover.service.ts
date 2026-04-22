/**
 * D37 — Project Workspaces & Handover service.
 *
 * Responsibilities:
 *   - Auto-mint a workspace from a D36 contract activation (snapshot milestones).
 *   - Drive milestone state machine with optimistic concurrency.
 *   - Track deliverables (submit + review).
 *   - Run the handover checklist + publish a final report on close.
 *   - Emit pwh.* webhooks + cross-domain bus events on every state change.
 *
 * Out of scope (intentionally — owned by D34 + future delivery + dispute):
 *   - Escrow release / payment capture.
 *   - Dispute opening (handled by D40 once it lands).
 */
import { Injectable, Logger } from '@nestjs/common';
import { ProjectWorkspacesHandoverRepository } from './project-workspaces-handover.repository';
import { D37Emit } from './project-workspaces-handover.emit';
import type { MilestoneStatus, WorkspaceStatus } from './dto';

@Injectable()
export class ProjectWorkspacesHandoverService {
  private readonly log = new Logger('pwh.svc');

  constructor(private readonly repo: ProjectWorkspacesHandoverRepository) {}

  list(tenantId: string, f: { projectId?: string; contractId?: string; status?: WorkspaceStatus[] }) {
    return this.repo.list(tenantId, f);
  }

  detail(id: string) {
    const ws = this.repo.byId(id);
    if (!ws) return null;
    return {
      ...ws,
      parties: this.repo.partiesFor(id),
      milestones: this.repo.milestonesFor(id),
      deliverables: this.repo.deliverablesFor(id),
      checklist: this.repo.checklistFor(id),
      finalReport: this.repo.reportFor(id) ?? null,
      events: this.repo.eventsFor(id),
    };
  }

  byContract(contractId: string) { return this.repo.byContractId(contractId); }

  mintFromContract(args: {
    tenantId: string; contractId: string; projectId: string; title: string;
    milestones: { title: string; amountCents: number; dueAt: string | null }[];
    parties: { partyId: string; role: 'client' | 'provider' | 'observer'; displayName: string }[];
    idempotencyKey: string; actor: string;
  }) {
    const ws = this.repo.mint(args);
    void D37Emit.workspaceMinted(args.tenantId, ws.id, { contractId: args.contractId, milestones: args.milestones.length });
    return ws;
  }

  kickoff(workspaceId: string, actor: string) {
    const ws = this.repo.byId(workspaceId); if (!ws) throw new Error('not_found');
    if (ws.status !== 'kickoff') throw new Error(`cannot_kickoff_from_${ws.status}`);
    const updated = this.repo.setStatus(workspaceId, 'active', actor, {});
    void D37Emit.workspaceKickoff(ws.tenantId, workspaceId, {});
    void D37Emit.workspaceActivated(ws.tenantId, workspaceId, {});
    return updated;
  }

  updateMilestone(workspaceId: string, milestoneId: string, to: MilestoneStatus, expectedVersion: number, actor: string, note?: string) {
    const ws = this.repo.byId(workspaceId); if (!ws) throw new Error('not_found');
    const m = this.repo.transitionMilestone(workspaceId, milestoneId, to, expectedVersion, actor, note);
    if (to === 'in-progress')   void D37Emit.milestoneStarted(ws.tenantId, milestoneId, { workspaceId });
    if (to === 'submitted')     void D37Emit.milestoneSubmitted(ws.tenantId, milestoneId, { workspaceId });
    if (to === 'accepted') {
      void D37Emit.milestoneAccepted(ws.tenantId, milestoneId, { workspaceId, amountCents: m.amountCents });
      // Auto-flip the workspace to in-review once every milestone is accepted.
      const all = this.repo.milestonesFor(workspaceId);
      if (all.every((x) => x.status === 'accepted') && ws.status === 'active') {
        const moved = this.repo.setStatus(workspaceId, 'in-review', actor, { allMilestonesAccepted: true });
        void D37Emit.workspaceActivated(ws.tenantId, workspaceId, { phase: 'in-review', moved: moved.status });
      }
    }
    if (to === 'rejected')      void D37Emit.milestoneRejected(ws.tenantId, milestoneId, { workspaceId, note: note ?? null });
    return m;
  }

  submitDeliverable(args: { workspaceId: string; milestoneId: string; title: string; url: string; notes?: string; idempotencyKey: string; actor: string }) {
    const ws = this.repo.byId(args.workspaceId); if (!ws) throw new Error('not_found');
    const d = this.repo.submitDeliverable(args);
    void D37Emit.deliverableSubmitted(ws.tenantId, d.id, { workspaceId: args.workspaceId, milestoneId: args.milestoneId, url: args.url });
    return d;
  }

  reviewDeliverable(workspaceId: string, deliverableId: string, decision: 'accepted' | 'changes-requested', feedback: string | undefined, actor: string) {
    const ws = this.repo.byId(workspaceId); if (!ws) throw new Error('not_found');
    const d = this.repo.reviewDeliverable(workspaceId, deliverableId, decision, feedback, actor);
    if (decision === 'accepted')          void D37Emit.deliverableAccepted(ws.tenantId, deliverableId, { workspaceId });
    else                                  void D37Emit.deliverableChanges(ws.tenantId, deliverableId, { workspaceId, feedback: feedback ?? null });
    return d;
  }

  startHandover(workspaceId: string, actor: string) {
    const ws = this.repo.byId(workspaceId); if (!ws) throw new Error('not_found');
    if (ws.status !== 'in-review' && ws.status !== 'active') throw new Error(`cannot_start_handover_from_${ws.status}`);
    const updated = this.repo.setStatus(workspaceId, 'handover', actor, {});
    void D37Emit.handoverStarted(ws.tenantId, workspaceId, {});
    return updated;
  }

  completeChecklistItem(workspaceId: string, itemId: string, actor: string, note?: string) {
    const ws = this.repo.byId(workspaceId); if (!ws) throw new Error('not_found');
    const item = this.repo.completeChecklistItem(workspaceId, itemId, actor, note);
    void D37Emit.handoverItemCompleted(ws.tenantId, workspaceId, { itemId, kind: item.kind });
    const all = this.repo.checklistFor(workspaceId);
    if (all.every((x) => x.done)) {
      void D37Emit.handoverCompleted(ws.tenantId, workspaceId, { items: all.length });
    }
    return item;
  }

  closeWorkspace(workspaceId: string, finalReportMd: string, idempotencyKey: string, actor: string) {
    const ws = this.repo.byId(workspaceId); if (!ws) throw new Error('not_found');
    if (ws.status !== 'handover' && ws.status !== 'in-review') throw new Error(`cannot_close_from_${ws.status}`);
    const checklist = this.repo.checklistFor(workspaceId);
    if (!checklist.every((x) => x.done)) throw new Error('handover_checklist_incomplete');
    const report = this.repo.publishFinalReport(workspaceId, finalReportMd, idempotencyKey, actor);
    void D37Emit.finalReportPublished(ws.tenantId, workspaceId, { reportId: report.id });
    const closed = this.repo.setStatus(workspaceId, 'closed', actor, { reportId: report.id });
    void D37Emit.workspaceClosed(ws.tenantId, workspaceId, { reportId: report.id });
    return { workspace: closed, report };
  }

  hold(workspaceId: string, reason: string, actor: string) {
    const ws = this.repo.byId(workspaceId); if (!ws) throw new Error('not_found');
    if (ws.status === 'closed' || ws.status === 'cancelled') throw new Error(`cannot_hold_from_${ws.status}`);
    const updated = this.repo.setStatus(workspaceId, 'on-hold', actor, { reason });
    void D37Emit.workspaceOnHold(ws.tenantId, workspaceId, { reason });
    return updated;
  }

  cancel(workspaceId: string, reason: string, actor: string) {
    const ws = this.repo.byId(workspaceId); if (!ws) throw new Error('not_found');
    if (ws.status === 'closed' || ws.status === 'cancelled') throw new Error(`cannot_cancel_from_${ws.status}`);
    const updated = this.repo.setStatus(workspaceId, 'cancelled', actor, { reason });
    void D37Emit.workspaceCancelled(ws.tenantId, workspaceId, { reason });
    return updated;
  }
}
