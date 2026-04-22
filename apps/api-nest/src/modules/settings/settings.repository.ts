import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import type { SettingNamespace, SettingScope, UpsertSettingDto } from './dto';

/** Hot-path queries for the Settings page. Every query is bounded + indexed. */
@Injectable()
export class SettingsRepository {
  constructor(private readonly ds: DataSource) {}

  // ---------- settings ----------
  list(identityId: string, namespace?: SettingNamespace) {
    if (namespace) {
      return this.ds.query(
        `SELECT * FROM settings WHERE identity_id = $1 AND namespace = $2 ORDER BY key`,
        [identityId, namespace],
      );
    }
    return this.ds.query(
      `SELECT * FROM settings WHERE identity_id = $1 ORDER BY namespace, key`,
      [identityId],
    );
  }

  getOne(identityId: string, namespace: string, key: string) {
    return this.ds.query(
      `SELECT * FROM settings WHERE identity_id = $1 AND namespace = $2 AND key = $3 LIMIT 1`,
      [identityId, namespace, key],
    ).then(r => r[0]);
  }

  /** Upsert + audit-trail in a single transaction. */
  async upsert(identityId: string, actorId: string | null, dto: UpsertSettingDto) {
    return this.ds.transaction(async (mgr) => {
      const existing = await mgr.query(
        `SELECT value FROM settings WHERE identity_id = $1 AND namespace = $2 AND key = $3 LIMIT 1`,
        [identityId, dto.namespace, dto.key],
      );
      const oldValue = existing[0]?.value ?? null;
      const row = await mgr.query(
        `INSERT INTO settings (identity_id, org_id, scope, namespace, key, value, updated_by, updated_at)
         VALUES ($1, $2, COALESCE($3,'user')::setting_scope, $4, $5, $6::jsonb, $7, now())
         ON CONFLICT (identity_id, org_id, scope, namespace, key) DO UPDATE SET
           value = EXCLUDED.value, updated_by = EXCLUDED.updated_by, updated_at = now()
         RETURNING *`,
        [identityId, dto.orgId ?? null, dto.scope ?? null, dto.namespace, dto.key,
         JSON.stringify(dto.value), actorId],
      ).then((r: { 0: unknown }[]) => r[0]);
      await mgr.query(
        `INSERT INTO settings_audit (identity_id, actor_id, namespace, key, old_value, new_value, source)
         VALUES ($1, $2, $3, $4, $5::jsonb, $6::jsonb, 'web')`,
        [identityId, actorId, dto.namespace, dto.key, oldValue, JSON.stringify(dto.value)],
      );
      return row;
    });
  }

  resetNamespace(identityId: string, namespace: SettingNamespace) {
    return this.ds.query(
      `DELETE FROM settings WHERE identity_id = $1 AND namespace = $2 RETURNING key`,
      [identityId, namespace],
    );
  }

  audit(identityId: string, limit = 50) {
    return this.ds.query(
      `SELECT * FROM settings_audit WHERE identity_id = $1 ORDER BY occurred_at DESC LIMIT $2`,
      [identityId, Math.min(limit, 200)],
    );
  }

  // ---------- catalogue ----------
  listLocales()   { return this.ds.query(`SELECT * FROM locales   WHERE enabled ORDER BY label`); }
  listTimezones() { return this.ds.query(`SELECT * FROM timezones WHERE enabled ORDER BY utc_offset, label`); }

  // ---------- connected accounts ----------
  listConnectedAccounts(identityId: string) {
    return this.ds.query(
      `SELECT * FROM connected_accounts WHERE identity_id = $1 AND revoked_at IS NULL ORDER BY connected_at DESC`,
      [identityId],
    );
  }

  createConnectedAccount(identityId: string, p: { provider: string; externalId: string; displayName?: string; scopes?: string[]; metadata?: Record<string, unknown> }) {
    return this.ds.query(
      `INSERT INTO connected_accounts (identity_id, provider, external_id, display_name, scopes, metadata)
       VALUES ($1, $2, $3, $4, COALESCE($5,'{}'::text[]), COALESCE($6::jsonb,'{}'::jsonb))
       ON CONFLICT (identity_id, provider, external_id) DO UPDATE SET
         display_name = EXCLUDED.display_name, scopes = EXCLUDED.scopes,
         metadata = EXCLUDED.metadata, revoked_at = NULL, last_used_at = now()
       RETURNING *`,
      [identityId, p.provider, p.externalId, p.displayName ?? null,
       p.scopes ?? null, p.metadata ? JSON.stringify(p.metadata) : null],
    ).then(r => r[0]);
  }

  revokeConnectedAccount(identityId: string, id: string) {
    return this.ds.query(
      `UPDATE connected_accounts SET revoked_at = now() WHERE id = $1 AND identity_id = $2 RETURNING id`,
      [id, identityId],
    );
  }

  // ---------- data requests (GDPR) ----------
  createDataRequest(identityId: string, kind: string, reason?: string) {
    return this.ds.query(
      `INSERT INTO data_requests (identity_id, kind, reason) VALUES ($1, $2::data_request_kind, $3) RETURNING *`,
      [identityId, kind, reason ?? null],
    ).then(r => r[0]);
  }

  listDataRequests(identityId: string) {
    return this.ds.query(
      `SELECT id, kind, status, requested_at, completed_at, download_url, reason
         FROM data_requests WHERE identity_id = $1 ORDER BY requested_at DESC`,
      [identityId],
    );
  }
}
