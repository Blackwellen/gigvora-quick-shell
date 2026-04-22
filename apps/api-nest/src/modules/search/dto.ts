import { IsArray, IsBoolean, IsEnum, IsInt, IsOptional, IsString, Max, Min, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export const SEARCH_INDEXES = ['all','users','jobs','projects','gigs','services','companies','startups','media','groups','events','podcasts','webinars','posts'] as const;
export type SearchScope = typeof SEARCH_INDEXES[number];

export const RELATIONS = ['related','mentions','depends_on','references','attached_to'] as const;
export type Relation = typeof RELATIONS[number];

export class SearchQueryDto {
  @IsString() q!: string;
  @IsOptional() @IsEnum(SEARCH_INDEXES) scope?: SearchScope;
  @IsOptional() @IsArray() tags?: string[];
  @IsOptional() @IsString() filters?: any;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(100) limit?: number;
  @IsOptional() @Type(() => Number) @IsInt() @Min(0) offset?: number;
}

export class AutocompleteDto {
  @IsString() q!: string;
  @IsOptional() @IsEnum(SEARCH_INDEXES) scope?: SearchScope;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(20) limit?: number;
}

export class TrackClickDto {
  @IsString() query!: string;
  @IsString() clickedId!: string;
  @IsString() clickedIndex!: string;
  @IsOptional() @IsEnum(SEARCH_INDEXES) scope?: SearchScope;
}

export class SaveSearchDto {
  @IsString() name!: string;
  @IsString() query!: string;
  @IsOptional() @IsEnum(SEARCH_INDEXES) scope?: SearchScope;
  @IsOptional() filters?: Record<string, unknown>;
  @IsOptional() @IsBoolean() pinned?: boolean;
  @IsOptional() @IsBoolean() notify?: boolean;
}

export class UpsertShortcutDto {
  @IsString() actionId!: string;
  @IsString() keybind!: string;
  @IsOptional() @IsBoolean() disabled?: boolean;
}

export class UpsertDocumentDto {
  @IsString() id!: string;
  @IsEnum(SEARCH_INDEXES) indexName!: Exclude<SearchScope,'all'>;
  @IsString() title!: string;
  @IsOptional() @IsString() body?: string;
  @IsOptional() @IsArray() tags?: string[];
  @IsOptional() @IsString() url?: string;
  @IsOptional() @IsString() ownerId?: string;
  @IsOptional() @IsString() orgId?: string;
  @IsOptional() @IsString() status?: string;
  @IsOptional() @IsString() region?: string;
  @IsOptional() @IsEnum(['public','private','org','internal'] as const) visibility?: 'public'|'private'|'org'|'internal';
  @IsOptional() meta?: Record<string, unknown>;
}

export class BulkIndexItemDto extends UpsertDocumentDto {}

export class BulkIndexDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BulkIndexItemDto)
  docs!: BulkIndexItemDto[];
}

export class CrossLinkDto {
  @IsString() sourceIndex!: string;
  @IsString() sourceId!: string;
  @IsString() targetIndex!: string;
  @IsString() targetId!: string;
  @IsEnum(RELATIONS) relation!: Relation;
  @IsOptional() weight?: number;
  @IsOptional() meta?: Record<string, unknown>;
}