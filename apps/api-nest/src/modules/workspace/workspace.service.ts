import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { WorkspaceRepository } from './workspace.repository';
import { AuditService } from './audit.service';
import { CreateOrgDto, CreateSavedViewDto, TrackRecentDto, UpdateSavedViewDto, UpdateShellPrefsDto } from './dto';

@Injectable()
export class WorkspaceService {
  constructor(private readonly repo: WorkspaceRepository, private readonly audit: AuditService) {}

  // ----- Bootstrap: single payload powering the shell on app load -----
  async bootstrap(userId: string) {
    const [orgs, prefsRows, savedViews, recents, navRows] = await Promise.all([
      this.repo.listOrgsForUser(userId),
      this.repo.getPrefs(userId),
      this.repo.listSavedViews(userId),
      this.repo.listRecents(userId, 10),
      this.repo.getNavTree('global', 'default'),
    ]);
    const prefs = prefsRows[0] ?? {
      userId, activeRole: 'user', activeOrgId: orgs[0]?.id ?? null,
      sidebarCollapsed: false, rightRailOpen: true, density: 'comfortable',
      theme: 'system', shortcuts: {},
    };
    return {
      orgs,
      prefs,
      savedViews,
      recents,
      nav: navRows[0]?.tree ?? null,
      version: navRows[0]?.version ?? 1,
    };
  }

  // ----- Orgs -----
  async listOrgs(userId: string) { const items = await this.repo.listOrgsForUser(userId); return { items, total: items.length, limit: items.length, hasMore: false }; }

  async createOrg(userId: string, dto: CreateOrgDto) {
    const org = await this.repo.createOrg({
      ownerId: userId, name: dto.name, slug: dto.slug,
      plan: dto.plan ?? 'free', logoUrl: dto.logoUrl,
    });
    await this.audit.record({ actorId: userId, orgId: org.id, action: 'org.create', targetType: 'org', targetId: org.id, meta: { slug: dto.slug } });
    return org;
  }

  // ----- Saved views -----
  async listSavedViews(userId: string) { const items = await this.repo.listSavedViews(userId); return { items, total: items.length, limit: items.length, hasMore: false }; }

  async createSavedView(userId: string, dto: CreateSavedViewDto) {
    const [row] = await this.repo.insertSavedView(userId, dto);
    await this.audit.record({ actorId: userId, action: 'savedView.create', targetType: 'savedView', targetId: row.id });
    return row;
  }

  async updateSavedView(userId: string, id: string, dto: UpdateSavedViewDto) {
    const rows = await this.repo.updateSavedView(userId, id, dto);
    if (!rows.length) throw new NotFoundException('saved view not found');
    await this.audit.record({ actorId: userId, action: 'savedView.update', targetType: 'savedView', targetId: id });
    return rows[0];
  }

  async deleteSavedView(userId: string, id: string) {
    await this.repo.deleteSavedView(userId, id);
    await this.audit.record({ actorId: userId, action: 'savedView.delete', targetType: 'savedView', targetId: id });
    return { ok: true };
  }

  // ----- Recents -----
  async listRecents(userId: string) { const items = await this.repo.listRecents(userId, 10); return { items, total: items.length, limit: 10, hasMore: items.length >= 10 }; }

  async trackRecent(userId: string, dto: TrackRecentDto) {
    await this.repo.trackRecent(userId, dto);
    return { ok: true };
  }

  // ----- Prefs -----
  async getPrefs(userId: string) {
    const rows = await this.repo.getPrefs(userId);
    return rows[0] ?? null;
  }

  async updatePrefs(userId: string, dto: UpdateShellPrefsDto) {
    const [row] = await this.repo.upsertPrefs(userId, dto);
    if (dto.activeRole) {
      await this.audit.record({ actorId: userId, action: 'shell.role.switch', meta: { to: dto.activeRole } });
    }
    if (dto.activeOrgId) {
      await this.audit.record({ actorId: userId, orgId: dto.activeOrgId, action: 'shell.org.switch' });
    }
    return row;
  }
}
