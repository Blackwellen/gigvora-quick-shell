import { IsArray, IsBoolean, IsEnum, IsInt, IsObject, IsOptional, IsString, Min } from 'class-validator';

export const ROLES = ['user','professional','enterprise','admin','moderator','support'] as const;
export type RoleName = typeof ROLES[number];

export class GrantRoleDto {
  @IsString() identityId!: string;
  @IsEnum(ROLES) role!: RoleName;
  @IsOptional() @IsString() orgId?: string;
  @IsOptional() @IsString() reason?: string;
  @IsOptional() expiresAt?: string;
}

export class RevokeRoleDto {
  @IsString() identityId!: string;
  @IsEnum(ROLES) role!: RoleName;
  @IsOptional() @IsString() orgId?: string;
}

export class SwitchRoleDto {
  @IsEnum(ROLES) role!: RoleName;
  @IsOptional() @IsString() orgId?: string;
}

export class CreateSubscriptionDto {
  @IsString() planId!: string;
  @IsOptional() @IsString() identityId?: string;
  @IsOptional() @IsString() orgId?: string;
  @IsOptional() @IsEnum(['monthly','annual'] as const) billingCycle?: 'monthly'|'annual';
  @IsOptional() @IsInt() @Min(1) seats?: number;
}

export class ChangePlanDto {
  @IsString() subscriptionId!: string;
  @IsString() toPlan!: string;
  @IsOptional() @IsString() reason?: string;
}

export class CancelSubscriptionDto {
  @IsString() subscriptionId!: string;
  @IsOptional() @IsBoolean() immediate?: boolean;
  @IsOptional() @IsString() reason?: string;
}

export class OverrideEntitlementDto {
  @IsOptional() @IsString() identityId?: string;
  @IsOptional() @IsString() orgId?: string;
  @IsString() feature!: string;
  @IsBoolean() grant!: boolean;
  @IsOptional() @IsString() reason?: string;
  @IsOptional() expiresAt?: string;
}

export class CheckAccessDto {
  @IsOptional() @IsString() feature?: string;
  @IsOptional() @IsEnum(ROLES) requiredRole?: RoleName;
  @IsOptional() @IsString() orgId?: string;
  @IsOptional() @IsString() route?: string;
  @IsOptional() @IsObject() meta?: Record<string, unknown>;
}

export class UpsertPlanDto {
  @IsString() id!: string;
  @IsString() label!: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() priceMonthly?: number;
  @IsOptional() priceAnnual?: number;
  @IsOptional() @IsArray() entitlements?: string[];
  @IsOptional() @IsObject() limits?: Record<string, unknown>;
  @IsOptional() @IsBoolean() highlight?: boolean;
  @IsOptional() @IsString() badge?: string;
  @IsOptional() @IsInt() position?: number;
  @IsOptional() @IsBoolean() active?: boolean;
}
