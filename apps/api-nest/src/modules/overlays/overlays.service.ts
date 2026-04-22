import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { OverlaysRepository } from './overlays.repository';
import {
  OpenOverlayDto, PatchOverlayDto, StartWorkflowDto, AdvanceWorkflowDto,
  DetachWindowDto, WindowPingDto,
} from './dto';

/**
 * Workflow templates declare the linear step sequence that a follow-through
 * (e.g. post-purchase) must walk through. Adding a new template here is the
 * only thing required to support a new follow-through journey on the frontend.
 */
const WORKFLOW_TEMPLATES: Record<string, string[]> = {
  purchase_followup:    ['checkout_success','receipt_view','review_prompt','next_action'],
  mfa_recovery:         ['identify','challenge','reset','complete'],
  onboarding_continue:  ['resume_prompt','step','review','complete'],
  publish_object:       ['draft_review','compliance_check','publish','share_prompt'],
};

@Injectable()
export class OverlaysService {
  constructor(private readonly repo: OverlaysRepository) {}

  async open(identityId: string, dto: OpenOverlayDto) {
    const session = await this.repo.open({
      identityId, kind: dto.kind, surfaceKey: dto.surfaceKey,
      route: dto.route, entityType: dto.entityType, entityId: dto.entityId,
      payload: dto.payload, origin: dto.origin,
    });
    await this.repo.audit({ sessionId: session.id, identityId, action: 'opened', meta: { surfaceKey: dto.surfaceKey, kind: dto.kind } });
    return session;
  }

  async patch(identityId: string, id: string, dto: PatchOverlayDto) {
    const existing = await this.repo.get(id);
    if (!existing) throw new NotFoundException('overlay not found');
    if (existing.identity_id && existing.identity_id !== identityId) throw new ForbiddenException();
    const next = await this.repo.patch(id, dto);
    if (dto.status && ['dismissed','completed','expired','failed','escalated'].includes(dto.status)) {
      await this.repo.audit({ sessionId: id, identityId, action: dto.status, meta: dto.result ?? {} });
    }
    return next;
  }

  async listOpen(identityId: string) {
    const items = await this.repo.listOpen(identityId);
    return { items, total: items.length, limit: items.length, hasMore: false };
  }
  get(id: string)              { return this.repo.get(id); }

  // --- workflows ---
  async startWorkflow(identityId: string, dto: StartWorkflowDto) {
    const steps = WORKFLOW_TEMPLATES[dto.templateKey];
    if (!steps) throw new NotFoundException(`unknown template ${dto.templateKey}`);
    const wf = await this.repo.startWorkflow(identityId, dto.templateKey, steps.length, steps[0], dto.context ?? {});
    // Pre-create rows so frontend can render the linear progress bar immediately
    for (let i = 0; i < steps.length; i++) {
      await this.repo['ds'].query(
        `INSERT INTO overlay_workflow_steps (workflow_id, step_key, position, status)
         VALUES ($1,$2,$3, CASE WHEN $3 = 1 THEN 'open'::overlay_status ELSE 'pending'::overlay_status END)
         ON CONFLICT (workflow_id, step_key) DO NOTHING`,
        [wf.id, steps[i], i + 1],
      );
    }
    await this.repo.audit({ workflowId: wf.id, identityId, action: 'workflow_started', meta: { templateKey: dto.templateKey } });
    return this.repo.getWorkflow(wf.id);
  }

  async advanceWorkflow(identityId: string, id: string, dto: AdvanceWorkflowDto) {
    const wf = await this.repo.getWorkflow(id);
    if (!wf) throw new NotFoundException();
    if (wf.identity_id !== identityId) throw new ForbiddenException();
    const updated = await this.repo.advanceWorkflow(id, dto.stepKey, dto.status ?? 'completed', dto.data ?? {});
    await this.repo.audit({ workflowId: id, identityId, action: 'workflow_step', meta: { stepKey: dto.stepKey, status: dto.status ?? 'completed' } });
    return this.repo.getWorkflow(updated.id);
  }

  getWorkflow(id: string)        { return this.repo.getWorkflow(id); }
  async listWorkflows(identityId: string) {
    const items = await this.repo.listWorkflows(identityId);
    return { items, total: items.length, limit: items.length, hasMore: false };
  }

  // --- detached windows ---
  detach(identityId: string, dto: DetachWindowDto) {
    return this.repo.detach(identityId, dto.channelKey, dto.surfaceKey, dto.route, dto.state ?? {});
  }
  pingWindow(identityId: string, channelKey: string, dto: WindowPingDto) {
    return this.repo.pingWindow(identityId, channelKey, dto.state);
  }
  closeWindow(identityId: string, channelKey: string) {
    return this.repo.closeWindow(identityId, channelKey);
  }
  async listWindows(identityId: string) {
    const items = await this.repo.listWindows(identityId);
    return { items, total: items.length, limit: items.length, hasMore: false };
  }
}
