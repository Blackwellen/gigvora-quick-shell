import { Injectable, BadRequestException, NotFoundException, ForbiddenException, ConflictException, Logger } from '@nestjs/common';
import { SharedWorkspacesCollaborationRepository } from './shared-workspaces-collaboration.repository';
import {
  WORKSPACE_TRANSITIONS, NOTE_TRANSITIONS, HANDOFF_TRANSITIONS,
  WorkspaceStatus, NoteStatus, HandoffStatus,
  CreateWorkspaceDto, CreateNoteDto, CreateHandoffDto, TransitionHandoffDto,
} from './dto';

const ANALYTICS_BASE = process.env.ANALYTICS_PYTHON_URL ?? 'http://localhost:8089';

@Injectable()
export class SharedWorkspacesCollaborationService {
  private readonly logger = new Logger(SharedWorkspacesCollaborationService.name);
  constructor(private readonly repo: SharedWorkspacesCollaborationRepository) {}

  // ─── Workspace membership guard ─────────────────────────────────
  private async assertMembership(orgId: string, workspaceId: string, identityId: string,
                                  requiredRoles?: string[]) {
    const ws = await this.repo.getWorkspace(orgId, workspaceId);
    if (!ws) throw new NotFoundException('workspace not found');
    const member = await this.repo.getMember(workspaceId, identityId);
    if (!member || member.status !== 'active') throw new ForbiddenException('not a workspace member');
    if (requiredRoles && !requiredRoles.includes(member.role)) {
      throw new ForbiddenException(`requires role: ${requiredRoles.join('|')}`);
    }
    return { ws, member };
  }

  // ─── Overview ───────────────────────────────────────────────────
  async overview(orgId: string, identityId: string) {
    const workspaces = await this.repo.listWorkspaces(orgId, { page: 1, pageSize: 25, status: 'active' });
    const handoffsByMe: any[] = [];
    const notesPreview: any[] = [];
    for (const ws of workspaces.items.slice(0, 5)) {
      const mem = await this.repo.getMember(ws.id, identityId);
      if (!mem || mem.status !== 'active') continue;
      const [notes, handoffs] = await Promise.all([
        this.repo.listNotes(ws.id, { page: 1, pageSize: 3, status: 'published' }),
        this.repo.listHandoffs(ws.id, { page: 1, pageSize: 5, toMe: true, status: 'pending' }, identityId),
      ]);
      notesPreview.push(...notes.items.map((n: any) => ({ ...n, workspaceName: ws.name })));
      handoffsByMe.push(...handoffs.items.map((h: any) => ({ ...h, workspaceName: ws.name })));
    }

    const insights = await this.fetchInsights(orgId, {
      activeWorkspaces: workspaces.total,
      pendingHandoffsForMe: handoffsByMe.length,
      publishedNotes: notesPreview.length,
    }).catch(() => this.fallbackInsights({ pendingHandoffsForMe: handoffsByMe.length, activeWorkspaces: workspaces.total }));

    return {
      kpis: {
        activeWorkspaces: workspaces.total,
        pendingHandoffsForMe: handoffsByMe.length,
        recentPublishedNotes: notesPreview.length,
      },
      workspaces: workspaces.items,
      pendingHandoffs: handoffsByMe.slice(0, 10),
      recentNotes: notesPreview.slice(0, 10),
      insights,
      computedAt: new Date().toISOString(),
    };
  }

