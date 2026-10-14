import { IsArray, IsObject, IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateSitemapConfigDto {
  @IsOptional() @IsArray() @IsString({ each: true })
  robots_disallow?: string[];

  @IsOptional() @IsArray() @IsString({ each: true })
  robots_allow?: string[];

  @IsOptional() @IsString() @MaxLength(500)
  sitemap_url?: string;

  @IsOptional() @IsObject()
  priority_mappings?: Record<string, any>;

  @IsOptional() @IsObject()
  change_frequencies?: Record<string, any>;
}
