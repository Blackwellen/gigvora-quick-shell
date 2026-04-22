import { Body, Controller, Get, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { InternalAdminLoginTerminalService } from './internal-admin-login-terminal.service';
import { EnvironmentSchema, OperatorSchema, LoginSchema, StepUpSchema, SwitchEnvSchema } from './dto';

/**
 * Internal-only routing: every endpoint here MUST be served via the
 * `/internal/*` reverse-proxy boundary. Public traffic must never reach this.
 */
@Controller('api/v1/internal-admin-login-terminal')
@UseGuards(AuthGuard('jwt'))
export class InternalAdminLoginTerminalController {
  constructor(private readonly svc: InternalAdminLoginTerminalService) {}
  private reqMeta(req: any) { return { ip: req.ip ?? req.headers?.['x-forwarded-for'], userAgent: req.headers?.['user-agent'] }; }
  private actorOf(req: any): string { return req.user.sub; }

  @Get('overview') overview() { return this.svc.overview(); }

  // Environments
  @Get('environments') listEnvironments() { return this.svc.listEnvironments(); }
  @Post('environments') createEnv(@Req() req: any, @Body() body: any) {
    return this.svc.createEnvironment(this.actorOf(req), EnvironmentSchema.parse(body), this.reqMeta(req));
  }
  @Patch('environments/:id') updateEnv(@Req() req: any, @Param('id') id: string, @Body() body: any) {
    return this.svc.updateEnvironment(this.actorOf(req), id, EnvironmentSchema.partial().parse(body), this.reqMeta(req));
  }

  // Operators
  @Get('operators') listOperators() { return this.svc.listOperators(); }
  @Post('operators') createOperator(@Req() req: any, @Body() body: any) {
    return this.svc.createOperator(this.actorOf(req), OperatorSchema.parse(body), this.reqMeta(req));
  }
  @Patch('operators/:id') updateOperator(@Req() req: any, @Param('id') id: string, @Body() body: any) {
    return this.svc.updateOperator(this.actorOf(req), id, OperatorSchema.partial().parse(body), this.reqMeta(req));
  }

  // Login flow
  @Post('login') login(@Req() req: any, @Body() body: any) {
    return this.svc.login(LoginSchema.parse(body), this.reqMeta(req));
  }
  @Post('step-up') stepUp(@Req() req: any, @Body() body: any) {
    return this.svc.verifyStepUp(StepUpSchema.parse(body), this.reqMeta(req));
  }
  @Post('switch-environment') switchEnv(@Req() req: any, @Body() body: any) {
    return this.svc.switchEnvironment(this.actorOf(req), SwitchEnvSchema.parse(body), this.reqMeta(req));
  }

  // Sessions
  @Get('sessions/mine') mine(@Req() req: any) { return this.svc.listMySessions(this.actorOf(req)); }
  @Patch('sessions/:id/revoke') revoke(@Req() req: any, @Param('id') id: string) {
    return this.svc.revokeSession(this.actorOf(req), id, this.reqMeta(req));
  }

  // Forensics
  @Get('attempts') attempts() { return this.svc.recentAttempts(); }
  @Get('audit') audit() { return this.svc.recentAudit(); }
}
