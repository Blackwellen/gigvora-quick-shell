import { Injectable, Inject } from '@nestjs/common';
import { sql, and, eq, desc, gte } from 'drizzle-orm';
import {
  recruiterDashboardPipelines,
  recruiterDashboardOutreach,
  recruiterDashboardVelocity,
  recruiterDashboardTasks,
  recruiterDashboardEvents,
} from '@gigvora/db/schema/recruiter-dashboard';

export type DrizzleDb = any;

@Injectable()
export class RecruiterDashboardRepository {
  constructor(@Inject('DRIZZLE_DB') private readonly db: DrizzleDb) {}

  // Pipelines
  async listPipelines(recruiterId: string, q: any) {
    const conds = [eq(recruiterDashboardPipelines.recruiterIdentityId, recruiterId)];
    if (q.status) conds.push(eq(recruiterDashboardPipelines.status, q.status));
    const offset = (q.page - 1) * q.pageSize;
    const items = await this.db.select().from(recruiterDashboardPipelines)
      .where(and(...conds)).orderBy(desc(recruiterDashboardPipelines.lastActivityAt))
      .limit(q.pageSize).offset(offset);
    return { items, page: q.page, pageSize: q.pageSize };
  }

  async getPipeline(recruiterId: string, id: string) {
    const rows = await this.db.select().from(recruiterDashboardPipelines)
      .where(and(eq(recruiterDashboardPipelines.id, id), eq(recruiterDashboardPipelines.recruiterIdentityId, recruiterId))).limit(1);
    return rows[0] ?? null;
  }

  async updatePipelineStatus(id: string, status: string) {
    const [row] = await this.db.update(recruiterDashboardPipelines)
      .set({ status, lastActivityAt: new Date() })
      .where(eq(recruiterDashboardPipelines.id, id)).returning();
    return row;
  }

  // Outreach
  async listOutreach(recruiterId: string, q: any) {
    const conds = [eq(recruiterDashboardOutreach.recruiterIdentityId, recruiterId)];
    if (q.status) conds.push(eq(recruiterDashboardOutreach.status, q.status));
    if (q.pipelineId) conds.push(eq(recruiterDashboardOutreach.pipelineId, q.pipelineId));
    const offset = (q.page - 1) * q.pageSize;
    const items = await this.db.select().from(recruiterDashboardOutreach)
      .where(and(...conds)).orderBy(desc(recruiterDashboardOutreach.createdAt))
      .limit(q.pageSize).offset(offset);
    return { items, page: q.page, pageSize: q.pageSize };
  }

  async outreachFunnel(recruiterId: string, windowDays: number) {
    const since = new Date(Date.now() - windowDays * 86400_000);
    const rows = await this.db.execute(sql`
      SELECT status,
             COUNT(*)::int AS count,
             AVG(response_time_hours)::float AS avg_response_hours
      FROM recruiter_dashboard_outreach
      WHERE recruiter_identity_id = ${recruiterId}
        AND created_at >= ${since}
      GROUP BY status
    `);
    return (rows as any).rows ?? rows;
  }

  // Velocity
  async listVelocity(recruiterId: string, q: any) {
    const since = new Date(Date.now() - q.windowDays * 86400_000);
    const conds = [eq(recruiterDashboardVelocity.recruiterIdentityId, recruiterId), gte(recruiterDashboardVelocity.capturedOn, since.toISOString().slice(0, 10))];
    if (q.pipelineId) conds.push(eq(recruiterDashboardVelocity.pipelineId, q.pipelineId));
    return this.db.select().from(recruiterDashboardVelocity).where(and(...conds))
      .orderBy(desc(recruiterDashboardVelocity.capturedOn)).limit(365);
  }

  // Tasks
  async listTasks(recruiterId: string, q: any) {
    const conds = [eq(recruiterDashboardTasks.recruiterIdentityId, recruiterId)];
    if (q.status) conds.push(eq(recruiterDashboardTasks.status, q.status));
    if (q.pipelineId) conds.push(eq(recruiterDashboardTasks.pipelineId, q.pipelineId));
    if (q.priority) conds.push(eq(recruiterDashboardTasks.priority, q.priority));
    return this.db.select().from(recruiterDashboardTasks).where(and(...conds))
      .orderBy(desc(recruiterDashboardTasks.createdAt)).limit(200);
  }

  async getTask(recruiterId: string, id: string) {
    const rows = await this.db.select().from(recruiterDashboardTasks)
      .where(and(eq(recruiterDashboardTasks.id, id), eq(recruiterDashboardTasks.recruiterIdentityId, recruiterId))).limit(1);
    return rows[0] ?? null;
  }

  async updateTaskStatus(id: string, status: string, snoozedUntil?: string | null) {
    const patch: any = { status };
    if (status === 'snoozed') patch.snoozedUntil = snoozedUntil ? new Date(snoozedUntil) : null;
    if (status === 'done') patch.completedAt = new Date();
    const [row] = await this.db.update(recruiterDashboardTasks)
      .set(patch).where(eq(recruiterDashboardTasks.id, id)).returning();
    return row;
  }

  async recordEvent(recruiterId: string, actorId: string | null, action: string, target: { type?: string; id?: string } = {}, diff: any = {}) {
    await this.db.insert(recruiterDashboardEvents).values({
      recruiterIdentityId: recruiterId,
      actorIdentityId: actorId ?? null,
      action,
      targetType: target.type ?? null,
      targetId: target.id ?? null,
      diff,
    });
  }
}
