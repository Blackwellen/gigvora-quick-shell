/**
 * FD-17 — Master Settings + Legal/Consent + KPI + Entitlements + Roles +
 * Kill-Switch controller.
 *
 * Mounted at `/api/v1/master-settings`. JWT-guarded; per-route role gates are
 * enforced by `RolesGuard` reading the `@AdminRoles()` decorator.
 *
 * Two-person rule: any mutation against a `requiresTwoPersonRule` namespace
 * (smtp/connectors/apiKeys) or kill-switch returns `202 { pendingChangeId }`
 * instead of writing. A second admin (different userId, role >= sa_admin)
 * approves via `POST /master-settings/changes/:id/approve` to commit.
 */
import {
  Controller, Get, Patch, Post, Body, Param, Query, Req, UseGuards, HttpCode,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { RolesGuard } from '../auth/roles.guard';
import { AdminRoles } from '../auth/roles.decorator';
import { MasterSettingsService } from './master-settings.service';
import type {
  SettingsNamespace, SettingsEnvironment, AdminRole, KillSwitchDomain,
} from './master-settings.types';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('master-settings')
export class MasterSettingsController {
  constructor(private readonly svc: MasterSettingsService) {}

  // ── Bundles ──────────────────────────────────────────────────────────
  @Get('bundle')
  @AdminRoles('viewer', 'sa_operator', 'sa_admin', 'sa_root')
  bundle(
    @Query('namespace') namespace: SettingsNamespace,
    @Query('env') env: SettingsEnvironment = 'production',
    @Req() req: { user: { id: string; role: AdminRole } },
  ) {
    return this.svc.readBundle(namespace, env, req.user.role);
  }

  @Patch('entry')
  @AdminRoles('sa_operator', 'sa_admin', 'sa_root')
  upsertEntry(@Body() dto: UpsertEntryDto, @Req() req: { user: { id: string; role: AdminRole; ip?: string } }): Promise<any> {
    return this.svc.upsertEntry(dto, req.user);
  }

  // ── Two-person rule ──────────────────────────────────────────────────
  @Post('changes/:id/approve')
  @AdminRoles('sa_admin', 'sa_root')
  approveChange(@Param('id') id: string, @Req() req: { user: { id: string; role: AdminRole } }): Promise<any> {
    return this.svc.approvePendingChange(id, req.user);
  }

  @Post('changes/:id/reject')
  @AdminRoles('sa_admin', 'sa_root')
  rejectChange(
    @Param('id') id: string,
    @Body() body: { reason: string },
    @Req() req: { user: { id: string; role: AdminRole } },
  ) {
    return this.svc.rejectPendingChange(id, body.reason, req.user);
  }

  // ── CMS / legal ──────────────────────────────────────────────────────
  @Get('legal')
  @AdminRoles('viewer', 'sa_operator', 'sa_admin', 'sa_root')
  listLegal() { return this.svc.listLegalDocs(); }

  @Patch('legal')
  @AdminRoles('sa_admin', 'sa_root')
  publishLegal(@Body() dto: PublishLegalDto, @Req() req: { user: { id: string; role: AdminRole } }) {
    return this.svc.publishLegalDoc(dto, req.user);
  }

  @Post('consent')
  @HttpCode(204)
  recordConsent(
    @Body() dto: { userId: string; docSlug: string; docVersion: string },
    @Req() req: { ip?: string; headers: Record<string, string> },
  ) {
    return this.svc.recordConsent({
      ...dto,
      ip: req.ip ?? '0.0.0.0',
      userAgent: req.headers['user-agent'] ?? '',
    });
  }

  // ── KPI ──────────────────────────────────────────────────────────────
  @Get('kpis')
  @AdminRoles('viewer', 'sa_operator', 'sa_admin', 'sa_root')
  listKpis(@Query('portal') portal?: string) { return this.svc.listKpis(portal); }

  @Patch('kpis')
  @AdminRoles('sa_admin', 'sa_root')
  upsertKpi(@Body() dto: UpsertKpiDto, @Req() req: { user: { id: string; role: AdminRole } }) {
    return this.svc.upsertKpi(dto, req.user);
  }

  // ── Entitlements ─────────────────────────────────────────────────────
  @Get('entitlements')
  @AdminRoles('viewer', 'sa_operator', 'sa_admin', 'sa_root')
  matrix() { return this.svc.entitlementMatrix(); }

  @Patch('entitlements')
  @AdminRoles('sa_root')
  updateEntitlement(@Body() dto: UpdateEntitlementDto, @Req() req: { user: { id: string; role: AdminRole } }) {
    return this.svc.updateEntitlement(dto, req.user);
  }

  // ── Internal role accounts (mint / freeze) ───────────────────────────
  @Get('roles/accounts')
  @AdminRoles('sa_admin', 'sa_root')
  listAccounts() { return this.svc.listInternalAccounts(); }

  @Post('roles/mint')
  @AdminRoles('sa_root')
  mintAccount(@Body() dto: MintAccountDto, @Req() req: { user: { id: string; role: AdminRole } }) {
    return this.svc.mintInternalAccount(dto, req.user);
  }

  @Post('roles/:id/freeze')
  @AdminRoles('sa_admin', 'sa_root')
  freeze(@Param('id') id: string, @Body() body: { reason: string }, @Req() req: { user: { id: string; role: AdminRole } }) {
    return this.svc.freezeInternalAccount(id, body.reason, req.user);
  }

  @Post('roles/:id/unfreeze')
  @AdminRoles('sa_root')
  unfreeze(@Param('id') id: string, @Req() req: { user: { id: string; role: AdminRole } }) {
    return this.svc.unfreezeInternalAccount(id, req.user);
  }

  // ── Kill-switch matrix ───────────────────────────────────────────────
  @Get('kill-switches')
  @AdminRoles('viewer', 'sa_operator', 'sa_admin', 'sa_root')
  killSwitches() { return this.svc.killSwitchMatrix(); }

  @Post('kill-switches/:domain/activate')
  @AdminRoles('sa_admin', 'sa_root')
  activateKill(
    @Param('domain') domain: KillSwitchDomain,
    @Body() body: { reason: string; expectedClearedAt?: string },
    @Req() req: { user: { id: string; role: AdminRole } },
  ) {
    return this.svc.proposeKillSwitch(domain, true, body, req.user);
  }

  @Post('kill-switches/:domain/clear')
  @AdminRoles('sa_root')
  clearKill(@Param('domain') domain: KillSwitchDomain, @Req() req: { user: { id: string; role: AdminRole } }) {
    return this.svc.proposeKillSwitch(domain, false, { reason: 'cleared' }, req.user);
  }
}

export interface UpsertEntryDto {
  namespace: SettingsNamespace;
  key: string;
  value: unknown;
  environment: SettingsEnvironment;
  scope: 'platform' | 'tenant' | 'environment';
  isSecret?: boolean;
  reason?: string;
}
export interface PublishLegalDto {
  slug: string;
  title: string;
  version: string;
  effectiveAt: string;
  bodyMarkdown: string;
  changeSummary: string;
  requiresReConsent: boolean;
}
export interface UpsertKpiDto {
  id?: string;
  portal: string;
  metric: string;
  target: number;
  unit: string;
  direction: 'lower_is_better' | 'higher_is_better';
  windowDays: number;
  ownerRole: string;
  active: boolean;
}
export interface UpdateEntitlementDto {
  portal: string;
  roles: AdminRole[];
  canRead: boolean;
  canWrite: boolean;
  requiresSecondApprover?: boolean;
}
export interface MintAccountDto {
  email: string;
  displayName: string;
  roles: AdminRole[];
  requireMfa: boolean;
}
