import { Body, Controller, Delete, Get, Injectable, Module, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { z } from 'zod';
import { randomBytes } from 'crypto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

const RoleEnum = z.enum(['owner', 'admin', 'manager', 'member', 'viewer']);
const MemberPatchSchema = z.object({
  role: RoleEnum.optional(),
  department: z.string().max(120).optional(),
  title: z.string().max(120).optional(),
  status: z.enum(['active', 'invited', 'suspended', 'removed']).optional(),
  permissions: z.record(z.string(), z.any()).optional(),
});
const InviteSchema = z.object({
  workspace_id: z.string().uuid(),
  email: z.string().email(),
  role: RoleEnum.default('member'),
});

@Injectable()
class TeamRepo {
  constructor(private readonly ds: DataSource) {}
  members(workspaceId: string, status?: string) {
    const args: any[] = [workspaceId]; let where = 'workspace_id = $1';
    if (status) { where += ' AND status = $2'; args.push(status); }
    return this.ds.query(
      `SELECT * FROM team_members WHERE ${where} ORDER BY role, joined_at ASC LIMIT 500`, args,
    );
  }
  patchMember(id: string, data: any) {
    const sets: string[] = []; const args: any[] = []; let i = 1;
    for (const k of ['role', 'department', 'title', 'status']) {
      if (data[k] !== undefined) { sets.push(`${k} = $${i++}`); args.push(data[k]); }
    }
    if (data.permissions !== undefined) { sets.push(`permissions = $${i++}::jsonb`); args.push(JSON.stringify(data.permissions)); }
    sets.push(`updated_at = now()`);
    args.push(id);
    return this.ds.query(
      `UPDATE team_members SET ${sets.join(', ')} WHERE id = $${i} RETURNING *`, args,
    ).then((r: any[]) => r[0]);
  }
  removeMember(id: string) {
    return this.ds.query(
      `UPDATE team_members SET status = 'removed', updated_at = now() WHERE id = $1 RETURNING id`,
      [id],
    );
  }
  invites(workspaceId: string, status?: string) {
    const args: any[] = [workspaceId]; let where = 'workspace_id = $1';
    if (status) { where += ' AND status = $2'; args.push(status); }
    return this.ds.query(
      `SELECT * FROM team_invites WHERE ${where} ORDER BY created_at DESC LIMIT 200`, args,
    );
  }
  invite(identityId: string, data: any) {
    const token = randomBytes(24).toString('hex');
    return this.ds.query(
      `INSERT INTO team_invites (workspace_id, email, role, invited_by_identity_id, token, expires_at)
       VALUES ($1,$2,$3,$4,$5, now() + interval '14 days') RETURNING *`,
      [data.workspace_id, data.email, data.role, identityId, token],
    ).then((r: any[]) => r[0]);
  }
  revoke(id: string) {
    return this.ds.query(
      `UPDATE team_invites SET status='revoked' WHERE id = $1 RETURNING *`, [id],
    ).then((r: any[]) => r[0]);
  }
  accept(token: string, identityId: string, displayName: string, email: string) {
    return this.ds.transaction(async (m) => {
      const [inv] = await m.query(
        `SELECT * FROM team_invites WHERE token = $1 AND status = 'pending' AND expires_at > now() FOR UPDATE`,
        [token],
      );
      if (!inv) return null;
      await m.query(`UPDATE team_invites SET status='accepted', accepted_at=now() WHERE id = $1`, [inv.id]);
      const [member] = await m.query(
        `INSERT INTO team_members (workspace_id, identity_id, display_name, email, role)
         VALUES ($1,$2,$3,$4,$5)
         ON CONFLICT (workspace_id, identity_id) DO UPDATE SET status='active', updated_at = now()
         RETURNING *`,
        [inv.workspace_id, identityId, displayName, email, inv.role],
      );
      return member;
    });
  }
}

@Controller('api/v1/team-management')
@UseGuards(JwtAuthGuard)
class TeamController {
  constructor(private readonly repo: TeamRepo) {}
  private id(req: any) { return req.user?.identityId ?? req.user?.sub; }

  @Get('members')
  members(@Query('workspace_id') workspaceId: string, @Query('status') status?: string) {
    return { items: this.repo.members(workspaceId, status) };
  }
  @Patch('members/:id')
  patch(@Param('id') id: string, @Body() body: any) {
    return this.repo.patchMember(id, MemberPatchSchema.parse(body));
  }
  @Delete('members/:id')
  remove(@Param('id') id: string) { return this.repo.removeMember(id); }

  @Get('invites')
  invites(@Query('workspace_id') workspaceId: string, @Query('status') status?: string) {
    return { items: this.repo.invites(workspaceId, status) };
  }
  @Post('invites')
  invite(@Req() req: any, @Body() body: any) {
    return this.repo.invite(this.id(req), InviteSchema.parse(body));
  }
  @Delete('invites/:id')
  revoke(@Param('id') id: string) { return this.repo.revoke(id); }

  @Post('invites/accept')
  accept(@Req() req: any, @Body() body: { token: string; display_name: string; email: string }) {
    return this.repo.accept(body.token, this.id(req), body.display_name, body.email);
  }
}

@Module({ controllers: [TeamController], providers: [TeamRepo] })
export class TeamManagementModule {}
