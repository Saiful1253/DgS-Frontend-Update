import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class PortfolioChallengeDto {
  @IsOptional()
  @IsInt()
  id?: number;

  @IsString()
  @MaxLength(255)
  title: string;

  @IsOptional()
  @IsString()
  challenge_description?: string;

  @IsOptional()
  @IsString()
  solution_provided?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  supporting_image?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  sort_order?: number;
}

export class PortfolioPricingTierDto {
  @IsOptional()
  @IsInt()
  id?: number;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  title?: string;

  @IsOptional()
  @IsString({ each: true })
  currencies?: string[];

  @IsOptional()
  @IsString()
  primary_price?: string;

  @IsOptional()
  regional_prices?: Record<string, string>;

  @IsOptional()
  @IsString()
  price_subtitle?: string;

  @IsOptional()
  @IsString({ each: true })
  deliverables?: string[];

  @IsOptional()
  @IsString()
  badge_text?: string;

  @IsOptional()
  @IsString()
  cta_label?: string;

  @IsOptional()
  @IsString()
  cta_link?: string;

  @IsOptional()
  @IsBoolean()
  is_most_popular?: boolean;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  sort_order?: number;
}
