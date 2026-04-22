import { IsArray, IsEnum, IsInt, IsObject, IsOptional, IsString, Length, Max, Min } from 'class-validator';

export const POST_KINDS = ['text','media','link','poll','opportunity','milestone'] as const;
export const POST_VIS = ['public','followers','connections','private','org'] as const;
export const REACTIONS = ['like','celebrate','insightful','curious','support'] as const;

export class CreatePostDto {
  @IsEnum(POST_KINDS as unknown as string[]) kind!: typeof POST_KINDS[number];
  @IsString() @Length(0, 8000) body!: string;
  @IsOptional() @IsEnum(POST_VIS as unknown as string[]) visibility?: typeof POST_VIS[number];
  @IsOptional() @IsArray() tags?: string[];
  @IsOptional() @IsArray() media?: Array<{ url: string; kind: 'image'|'video'|'audio'; alt?: string; width?: number; height?: number }>;
  @IsOptional() @IsObject() link?: { url: string; title?: string; description?: string; image?: string };
  @IsOptional() @IsObject() poll?: { question: string; options: { label: string; votes?: number }[]; closesAt?: string | null };
  @IsOptional() @IsObject() opportunity?: { kind: string; refId: string; title: string; location?: string; comp?: string; deadline?: string };
  @IsOptional() @IsString() orgId?: string;
  @IsOptional() @IsString() language?: string;
}

export class UpdatePostDto {
  @IsOptional() @IsString() @Length(0, 8000) body?: string;
  @IsOptional() @IsEnum(POST_VIS as unknown as string[]) visibility?: typeof POST_VIS[number];
  @IsOptional() @IsArray() tags?: string[];
}

export class ReactionDto {
  @IsEnum(REACTIONS as unknown as string[]) kind!: typeof REACTIONS[number];
}

export class CommentDto {
  @IsString() @Length(1, 4000) body!: string;
  @IsOptional() @IsString() parentId?: string;
}

export class FeedQueryDto {
  @IsOptional() @IsInt() @Min(1) @Max(100) limit?: number;
  @IsOptional() @IsString() cursor?: string;
  @IsOptional() @IsString() reason?: 'follow'|'recommended'|'trending'|'opportunity';
}
