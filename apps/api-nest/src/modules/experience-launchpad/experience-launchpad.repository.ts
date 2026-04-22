import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';

@Injectable()
export class ExperienceLaunchpadRepository {
  constructor(private readonly ds: DataSource) {}

  // Pathways
  listPathways(filters: { domain?: string; level?: string; q?: string; limit?: number }) {
    const where: string[] = [`status = 'published'`];
    const args: any[] = [];
    let i = 1;
    if (filters.domain) { where.push(`domain = $${i++}`); args.push(filters.domain); }
    if (filters.level) { where.push(`level = $${i++}`); args.push(filters.level); }
    if (filters.q) { where.push(`(title ILIKE $${i} OR summary ILIKE $${i})`); args.push(`%${filters.q}%`); i++; }
    args.push(Math.min(filters.limit ?? 50, 200));
    return this.ds.query(
      `SELECT * FROM launchpad_pathways WHERE ${where.join(' AND ')} ORDER BY updated_at DESC LIMIT $${i}`,
      args,
    );
  }
  getPathway(id: string) {
    return this.ds.query(`SELECT * FROM launchpad_pathways WHERE id = $1 OR slug = $1 LIMIT 1`, [id])
      .then((r: any[]) => r[0] ?? null);
  }
  createPathway(data: any, identityId: string) {
    return this.ds.query(
      `INSERT INTO launchpad_pathways (slug, title, summary, domain, level, duration_weeks, hero_image_url, outcomes, modules, tags, status, created_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8::jsonb,$9::jsonb,$10,$11,$12) RETURNING *`,
      [data.slug, data.title, data.summary, data.domain, data.level, data.duration_weeks,
       data.hero_image_url ?? null, JSON.stringify(data.outcomes), JSON.stringify(data.modules),
       data.tags, data.status, identityId],
    ).then((r: any[]) => r[0]);
  }
  enroll(identityId: string, pathwayId: string) {
    return this.ds.query(
      `INSERT INTO launchpad_pathway_enrollments (identity_id, pathway_id) VALUES ($1, $2)
       ON CONFLICT (identity_id, pathway_id) DO UPDATE SET status='active' RETURNING *`,
      [identityId, pathwayId],
    ).then((r: any[]) => r[0]);
  }
  setProgress(identityId: string, pathwayId: string, pct: number) {
    return this.ds.query(
      `UPDATE launchpad_pathway_enrollments SET progress_pct = $3,
        status = CASE WHEN $3 = 100 THEN 'completed' ELSE status END,
        completed_at = CASE WHEN $3 = 100 THEN now() ELSE completed_at END
       WHERE identity_id = $1 AND pathway_id = $2 RETURNING *`,
      [identityId, pathwayId, pct],
    ).then((r: any[]) => r[0]);
  }
  myEnrollments(identityId: string) {
    return this.ds.query(
      `SELECT e.*, p.title, p.slug, p.domain, p.level, p.hero_image_url
       FROM launchpad_pathway_enrollments e JOIN launchpad_pathways p ON p.id = e.pathway_id
       WHERE e.identity_id = $1 ORDER BY e.enrolled_at DESC LIMIT 100`,
      [identityId],
    );
  }

