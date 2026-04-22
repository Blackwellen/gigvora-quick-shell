import { IsBoolean, IsEnum, IsInt, IsObject, IsOptional, IsString, IsUUID, Length, Min } from 'class-validator';

export class CreateOrgDto {
  @IsString() @Length(2, 80) name!: string;
  @IsString() @Length(2, 60) slug!: string;
  @IsOptional() @IsString() logoUrl?: string;
  @IsOptional() @IsEnum(['free','pro','team','enterprise']) plan?: 'free'|'pro'|'team'|'enterprise';
}

export class UpdateOrgDto {
  @IsOptional() @IsString() @Length(2, 80) name?: string;
  @IsOptional() @IsString() logoUrl?: string;
  @IsOptional() @IsEnum(['free','pro','team','enterprise']) plan?: 'free'|'pro'|'team'|'enterprise';
  @IsOptional() @IsObject() settings?: Record<string, unknown>;
}

export class InviteMemberDto {
  @IsUUID() userId!: string;
  @IsEnum(['owner','admin','member','viewer','guest']) role!: 'owner'|'admin'|'member'|'viewer'|'guest';
}

export class CreateSavedViewDto {
  @IsString() @Length(1, 80) label!: string;
  @IsString() @Length(1, 200) route!: string;
  @IsOptional() @IsString() icon?: string;
  @IsOptional() @IsBoolean() pinned?: boolean;
  @IsOptional() @IsInt() @Min(0) position?: number;
  @IsOptional() @IsObject() filters?: Record<string, unknown>;
}

export class UpdateSavedViewDto {
  @IsOptional() @IsString() @Length(1, 80) label?: string;
  @IsOptional() @IsBoolean() pinned?: boolean;
  @IsOptional() @IsInt() @Min(0) position?: number;
  @IsOptional() @IsObject() filters?: Record<string, unknown>;
}

export class TrackRecentDto {
  @IsEnum(['page','profile','project','job','gig','service','message','order','event','group'])
  kind!: 'page'|'profile'|'project'|'job'|'gig'|'service'|'message'|'order'|'event'|'group';
  @IsString() @Length(1, 200) label!: string;
  @IsString() @Length(1, 400) route!: string;
  @IsOptional() @IsObject() meta?: Record<string, unknown>;
}

export class UpdateShellPrefsDto {
  @IsOptional() @IsString() activeRole?: string;
  @IsOptional() @IsUUID() activeOrgId?: string;
  @IsOptional() @IsBoolean() sidebarCollapsed?: boolean;
  @IsOptional() @IsBoolean() rightRailOpen?: boolean;
  @IsOptional() @IsString() density?: string;
  @IsOptional() @IsString() theme?: string;
  @IsOptional() @IsObject() shortcuts?: Record<string, unknown>;
}

export interface PaginatedEnvelope<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}
