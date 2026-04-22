import { IsEnum, IsObject, IsOptional, IsString, IsUUID, Length } from 'class-validator';

export const OVERLAY_KINDS = [
  'modal','drawer','sheet','popover','hovercard','toast','wizard',
  'inspector','detached_window','quick_preview','confirmation',
] as const;
export type OverlayKind = typeof OVERLAY_KINDS[number];

export const OVERLAY_STATUSES = [
  'pending','open','dismissed','completed','expired','failed','escalated',
] as const;
export type OverlayStatus = typeof OVERLAY_STATUSES[number];

export class OpenOverlayDto {
  @IsEnum(OVERLAY_KINDS as unknown as string[]) kind!: OverlayKind;
  @IsString() @Length(1, 200) surfaceKey!: string;
  @IsOptional() @IsString() route?: string;
  @IsOptional() @IsString() entityType?: string;
  @IsOptional() @IsString() entityId?: string;
  @IsOptional() @IsObject()  payload?: Record<string, unknown>;
  @IsOptional() @IsEnum(['user','system','workflow','notification','deeplink','admin'] as const)
  origin?: 'user'|'system'|'workflow'|'notification'|'deeplink'|'admin';
}

export class PatchOverlayDto {
  @IsOptional() @IsObject() payload?: Record<string, unknown>;
  @IsOptional() @IsEnum(OVERLAY_STATUSES as unknown as string[]) status?: OverlayStatus;
  @IsOptional() @IsObject() result?: Record<string, unknown>;
}

export class StartWorkflowDto {
  @IsString() @Length(1, 120) templateKey!: string;
  @IsOptional() @IsObject() context?: Record<string, unknown>;
}

export class AdvanceWorkflowDto {
  @IsString() stepKey!: string;
  @IsOptional() @IsObject() data?: Record<string, unknown>;
  @IsOptional() @IsEnum(OVERLAY_STATUSES as unknown as string[]) status?: OverlayStatus;
}

export class DetachWindowDto {
  @IsString() channelKey!: string;
  @IsString() surfaceKey!: string;
  @IsString() route!: string;
  @IsOptional() @IsObject() state?: Record<string, unknown>;
}

export class WindowPingDto {
  @IsOptional() @IsObject() state?: Record<string, unknown>;
}
