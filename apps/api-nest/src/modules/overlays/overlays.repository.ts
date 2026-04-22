import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';

/**
 * Thin SQL access for overlays. Kept query-disciplined so that hot paths
 * (open/patch overlay on every drawer interaction) stay sub-10ms.
 */
@Injectable()
export class OverlaysRepository {
  constructor(private readonly ds: DataSource) {}

  // --- overlay_sessions ---
  open(row: {
    identityId: string | null; orgId?: string | null;
    kind: string; surfaceKey: string; route?: string | null;
    entityType?: string | null; entityId?: string | null;
    payload?: Record<string, unknown>; origin?: string;
  }) {
    return this.ds.query(
      `INSERT INTO overlay_sessions
         (identity_id, org_id, kind, surface_key, route, entity_type, entity_id, payload, origin)
       VALUES ($1,$2,$3,$4,$5,$6,$7,COALESCE($8::jsonb,'{}'::jsonb), COALESCE($9,'user')::overlay_origin)
       RETURNING *`,
      [row.identityId, row.orgId ?? null, row.kind, row.surfaceKey, row.route ?? null,
       row.entityType ?? null, row.entityId ?? null,
       row.payload ? JSON.stringify(row.payload) : null, row.origin ?? null],
    ).then(r => r[0]);
  }

  patch(id: string, patch: { payload?: Record<string, unknown>; status?: string; result?: Record<string, unknown> }) {
    return this.ds.query(
      `UPDATE overlay_sessions SET
         payload   = COALESCE($2::jsonb, payload),
         status    = COALESCE($3::overlay_status, status),
         result    = COALESCE($4::jsonb, result),
         closed_at = CASE WHEN $3 IN ('dismissed','completed','expired','failed') THEN now() ELSE closed_at END
       WHERE id = $1
       RETURNING *`,
      [id,
       patch.payload ? JSON.stringify(patch.payload) : null,
       patch.status ?? null,
       patch.result ? JSON.stringify(patch.result) : null],
    ).then(r => r[0]);
  }

  listOpen(identityId: string) {
    return this.ds.query(
      `SELECT * FROM overlay_sessions
        WHERE identity_id = $1 AND status IN ('open','pending')
        ORDER BY opened_at DESC LIMIT 100`,
      [identityId],
    );
  }

  get(id: string) {
    return this.ds.query(`SELECT * FROM overlay_sessions WHERE id = $1`, [id]).then(r => r[0]);
  }

  // --- workflows ---
  startWorkflow(identityId: string, templateKey: string, totalSteps: number, firstStep: string, context: Record<string, unknown>) {
    return this.ds.query(
      `INSERT INTO overlay_workflows (identity_id, template_key, current_step, total_steps, context)
       VALUES ($1,$2,$3,$4,$5::jsonb) RETURNING *`,
      [identityId, templateKey, firstStep, totalSteps, JSON.stringify(context)],
    ).then(r => r[0]);
  }

  advanceWorkflow(workflowId: string, stepKey: string, status: string, data: Record<string, unknown>) {
    return this.ds.transaction(async (mgr) => {
      await mgr.query(
        `UPDATE overlay_workflow_steps
            SET status = $3::overlay_status,
                data   = COALESCE(data,'{}'::jsonb) || $4::jsonb,
                exited_at = CASE WHEN $3 IN ('completed','dismissed','failed') THEN now() ELSE exited_at END,
                entered_at = COALESCE(entered_at, now())
          WHERE workflow_id = $1 AND step_key = $2`,
        [workflowId, stepKey, status, JSON.stringify(data)],
      );
      const next = await mgr.query(
        `SELECT step_key FROM overlay_workflow_steps
          WHERE workflow_id = $1 AND status IN ('pending','open')
          ORDER BY position ASC LIMIT 1`,
        [workflowId],
      );
      const isDone = next.length === 0;
      const wf = await mgr.query(
        `UPDATE overlay_workflows
            SET current_step = COALESCE($2, current_step),
                status       = CASE WHEN $3 THEN 'completed'::workflow_status ELSE status END,
                completed_at = CASE WHEN $3 THEN now() ELSE completed_at END,
                updated_at   = now()
          WHERE id = $1 RETURNING *`,
        [workflowId, next[0]?.step_key ?? null, isDone],
      );
      return wf[0];
    });
  }

  getWorkflow(id: string) {
    return this.ds.query(
      `SELECT w.*, COALESCE(json_agg(s ORDER BY s.position) FILTER (WHERE s.id IS NOT NULL), '[]') AS steps
         FROM overlay_workflows w
         LEFT JOIN overlay_workflow_steps s ON s.workflow_id = w.id
        WHERE w.id = $1 GROUP BY w.id`,
      [id],
    ).then(r => r[0]);
  }

  listWorkflows(identityId: string) {
    return this.ds.query(
      `SELECT * FROM overlay_workflows WHERE identity_id = $1 ORDER BY updated_at DESC LIMIT 50`,
      [identityId],
    );
  }

  // --- detached windows ---
  detach(identityId: string, channelKey: string, surfaceKey: string, route: string, state: Record<string, unknown>) {
    return this.ds.query(
      `INSERT INTO detached_windows (identity_id, channel_key, surface_key, route, state)
       VALUES ($1,$2,$3,$4,$5::jsonb)
       ON CONFLICT (identity_id, channel_key) DO UPDATE SET
         surface_key = EXCLUDED.surface_key,
         route       = EXCLUDED.route,
         state       = EXCLUDED.state,
         last_ping_at = now(),
         closed_at   = NULL
       RETURNING *`,
      [identityId, channelKey, surfaceKey, route, JSON.stringify(state)],
    ).then(r => r[0]);
  }

  pingWindow(identityId: string, channelKey: string, state?: Record<string, unknown>) {
    return this.ds.query(
      `UPDATE detached_windows
          SET last_ping_at = now(),
              state = COALESCE($3::jsonb, state)
        WHERE identity_id = $1 AND channel_key = $2 RETURNING *`,
      [identityId, channelKey, state ? JSON.stringify(state) : null],
    ).then(r => r[0]);
  }

  closeWindow(identityId: string, channelKey: string) {
    return this.ds.query(
      `UPDATE detached_windows SET closed_at = now()
        WHERE identity_id = $1 AND channel_key = $2 RETURNING *`,
      [identityId, channelKey],
    ).then(r => r[0]);
  }

  listWindows(identityId: string) {
    return this.ds.query(
      `SELECT * FROM detached_windows WHERE identity_id = $1 AND closed_at IS NULL ORDER BY last_ping_at DESC`,
      [identityId],
    );
  }

  // --- audit ---
  audit(row: { sessionId?: string | null; workflowId?: string | null; identityId: string; action: string; meta?: Record<string, unknown> }) {
    return this.ds.query(
      `INSERT INTO overlay_audit (session_id, workflow_id, identity_id, action, meta)
       VALUES ($1,$2,$3,$4,$5::jsonb)`,
      [row.sessionId ?? null, row.workflowId ?? null, row.identityId, row.action, JSON.stringify(row.meta ?? {})],
    );
  }
}
