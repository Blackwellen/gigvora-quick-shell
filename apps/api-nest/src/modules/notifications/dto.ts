import { ArrayNotEmpty, IsArray, IsBoolean, IsEnum, IsInt, IsObject, IsOptional, IsString, IsUrl, Length, Min } from 'class-validator';

export const NOTIFICATION_CHANNELS = ['in_app','email','push','sms','webhook','slack'] as const;
export type NotificationChannel = typeof NOTIFICATION_CHANNELS[number];

export const NOTIFICATION_PRIORITIES = ['low','normal','high','urgent'] as const;
export type NotificationPriority = typeof NOTIFICATION_PRIORITIES[number];

export const NOTIFICATION_STATUSES = ['pending','queued','sent','delivered','read','dismissed','failed','suppressed'] as const;
export type NotificationStatus = typeof NOTIFICATION_STATUSES[number];

export class CreateNotificationDto {
  @IsString() identityId!: string;
  @IsString() @Length(1, 120) topic!: string;
  @IsString() @Length(1, 200) title!: string;
  @IsOptional() @IsString() body?: string;
  @IsOptional() @IsEnum(NOTIFICATION_PRIORITIES as unknown as string[]) priority?: NotificationPriority;
  @IsOptional() @IsString() entityType?: string;
  @IsOptional() @IsString() entityId?: string;
  @IsOptional() @IsString() actionUrl?: string;
  @IsOptional() @IsString() category?: string;
  @IsOptional() @IsString() groupKey?: string;
  @IsOptional() @IsObject() data?: Record<string, unknown>;
  @IsOptional() @IsArray() channels?: NotificationChannel[];
}

export class ListNotificationsDto {
  @IsOptional() @IsInt() @Min(1) limit?: number;
  @IsOptional() @IsString() cursor?: string;
  @IsOptional() @IsString() topic?: string;
  @IsOptional() @IsEnum(NOTIFICATION_STATUSES as unknown as string[]) status?: NotificationStatus;
  @IsOptional() @IsBoolean() unreadOnly?: boolean;
}

export class MarkReadDto {
  @IsArray() @ArrayNotEmpty() @IsString({ each: true }) ids!: string[];
}

export class UpsertPreferenceDto {
  @IsString() topic!: string;
  @IsArray() channels!: NotificationChannel[];
  @IsOptional() @IsString() digest?: 'realtime'|'hourly'|'daily'|'off';
  @IsOptional() @IsObject() quietHours?: Record<string, unknown>;
}

export class RegisterDeviceDto {
  @IsString() platform!: 'web'|'ios'|'android'|'flutter';
  @IsString() @Length(8, 4096) token!: string;
  @IsOptional() @IsString() label?: string;
}

export class CreateWebhookDto {
  @IsString() topicPattern!: string;
  @IsUrl({ require_tld: false }) url!: string;
}

export class EmitActivityDto {
  @IsString() topic!: string;
  @IsString() verb!: string;
  @IsString() entityType!: string;
  @IsString() entityId!: string;
  @IsOptional() @IsArray() @IsString({ each: true }) surfaceKeys?: string[];
  @IsOptional() @IsString() identityId?: string;
  @IsOptional() @IsObject() data?: Record<string, unknown>;
}
