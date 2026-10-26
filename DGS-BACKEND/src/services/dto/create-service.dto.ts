import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsInt,
  IsBoolean,
  IsArray,
  Min,
  MaxLength,
  Matches,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class ServiceFeatureDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  icon?: string;
}

export class CreateServiceDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  group_id?: number | null;

  @IsString()
  @IsNotEmpty()
  @MaxLength(160)
  name: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(180)
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
    message: 'Slug may only contain lowercase letters, numbers, and hyphens',
  })
  slug: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  pillar: string;

  @IsOptional()
  @IsString()
  @MaxLength(600)
  description?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  icon_url?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  spec_code?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  badge_label?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  badge_status?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  sub_title?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  category_tag?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  tier_label?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  image_url?: string;

  @IsOptional()
  @IsBoolean()
  is_flagship?: boolean;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ServiceFeatureDto)
  features?: ServiceFeatureDto[];

  @IsOptional()
  @IsString()
  @MaxLength(255)
  compliance_codes?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  cta_label?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  cta_url?: string;

  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}
