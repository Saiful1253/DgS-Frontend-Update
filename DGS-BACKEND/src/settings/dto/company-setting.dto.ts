import { Type } from 'class-transformer';
import {
  IsArray,
  IsInt,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  MaxLength,
  ValidateNested,
} from 'class-validator';

export class BranchAddressDto {
  @IsString()
  @IsNotEmpty()
  city: string;

  @IsString()
  @IsNotEmpty()
  country: string;

  @IsString()
  @IsNotEmpty()
  address: string;

  @IsOptional()
  @IsString()
  phone?: string;
}

export class OfficialEmailsDto {
  @IsOptional() @IsString() general?: string;
  @IsOptional() @IsString() support?: string;
  @IsOptional() @IsString() sales?: string;
  @IsOptional() @IsString() careers?: string;
}

export class OfficialPhonesDto {
  @IsOptional() @IsString() phone?: string;
  @IsOptional() @IsString() whatsapp?: string;
  @IsOptional() @IsString() country_code?: string;
}

export class SocialLinksDto {
  @IsOptional() @IsString() linkedin?: string;
  @IsOptional() @IsString() facebook?: string;
  @IsOptional() @IsString() twitter?: string;
  @IsOptional() @IsString() github?: string;
  @IsOptional() @IsString() youtube?: string;
}

export class UpdateCompanySettingsDto {
  @IsOptional()
  @IsString()
  @MaxLength(255)
  legal_company_name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  brand_name?: string;

  @IsOptional()
  @IsString()
  mission_purpose?: string;

  @IsOptional()
  @IsString()
  incorporation_details?: string;

  @IsOptional()
  @IsString()
  eu_standards_badge_info?: string;

  @IsOptional()
  @IsString()
  primary_headquarters_address?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BranchAddressDto)
  branch_addresses?: BranchAddressDto[];

  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => OfficialEmailsDto)
  official_emails?: OfficialEmailsDto;

  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => OfficialPhonesDto)
  official_phones?: OfficialPhonesDto;

  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => SocialLinksDto)
  social_links?: SocialLinksDto;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  calendly_url?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  core_cta_objective?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  target_monthly_lead_capacity?: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  target_geographies?: string[];

  @IsOptional()
  @IsString()
  ideal_client_persona_focus?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  priority_focus_offerings?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  secondary_conversion_events?: string[];

  @IsOptional()
  @IsString()
  @MaxLength(100)
  ga4_measurement_id?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  gtm_container_id?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  meta_pixel_id?: string;

  @IsOptional()
  @IsString()
  custom_head_scripts?: string;

  @IsOptional()
  @IsString()
  custom_body_scripts?: string;
}
