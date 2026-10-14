import { Type } from 'class-transformer';
import {
  IsArray, IsBoolean, IsNotEmpty, IsObject, IsOptional, IsString, MaxLength, ValidateNested,
} from 'class-validator';

export class InternalLinkTargetDto {
  @IsString() @IsNotEmpty() @MaxLength(255)
  anchor_text: string;

  @IsString() @IsNotEmpty() @MaxLength(500)
  target_url: string;
}

export class UpsertPageMetaDto {
  @IsString() @IsNotEmpty() @MaxLength(255)
  page_path: string;

  @IsOptional() @IsString() @MaxLength(255)
  meta_title?: string;

  @IsOptional() @IsString()
  meta_description?: string;

  @IsOptional() @IsArray() @IsString({ each: true })
  keywords?: string[];

  @IsOptional() @IsString() @MaxLength(500)
  canonical_url?: string;

  @IsOptional() @IsString() @MaxLength(255)
  og_title?: string;

  @IsOptional() @IsString()
  og_description?: string;

  @IsOptional() @IsString() @MaxLength(500)
  og_image?: string;

  @IsOptional() @IsString() @MaxLength(50)
  twitter_card?: string;

  @IsOptional() @IsObject()
  schema_json_ld?: Record<string, any>;

  @IsOptional() @IsString() @MaxLength(255)
  default_image_alt?: string;

  @IsOptional() @IsArray() @ValidateNested({ each: true }) @Type(() => InternalLinkTargetDto)
  internal_link_targets?: InternalLinkTargetDto[];

  @IsOptional() @IsBoolean()
  no_index?: boolean;

  @IsOptional() @IsBoolean()
  no_follow?: boolean;
}
