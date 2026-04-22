import { IsArray, IsEmail, IsEnum, IsInt, IsObject, IsOptional, IsString, Length, Max, Min } from 'class-validator';

export const PAGE_STATUSES = ['draft','scheduled','published','archived'] as const;
export type PageStatus = typeof PAGE_STATUSES[number];

export class ListPagesQuery {
  @IsOptional() @IsString() surface?: string;
  @IsOptional() @IsEnum(PAGE_STATUSES) status?: PageStatus;
  @IsOptional() @IsString() locale?: string;
  @IsOptional() @IsString() q?: string;
  @IsOptional() @IsInt() @Min(1) @Max(100) limit?: number;
  @IsOptional() @IsInt() @Min(0) offset?: number;
}

export class UpsertPageDto {
  @IsString() @Length(1, 200) slug!: string;
  @IsString() surface!: string;
  @IsString() @Length(1, 200) title!: string;
  @IsOptional() @IsString() tagline?: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsString() heroImage?: string;
  @IsOptional() @IsObject() body?: Record<string, unknown>;
  @IsOptional() @IsObject() seo?: Record<string, unknown>;
  @IsOptional() @IsEnum(PAGE_STATUSES) status?: PageStatus;
  @IsOptional() @IsString() locale?: string;
}

export class CreateLeadDto {
  @IsEmail() email!: string;
  @IsOptional() @IsString() @Length(1, 200) fullName?: string;
  @IsOptional() @IsString() company?: string;
  @IsOptional() @IsString() role?: string;
  @IsOptional() @IsString() useCase?: string;
  @IsOptional() @IsString() sourcePage?: string;
  @IsOptional() @IsString() sourceCta?: string;
  @IsOptional() @IsObject() utm?: Record<string, unknown>;
  @IsOptional() @IsObject() consent?: Record<string, unknown>;
}

export class NewsletterSubscribeDto {
  @IsEmail() email!: string;
  @IsOptional() @IsArray() topics?: string[];
  @IsOptional() @IsString() source?: string;
  @IsOptional() @IsObject() utm?: Record<string, unknown>;
}

export class CtaEventDto {
  @IsString() experimentKey!: string;
  @IsOptional() @IsString() variantLabel?: string;
  @IsEnum(['impression','click','convert'] as const) eventType!: 'impression'|'click'|'convert';
  @IsOptional() @IsString() visitorId?: string;
  @IsOptional() @IsString() page?: string;
  @IsOptional() @IsObject() meta?: Record<string, unknown>;
}
