import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';

@Injectable()
export class SalesNavigatorRepository {
  constructor(private readonly ds: DataSource) {}

  // Leads
  async listLeads(ownerId: string, filters: any) {
    const where: string[] = ['owner_identity_id = $1'];
    const args: any[] = [ownerId];
    let i = 2;
    if (filters.q) { where.push(`(full_name ILIKE $${i} OR headline ILIKE $${i} OR company_name ILIKE $${i})`); args.push(`%${filters.q}%`); i++; }
    if (filters.industry) { where.push(`industry = $${i++}`); args.push(filters.industry); }
    if (filters.region) { where.push(`region = $${i++}`); args.push(filters.region); }
    if (filters.hq_country) { where.push(`hq_country = $${i++}`); args.push(filters.hq_country); }
    if (filters.function_area) { where.push(`function_area = $${i++}`); args.push(filters.function_area); }
    if (filters.status) { where.push(`status = $${i++}`); args.push(filters.status); }
    if (filters.saved) { where.push(`saved = true`); }
    if (filters.intent_min != null) { where.push(`intent_score >= $${i++}`); args.push(filters.intent_min); }
    if (filters.seniority?.length) { where.push(`seniority = ANY($${i++})`); args.push(filters.seniority); }
    const limit = Math.min(filters.page_size ?? 25, 100);
    const offset = ((filters.page ?? 1) - 1) * limit;
    args.push(limit, offset);
    const rows = await this.ds.query(
      `SELECT * FROM sn_leads WHERE ${where.join(' AND ')} ORDER BY updated_at DESC LIMIT $${i++} OFFSET $${i}`,
      args,
    );
    const [{ count }] = await this.ds.query(
      `SELECT COUNT(*)::int as count FROM sn_leads WHERE ${where.join(' AND ')}`,
      args.slice(0, args.length - 2),
    );
    return { items: rows, meta: { count, page: filters.page ?? 1, page_size: limit } };
  }

  async getLead(ownerId: string, id: string) {
    const [row] = await this.ds.query(`SELECT * FROM sn_leads WHERE id = $1 AND owner_identity_id = $2`, [id, ownerId]);
    return row || null;
  }

  async createLead(ownerId: string, data: any) {
    const [row] = await this.ds.query(
      `INSERT INTO sn_leads (owner_identity_id, full_name, headline, email, phone, company_id, company_name,
        title, seniority, function_area, industry, hq_country, hq_city, region, linkedin_url, source, tags, notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18) RETURNING *`,
      [ownerId, data.full_name, data.headline, data.email, data.phone, data.company_id, data.company_name,
       data.title, data.seniority, data.function_area, data.industry, data.hq_country, data.hq_city,
       data.region, data.linkedin_url, data.source, data.tags, data.notes],
    );
    return row;
  }

  async updateLead(ownerId: string, id: string, data: any) {
    const sets: string[] = [];
    const args: any[] = [];
    let i = 1;
    for (const [k, v] of Object.entries(data)) {
      if (v === undefined) continue;
      sets.push(`${k} = $${i++}`); args.push(v);
    }
    if (!sets.length) return this.getLead(ownerId, id);
    args.push(id, ownerId);
    const [row] = await this.ds.query(
      `UPDATE sn_leads SET ${sets.join(', ')} WHERE id = $${i++} AND owner_identity_id = $${i} RETURNING *`,
      args,
    );
    return row || null;
  }

  async deleteLead(ownerId: string, id: string) {
    await this.ds.query(`DELETE FROM sn_leads WHERE id = $1 AND owner_identity_id = $2`, [id, ownerId]);
    return { ok: true };
  }