  private async fetchInsights(orgId: string, signals: any) {
    try {
      const res = await fetch(`${ANALYTICS_BASE}/shared-workspaces-collaboration/insights`, {
        method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ org_id: orgId, signals }), signal: AbortSignal.timeout(2000),
      });
      if (res.ok) return (await res.json()).insights ?? [];
    } catch (e) { this.logger.warn(`analytics down: ${(e as Error).message}`); }
    return this.fallbackInsights(signals);
  }
  private fallbackInsights(s: { pendingHandoffsForMe?: number; activeWorkspaces?: number }) {
    const out: any[] = [];
    if ((s.pendingHandoffsForMe ?? 0) > 0) out.push({ id: 'pending-handoffs', severity: 'warn', title: `${s.pendingHandoffsForMe} handoff(s) await your action`, body: 'Accept, reject, or reassign.' });
    if (!s.activeWorkspaces) out.push({ id: 'no-ws', severity: 'info', title: 'No active workspaces', body: 'Create a shared workspace to start collaborating.' });
    if (!out.length) out.push({ id: 'all-clear', severity: 'success', title: 'Collaboration healthy', body: 'No outstanding handoffs or stale workspaces.' });
    return out;
  }

  // ─── Workspaces ─────────────────────────────────────────────────
  listWorkspaces(orgId: string, q: any) { return this.repo.listWorkspaces(orgId, q); }
  async getWorkspace(orgId: string, id: string, identityId: string) {
    const { ws } = await this.assertMembership(orgId, id, identityId);
    return ws;
  }

  async createWorkspace(orgId: string, dto: CreateWorkspaceDto, identityId: string, fullName: string, email: string, req?: any) {
    const existing = await this.repo.getWorkspaceBySlug(orgId, dto.slug);
    if (existing) throw new ConflictException(`slug already in use: ${dto.slug}`);
    const ws = await this.repo.createWorkspace({
      orgIdentityId: orgId, name: dto.name, slug: dto.slug,
      description: dto.description ?? null, visibility: dto.visibility,
      status: 'active', createdBy: identityId,
    });
    await this.repo.addMember({
      workspaceId: ws.id, memberIdentityId: identityId,
      fullName, email, role: 'owner', status: 'active',
    });
    await this.repo.recordAudit(ws.id, identityId, 'workspace.created',
      { type: 'workspace', id: ws.id }, { name: dto.name, slug: dto.slug }, req);
    return ws;
  }

  async updateWorkspace(orgId: string, id: string, patch: any, identityId: string, req?: any) {
    await this.assertMembership(orgId, id, identityId, ['owner', 'editor']);
    const before = await this.repo.getWorkspace(orgId, id);
    const row = await this.repo.updateWorkspace(id, patch);
    await this.repo.recordAudit(id, identityId, 'workspace.updated', { type: 'workspace', id }, { before, after: row }, req);
    return row;
  }

  async transitionWorkspace(orgId: string, id: string, status: WorkspaceStatus, identityId: string, req?: any) {
    const { ws } = await this.assertMembership(orgId, id, identityId, ['owner']);
    const allowed = WORKSPACE_TRANSITIONS[ws.status as WorkspaceStatus] ?? [];
    if (!allowed.includes(status)) throw new BadRequestException(`invalid transition: ${ws.status} → ${status}`);
    const row = await this.repo.setWorkspaceStatus(id, status);
    await this.repo.recordAudit(id, identityId, `workspace.${status}`, { type: 'workspace', id }, { from: ws.status, to: status }, req);
    return row;
  }

  // ─── Members ────────────────────────────────────────────────────
  async listMembers(orgId: string, workspaceId: string, identityId: string) {
    await this.assertMembership(orgId, workspaceId, identityId);
    return this.repo.listMembers(workspaceId);
  }

  async addMember(orgId: string, workspaceId: string, dto: any, identityId: string, req?: any) {
    await this.assertMembership(orgId, workspaceId, identityId, ['owner', 'editor']);
    const existing = await this.repo.getMember(workspaceId, dto.memberIdentityId);
    if (existing && existing.status === 'active') throw new ConflictException('member already in workspace');
    const row = await this.repo.addMember({ workspaceId, ...dto, status: 'active' });
    await this.repo.recordAudit(workspaceId, identityId, 'member.added', { type: 'member', id: row.id }, { ...dto }, req);
    return row;
  }

  async changeMemberRole(orgId: string, workspaceId: string, memberId: string, role: string, identityId: string, req?: any) {
    await this.assertMembership(orgId, workspaceId, identityId, ['owner']);
    const row = await this.repo.updateMemberRole(memberId, role);
    if (!row) throw new NotFoundException('member not found');
    await this.repo.recordAudit(workspaceId, identityId, 'member.role_changed', { type: 'member', id: memberId }, { role }, req);
    return row;
  }

  async removeMember(orgId: string, workspaceId: string, memberId: string, identityId: string, req?: any) {
    await this.assertMembership(orgId, workspaceId, identityId, ['owner']);
    const row = await this.repo.removeMember(memberId);
    if (!row) throw new NotFoundException('member not found');
    await this.repo.recordAudit(workspaceId, identityId, 'member.removed', { type: 'member', id: memberId }, {}, req);
    return row;
  }

  // ─── Notes ──────────────────────────────────────────────────────
  async listNotes(orgId: string, workspaceId: string, q: any, identityId: string) {
    await this.assertMembership(orgId, workspaceId, identityId);
    return this.repo.listNotes(workspaceId, q);
  }
  async getNote(orgId: string, workspaceId: string, id: string, identityId: string) {
    await this.assertMembership(orgId, workspaceId, identityId);
    const note = await this.repo.getNote(workspaceId, id);
    if (!note) throw new NotFoundException('note not found');
    return note;
  }
  async createNote(orgId: string, workspaceId: string, dto: CreateNoteDto, identityId: string, req?: any) {
    await this.assertMembership(orgId, workspaceId, identityId, ['owner', 'editor', 'contributor']);
    const values: any = { workspaceId, authorId: identityId, ...dto };
    if (dto.status === 'published') values.publishedAt = new Date();
    const row = await this.repo.createNote(values);
    await this.repo.recordAudit(workspaceId, identityId, 'note.created', { type: 'note', id: row.id }, { title: dto.title, status: dto.status }, req);
    return row;
  }
  async updateNote(orgId: string, workspaceId: string, id: string, patch: any, identityId: string, req?: any) {
    const { member } = await this.assertMembership(orgId, workspaceId, identityId);
    const note = await this.repo.getNote(workspaceId, id);
    if (!note) throw new NotFoundException('note not found');
    if (note.authorId !== identityId && !['owner', 'editor'].includes(member.role)) {
      throw new ForbiddenException('only author, owner, or editor can edit this note');
    }
    const row = await this.repo.updateNote(id, patch);
    await this.repo.recordAudit(workspaceId, identityId, 'note.updated', { type: 'note', id }, { patch }, req);
    return row;
  }
  async transitionNote(orgId: string, workspaceId: string, id: string, status: NoteStatus, identityId: string, req?: any) {
    const { member } = await this.assertMembership(orgId, workspaceId, identityId);
    const note = await this.repo.getNote(workspaceId, id);
    if (!note) throw new NotFoundException('note not found');
    if (note.authorId !== identityId && !['owner', 'editor'].includes(member.role)) {
      throw new ForbiddenException('only author, owner, or editor can change note status');
    }
    const allowed = NOTE_TRANSITIONS[note.status as NoteStatus] ?? [];
    if (!allowed.includes(status)) throw new BadRequestException(`invalid transition: ${note.status} → ${status}`);
    const row = await this.repo.setNoteStatus(id, status);
    await this.repo.recordAudit(workspaceId, identityId, `note.${status}`, { type: 'note', id }, { from: note.status, to: status }, req);
    return row;
  }

  // ─── Handoffs ───────────────────────────────────────────────────
  async listHandoffs(orgId: string, workspaceId: string, q: any, identityId: string) {
    await this.assertMembership(orgId, workspaceId, identityId);
    return this.repo.listHandoffs(workspaceId, q, identityId);
  }
  async getHandoff(orgId: string, workspaceId: string, id: string, identityId: string) {
    await this.assertMembership(orgId, workspaceId, identityId);
    const h = await this.repo.getHandoff(workspaceId, id);
    if (!h) throw new NotFoundException('handoff not found');
    return h;
  }
  async createHandoff(orgId: string, workspaceId: string, dto: CreateHandoffDto, identityId: string, req?: any) {
    await this.assertMembership(orgId, workspaceId, identityId);
    const recipient = await this.repo.getMember(workspaceId, dto.toIdentityId);
    if (!recipient || recipient.status !== 'active') {
      throw new BadRequestException('recipient is not an active member of this workspace');
    }
    const values: any = {
      workspaceId, fromIdentityId: identityId, toIdentityId: dto.toIdentityId,
      fromTeam: dto.fromTeam ?? null, toTeam: dto.toTeam ?? null,
      subject: dto.subject, context: dto.context, checklist: dto.checklist,
      attachments: dto.attachments, priority: dto.priority,
      dueAt: dto.dueAt ? new Date(dto.dueAt) : null, status: 'pending',
    };
    const row = await this.repo.createHandoff(values);
    await this.repo.recordAudit(workspaceId, identityId, 'handoff.created',
      { type: 'handoff', id: row.id }, { subject: dto.subject, to: dto.toIdentityId, priority: dto.priority }, req);
    return row;
  }
  async transitionHandoff(orgId: string, workspaceId: string, id: string, dto: TransitionHandoffDto, identityId: string, req?: any) {
    await this.assertMembership(orgId, workspaceId, identityId);
    const h = await this.repo.getHandoff(workspaceId, id);
    if (!h) throw new NotFoundException('handoff not found');
    const allowed = HANDOFF_TRANSITIONS[h.status as HandoffStatus] ?? [];
    if (!allowed.includes(dto.status)) throw new BadRequestException(`invalid transition: ${h.status} → ${dto.status}`);

    // Authorisation by transition:
    //   accept / reject / complete: only the recipient (toIdentityId)
    //   cancel: only the sender (fromIdentityId)
    if ((dto.status === 'accepted' || dto.status === 'rejected' || dto.status === 'completed') && h.toIdentityId !== identityId) {
      throw new ForbiddenException('only the recipient can accept, reject, or complete this handoff');
    }
    if (dto.status === 'cancelled' && h.fromIdentityId !== identityId) {
      throw new ForbiddenException('only the sender can cancel this handoff');
    }

    const extra: any = {};
    if (dto.status === 'rejected') extra.rejectedReason = dto.reason ?? null;
    const row = await this.repo.setHandoffStatus(id, dto.status, extra);
    await this.repo.recordAudit(workspaceId, identityId, `handoff.${dto.status}`,
      { type: 'handoff', id }, { from: h.status, to: dto.status, reason: dto.reason }, req);
    return row;
  }
  async updateHandoffChecklist(orgId: string, workspaceId: string, id: string, checklist: any[], identityId: string, req?: any) {
    await this.assertMembership(orgId, workspaceId, identityId);
    const h = await this.repo.getHandoff(workspaceId, id);
    if (!h) throw new NotFoundException('handoff not found');
    if (h.toIdentityId !== identityId && h.fromIdentityId !== identityId) {
      throw new ForbiddenException('only sender or recipient can update the checklist');
    }
    const row = await this.repo.updateHandoff(id, { checklist });
    await this.repo.recordAudit(workspaceId, identityId, 'handoff.checklist_updated',
      { type: 'handoff', id }, { itemCount: checklist.length, doneCount: checklist.filter((c: any) => c.done).length }, req);
    return row;
  }

  // ─── Audit ──────────────────────────────────────────────────────
  async listAudit(orgId: string, workspaceId: string, identityId: string, limit = 100) {
    await this.assertMembership(orgId, workspaceId, identityId, ['owner', 'editor']);
    return this.repo.listAudit(workspaceId, limit);
  }
}
