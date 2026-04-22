import { Module } from '@nestjs/common';
import { Body, Controller, Delete, Get, Injectable, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { z } from 'zod';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

const DraftCreateSchema = z.object({
  kind: z.enum(['post', 'article', 'reel', 'clip', 'podcast', 'short', 'campaign', 'template', 'showcase', 'story']),
  title: z.string().min(1).max(280),
  body: z.string().max(60000).default(''),
  blocks: z.array(z.any()).max(500).default([]),
  hero_url: z.string().url().optional(),
  destination: z.string().max(64).default('feed'),
  tags: z.array(z.string().max(48)).max(20).default([]),
  scheduled_for: z.string().datetime().optional(),
});
const DraftPatchSchema = DraftCreateSchema.partial().extend({
  status: z.enum(['draft', 'in-review', 'scheduled', 'published', 'archived']).optional(),
});

@Injectable()
class StudioRepository {
  constructor(private readonly ds: DataSource) {}
  list(ownerId: string, filters: { status?: string; kind?: string; q?: string }) {
    const where: string[] = [`owner_identity_id = $1`];
    const args: any[] = [ownerId];
    let i = 2;
    if (filters.status) { where.push(`status = $${i++}`); args.push(filters.status); }
    if (filters.kind) { where.push(`kind = $${i++}`); args.push(filters.kind); }
    if (filters.q) { where.push(`(title ILIKE $${i} OR body ILIKE $${i})`); args.push(`%${filters.q}%`); i++; }
    return this.ds.query(
      `SELECT id, kind, title, status, destination, hero_url, tags, scheduled_for, published_at, version, metrics, updated_at
       FROM studio_drafts WHERE ${where.join(' AND ')} ORDER BY updated_at DESC LIMIT 200`, args,
    );
  }
  get(ownerId: string, id: string) {
    return this.ds.query(`SELECT * FROM studio_drafts WHERE id = $1 AND owner_identity_id = $2`, [id, ownerId])
      .then((r: any[]) => r[0] ?? null);
  }
  create(ownerId: string, data: any) {
    return this.ds.query(
      `INSERT INTO studio_drafts (owner_identity_id, kind, title, body, blocks, hero_url, destination, tags, scheduled_for, status)
       VALUES ($1,$2,$3,$4,$5::jsonb,$6,$7,$8,$9,
         CASE WHEN $9 IS NOT NULL THEN 'scheduled' ELSE 'draft' END) RETURNING *`,
      [ownerId, data.kind, data.title, data.body, JSON.stringify(data.blocks),
       data.hero_url ?? null, data.destination, data.tags, data.scheduled_for ?? null],
    ).then((r: any[]) => r[0]);
  }
  patch(ownerId: string, id: string, data: any) {
    const sets: string[] = [];
    const args: any[] = [];
    let i = 1;
    for (const k of Object.keys(data)) {
      if (data[k] === undefined) continue;
      const col = ({ scheduled_for: 'scheduled_for', hero_url: 'hero_url' } as Record<string, string>)[k] ?? k;
      if (col === 'blocks') { sets.push(`blocks = $${i++}::jsonb`); args.push(JSON.stringify(data.blocks)); continue; }
      sets.push(`${col} = $${i++}`); args.push(data[k]);
    }
    sets.push(`updated_at = now()`);
    sets.push(`version = version + 1`);
    args.push(id, ownerId);
    return this.ds.query(
      `UPDATE studio_drafts SET ${sets.join(', ')} WHERE id = $${i++} AND owner_identity_id = $${i} RETURNING *`,
      args,
    ).then((r: any[]) => r[0]);
  }
  publish(ownerId: string, id: string) {
    return this.ds.query(
      `UPDATE studio_drafts SET status='published', published_at = now(), updated_at = now()
       WHERE id = $1 AND owner_identity_id = $2 RETURNING *`,
      [id, ownerId],
    ).then((r: any[]) => r[0]);
  }
  remove(ownerId: string, id: string) {
    return this.ds.query(`DELETE FROM studio_drafts WHERE id = $1 AND owner_identity_id = $2`, [id, ownerId]);
  }
  // Assets
  listAssets(ownerId: string, kind?: string) {
    const args: any[] = [ownerId];
    let where = 'owner_identity_id = $1';
    if (kind) { where += ' AND kind = $2'; args.push(kind); }
    return this.ds.query(`SELECT * FROM studio_assets WHERE ${where} ORDER BY created_at DESC LIMIT 200`, args);
  }
  registerAsset(ownerId: string, data: any) {
    return this.ds.query(
      `INSERT INTO studio_assets (owner_identity_id, kind, url, poster_url, bytes, duration_ms, width, height, tags, metadata)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10::jsonb) RETURNING *`,
      [ownerId, data.kind, data.url, data.poster_url ?? null, data.bytes ?? 0,
       data.duration_ms ?? null, data.width ?? null, data.height ?? null,
       data.tags ?? [], JSON.stringify(data.metadata ?? {})],
    ).then((r: any[]) => r[0]);
  }
}

@Controller('api/v1/creation-studio')
@UseGuards(JwtAuthGuard)
class StudioController {
  constructor(private readonly repo: StudioRepository) {}
  private id(req: any) { return req.user?.identityId ?? req.user?.sub; }

  @Get('drafts')
  drafts(@Req() req: any, @Query() q: any) {
    return { items: this.repo.list(this.id(req), { status: q.status, kind: q.kind, q: q.q }) };
  }
  @Get('drafts/:id')
  draft(@Req() req: any, @Param('id') id: string) { return this.repo.get(this.id(req), id); }
  @Post('drafts')
  create(@Req() req: any, @Body() body: any) {
    return this.repo.create(this.id(req), DraftCreateSchema.parse(body));
  }
  @Patch('drafts/:id')
  patch(@Req() req: any, @Param('id') id: string, @Body() body: any) {
    return this.repo.patch(this.id(req), id, DraftPatchSchema.parse(body));
  }
  @Post('drafts/:id/publish')
  publish(@Req() req: any, @Param('id') id: string) { return this.repo.publish(this.id(req), id); }
  @Delete('drafts/:id')
  remove(@Req() req: any, @Param('id') id: string) { return this.repo.remove(this.id(req), id); }

  @Get('assets')
  assets(@Req() req: any, @Query('kind') kind?: string) { return { items: this.repo.listAssets(this.id(req), kind) }; }
  @Post('assets')
  registerAsset(@Req() req: any, @Body() body: any) { return this.repo.registerAsset(this.id(req), body); }
}

@Module({ controllers: [StudioController], providers: [StudioRepository] })
export class CreationStudioModule {}