  // Lists
  async listLeadLists(ownerId: string) {
    return this.ds.query(`SELECT * FROM sn_lead_lists WHERE owner_identity_id = $1 ORDER BY pinned DESC, updated_at DESC`, [ownerId]);
  }
  async createList(ownerId: string, data: any) {
    const [row] = await this.ds.query(
      `INSERT INTO sn_lead_lists (owner_identity_id, name, kind, query, pinned) VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [ownerId, data.name, data.kind, data.query, data.pinned],
    );
    return row;
  }
  async addToList(ownerId: string, listId: string, leadIds: string[]) {
    for (const id of leadIds) {
      await this.ds.query(`INSERT INTO sn_lead_list_members (list_id, lead_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`, [listId, id]);
    }
    await this.ds.query(`UPDATE sn_lead_lists SET member_count = (SELECT COUNT(*) FROM sn_lead_list_members WHERE list_id = $1) WHERE id = $1 AND owner_identity_id = $2`, [listId, ownerId]);
    return { ok: true, added: leadIds.length };
  }

  // Sequences + Activities
  async listSequences(ownerId: string) {
    return this.ds.query(`SELECT * FROM sn_outreach_sequences WHERE owner_identity_id = $1 ORDER BY updated_at DESC`, [ownerId]);
  }
  async createSequence(ownerId: string, data: any) {
    const [row] = await this.ds.query(
      `INSERT INTO sn_outreach_sequences (owner_identity_id, name, channel, goal, steps) VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [ownerId, data.name, data.channel, data.goal, JSON.stringify(data.steps)],
    );
    return row;
  }
  async createActivity(ownerId: string, data: any) {
    const [row] = await this.ds.query(
      `INSERT INTO sn_outreach_activities (sequence_id, lead_id, owner_identity_id, step_index, channel, subject, body, scheduled_at, status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
      [data.sequence_id ?? null, data.lead_id, ownerId, data.step_index, data.channel,
       data.subject ?? null, data.body ?? null, data.scheduled_at ?? null, data.status],
    );
    await this.ds.query(`UPDATE sn_leads SET last_activity_at = now() WHERE id = $1 AND owner_identity_id = $2`, [data.lead_id, ownerId]);
    return row;
  }
  async listActivities(ownerId: string, leadId?: string) {
    if (leadId) return this.ds.query(`SELECT * FROM sn_outreach_activities WHERE owner_identity_id = $1 AND lead_id = $2 ORDER BY created_at DESC`, [ownerId, leadId]);
    return this.ds.query(`SELECT * FROM sn_outreach_activities WHERE owner_identity_id = $1 ORDER BY created_at DESC LIMIT 200`, [ownerId]);
  }

  // Goals
  async listGoals(ownerId: string) {
    return this.ds.query(`SELECT * FROM sn_relationship_goals WHERE owner_identity_id = $1 ORDER BY next_touch_at NULLS LAST`, [ownerId]);
  }
  async createGoal(ownerId: string, data: any) {
    const [row] = await this.ds.query(
      `INSERT INTO sn_relationship_goals (owner_identity_id, lead_id, account_company_id, title, cadence_days, next_touch_at, notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [ownerId, data.lead_id ?? null, data.account_company_id ?? null, data.title, data.cadence_days, data.next_touch_at ?? null, data.notes],
    );
    return row;
  }

  // Signals
  async listSignals(filters: any) {
    const where: string[] = ['(expires_at IS NULL OR expires_at > now())'];
    const args: any[] = [];
    let i = 1;
    if (filters.company_id) { where.push(`company_id = $${i++}`); args.push(filters.company_id); }
    if (filters.kind) { where.push(`kind = $${i++}`); args.push(filters.kind); }
    if (filters.severity_min) { where.push(`severity >= $${i++}`); args.push(filters.severity_min); }
    args.push(filters.limit ?? 100);
    return this.ds.query(
      `SELECT s.*, c.name as company_name, c.logo_url as company_logo FROM sn_sales_signals s
       LEFT JOIN companies c ON c.id = s.company_id
       WHERE ${where.join(' AND ')} ORDER BY severity DESC, detected_at DESC LIMIT $${i}`,
      args,
    );
  }
  async createSignal(data: any) {
    const [row] = await this.ds.query(
      `INSERT INTO sn_sales_signals (company_id, kind, severity, title, body, source_url, source_label, expires_at, metadata)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
      [data.company_id, data.kind, data.severity, data.title, data.body, data.source_url ?? null,
       data.source_label ?? null, data.expires_at ?? null, JSON.stringify(data.metadata)],
    );
    return row;
  }

  // Seats
  async listSeats(workspaceId: string) {
    return this.ds.query(`SELECT * FROM sn_seats WHERE workspace_id = $1 ORDER BY invited_at DESC`, [workspaceId]);
  }
  async upsertSeat(data: any) {
    const [row] = await this.ds.query(
      `INSERT INTO sn_seats (workspace_id, identity_id, role, monthly_credit_quota)
       VALUES ($1,$2,$3,$4)
       ON CONFLICT (workspace_id, identity_id) DO UPDATE SET role = EXCLUDED.role, monthly_credit_quota = EXCLUDED.monthly_credit_quota
       RETURNING *`,
      [data.workspace_id, data.identity_id, data.role, data.monthly_credit_quota],
    );
    return row;
  }

  // Account/Company intel — reuse existing companies
  async accountSearch(q: string, limit = 25) {
    return this.ds.query(
      `SELECT id, name, slug, logo_url, industry, hq_country, hq_city, employee_count
       FROM companies WHERE name ILIKE $1 OR industry ILIKE $1 ORDER BY employee_count DESC NULLS LAST LIMIT $2`,
      [`%${q}%`, limit],
    );
  }

  // Audit
  async audit(identityId: string, action: string, kind: string, entityId: string | null, payload: any) {
    await this.ds.query(
      `INSERT INTO sn_audit (identity_id, action, entity_kind, entity_id, payload) VALUES ($1,$2,$3,$4,$5)`,
      [identityId, action, kind, entityId, JSON.stringify(payload ?? {})],
    );
  }
}
