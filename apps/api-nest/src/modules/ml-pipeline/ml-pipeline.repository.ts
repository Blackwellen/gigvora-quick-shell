/**
 * Repository for the ML pipeline registry + ID-Verifier connectors.
 * Reads/writes the user's own Postgres via TypeORM DataSource (raw SQL).
 */
import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import type { EncryptedBundle } from './ml-pipeline.crypto';

export interface ModelRow {
  id: string; name: string; version: string; kind: string; active: boolean;
}

export interface PerfSampleIn {
  modelId: string;
  precision: number; recall: number;
  latencyP95Ms: number; uptimePct: number;
  sampleSize?: number;
}

export interface ScoreIn {
  modelId: string;
  subjectKind: string; subjectId: string;
  score: number; band: string; flag: string;
  components?: unknown; reason?: unknown;
}

export interface ConnectorRow {
  id: string;
  provider: 'onfido' | 'veriff' | 'persona' | 'stripe_identity' | 'manual';
  enabled: boolean;
  priority: number;
  health: 'healthy' | 'degraded' | 'down' | 'unknown';
  last_health_at: string | null;
  config_public: Record<string, unknown>;
  has_secret: boolean;
  config_secret_key_version: number | null;
  updated_at: string;
}

@Injectable()
export class MlPipelineRepository {
  constructor(@InjectDataSource() private readonly ds: DataSource) {}

  // ── Models ─────────────────────────────────────────────
  async listActiveModels(): Promise<ModelRow[]> {
    return this.ds.query(`SELECT id, name, version, kind, active FROM ml_models WHERE active = true ORDER BY name`);
  }
  async findModelByName(name: string): Promise<ModelRow | null> {
    const r = await this.ds.query(
      `SELECT id, name, version, kind, active FROM ml_models WHERE name = $1 AND active = true ORDER BY created_at DESC LIMIT 1`,
      [name],
    );
    return r[0] ?? null;
  }
  async upsertModel(name: string, version: string, kind: string): Promise<ModelRow> {
    const r = await this.ds.query(
      `INSERT INTO ml_models (name, version, kind, active) VALUES ($1,$2,$3,true)
       ON CONFLICT (name, version) DO UPDATE SET active = true
       RETURNING id, name, version, kind, active`,
      [name, version, kind],
    );
    return r[0];
  }

  // ── Performance samples ────────────────────────────────
  async insertPerformance(s: PerfSampleIn): Promise<void> {
    await this.ds.query(
      `INSERT INTO ml_model_performance
        (model_id, precision, recall, latency_p95_ms, uptime_pct, sample_size)
       VALUES ($1,$2,$3,$4,$5,$6)`,
      [s.modelId, s.precision, s.recall, s.latencyP95Ms, s.uptimePct, s.sampleSize ?? 0],
    );
  }

  async recentPerformance(limit = 200): Promise<Array<{
    model: string; version: string; kind: string;
    precision: number; recall: number; latency_p95_ms: number; uptime_pct: number; sampled_at: string;
  }>> {
    return this.ds.query(
      `SELECT m.name AS model, m.version, m.kind,
              p.precision::float AS precision, p.recall::float AS recall,
              p.latency_p95_ms, p.uptime_pct::float AS uptime_pct, p.sampled_at
       FROM ml_model_performance p
       JOIN ml_models m ON m.id = p.model_id
       WHERE m.active = true
       ORDER BY p.sampled_at DESC
       LIMIT $1`,
      [limit],
    );
  }

  // ── Scores ─────────────────────────────────────────────
  async insertScore(s: ScoreIn): Promise<void> {
    await this.ds.query(
      `INSERT INTO ml_scores
        (model_id, subject_kind, subject_id, score, band, flag, components, reason)
       VALUES ($1,$2,$3,$4,$5,$6,$7::jsonb,$8::jsonb)`,
      [s.modelId, s.subjectKind, s.subjectId, s.score, s.band, s.flag,
       JSON.stringify(s.components ?? []), JSON.stringify(s.reason ?? [])],
    );
  }

  async latestScoresFor(subjectKind: string, subjectIds: string[]): Promise<Array<{
    subject_kind: string; subject_id: string; model: string;
    score: number; band: string; flag: string; created_at: string;
  }>> {
    if (!subjectIds.length) return [];
    return this.ds.query(
      `SELECT DISTINCT ON (s.subject_id)
              s.subject_kind, s.subject_id, m.name AS model,
              s.score::float AS score, s.band, s.flag, s.created_at
       FROM ml_scores s
       JOIN ml_models m ON m.id = s.model_id
       WHERE s.subject_kind = $1 AND s.subject_id = ANY($2::text[])
       ORDER BY s.subject_id, s.created_at DESC`,
      [subjectKind, subjectIds],
    );
  }

