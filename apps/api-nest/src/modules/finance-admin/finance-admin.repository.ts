import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

@Injectable()
export class FinanceAdminRepository {
  constructor(@InjectDataSource() private readonly ds: DataSource) {}

  // ── Refunds ────────────────────────────────────────
  async listRefunds(filter: any) {
    const w: string[] = []; const v: any[] = []; let i = 1;
    for (const [c, k] of [['status','status'],['category','category'],['provider','provider'],['customer_id','customerId']] as const) {
      if (filter[k] !== undefined) { w.push(`${c}=$${i++}`); v.push(filter[k]); }
    }
    if (filter.q) { w.push(`(reference ILIKE $${i} OR reason ILIKE $${i})`); v.push(`%${filter.q}%`); i++; }
    const where = w.length ? `WHERE ${w.join(' AND ')}` : '';
    const limit = filter.pageSize ?? 25;
    const offset = ((filter.page ?? 1) - 1) * limit;
    const [rows, count] = await Promise.all([
      this.ds.query(`SELECT * FROM fin_refunds ${where} ORDER BY created_at DESC LIMIT ${limit} OFFSET ${offset}`, v),
      this.ds.query(`SELECT COUNT(*)::int c FROM fin_refunds ${where}`, v),
    ]);
    return { items: rows, total: count[0]?.c ?? 0 };
  }
  async refundById(id: string) {
    const r = await this.ds.query(`SELECT * FROM fin_refunds WHERE id=$1`, [id]);
    return r[0] ?? null;
  }
  async createRefund(p: any, requestedBy: string) {
    const ref = `RF-${Math.random().toString(36).slice(2, 10).toUpperCase()}`;
    const r = await this.ds.query(
      `INSERT INTO fin_refunds (reference, invoice_id, payment_ref, customer_id, amount_minor, currency, reason, category, provider, requested_by, meta)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11::jsonb) RETURNING *`,
      [ref, p.invoiceId ?? null, p.paymentRef ?? null, p.customerId, p.amountMinor, p.currency,
       p.reason, p.category, p.provider, requestedBy, JSON.stringify(p.meta ?? {})],
    );
    return r[0];
  }
  async transitionRefund(id: string, to: string, actorId: string) {
    const cols = ['status=$1', 'updated_at=now()']; const vals: any[] = [to];
    if (to === 'approved')   { cols.push(`approved_by=$${vals.length+1}`, `approved_at=now()`); vals.push(actorId); }
    if (to === 'succeeded' || to === 'failed') { cols.push(`processed_at=now()`); }
    vals.push(id);
    const r = await this.ds.query(`UPDATE fin_refunds SET ${cols.join(',')} WHERE id=$${vals.length} RETURNING *`, vals);
    return r[0];
  }

  // ── Holds ──────────────────────────────────────────
  listHolds(status?: string) {
    return status
      ? this.ds.query(`SELECT * FROM fin_holds WHERE status=$1 ORDER BY created_at DESC LIMIT 200`, [status])
      : this.ds.query(`SELECT * FROM fin_holds ORDER BY created_at DESC LIMIT 200`);
  }
  async createHold(p: any) {
    const r = await this.ds.query(
      `INSERT INTO fin_holds (owner_id, amount_minor, currency, reason, expires_at, notes)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [p.ownerId, p.amountMinor, p.currency, p.reason, p.expiresAt ?? null, p.notes ?? null],
    );
    return r[0];
  }
  async releaseHold(id: string, actorId: string) {
    const r = await this.ds.query(
      `UPDATE fin_holds SET status='released', released_at=now(), released_by=$1 WHERE id=$2 AND status='active' RETURNING *`,
      [actorId, id],
    );
    return r[0] ?? null;
  }

  // ── Controls ───────────────────────────────────────
  listControls() { return this.ds.query(`SELECT * FROM fin_billing_controls ORDER BY scope, control_key`); }
  async setControl(p: any, actorId: string) {
    const r = await this.ds.query(
      `INSERT INTO fin_billing_controls (scope, scope_key, control_key, value, enabled, updated_by, updated_at)
       VALUES ($1,$2,$3,$4::jsonb,$5,$6,now())
       ON CONFLICT (scope, scope_key, control_key) DO UPDATE
         SET value=EXCLUDED.value, enabled=EXCLUDED.enabled, updated_by=EXCLUDED.updated_by, updated_at=now()
       RETURNING *`,
      [p.scope, p.scopeKey, p.controlKey, JSON.stringify(p.value), p.enabled, actorId],
    );
    return r[0];
  }

  // ── Ledger ─────────────────────────────────────────
  async ledger(account?: string, limit = 100) {
    const sql = account
      ? `SELECT * FROM fin_ledger WHERE account=$1 ORDER BY occurred_at DESC LIMIT ${limit}`
      : `SELECT * FROM fin_ledger ORDER BY occurred_at DESC LIMIT ${limit}`;
    return account ? this.ds.query(sql, [account]) : this.ds.query(sql);
  }
  async writeLedger(e: any) {
    await this.ds.query(
      `INSERT INTO fin_ledger (account, owner_id, ref_kind, ref_id, direction, amount_minor, currency, description, actor_id, meta)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10::jsonb)`,
      [e.account, e.ownerId ?? null, e.refKind, e.refId ?? null, e.direction,
       e.amountMinor, e.currency ?? 'GBP', e.description ?? null, e.actorId ?? null, JSON.stringify(e.meta ?? {})],
    );
  }
  async audit(actorId: string | null, action: string, targetKind: string | null, targetId: string | null, diff: any, meta: any = {}) {
    await this.ds.query(
      `INSERT INTO fin_audit_events (actor_id, action, target_kind, target_id, diff, ip, user_agent)
       VALUES ($1,$2,$3,$4,$5::jsonb,$6,$7)`,
      [actorId, action, targetKind, targetId, JSON.stringify(diff ?? {}), meta.ip ?? null, meta.userAgent ?? null],
    );
  }

  // ── KPIs ───────────────────────────────────────────
  async kpis() {
    const [refundStatus, holds, ledgerSummary] = await Promise.all([
      this.ds.query(`SELECT status, COUNT(*)::int c, COALESCE(SUM(amount_minor),0)::bigint a FROM fin_refunds GROUP BY status`),
      this.ds.query(`SELECT status, COUNT(*)::int c, COALESCE(SUM(amount_minor),0)::bigint a FROM fin_holds GROUP BY status`),
      this.ds.query(
        `SELECT account, direction, COALESCE(SUM(amount_minor),0)::bigint a FROM fin_ledger
          WHERE occurred_at > now() - interval '30 days' GROUP BY account, direction`,
      ),
    ]);
    return {
      refunds: Object.fromEntries(refundStatus.map((r: any) => [r.status, { count: r.c, amountMinor: Number(r.a) }])),
      holds:   Object.fromEntries(holds.map((r: any) => [r.status, { count: r.c, amountMinor: Number(r.a) }])),
      ledger30d: ledgerSummary.map((r: any) => ({ account: r.account, direction: r.direction, amountMinor: Number(r.a) })),
    };
  }
}
