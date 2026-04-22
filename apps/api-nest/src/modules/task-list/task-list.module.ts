import { Module, Body, Controller, Delete, Get, Injectable, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { z } from 'zod';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

const ListSchema = z.object({
  name: z.string().min(1).max(120),
  description: z.string().max(2000).default(''),
  color: z.string().max(16).default('#6366f1'),
  position: z.number().int().min(0).max(10000).default(0),
  workspace_id: z.string().uuid().optional(),
});
const ItemSchema = z.object({
  list_id: z.string().uuid(),
  title: z.string().min(1).max(280),
  notes: z.string().max(8000).default(''),
  status: z.enum(['todo', 'in_progress', 'blocked', 'done', 'cancelled']).default('todo'),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).default('medium'),
  due_at: z.string().datetime().optional(),
  assignee_identity_id: z.string().uuid().optional(),
  labels: z.array(z.string().max(48)).max(20).default([]),
  linked_entity: z.record(z.string(), z.any()).optional(),
});
const ItemPatchSchema = ItemSchema.partial().omit({ list_id: true });

@Injectable()
class TaskRepo {
  constructor(private readonly ds: DataSource) {}
  lists(ownerId: string, includeArchived = false) {
    return this.ds.query(
      `SELECT l.*, (SELECT COUNT(*)::int FROM task_items i WHERE i.list_id = l.id AND i.status != 'done') AS open_count
       FROM task_lists l WHERE l.owner_identity_id = $1 ${includeArchived ? '' : 'AND archived = false'}
       ORDER BY l.position ASC, l.created_at ASC LIMIT 100`, [ownerId],
    );
  }
  createList(ownerId: string, data: any) {
    return this.ds.query(
      `INSERT INTO task_lists (owner_identity_id, workspace_id, name, description, color, position)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [ownerId, data.workspace_id ?? null, data.name, data.description, data.color, data.position],
    ).then((r: any[]) => r[0]);
  }
  archiveList(ownerId: string, id: string) {
    return this.ds.query(
      `UPDATE task_lists SET archived = true WHERE id = $1 AND owner_identity_id = $2 RETURNING *`,
      [id, ownerId],
    ).then((r: any[]) => r[0]);
  }

  items(ownerId: string, listId?: string, status?: string) {
    const where: string[] = [`owner_identity_id = $1`];
    const args: any[] = [ownerId];
    let i = 2;
    if (listId) { where.push(`list_id = $${i++}`); args.push(listId); }
    if (status) { where.push(`status = $${i++}`); args.push(status); }
    return this.ds.query(
      `SELECT * FROM task_items WHERE ${where.join(' AND ')} ORDER BY position ASC, due_at NULLS LAST, created_at DESC LIMIT 500`,
      args,
    );
  }
  createItem(ownerId: string, data: any) {
    return this.ds.query(
      `INSERT INTO task_items (list_id, owner_identity_id, assignee_identity_id, title, notes, status, priority, due_at, labels, linked_entity)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10::jsonb) RETURNING *`,
      [data.list_id, ownerId, data.assignee_identity_id ?? null, data.title, data.notes,
       data.status, data.priority, data.due_at ?? null, data.labels,
       data.linked_entity ? JSON.stringify(data.linked_entity) : null],
    ).then((r: any[]) => r[0]);
  }
  patchItem(ownerId: string, id: string, data: any) {
    const sets: string[] = []; const args: any[] = []; let i = 1;
    const cols: Record<string, string> = {
      title: 'title', notes: 'notes', status: 'status', priority: 'priority',
      due_at: 'due_at', assignee_identity_id: 'assignee_identity_id', labels: 'labels',
      linked_entity: 'linked_entity',
    };
    for (const [k, col] of Object.entries(cols)) {
      if (data[k] === undefined) continue;
      if (k === 'linked_entity') { sets.push(`${col} = $${i++}::jsonb`); args.push(JSON.stringify(data[k])); continue; }
      sets.push(`${col} = $${i++}`); args.push(data[k]);
    }
    if (data.status === 'done') sets.push(`completed_at = now()`);
    sets.push(`updated_at = now()`);
    args.push(id, ownerId);
    return this.ds.query(
      `UPDATE task_items SET ${sets.join(', ')} WHERE id = $${i++} AND owner_identity_id = $${i} RETURNING *`,
      args,
    ).then((r: any[]) => r[0]);
  }
  removeItem(ownerId: string, id: string) {
    return this.ds.query(`DELETE FROM task_items WHERE id = $1 AND owner_identity_id = $2`, [id, ownerId]);
  }
}

@Controller('api/v1/task-list')
@UseGuards(JwtAuthGuard)
class TaskController {
  constructor(private readonly repo: TaskRepo) {}
  private id(req: any) { return req.user?.identityId ?? req.user?.sub; }

  @Get('lists')
  lists(@Req() req: any, @Query('archived') archived?: string) {
    return { items: this.repo.lists(this.id(req), archived === 'true') };
  }
  @Post('lists')
  createList(@Req() req: any, @Body() body: any) { return this.repo.createList(this.id(req), ListSchema.parse(body)); }
  @Delete('lists/:id')
  archive(@Req() req: any, @Param('id') id: string) { return this.repo.archiveList(this.id(req), id); }

  @Get('items')
  items(@Req() req: any, @Query() q: any) {
    return { items: this.repo.items(this.id(req), q.list_id, q.status) };
  }
  @Post('items')
  createItem(@Req() req: any, @Body() body: any) { return this.repo.createItem(this.id(req), ItemSchema.parse(body)); }
  @Patch('items/:id')
  patchItem(@Req() req: any, @Param('id') id: string, @Body() body: any) {
    return this.repo.patchItem(this.id(req), id, ItemPatchSchema.parse(body));
  }
  @Delete('items/:id')
  removeItem(@Req() req: any, @Param('id') id: string) { return this.repo.removeItem(this.id(req), id); }
}

@Module({ controllers: [TaskController], providers: [TaskRepo] })
export class TaskListModule {}