  // ── ID-Verifier connectors ────────────────────────────
  async listConnectors(): Promise<ConnectorRow[]> {
    return this.ds.query(
      `SELECT id, provider, enabled, priority, health, last_health_at,
              COALESCE(config_public, '{}'::jsonb) AS config_public,
              (config_secret_ciphertext IS NOT NULL) AS has_secret,
              config_secret_key_version, updated_at
       FROM id_verify_connectors ORDER BY priority`,
    );
  }

  async getConnector(id: string): Promise<ConnectorRow | null> {
    const r = await this.ds.query(
      `SELECT id, provider, enabled, priority, health, last_health_at,
              COALESCE(config_public, '{}'::jsonb) AS config_public,
              (config_secret_ciphertext IS NOT NULL) AS has_secret,
              config_secret_key_version, updated_at
       FROM id_verify_connectors WHERE id = $1`, [id],
    );
    return r[0] ?? null;
  }

  async setConnectorEnabled(id: string, enabled: boolean, actorId: string | null,
                            ip?: string, ua?: string): Promise<ConnectorRow> {
    const before = await this.getConnector(id);
    const r = await this.ds.query(
      `UPDATE id_verify_connectors
         SET enabled = $2, updated_by = $3
       WHERE id = $1
       RETURNING id, provider, enabled, priority, health, last_health_at,
                 COALESCE(config_public, '{}'::jsonb) AS config_public,
                 (config_secret_ciphertext IS NOT NULL) AS has_secret,
                 config_secret_key_version, updated_at`,
      [id, enabled, actorId],
    );
    await this.logConnectorEvent(id, actorId, enabled ? 'enable' : 'disable', before, r[0], ip, ua);
    return r[0];
  }

  async setConnectorSecret(id: string, secret: EncryptedBundle | null,
                           configPublic: Record<string, unknown> | undefined,
                           actorId: string | null, ip?: string, ua?: string): Promise<ConnectorRow> {
    const before = await this.getConnector(id);
    await this.ds.query(
      `UPDATE id_verify_connectors
         SET config_secret_ciphertext  = $2,
             config_secret_iv          = $3,
             config_secret_tag         = $4,
             config_secret_key_version = $5,
             config_public             = COALESCE($6::jsonb, config_public),
             updated_by                = $7
       WHERE id = $1`,
      [id,
       secret?.ciphertext ?? null, secret?.iv ?? null, secret?.tag ?? null, secret?.keyVersion ?? null,
       configPublic ? JSON.stringify(configPublic) : null, actorId],
    );
    const after = await this.getConnector(id);
    await this.logConnectorEvent(id, actorId, 'rotate_secret', before, after, ip, ua);
    return after!;
  }

  async getConnectorSecretCipher(id: string): Promise<EncryptedBundle | null> {
    const r = await this.ds.query(
      `SELECT config_secret_ciphertext AS ciphertext,
              config_secret_iv AS iv,
              config_secret_tag AS tag,
              config_secret_key_version AS "keyVersion"
       FROM id_verify_connectors WHERE id = $1`, [id],
    );
    const row = r[0];
    if (!row?.ciphertext) return null;
    return row as EncryptedBundle;
  }

  async setHealth(id: string, health: 'healthy' | 'degraded' | 'down' | 'unknown'): Promise<void> {
    await this.ds.query(
      `UPDATE id_verify_connectors SET health = $2, last_health_at = now() WHERE id = $1`,
      [id, health],
    );
    await this.logConnectorEvent(id, null, 'health_probe', null, { health }, undefined, undefined);
  }

  private async logConnectorEvent(connectorId: string, actorId: string | null,
                                  action: string, before: unknown, after: unknown,
                                  ip?: string, ua?: string): Promise<void> {
    await this.ds.query(
      `INSERT INTO id_verify_connector_events
        (connector_id, actor_id, action, before, after, ip, user_agent)
       VALUES ($1,$2,$3,$4::jsonb,$5::jsonb,$6,$7)`,
      [connectorId, actorId, action,
       before ? JSON.stringify(before) : null,
       after  ? JSON.stringify(after)  : null,
       ip ?? null, ua ?? null],
    );
  }

  async listConnectorEvents(connectorId: string, limit = 50) {
    return this.ds.query(
      `SELECT id, actor_id, action, before, after, ip, user_agent, created_at
       FROM id_verify_connector_events WHERE connector_id = $1 ORDER BY created_at DESC LIMIT $2`,
      [connectorId, limit],
    );
  }
}
