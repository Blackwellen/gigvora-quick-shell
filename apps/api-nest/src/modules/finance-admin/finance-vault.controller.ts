import { Body, Controller, Get, Param, Post, Query, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { z } from 'zod';
import { FinanceVaultService, BankCreateSchema, RevealSchema } from './finance-vault.service';

const PostEntrySchema = z.object({
  kind: z.string().min(1).max(32),
  reference: z.string().min(1).max(120),
  externalRef: z.string().max(200).optional(),
  memo: z.string().max(500).optional(),
  meta: z.record(z.string(), z.unknown()).optional(),
  lines: z.array(z.object({
    accountId: z.string().uuid(),
    amountMinor: z.number().int().positive(),
    currency: z.string().length(3),
    side: z.enum(['debit', 'credit']),
    memo: z.string().max(500).optional(),
  })).min(2).max(20),
});

@Controller('api/v1/finance-vault')
@UseGuards(AuthGuard('jwt'))
export class FinanceVaultController {
  constructor(private readonly svc: FinanceVaultService) {}
  private actor(r: any) { return r.user.sub; }
  private role(r: any)  { return r.user.financeRole ?? r.user.adminRole ?? r.user.role ?? 'viewer'; }
  private ip(r: any)    { return r.ip ?? r.headers?.['x-forwarded-for']; }
  private ua(r: any)    { return r.headers?.['user-agent']; }

  // ── Bank vault ────────────────────────────────────────
  @Get('bank')
  list(@Req() r: any, @Query('ownerKind') ok?: string, @Query('ownerId') oid?: string) {
    return this.svc.listBankVault(this.role(r), ok, oid);
  }

  @Post('bank')
  create(@Req() r: any, @Body() body: any) {
    return this.svc.createBankRecord(this.role(r), this.actor(r), BankCreateSchema.parse(body));
  }

  @Post('bank/:id/reveal')
  reveal(@Req() r: any, @Param('id') id: string, @Body() body: any) {
    return this.svc.revealBankRecord(this.role(r), this.actor(r), id, RevealSchema.parse(body),
                                     this.ip(r), this.ua(r), r.headers?.['x-session-id']);
  }

  @Get('bank/:id/reveals')
  reveals(@Req() r: any, @Param('id') id: string) {
    return this.svc.revealHistory(this.role(r), id);
  }

  @Post('bank/:id/verify')
  verify(@Req() r: any, @Param('id') id: string) {
    return this.svc.verifyBankRecord(this.role(r), this.actor(r), id);
  }

  @Post('bank/:id/archive')
  archive(@Req() r: any, @Param('id') id: string) {
    return this.svc.archiveBankRecord(this.role(r), id);
  }

  // ── Ledger ────────────────────────────────────────────
  @Get('ledger/accounts')
  accounts(@Req() r: any, @Query('ownerKind') ok?: string, @Query('ownerId') oid?: string) {
    return this.svc.listAccounts(this.role(r), ok, oid);
  }

  @Post('ledger/accounts')
  ensureAccount(@Req() r: any, @Body() body: any) {
    const s = z.object({
      ownerKind: z.enum(['user', 'company', 'platform']),
      ownerId: z.string().uuid().nullable(),
      bucket: z.string().min(1).max(40),
      currency: z.string().length(3).default('GBP'),
    }).parse(body);
    return this.svc.ensureAccount(this.role(r), s.ownerKind, s.ownerId, s.bucket, s.currency);
  }

  @Post('ledger/entries')
  postEntry(@Req() r: any, @Body() body: any) {
    return this.svc.postEntry(this.role(r), this.actor(r), PostEntrySchema.parse(body));
  }

  @Get('ledger/entries')
  listEntries(@Req() r: any) { return this.svc.recentEntries(this.role(r)); }

  @Get('ledger/trial-balance')
  trial(@Req() r: any) { return this.svc.trialBalance(this.role(r)); }
}
