import { IsArray, IsBoolean, IsEnum, IsObject, IsOptional, IsString, Length } from 'class-validator';

export const SETTING_NAMESPACES = ['general','locale','accessibility','privacy','profile','connections'] as const;
export type SettingNamespace = typeof SETTING_NAMESPACES[number];

export const SETTING_SCOPES = ['user','org','device'] as const;
export type SettingScope = typeof SETTING_SCOPES[number];

export class UpsertSettingDto {
  @IsEnum(SETTING_NAMESPACES as unknown as string[]) namespace!: SettingNamespace;
  @IsString() @Length(1, 80) key!: string;
  // value is intentionally any-jsonb; service-level rules validate per-key.
  value!: unknown;
  @IsOptional() @IsEnum(SETTING_SCOPES as unknown as string[]) scope?: SettingScope;
  @IsOptional() @IsString() orgId?: string;
}

export class BulkUpsertSettingsDto {
  @IsArray() items!: UpsertSettingDto[];
}

export class ResetNamespaceDto {
  @IsEnum(SETTING_NAMESPACES as unknown as string[]) namespace!: SettingNamespace;
}

export class CreateConnectedAccountDto {
  @IsString() provider!: string;
  @IsString() externalId!: string;
  @IsOptional() @IsString() displayName?: string;
  @IsOptional() @IsArray() scopes?: string[];
  @IsOptional() @IsObject() metadata?: Record<string, unknown>;
}

export class CreateDataRequestDto {
  @IsEnum(['export','erasure','rectification']) kind!: 'export'|'erasure'|'rectification';
  @IsOptional() @IsString() reason?: string;
}
