import { IsInt, IsOptional, IsString, Length, Max, Min } from 'class-validator';

export class CreateRequestDto {
  @IsString() recipientId!: string;
  @IsOptional() @IsString() @Length(0, 1000) message?: string;
}

export class RespondRequestDto {
  @IsString() decision!: 'accept' | 'decline';
}

export class ListQueryDto {
  @IsOptional() @IsInt() @Min(1) @Max(100) limit?: number;
  @IsOptional() @IsString() cursor?: string;
  @IsOptional() @IsString() status?: 'pending' | 'accepted' | 'declined' | 'withdrawn' | 'blocked';
}

export class SuggestionsQueryDto {
  @IsOptional() @IsInt() @Min(1) @Max(50) limit?: number;
  @IsOptional() @IsInt() @Min(2) @Max(3) maxDegree?: number;
}
