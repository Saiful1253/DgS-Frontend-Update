import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { IsLooseNumber } from '../../common/validators/is-loose-number.validator';

export class CalendlySlotDto {
  @IsOptional() @IsString() date?: string;
  @IsOptional() @IsString() time?: string;
  @IsOptional() @IsString() url?: string;
}

export class CreateLeadDto {
  @IsOptional()
  @IsString()
  @MaxLength(50)
  type?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  source_channel?: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  full_name: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  email: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  country?: string;

  @IsOptional()
  @IsString()
  @MaxLength(10)
  currency?: string;

  @IsOptional()
  @IsLooseNumber()
  est_deal_value?: string | number;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  source_page_url?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  client_ip?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  mobile_prefix?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  mobile_number?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  company_name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  designation?: string;

  @IsOptional()
  @IsString()
  message?: string;

  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => CalendlySlotDto)
  calendly_slot?: CalendlySlotDto;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  service_requirements?: string[];

  @IsOptional()
  @IsString()
  @MaxLength(50)
  return_file_format?: string;

  @IsOptional()
  @IsString()
  detailed_instructions?: string;

  @IsOptional()
  @IsBoolean()
  want_commercial_quote?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  status?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  assigned_owner_id?: number;

  @IsOptional()
  @IsString()
  follow_up_date?: string;

  @IsOptional()
  @IsString()
  follow_up_notes?: string;
}
