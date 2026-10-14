import { IsString, IsOptional, IsBoolean } from 'class-validator';

export class UpsertBlogSeoDto {
  @IsString()
  @IsOptional()
  meta_title?: string;

  @IsString()
  @IsOptional()
  meta_description?: string;

  @IsString()
  @IsOptional()
  og_image_url?: string;

  @IsString()
  @IsOptional()
  keywords?: string;

  @IsString()
  @IsOptional()
  canonical_url?: string;

  @IsBoolean()
  @IsOptional()
  indexable?: boolean;

  @IsBoolean()
  @IsOptional()
  no_index?: boolean;

  @IsBoolean()
  @IsOptional()
  no_follow?: boolean;
}
