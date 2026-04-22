import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import type { ListPagesQuery, UpsertPageDto, CreateLeadDto, NewsletterSubscribeDto } from './dto';

@Injectable()
export class MarketingRepository {
  constructor(private readonly ds: DataSource) {}

  // --- Pages ---
  async listPages(q: ListPagesQuery) {
    const params: any[] = [];
    const where: string[] = [];
    if (q.surface) { params.push(q.surface); where.push(`surface = $${params.length}`); }
    if (q.status)  { params.push(q.status);  where.push(`status  = $${params.length}`); }
    if (q.locale)  { params.push(q.locale);  where.push(`locale  = $${params.length}`); }
    if (q.q)       { params.push(`%${q.q.toLowerCase()}%`); where.push(`(lower(title) LIKE $${params.length} OR lower(slug) LIKE $${params.length})`); }
    const limit = Math.min(q.limit ?? 50, 100);
    const offset = q.offset ?? 0;
    const whereSql = where.length ? 'WHERE ' + where.join(' AND ') : '';
    const items = await this.ds.query(
      `SELECT id, slug, surface, title, tagline, description, hero_image AS "heroImage",
              status, published_at AS "publishedAt", locale, version, updated_at AS "updatedAt"
       FROM marketing_pages ${whereSql}
       ORDER BY updated_at DESC
       LIMIT ${limit} OFFSET ${offset}`,
      params,
    );
    const totalRow = await this.ds.query(
      `SELECT COUNT(*)::int AS n FROM marketing_pages ${whereSql}`, params);
    const total = totalRow[0]?.n ?? items.length;
    return { items, total, limit, hasMore: offset + items.length < total };
  }

  async getPageBySlug(slug: string) {
    const rows = await this.ds.query(
      `SELECT * FROM marketing_pages WHERE slug = $1 LIMIT 1`, [slug],
    );
    return rows[0] ?? null;
  }

  async upsertPage(dto: UpsertPageDto, authorId: string | null) {
    const rows = await this.ds.query(
      `INSERT INTO marketing_pages (slug, surface, title, tagline, description, hero_image, body, seo, status, locale, author_id)
       VALUES ($1,$2,$3,$4,$5,$6,COALESCE($7,'{}'::jsonb),COALESCE($8,'{}'::jsonb),COALESCE($9,'draft'),COALESCE($10,'en-GB'),$11)
       ON CONFLICT (slug) DO UPDATE SET
         surface=EXCLUDED.surface, title=EXCLUDED.title, tagline=EXCLUDED.tagline,
         description=EXCLUDED.description, hero_image=EXCLUDED.hero_image, body=EXCLUDED.body,
         seo=EXCLUDED.seo, status=EXCLUDED.status, locale=EXCLUDED.locale,
         version = marketing_pages.version + 1, updated_at = now(),
         published_at = CASE WHEN EXCLUDED.status='published' AND marketing_pages.published_at IS NULL THEN now() ELSE marketing_pages.published_at END
       RETURNING *`,
      [dto.slug, dto.surface, dto.title, dto.tagline ?? null, dto.description ?? null,
       dto.heroImage ?? null, dto.body ?? null, dto.seo ?? null, dto.status ?? null,
       dto.locale ?? null, authorId],
    );
    return rows[0];
  }

  // --- Leads ---
  async createLead(dto: CreateLeadDto, ip: string | null, ua: string | null) {
    const consent = { ...(dto.consent ?? {}), ip, ua, recorded_at: new Date().toISOString() };
    const rows = await this.ds.query(
      `INSERT INTO marketing_leads (email, full_name, company, role, use_case, source_page, source_cta, utm, consent)
       VALUES ($1,$2,$3,$4,$5,$6,$7,COALESCE($8,'{}'::jsonb),$9::jsonb)
       RETURNING id, email, status, score, created_at AS "createdAt"`,
      [dto.email.trim().toLowerCase(), dto.fullName ?? null, dto.company ?? null, dto.role ?? null,
       dto.useCase ?? null, dto.sourcePage ?? null, dto.sourceCta ?? null,
       dto.utm ?? null, JSON.stringify(consent)],
    );
    return rows[0];
  }