  // Mentors
  listMentors(filters: { expertise?: string[]; status?: string; q?: string; limit?: number }) {
    const where: string[] = [`1 = 1`];
    const args: any[] = [];
    let i = 1;
    if (filters.status) { where.push(`status = $${i++}`); args.push(filters.status); }
    if (filters.expertise?.length) { where.push(`expertise && $${i++}::text[]`); args.push(filters.expertise); }
    if (filters.q) { where.push(`(display_name ILIKE $${i} OR headline ILIKE $${i} OR bio ILIKE $${i})`); args.push(`%${filters.q}%`); i++; }
    args.push(Math.min(filters.limit ?? 50, 200));
    return this.ds.query(
      `SELECT * FROM launchpad_mentors WHERE ${where.join(' AND ')} ORDER BY rating DESC, sessions DESC LIMIT $${i}`,
      args,
    );
  }
  upsertMentor(identityId: string, data: any) {
    return this.ds.query(
      `INSERT INTO launchpad_mentors (identity_id, display_name, headline, bio, expertise, industries, rate_amount, rate_currency, status, availability)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10::jsonb)
       ON CONFLICT (identity_id) DO UPDATE SET
         display_name = EXCLUDED.display_name, headline = EXCLUDED.headline, bio = EXCLUDED.bio,
         expertise = EXCLUDED.expertise, industries = EXCLUDED.industries, rate_amount = EXCLUDED.rate_amount,
         rate_currency = EXCLUDED.rate_currency, status = EXCLUDED.status, availability = EXCLUDED.availability,
         updated_at = now() RETURNING *`,
      [identityId, data.display_name, data.headline, data.bio, data.expertise, data.industries,
       data.rate_amount, data.rate_currency, data.status, JSON.stringify(data.availability)],
    ).then((r: any[]) => r[0]);
  }
  bookMentor(identityId: string, data: any) {
    return this.ds.query(
      `INSERT INTO launchpad_mentor_bookings (mentor_id, mentee_identity_id, scheduled_for, duration_min, topic)
       VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [data.mentor_id, identityId, data.scheduled_for, data.duration_min, data.topic],
    ).then((r: any[]) => r[0]);
  }
  myMentorBookings(identityId: string) {
    return this.ds.query(
      `SELECT b.*, m.display_name AS mentor_name FROM launchpad_mentor_bookings b
       JOIN launchpad_mentors m ON m.id = b.mentor_id
       WHERE b.mentee_identity_id = $1 ORDER BY b.scheduled_for DESC LIMIT 100`,
      [identityId],
    );
  }

  // Challenges
  listChallenges(status?: string) {
    const args: any[] = [];
    let where = '1=1';
    if (status) { where = 'status = $1'; args.push(status); }
    return this.ds.query(
      `SELECT * FROM launchpad_challenges WHERE ${where} ORDER BY ends_at ASC LIMIT 200`, args,
    );
  }
  createChallenge(data: any) {
    return this.ds.query(
      `INSERT INTO launchpad_challenges (slug, title, brief, sponsor, sponsor_logo, prize_amount, prize_currency, starts_at, ends_at, status, tags, rubric)
       VALUES ($1,$2,$3,$4,$5,$6,$7,COALESCE($8::timestamptz, now()),$9::timestamptz,$10,$11,$12::jsonb) RETURNING *`,
      [data.slug, data.title, data.brief, data.sponsor ?? null, data.sponsor_logo ?? null,
       data.prize_amount, data.prize_currency, data.starts_at ?? null, data.ends_at, data.status,
       data.tags, JSON.stringify(data.rubric)],
    ).then((r: any[]) => r[0]);
  }
  submit(identityId: string, data: any) {
    return this.ds.query(
      `INSERT INTO launchpad_submissions (challenge_id, identity_id, title, summary, asset_urls)
       VALUES ($1,$2,$3,$4,$5::jsonb) RETURNING *`,
      [data.challenge_id, identityId, data.title, data.summary, JSON.stringify(data.asset_urls)],
    ).then((r: any[]) => r[0]);
  }
  leaderboard(challengeId: string, limit = 50) {
    return this.ds.query(
      `SELECT * FROM launchpad_submissions WHERE challenge_id = $1 ORDER BY score DESC, submitted_at ASC LIMIT $2`,
      [challengeId, Math.min(limit, 200)],
    );
  }

  // Opportunities
  listOpportunities(filters: { kind?: string; tags?: string[]; q?: string; limit?: number }) {
    const where: string[] = [`status = 'open'`];
    const args: any[] = [];
    let i = 1;
    if (filters.kind) { where.push(`kind = $${i++}`); args.push(filters.kind); }
    if (filters.tags?.length) { where.push(`tags && $${i++}::text[]`); args.push(filters.tags); }
    if (filters.q) { where.push(`(title ILIKE $${i} OR org_name ILIKE $${i})`); args.push(`%${filters.q}%`); i++; }
    args.push(Math.min(filters.limit ?? 50, 200));
    return this.ds.query(
      `SELECT * FROM launchpad_opportunities WHERE ${where.join(' AND ')} ORDER BY created_at DESC LIMIT $${i}`,
      args,
    );
  }
  createOpportunity(data: any) {
    return this.ds.query(
      `INSERT INTO launchpad_opportunities (kind, title, org_name, location, salary_band, starts_at, ends_at, level, tags, link_href, description)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *`,
      [data.kind, data.title, data.org_name, data.location, data.salary_band ?? null,
       data.starts_at ?? null, data.ends_at ?? null, data.level, data.tags,
       data.link_href ?? null, data.description],
    ).then((r: any[]) => r[0]);
  }

  // Audit
  audit(identityId: string | null, action: string, entityKind: string, entityId: string | null, payload: any) {
    return this.ds.query(
      `INSERT INTO lst_audit (identity_id, domain, action, entity_kind, entity_id, payload)
       VALUES ($1, 'launchpad', $2, $3, $4, $5::jsonb)`,
      [identityId, action, entityKind, entityId, JSON.stringify(payload ?? {})],
    );
  }
}
