import { Type } from 'class-transformer';
import {
  IsBoolean, IsInt, IsNotEmpty, IsOptional, IsString, MaxLength, Min, Max,
} from 'class-validator';

export class CreateTestimonialDto {
  @IsString() @IsNotEmpty() @MaxLength(50)
  kind: string;

  @IsString() @IsNotEmpty() @MaxLength(255)
  author_name: string;

  @IsOptional() @IsString() @MaxLength(255)
  author_role?: string;

  @IsOptional() @IsString() @MaxLength(255)
  author_company?: string;

  @IsOptional() @IsString() @MaxLength(500)
  avatar_url?: string;

  @IsOptional() @IsString() @MaxLength(500)
  client_logo_url?: string;

  @Type(() => Number) @IsInt() @Min(1) @Max(5)
  rating: number;

  @IsOptional() @IsString()
  content?: string;

  @IsOptional() @IsString() @MaxLength(50)
  source_platform?: string;

  @IsOptional() @IsBoolean()
  is_featured?: boolean;

  @IsOptional() @Type(() => Number) @IsInt()
  display_order?: number;

  @IsOptional() @IsBoolean()
  is_active?: boolean;
}
