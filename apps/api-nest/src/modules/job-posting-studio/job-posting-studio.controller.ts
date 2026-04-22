import { Body, Controller, Get, Param, Post, Put, Query, Req } from '@nestjs/common';
import { JobPostingStudioService } from './job-posting-studio.service';
import {
  JobDraftSchema, JobUpdateSchema, ListFiltersSchema, PublishSchema,
  CreditPurchaseCreateSchema, CreditPurchaseConfirmSchema, ApprovalDecisionSchema,
} from './dto';

/**
 * Domain 24 — public REST surface (/api/v1/job-posting-studio/*).
 *
 *  GET    /jobs                            — list (filter/sort/page)
 *  POST   /jobs                            — create draft
 *  GET    /jobs/:id                        — detail (+approval, +audit)
 *  PUT    /jobs/:id                        — patch (optimistic concurrency)
 *  GET    /jobs/:id/quality                — ML quality + tips
 *  GET    /jobs/:id/moderate               — ML moderation
 *  POST   /jobs/:id/submit                 — submit for review
 *  POST   /jobs/:id/decision               — recruiter approve/reject/changes
 *  POST   /jobs/:id/publish                — consumes 1 credit; idempotent
 *  POST   /jobs/:id/pause | /resume | /archive
 *  GET    /approvals                       — recruiter queue
 *
 *  GET    /credits/packs                   — purchasable packs
 *  GET    /credits/balance                 — balance + ledger
 *  POST   /credits/purchases               — multi-step: create
 *  POST   /credits/purchases/:id/confirm   — multi-step: confirm
 *  GET    /credits/purchases               — list
 *
 *  GET    /insights                        — tenant studio insights
 */
@Controller('api/v1/job-posting-studio')
export class JobPostingStudioController {
  constructor(private readonly svc: JobPostingStudioService) {}
  private actor(req: any) { return req?.identityId ?? req?.user?.id ?? 'anonymous'; }
  private name(req: any) { return req?.user?.name ?? 'Recruiter'; }
  private tenant(req: any) { return req?.user?.tenantId ?? 'tenant-demo'; }

  @Get('jobs')
  list(@Query() raw: any, @Req() req: any) {
    const f = ListFiltersSchema.parse({
      ...raw,
      page: raw.page ? Number(raw.page) : undefined,
      pageSize: raw.pageSize ? Number(raw.pageSize) : undefined,
      status: raw.status ? (Array.isArray(raw.status) ? raw.status : [raw.status]) : undefined,
    });
    return this.svc.list(this.tenant(req), f);
  }

  @Post('jobs')
  create(@Body() body: any, @Req() req: any) {
    return this.svc.createDraft(this.tenant(req), this.actor(req), this.name(req), JobDraftSchema.parse(body));
  }

  @Get('jobs/:id') detail(@Param('id') id: string) { return this.svc.detail(id) ?? { error: 'not_found' }; }

  @Put('jobs/:id')
  update(@Param('id') id: string, @Body() body: any, @Req() req: any) {
    const expectedVersion = Number(body.expectedVersion ?? 1);
    return this.svc.update(id, expectedVersion, JobUpdateSchema.parse(body.patch ?? body), this.actor(req));
  }

  @Get('jobs/:id/quality') quality(@Param('id') id: string) { return this.svc.quality(id) ?? { error: 'not_found' }; }
  @Get('jobs/:id/moderate') moderate(@Param('id') id: string) { return this.svc.moderate(id) ?? { error: 'not_found' }; }

  @Post('jobs/:id/submit')
  submit(@Param('id') id: string, @Req() req: any) { return this.svc.submitForReview(id, this.actor(req)); }

  @Post('jobs/:id/decision')
  decide(@Param('id') id: string, @Body() body: any, @Req() req: any) {
    const d = ApprovalDecisionSchema.parse(body);
    return this.svc.decide(id, this.actor(req), d.decision, d.note);
  }

  @Post('jobs/:id/publish')
  publish(@Param('id') id: string, @Body() body: any, @Req() req: any) {
    const p = PublishSchema.parse(body);
    return this.svc.publish(id, this.actor(req), p);
  }
  @Post('jobs/:id/pause') pause(@Param('id') id: string, @Req() req: any) { return this.svc.pause(id, this.actor(req)); }
  @Post('jobs/:id/resume') resume(@Param('id') id: string, @Req() req: any) { return this.svc.resume(id, this.actor(req)); }
  @Post('jobs/:id/archive') archive(@Param('id') id: string, @Req() req: any) { return this.svc.archive(id, this.actor(req)); }

  @Get('approvals') queue(@Req() req: any) { return this.svc.approvalQueue(this.tenant(req)); }

  // Credits
  @Get('credits/packs') packs() { return this.svc.packs(); }
  @Get('credits/balance') balance(@Req() req: any) { return this.svc.balance(this.tenant(req)); }
  @Post('credits/purchases')
  buy(@Body() body: any, @Req() req: any) {
    const p = CreditPurchaseCreateSchema.parse(body);
    return this.svc.createPurchase(this.tenant(req), this.actor(req), p.packId);
  }
  @Post('credits/purchases/:id/confirm')
  confirm(@Param('id') id: string, @Body() body: any, @Req() req: any) {
    CreditPurchaseConfirmSchema.parse({ purchaseId: id, ...body });
    return this.svc.confirmPurchase(id, this.actor(req));
  }
  @Get('credits/purchases') purchases(@Req() req: any) { return this.svc.listPurchases(this.tenant(req)); }

  @Get('insights') insights(@Req() req: any) { return this.svc.insights(this.tenant(req)); }
}
