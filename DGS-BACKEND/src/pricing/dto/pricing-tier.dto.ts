import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

export class CreatePricingTierDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  entity_type: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  entity_id: number;

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  tier_title: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  primary_price?: number;

  @IsOptional()
  @IsString()
  @MaxLength(10)
  primary_currency?: string;

  @IsOptional()
  regional_prices?: Record<string, string>;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  billing_cycle?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  included_features?: string[];

  @IsOptional()
  @IsString()
  @MaxLength(100)
  badge_text?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  cta_text?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  cta_link?: string;

  @IsOptional()
  @IsBoolean()
  is_most_popular?: boolean;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  display_order?: number;
}
