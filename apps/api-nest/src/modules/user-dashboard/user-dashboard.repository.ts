import { Injectable, Inject } from '@nestjs/common';
import { sql, and, eq, desc, asc } from 'drizzle-orm';
import {
  dashboardWidgets,
  dashboardSnapshots,
  dashboardActions,
  dashboardEvents,
} from '@gigvora/db/schema/user-dashboard';

export type DrizzleDb = any;

@Injectable()
export class UserDashboardRepository {
  constructor(@Inject('DRIZZLE_DB') private readonly db: DrizzleDb) {}

  // Widgets
  async listWidgets(userId: string, role: string) {
    return this.db
      .select()
      .from(dashboardWidgets)
      .where(and(eq(dashboardWidgets.userId, userId), eq(dashboardWidgets.role, role)))
      .orderBy(asc(dashboardWidgets.position));
  }

  async upsertWidget(userId: string, dto: any) {
    const existing = await this.db
      .select()
      .from(dashboardWidgets)
      .where(and(
        eq(dashboardWidgets.userId, userId),
        eq(dashboardWidgets.role, dto.role),
        eq(dashboardWidgets.widgetKey, dto.widgetKey),
      ))
      .limit(1);
    if (existing.length) {
      const [row] = await this.db
        .update(dashboardWidgets)
        .set({ position: dto.position, size: dto.size, visible: dto.visible, config: dto.config, updatedAt: new Date() })
        .where(eq(dashboardWidgets.id, existing[0].id))
        .returning();
      return row;
    }
    const [row] = await this.db.insert(dashboardWidgets).values({
      userId, role: dto.role, widgetKey: dto.widgetKey, position: dto.position,
      size: dto.size, visible: dto.visible, config: dto.config,
    }).returning();
    return row;
  }

  async reorderWidgets(userId: string, role: string, order: { id: string; position: number }[]) {
    for (const item of order) {
      await this.db.update(dashboardWidgets)
        .set({ position: item.position, updatedAt: new Date() })
        .where(and(eq(dashboardWidgets.id, item.id), eq(dashboardWidgets.userId, userId), eq(dashboardWidgets.role, role)));
    }
    return this.listWidgets(userId, role);
  }

  async deleteWidget(userId: string, id: string) {
    await this.db.delete(dashboardWidgets).where(and(eq(dashboardWidgets.id, id), eq(dashboardWidgets.userId, userId)));
    return { ok: true };
  }

  // Snapshots
  async getLatestSnapshot(userId: string, role: string) {
    const rows = await this.db
      .select()
      .from(dashboardSnapshots)
      .where(and(eq(dashboardSnapshots.userId, userId), eq(dashboardSnapshots.role, role)))
      .orderBy(desc(dashboardSnapshots.computedAt))
      .limit(1);
    return rows[0] ?? null;
  }

  async writeSnapshot(userId: string, role: string, payload: any, ttlSeconds = 60) {
    const staleAt = new Date(Date.now() + ttlSeconds * 1000);
    const [row] = await this.db.insert(dashboardSnapshots)
      .values({ userId, role, payload, staleAt })
      .returning();
    return row;
  }

  // Actions
  async listActions(userId: string, role: string, status?: string) {
    const conds = [eq(dashboardActions.userId, userId), eq(dashboardActions.role, role)];
    if (status) conds.push(eq(dashboardActions.status, status));
    return this.db
      .select()
      .from(dashboardActions)
      .where(and(...conds))
      .orderBy(desc(dashboardActions.priority), asc(dashboardActions.createdAt))
      .limit(200);
  }

  async createAction(userId: string, dto: any) {
    const [row] = await this.db.insert(dashboardActions).values({
      userId,
      role: dto.role,
      kind: dto.kind,
      title: dto.title,
      description: dto.description ?? '',
      href: dto.href ?? null,
      priority: dto.priority,
      dueAt: dto.dueAt ? new Date(dto.dueAt) : null,
      meta: dto.meta ?? {},
    }).returning();
    return row;
  }

  async updateAction(userId: string, id: string, dto: any) {
    const patch: any = { updatedAt: new Date() };
    if (dto.status) {
      patch.status = dto.status;
      if (dto.status === 'done') patch.completedAt = new Date();
    }
    if (dto.snoozeUntil) patch.snoozeUntil = new Date(dto.snoozeUntil);
    if (dto.priority != null) patch.priority = dto.priority;
    if (dto.title) patch.title = dto.title;
    if (dto.description != null) patch.description = dto.description;
    const [row] = await this.db
      .update(dashboardActions)
      .set(patch)
      .where(and(eq(dashboardActions.id, id), eq(dashboardActions.userId, userId)))
      .returning();
    return row;
  }

  async recordEvent(userId: string, action: string, meta: any = {}) {
    await this.db.insert(dashboardEvents).values({ userId, actorId: userId, action, meta });
  }
}
