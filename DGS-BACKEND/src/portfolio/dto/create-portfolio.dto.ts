import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
  ValidateIf,
  ValidateNested,
} from 'class-validator';
import {
  PortfolioPricingTierDto,
} from './portfolio-challenge.dto';
import { PortfolioMediaType, PortfolioProjectStatus, PortfolioProjectType } from '../entities/portfolio.entity';

export class CreatePortfolioDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  project_name: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  slug: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  client_name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  client_logo?: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  category: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @IsOptional()
  @IsString()
  @MaxLength(500)
  live_url?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  app_store_url?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  play_store_url?: string;

  @IsOptional()
  @IsBoolean()
  is_featured?: boolean;

  @IsOptional()
  @IsEnum(PortfolioMediaType)
  media_type?: PortfolioMediaType;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  media_url?: string;

  @IsOptional()
  @IsEnum(PortfolioProjectStatus)
  project_status?: PortfolioProjectStatus;

  @IsOptional()
  @IsEnum(PortfolioProjectType)
  project_type?: PortfolioProjectType;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  latitude?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  longitude?: number;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  cover_image?: string;

  @IsOptional()
  @IsBoolean()
  comparison_enabled?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  comparison_title?: string;

  @IsOptional()
  @IsString()
  industry_standard_text?: string;

  @IsOptional()
  @IsString()
  our_approach_text?: string;

  @IsOptional()
  @IsBoolean()
  pricing_enabled?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  pricing_title?: string;


  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PortfolioPricingTierDto)
  pricing_tiers?: PortfolioPricingTierDto[];
}
