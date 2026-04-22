import { Body, Controller, Get, Param, Post, Query, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AdminOpsService } from './admin-ops.service';
import {
  ListSchema, UpsertCompanySchema, UpsertUserSchema, UpsertMentorSchema, BulkActionSchema,
} from './dto';

type Entity = 'company' | 'user' | 'mentor';

@Controller('api/v1/admin-ops')
@UseGuards(AuthGuard('jwt'))
export class AdminOpsController {
  constructor(private readonly svc: AdminOpsService) {}
  private actor(req: any): string { return req.user?.sub ?? 'system'; }
  private role(req: any): string  { return req.user?.opsRole ?? req.user?.role ?? 'viewer'; }
  private meta(req: any) { return { ip: req.ip ?? req.headers?.['x-forwarded-for'], userAgent: req.headers?.['user-agent'] }; }

  // ── Companies ─────
  @Get('companies') listCo(@Req() req: any, @Query() q: any) {
    return this.svc.list(this.role(req), 'company', ListSchema.parse({
      ...q, page: q.page ? Number(q.page) : 1, pageSize: q.pageSize ? Number(q.pageSize) : 50,
    }));
  }
  @Get('companies/:id') detailCo(@Req() req: any, @Param('id') id: string) {
    return this.svc.detail(this.role(req), 'company', id);
  }
  @Post('companies') upsertCo(@Req() req: any, @Body() body: any) {
    return this.svc.upsert(this.role(req), this.actor(req), 'company', UpsertCompanySchema.parse(body), this.meta(req));
  }

  // ── Users ─────
  @Get('users') listUsers(@Req() req: any, @Query() q: any) {
    return this.svc.list(this.role(req), 'user', ListSchema.parse({
      ...q, page: q.page ? Number(q.page) : 1, pageSize: q.pageSize ? Number(q.pageSize) : 50,
    }));
  }
  @Get('users/:id') detailUser(@Req() req: any, @Param('id') id: string) {
    return this.svc.detail(this.role(req), 'user', id);
  }
  @Post('users') upsertUser(@Req() req: any, @Body() body: any) {
    return this.svc.upsert(this.role(req), this.actor(req), 'user', UpsertUserSchema.parse(body), this.meta(req));
  }

  // ── Mentors ─────
  @Get('mentors') listMentors(@Req() req: any, @Query() q: any) {
    return this.svc.list(this.role(req), 'mentor', ListSchema.parse({
      ...q, page: q.page ? Number(q.page) : 1, pageSize: q.pageSize ? Number(q.pageSize) : 50,
    }));
  }
  @Get('mentors/:id') detailMentor(@Req() req: any, @Param('id') id: string) {
    return this.svc.detail(this.role(req), 'mentor', id);
  }
  @Post('mentors') upsertMentor(@Req() req: any, @Body() body: any) {
    return this.svc.upsert(this.role(req), this.actor(req), 'mentor', UpsertMentorSchema.parse(body), this.meta(req));
  }

  // ── Bulk action across any entity ─────
  @Post('bulk') bulk(@Req() req: any, @Body() body: any) {
    return this.svc.bulkAct(this.role(req), this.actor(req), BulkActionSchema.parse(body) as any, this.meta(req));
  }
}
