import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  ValidateNested,
} from 'class-validator';

export class ProductIntegrationDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  logo?: string;
}

export class ProductComparisonRowDto {
  @IsOptional()
  @IsString()
  traditional?: string;

  @IsOptional()
  @IsString()
  our_product?: string;
}

export class CreateProductSaasDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  product_name: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  slug: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  brand_logo?: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  category: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  industry_focus?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  deployment_options?: string[];

  @IsOptional()
  @IsString()
  @MaxLength(100)
  status_badge?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @IsOptional()
  @IsString()
  @MaxLength(500)
  live_demo_url?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  sandbox_url?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  app_store_url?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  documentation_url?: string;

  @IsOptional()
  @IsBoolean()
  is_featured?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  cover_image?: string;

  @IsOptional()
  @IsString()
  primary_challenge?: string;

  @IsOptional()
  @IsString()
  primary_solution?: string;

  @IsOptional()
  @IsBoolean()
  enable_explore_solution?: boolean;

  @IsOptional()
  @IsBoolean()
  enable_request_demo?: boolean;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tech_specs?: string[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProductIntegrationDto)
  integrations?: ProductIntegrationDto[];

  @IsOptional()
  @IsString()
  @MaxLength(255)
  meta_title?: string;

  @IsOptional()
  @IsString()
  meta_description?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  keywords?: string[];

  @IsOptional()
  @IsString()
  @MaxLength(500)
  canonical_url?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  custom_og_image?: string;

  @IsOptional()
  @IsBoolean()
  no_index?: boolean;

  @IsOptional()
  @IsBoolean()
  no_follow?: boolean;

  @IsOptional()
  @IsBoolean()
  comparison_enabled?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  comparison_title?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProductComparisonRowDto)
  comparison_rows?: ProductComparisonRowDto[];

  @IsOptional()
  @IsBoolean()
  pricing_enabled?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  pricing_title?: string;
}
