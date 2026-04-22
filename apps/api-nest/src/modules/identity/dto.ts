import { IsEmail, IsEnum, IsObject, IsOptional, IsString, Length, Matches, MinLength } from 'class-validator';

export class SignupDto {
  @IsEmail() email!: string;
  @MinLength(8) @Matches(/[A-Z]/, { message: 'must contain an uppercase letter' })
  @Matches(/[a-z]/, { message: 'must contain a lowercase letter' })
  @Matches(/[0-9]/, { message: 'must contain a number' })
  password!: string;
  @IsOptional() @IsString() @Length(1, 120) displayName?: string;
  @IsOptional() marketingOptIn?: boolean;
}

export class LoginDto {
  @IsEmail() email!: string;
  @IsString() password!: string;
  @IsOptional() @IsString() mfaCode?: string;
  @IsOptional() @IsString() deviceLabel?: string;
}

export class RefreshDto { @IsString() refreshToken!: string; }
export class LogoutDto { @IsOptional() @IsString() refreshToken?: string; }

export class ForgotPasswordDto { @IsEmail() email!: string; }
export class ResetPasswordDto {
  @IsString() token!: string;
  @MinLength(8) password!: string;
}

export class VerifyEmailDto { @IsString() token!: string; }
export class ResendVerificationDto { @IsEmail() email!: string; }

export class EnrollMfaDto {
  @IsEnum(['totp','sms','webauthn'] as const) type!: 'totp'|'sms'|'webauthn';
  @IsOptional() @IsString() label?: string;
}
export class VerifyMfaDto { @IsString() factorId!: string; @IsString() code!: string; }

export class OnboardingPatchDto {
  @IsOptional() @IsString() currentStep?: string;
  @IsOptional() @IsObject() payload?: Record<string, unknown>;
  @IsOptional() @IsEnum(['not_started','in_progress','completed','skipped'] as const)
  status?: 'not_started'|'in_progress'|'completed'|'skipped';
}

export class CreateVerificationDto {
  @IsEnum(['id_document','address','company','badge_professional','badge_enterprise'] as const)
  kind!: 'id_document'|'address'|'company'|'badge_professional'|'badge_enterprise';
  @IsOptional() @IsObject() evidence?: Record<string, unknown>;
}
export class DecideVerificationDto {
  @IsEnum(['approved','rejected','escalated'] as const) decision!: 'approved'|'rejected'|'escalated';
  @IsOptional() @IsString() note?: string;
}
