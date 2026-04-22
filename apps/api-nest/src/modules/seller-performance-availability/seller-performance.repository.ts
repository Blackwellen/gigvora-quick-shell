import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

@Injectable()
export class SellerPerformanceRepository {
  constructor(@InjectDataSource() private readonly ds: DataSource) {}

  private async q<T = any>(sql: string, params: any[] = []): Promise<T[]> {
    return this.ds.query(sql, params);
  }

  async getOrCreateAvailability(sellerId: string) {
    const rows = await this.q(
      `INSERT INTO seller_availability (seller_id) VALUES ($1)
       ON CONFLICT (seller_id) DO UPDATE SET seller_id = EXCLUDED.seller_id
       RETURNING *`,
      [sellerId],
    );
    return rows[0];
  }

  async updateAvailability(sellerId: string, patch: Record<string, any>) {
    const fields: string[] = [];
    const values: any[] = [];
    let i = 1;
    for (const [k, v] of Object.entries(patch)) {
      fields.push(`${k} = $${i++}`);
      values.push(v);
    }
    if (!fields.length) return this.getOrCreateAvailability(sellerId);
    values.push(sellerId);
    const rows = await this.q(
      `UPDATE seller_availability SET ${fields.join(', ')}, updated_at = now()
       WHERE seller_id = $${i} RETURNING *`,
      values,
    );
    return rows[0] ?? this.getOrCreateAvailability(sellerId);
  }

  async listGigCapacity(sellerId: string) {
    return this.q(
      `SELECT * FROM seller_gig_capacity WHERE seller_id = $1 ORDER BY updated_at DESC`,
      [sellerId],
    );
  }

  async upsertGigCapacity(sellerId: string, gigId: string, patch: Record<string, any>) {
    const fields = Object.keys(patch);
    const values = Object.values(patch);
    if (!fields.length) {
      const rows = await this.q(
        `INSERT INTO seller_gig_capacity (seller_id, gig_id) VALUES ($1, $2)
         ON CONFLICT DO NOTHING RETURNING *`,
        [sellerId, gigId],
      );
      return rows[0];
    }
    const setClause = fields.map((f, i) => `${f} = $${i + 3}`).join(', ');
    const rows = await this.q(
      `INSERT INTO seller_gig_capacity (seller_id, gig_id, ${fields.join(',')})
       VALUES ($1, $2, ${fields.map((_, i) => `$${i + 3}`).join(',')})
       ON CONFLICT (id) DO UPDATE SET ${setClause}, updated_at = now()
       RETURNING *`,
      [sellerId, gigId, ...values],
    );
    return rows[0];
  }

  async setGigStatus(sellerId: string, gigId: string, status: string, reason?: string) {
    const rows = await this.q(
      `UPDATE seller_gig_capacity
       SET status = $3, paused_at = CASE WHEN $3 = 'paused' THEN now() ELSE NULL END,
           paused_reason = $4, updated_at = now()
       WHERE seller_id = $1 AND gig_id = $2 RETURNING *`,
      [sellerId, gigId, status, reason ?? null],
    );
    if (rows[0]) return rows[0];
    // create row if missing
    const created = await this.q(
      `INSERT INTO seller_gig_capacity (seller_id, gig_id, status, paused_reason, paused_at)
       VALUES ($1, $2, $3, $4, CASE WHEN $3 = 'paused' THEN now() ELSE NULL END)
       RETURNING *`,
      [sellerId, gigId, status, reason ?? null],
    );
    return created[0];
  }

  async getLatestSnapshot(sellerId: string) {
    const rows = await this.q(
      `SELECT * FROM seller_performance_snapshots WHERE seller_id = $1
       ORDER BY period_start DESC LIMIT 1`,
      [sellerId],
    );
    return rows[0];
  }

  async listOptimizations(sellerId: string, status: string = 'open') {
    return this.q(
      `SELECT * FROM seller_offer_optimizations WHERE seller_id = $1 AND status = $2
       ORDER BY severity DESC, created_at DESC`,
      [sellerId, status],
    );
  }

  async setOptimizationStatus(id: string, sellerId: string, status: 'dismissed' | 'applied') {
    const col = status === 'dismissed' ? 'dismissed_at' : 'applied_at';
    const rows = await this.q(
      `UPDATE seller_offer_optimizations
       SET status = $1, ${col} = now()
       WHERE id = $2 AND seller_id = $3 RETURNING *`,
      [status, id, sellerId],
    );
    return rows[0];
  }

  async logEvent(sellerId: string, eventType: string, payload: any, actorId?: string) {
    await this.q(
      `INSERT INTO seller_availability_events (seller_id, event_type, payload, actor_id)
       VALUES ($1, $2, $3::jsonb, $4)`,
      [sellerId, eventType, JSON.stringify(payload), actorId ?? null],
    );
  }
}
