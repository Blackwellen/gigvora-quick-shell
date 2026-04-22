import { Body, Controller, Get, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import type { Request } from 'express';
import {
  CreateVerificationDto, DecideVerificationDto, EnrollMfaDto, ForgotPasswordDto,
  LoginDto, LogoutDto, OnboardingPatchDto, RefreshDto, ResendVerificationDto,
  ResetPasswordDto, SignupDto, VerifyEmailDto, VerifyMfaDto,
} from './dto';
import { IdentityService } from './identity.service';

function ctx(req: Request) {
  const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || req.ip || null;
  const userAgent = (req.headers['user-agent'] as string) ?? null;
  return { ip, userAgent };
}

@Controller('identity')
export class IdentityController {
  constructor(private readonly svc: IdentityService) {}

  // public
  @Post('signup') signup(@Body() dto: SignupDto, @Req() req: Request) { return this.svc.signup(dto, ctx(req)); }
  @Post('login')  login(@Body() dto: LoginDto, @Req() req: Request)   { return this.svc.login(dto, { ...ctx(req), deviceLabel: dto.deviceLabel ?? null }); }
  @Post('refresh') refresh(@Body() dto: RefreshDto, @Req() req: Request) { return this.svc.refresh(dto.refreshToken, ctx(req)); }
  @Post('logout')  logout(@Body() dto: LogoutDto, @Req() req: Request)   { return this.svc.logout(dto.refreshToken, ctx(req)); }

  @Post('email/verify') verifyEmail(@Body() dto: VerifyEmailDto, @Req() req: Request) { return this.svc.verifyEmail(dto.token, ctx(req)); }
  @Post('email/resend') resend(@Body() dto: ResendVerificationDto, @Req() req: Request) { return this.svc.resendVerification(dto.email, ctx(req)); }

  @Post('password/forgot') forgot(@Body() dto: ForgotPasswordDto, @Req() req: Request) { return this.svc.forgotPassword(dto.email, ctx(req)); }
  @Post('password/reset')  reset(@Body() dto: ResetPasswordDto, @Req() req: Request) { return this.svc.resetPassword(dto.token, dto.password, ctx(req)); }

  // authenticated
  @UseGuards(AuthGuard('jwt')) @Get('me')
  me(@Req() req: Request) {
    const userId = (req as any).user?.userId;
    return { userId };
  }

  @UseGuards(AuthGuard('jwt')) @Get('mfa') listMfa(@Req() req: Request) {
    return this.svc.listMfa((req as any).user.userId);
  }
  @UseGuards(AuthGuard('jwt')) @Post('mfa/enroll')
  enroll(@Body() dto: EnrollMfaDto, @Req() req: Request) { return this.svc.enrollMfa((req as any).user.userId, dto.type, dto.label); }
  @UseGuards(AuthGuard('jwt')) @Post('mfa/verify')
  verifyMfa(@Body() dto: VerifyMfaDto, @Req() req: Request) { return this.svc.verifyMfaEnrollment((req as any).user.userId, dto.factorId, dto.code); }

  @UseGuards(AuthGuard('jwt')) @Get('sessions') sessions(@Req() req: Request) { return this.svc.listSessions((req as any).user.userId); }
  @UseGuards(AuthGuard('jwt')) @Post('sessions/:id/revoke')
  revoke(@Param('id') id: string, @Req() req: Request) { return this.svc.revokeSession(id, (req as any).user.userId, ctx(req)); }

  // onboarding
  @UseGuards(AuthGuard('jwt')) @Get('onboarding')
  getOnboarding(@Req() req: Request) { return this.svc.getOnboarding((req as any).user.userId); }
  @UseGuards(AuthGuard('jwt')) @Patch('onboarding')
  patchOnboarding(@Body() dto: OnboardingPatchDto, @Req() req: Request) {
    return this.svc.patchOnboarding((req as any).user.userId, dto.status ?? null, dto.currentStep ?? null, dto.payload ?? {});
  }

  // verifications (KYC / badges)
  @UseGuards(AuthGuard('jwt')) @Post('verifications')
  createVerification(@Body() dto: CreateVerificationDto, @Req() req: Request) {
    return this.svc.createVerification((req as any).user.userId, dto.kind, dto.evidence ?? {});
  }
  @UseGuards(AuthGuard('jwt')) @Get('verifications')
  listVerifications(@Req() req: Request) { return this.svc.listVerifications((req as any).user.userId); }

  // admin-facing review queue (TODO: gate behind admin role)
  @UseGuards(AuthGuard('jwt')) @Get('admin/verifications/pending')
  pending() { return this.svc.pendingVerifications(); }
  @UseGuards(AuthGuard('jwt')) @Post('admin/verifications/:id/decide')
  decide(@Param('id') id: string, @Body() dto: DecideVerificationDto, @Req() req: Request) {
    return this.svc.decideVerification(id, (req as any).user.userId, dto.decision, dto.note ?? null, ctx(req));
  }
}