  async listLeads(limit = 50, offset = 0, status?: string) {
    const params: any[] = [];
    const where = status ? (params.push(status), `WHERE status = $${params.length}`) : '';
    const cap = Math.min(limit, 100);
    const items = await this.ds.query(
      `SELECT id, email, full_name AS "fullName", company, role, source_page AS "sourcePage",
              status, score, created_at AS "createdAt"
       FROM marketing_leads ${where}
       ORDER BY created_at DESC
       LIMIT ${cap} OFFSET ${offset}`,
      params,
    );
    const totalRow = await this.ds.query(`SELECT COUNT(*)::int AS n FROM marketing_leads ${where}`, params);
    const total = totalRow[0]?.n ?? items.length;
    return { items, total, limit: cap, hasMore: offset + items.length < total };
  }

  // --- Newsletter ---
  async subscribe(dto: NewsletterSubscribeDto, ip: string | null, ua: string | null) {
    const email = dto.email.trim().toLowerCase();
    const rows = await this.ds.query(
      `INSERT INTO newsletter_subscribers (email, list_topics, source, utm, status, confirm_token)
       VALUES ($1, COALESCE($2, '{}'), $3, COALESCE($4,'{}'::jsonb), 'pending', encode(gen_random_bytes(16),'hex'))
       ON CONFLICT (email) DO UPDATE
         SET list_topics = EXCLUDED.list_topics,
             source = COALESCE(EXCLUDED.source, newsletter_subscribers.source),
             utm = newsletter_subscribers.utm || EXCLUDED.utm,
             status = CASE WHEN newsletter_subscribers.status='unsubscribed' THEN 'pending' ELSE newsletter_subscribers.status END,
             updated_at = now()
       RETURNING id, email, status, confirm_token AS "confirmToken", unsubscribe_token AS "unsubscribeToken"`,
      [email, dto.topics ?? null, dto.source ?? null, dto.utm ?? null],
    );
    await this.ds.query(
      `INSERT INTO marketing_consent_log (email, action, ip, user_agent) VALUES ($1,'opt_in',$2,$3)`,
      [email, ip, ua],
    );
    return rows[0];
  }

  async confirmSubscriber(token: string) {
    const rows = await this.ds.query(
      `UPDATE newsletter_subscribers SET status='confirmed', confirmed_at=now(), confirm_token=NULL, updated_at=now()
       WHERE confirm_token = $1 RETURNING email`, [token]);
    if (rows[0]) {
      await this.ds.query(`INSERT INTO marketing_consent_log (email, action) VALUES ($1,'confirm')`, [rows[0].email]);
    }
    return rows[0] ?? null;
  }

  async unsubscribe(token: string) {
    const rows = await this.ds.query(
      `UPDATE newsletter_subscribers SET status='unsubscribed', unsubscribed_at=now(), updated_at=now()
       WHERE unsubscribe_token = $1 RETURNING email`, [token]);
    if (rows[0]) {
      await this.ds.query(`INSERT INTO marketing_consent_log (email, action) VALUES ($1,'opt_out')`, [rows[0].email]);
    }
    return rows[0] ?? null;
  }

  // --- CTA experiments ---
  async getExperimentByKey(key: string) {
    const rows = await this.ds.query(
      `SELECT e.id, e.key, e.name, e.status,
              COALESCE(json_agg(json_build_object(
                'id', v.id, 'label', v.label, 'payload', v.payload, 'weight', v.weight
              ) ORDER BY v.label) FILTER (WHERE v.id IS NOT NULL), '[]') AS variants
       FROM cta_experiments e LEFT JOIN cta_variants v ON v.experiment_id = e.id
       WHERE e.key = $1 GROUP BY e.id LIMIT 1`, [key]);
    return rows[0] ?? null;
  }

  async recordCtaEvent(experimentId: string, variantId: string, eventType: string,
                       visitorId: string | null, page: string | null, meta: any) {
    await this.ds.query(
      `INSERT INTO cta_events (experiment_id, variant_id, event_type, visitor_id, page, meta)
       VALUES ($1,$2,$3,$4,$5,COALESCE($6,'{}'::jsonb))`,
      [experimentId, variantId, eventType, visitorId, page, meta ?? null],
    );
  }

  async ctaSummary(experimentId: string) {
    return this.ds.query(
      `SELECT v.id AS "variantId", v.label,
              COUNT(*) FILTER (WHERE e.event_type='impression') AS impressions,
              COUNT(*) FILTER (WHERE e.event_type='click') AS clicks,
              COUNT(*) FILTER (WHERE e.event_type='convert') AS conversions
       FROM cta_variants v LEFT JOIN cta_events e ON e.variant_id = v.id
       WHERE v.experiment_id = $1 GROUP BY v.id, v.label ORDER BY v.label`, [experimentId]);
  }
}
