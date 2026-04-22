/**
 * D36 — public REST surface.
 *
 *   GET    /api/v1/contracts-sow-acceptance/contracts
 *   GET    /api/v1/contracts-sow-acceptance/contracts/:id
 *   POST   /api/v1/contracts-sow-acceptance/contracts/from-award
 *   POST   /api/v1/contracts-sow-acceptance/contracts/send
 *   POST   /api/v1/contracts-sow-acceptance/contracts/sign
 *   POST   /api/v1/contracts-sow-acceptance/contracts/reject
 *   POST   /api/v1/contracts-sow-acceptance/contracts/void
 *   POST   /api/v1/contracts-sow-acceptance/contracts/amend
 *   POST   /api/v1/contracts-sow-acceptance/contracts/verify-hash
 *   GET    /api/v1/contracts-sow-acceptance/insights
 */
import { Body, Controller, Get, Param, Post, Query, Req } from '@nestjs/common';
import { ContractsSowAcceptanceService } from './contracts-sow-acceptance.service';
import { ContractsSowAcceptanceAnalyticsService } from './contracts-sow-acceptance.analytics.service';
import {
  ListContractsSchema, CreateFromAwardSchema, SendForSignatureSchema, ClickToSignSchema,
  RejectSchema, VoidSchema, AmendSchema, VerifyHashSchema,
} from './dto';

@Controller('api/v1/contracts-sow-acceptance')
export class ContractsSowAcceptanceController {
  constructor(
    private readonly svc: ContractsSowAcceptanceService,
    private readonly analytics: ContractsSowAcceptanceAnalyticsService,
  ) {}

  private actor(req: any) { return req?.identityId ?? req?.user?.id ?? 'demo-user'; }
  private tenant(req: any) { return req?.tenantId ?? 'tenant-demo'; }
  private ip(req: any) { return req?.ip ?? req?.headers?.['x-forwarded-for'] ?? 'unknown'; }
  private ua(req: any) { return String(req?.headers?.['user-agent'] ?? 'unknown').slice(0, 512); }

  @Get('contracts')
  list(@Query() raw: any, @Req() req: any) {
    const f = ListContractsSchema.parse({ ...raw, page: raw.page ? Number(raw.page) : undefined, pageSize: raw.pageSize ? Number(raw.pageSize) : undefined });
    return this.svc.list(this.tenant(req), { projectId: f.projectId, proposalId: f.proposalId, status: f.status });
  }

  @Get('contracts/:id') detail(@Param('id') id: string) { return this.svc.detail(id); }

  @Post('contracts/from-award')
  fromAward(@Body() body: any, @Req() req: any) {
    const dto = CreateFromAwardSchema.parse(body);
    return this.svc.mintFromAward({
      tenantId: this.tenant(req),
      awardId: dto.awardId,
      proposalId: dto.proposalId,
      projectId: dto.projectId,
      title: dto.title,
      governingLaw: dto.governingLaw,
      expiresInDays: dto.expiresInDays,
      parties: dto.parties.map((p) => ({ partyId: p.partyId, role: p.role, displayName: p.displayName, email: p.email, signOrder: p.signOrder })),
      idempotencyKey: dto.idempotencyKey,
      actor: this.actor(req),
    });
  }

  @Post('contracts/send')
  send(@Body() body: any, @Req() req: any) {
    const dto = SendForSignatureSchema.parse(body);
    return this.svc.send(dto.contractId, dto.message, this.actor(req));
  }

  @Post('contracts/sign')
  sign(@Body() body: any, @Req() req: any) {
    const dto = ClickToSignSchema.parse(body);
    return this.svc.clickToSign({
      contractId: dto.contractId,
      partyId: dto.partyId,
      typedName: dto.typedName,
      acceptedTos: dto.acceptTos,
      acceptedScope: dto.acceptScope,
      capturedIp: dto.clientCapturedIp ?? this.ip(req),
      capturedUa: dto.clientCapturedUa ?? this.ua(req),
      idempotencyKey: dto.idempotencyKey,
      actor: this.actor(req),
    });
  }

  @Post('contracts/reject')
  reject(@Body() body: any, @Req() req: any) {
    const dto = RejectSchema.parse(body);
    return this.svc.reject(dto.contractId, dto.partyId, dto.reason, this.actor(req));
  }

  @Post('contracts/void')
  voidContract(@Body() body: any, @Req() req: any) {
    const dto = VoidSchema.parse(body);
    return this.svc.cancel(dto.contractId, dto.reason, this.actor(req));
  }

  @Post('contracts/amend')
  amend(@Body() body: any, @Req() req: any) {
    const dto = AmendSchema.parse(body);
    return this.svc.amend(dto.contractId, dto.changeSummary, dto.newExpiresInDays, dto.idempotencyKey, this.actor(req));
  }

  @Post('contracts/verify-hash')
  verifyHash(@Body() body: any) {
    const dto = VerifyHashSchema.parse(body);
    return this.svc.verifyHash(dto.contractId);
  }

  @Get('insights')
  insights(@Query('projectId') projectId: string | undefined, @Req() req: any) {
    return this.analytics.insights(this.tenant(req), projectId);
  }
}
