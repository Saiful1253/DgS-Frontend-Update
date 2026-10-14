import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsIn,
  IsObject,
  IsArray,
  IsBoolean,
  IsNumber,
  IsDateString,
} from 'class-validator';

export const BLOG_STATUSES = [
  'draft',
  'internal_review',
  'scheduled',
  'published',
  'archived',
] as const;

export type BlogStatus = (typeof BLOG_STATUSES)[number];

export class CreateBlogDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsOptional()
  slug?: string;

  @IsString()
  @IsOptional()
  excerpt?: string;

  @IsString()
  @IsOptional()
  content?: string;

  @IsObject()
  @IsOptional()
  content_delta?: object;

  @IsString()
  @IsOptional()
  featured_image_url?: string;

  @IsString()
  @IsOptional()
  featured_image_alt?: string;

  @IsString()
  @IsOptional()
  reading_time?: string;

  @IsString()
  @IsOptional()
  category?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[];

  @IsString()
  @IsOptional()
  primary_author_name?: string;

  @IsArray()
  @IsOptional()
  co_authors?: Array<{ name: string; designation?: string }>;

  @IsArray()
  @IsNumber({}, { each: true })
  @IsOptional()
  related_article_ids?: number[];

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  related_service_keys?: string[];

  @IsString()
  @IsOptional()
  meta_title?: string;

  @IsString()
  @IsOptional()
  meta_description?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  keywords?: string[];

  @IsString()
  @IsOptional()
  canonical_url?: string;

  @IsString()
  @IsOptional()
  custom_og_image?: string;

  @IsBoolean()
  @IsOptional()
  no_index?: boolean;

  @IsBoolean()
  @IsOptional()
  no_follow?: boolean;

  @IsBoolean()
  @IsOptional()
  featured_status?: boolean;

  @IsIn([...BLOG_STATUSES])
  @IsOptional()
  status?: BlogStatus;

  @IsDateString()
  @IsOptional()
  published_at?: string;

  @IsDateString()
  @IsOptional()
  scheduled_at?: string;
}