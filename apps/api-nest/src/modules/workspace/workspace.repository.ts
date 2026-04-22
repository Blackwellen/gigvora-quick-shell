import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

/** Thin repository wrapping raw SQL for the workspace shell domain. */
@Injectable()
export class WorkspaceRepository {
  constructor(@InjectDataSource() private readonly ds: DataSource) {}

  // ----- Orgs -----
  listOrgsForUser(userId: string) {
    return this.ds.query(
      `SELECT o.id, o.slug, o.name, o.logo_url AS "logoUrl", o.plan, o.status,
              m.role
         FROM orgs o
         JOIN memberships m ON m.org_id = o.id
        WHERE m.user_id = $1 AND m.state = 'active' AND o.status = 'active'
        ORDER BY o.name ASC`,
      [userId],
    );
  }

  createOrg(p: { ownerId: string; name: string; slug: string; plan: string; logoUrl?: string }) {
    return this.ds.transaction(async (m) => {
      const [org] = await m.query(
        `INSERT INTO orgs (slug, name, plan, owner_id, logo_url)
         VALUES ($1,$2,$3,$4,$5) RETURNING id, slug, name, plan, status, logo_url AS "logoUrl"`,
        [p.slug, p.name, p.plan, p.ownerId, p.logoUrl ?? null],
      );
      await m.query(
        `INSERT INTO memberships (org_id, user_id, role, state) VALUES ($1,$2,'owner','active')`,
        [org.id, p.ownerId],
      );
      return { ...org, role: 'owner' };
    });
  }

  // ----- Saved views -----
  listSavedViews(userId: string) {
    return this.ds.query(
      `SELECT id, label, route, icon, pinned, position, filters
         FROM saved_views WHERE user_id = $1 ORDER BY pinned DESC, position ASC`,
      [userId],
    );
  }

  insertSavedView(userId: string, v: { label: string; route: string; icon?: string; pinned?: boolean; position?: number; filters?: any }) {
    return this.ds.query(
      `INSERT INTO saved_views (user_id, label, route, icon, pinned, position, filters)
       VALUES ($1,$2,$3,$4,$5,$6,$7)
       RETURNING id, label, route, icon, pinned, position, filters`,
      [userId, v.label, v.route, v.icon ?? null, v.pinned ?? false, v.position ?? 0, v.filters ?? {}],
    );
  }

  updateSavedView(userId: string, id: string, patch: Partial<{ label: string; pinned: boolean; position: number; filters: any }>) {
    return this.ds.query(
      `UPDATE saved_views
          SET label    = COALESCE($3, label),
              pinned   = COALESCE($4, pinned),
              position = COALESCE($5, position),
              filters  = COALESCE($6, filters),
              updated_at = now()
        WHERE user_id = $1 AND id = $2
        RETURNING id, label, route, icon, pinned, position, filters`,
      [userId, id, patch.label ?? null, patch.pinned ?? null, patch.position ?? null, patch.filters ?? null],
    );
  }

  deleteSavedView(userId: string, id: string) {
    return this.ds.query(`DELETE FROM saved_views WHERE user_id = $1 AND id = $2`, [userId, id]);
  }

  // ----- Recents -----
  listRecents(userId: string, limit = 10) {
    return this.ds.query(
      `SELECT id, kind, label, route, meta, visited_at AS "visitedAt"
         FROM recent_items WHERE user_id = $1 ORDER BY visited_at DESC LIMIT $2`,
      [userId, limit],
    );
  }

  trackRecent(userId: string, r: { kind: string; label: string; route: string; meta?: any }) {
    return this.ds.transaction(async (m) => {
      await m.query(
        `INSERT INTO recent_items (user_id, kind, label, route, meta)
         VALUES ($1,$2,$3,$4,$5)`,
        [userId, r.kind, r.label, r.route, r.meta ?? {}],
      );
      // Keep rolling window of 50 per user
      await m.query(
        `DELETE FROM recent_items WHERE user_id = $1 AND id NOT IN
           (SELECT id FROM recent_items WHERE user_id = $1
             ORDER BY visited_at DESC LIMIT 50)`,
        [userId],
      );
    });
  }

  // ----- Shell prefs -----
  getPrefs(userId: string) {
    return this.ds.query(
      `SELECT user_id AS "userId", active_role AS "activeRole",
              active_org_id AS "activeOrgId", sidebar_collapsed AS "sidebarCollapsed",
              right_rail_open AS "rightRailOpen", density, theme, shortcuts
         FROM shell_prefs WHERE user_id = $1`,
      [userId],
    );
  }

  upsertPrefs(userId: string, p: any) {
    return this.ds.query(
      `INSERT INTO shell_prefs (user_id, active_role, active_org_id, sidebar_collapsed, right_rail_open, density, theme, shortcuts)
       VALUES ($1, COALESCE($2,'user'), $3, COALESCE($4,false), COALESCE($5,true),
               COALESCE($6,'comfortable'), COALESCE($7,'system'), COALESCE($8,'{}'::jsonb))
       ON CONFLICT (user_id) DO UPDATE SET
         active_role = COALESCE(EXCLUDED.active_role, shell_prefs.active_role),
         active_org_id = COALESCE(EXCLUDED.active_org_id, shell_prefs.active_org_id),
         sidebar_collapsed = COALESCE(EXCLUDED.sidebar_collapsed, shell_prefs.sidebar_collapsed),
         right_rail_open = COALESCE(EXCLUDED.right_rail_open, shell_prefs.right_rail_open),
         density = COALESCE(EXCLUDED.density, shell_prefs.density),
         theme = COALESCE(EXCLUDED.theme, shell_prefs.theme),
         shortcuts = COALESCE(EXCLUDED.shortcuts, shell_prefs.shortcuts),
         updated_at = now()
       RETURNING *`,
      [userId, p.activeRole ?? null, p.activeOrgId ?? null, p.sidebarCollapsed ?? null,
       p.rightRailOpen ?? null, p.density ?? null, p.theme ?? null, p.shortcuts ?? null],
    );
  }

  // ----- Nav tree -----
  getNavTree(scope: string, key: string) {
    return this.ds.query(
      `SELECT tree, version FROM nav_config WHERE scope = $1 AND scope_key = $2`,
      [scope, key],
    );
  }
}
