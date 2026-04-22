import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import type { ReportCreate, ScheduleCreate } from './dto';

@Injectable()
export class ReportingRepository {
  constructor(@InjectDataSource() private readonly ds: DataSource) {}

  list(tenantId: string, ownerId: string | null) {
    return this.ds.query(
      `SELECT r.*, COUNT(s.id) FILTER (WHERE s.enabled) AS active_schedules
         FROM report_definitions r
         LEFT JOIN report_schedules s ON s.report_id=r.id
        WHERE r.tenant_id=$1 AND (r.visibility<>'private' OR r.owner_identity_id=$2)
        GROUP BY r.id
        ORDER BY r.updated_at DESC LIMIT 200`,
      [tenantId, ownerId],
    ).catch(() => []);
  }

  byId(id: string) {
    return this.ds.query(`SELECT * FROM report_definitions WHERE id=$1`, [id])
      .then((r) => r[0] ?? null).catch(() => null);
  }

  create(input: ReportCreate, ownerId: string, tenantId: string) {
    return this.ds.query(
      `INSERT INTO report_definitions
         (tenant_id, owner_identity_id, name, description, kind, query, visualization, visibility)
       VALUES ($1,$2,$3,$4,$5,$6::jsonb,$7::jsonb,$8) RETURNING *`,
      [tenantId, ownerId, input.name, input.description ?? null, input.kind,
       JSON.stringify(input.query), JSON.stringify(input.visualization ?? {}),
       input.visibility],
    ).then((r) => r[0]);
  }

  delete(id: string, ownerId: string) {
    return this.ds.query(
      `DELETE FROM report_definitions WHERE id=$1 AND owner_identity_id=$2 RETURNING id`,
      [id, ownerId]).then((r) => r[0] ?? null).catch(() => null);
  }

  schedules(reportId: string) {
    return this.ds.query(`SELECT * FROM report_schedules WHERE report_id=$1 ORDER BY id`, [reportId])
      .catch(() => []);
  }

  createSchedule(reportId: string, input: ScheduleCreate) {
    return this.ds.query(
      `INSERT INTO report_schedules (report_id, cron_expr, timezone, enabled, recipients, format)
       VALUES ($1,$2,$3,$4,$5::jsonb,$6) RETURNING *`,
      [reportId, input.cron_expr, input.timezone, input.enabled,
       JSON.stringify(input.recipients), input.format],
    ).then((r) => r[0]);
  }

  recordRun(reportId: string, status: string, rowCount: number, artifactUrl: string | null, err?: string) {
    return this.ds.query(
      `INSERT INTO report_runs (report_id, status, started_at, completed_at, row_count, artifact_url, error_message)
       VALUES ($1,$2, now(), now(), $3, $4, $5) RETURNING *`,
      [reportId, status, rowCount, artifactUrl, err ?? null],
    ).then((r) => r[0]).catch(() => null);
  }

  runs(reportId: string, limit = 30) {
    return this.ds.query(
      `SELECT * FROM report_runs WHERE report_id=$1 ORDER BY started_at DESC NULLS LAST LIMIT $2`,
      [reportId, limit],
    ).catch(() => []);
  }
}
