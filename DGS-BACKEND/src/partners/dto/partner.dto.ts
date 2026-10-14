import { Type } from 'class-transformer';
import {
  IsBoolean, IsInt, IsNotEmpty, IsOptional, IsString, MaxLength,
} from 'class-validator';

export class CreatePartnerDto {
  @IsString() @IsNotEmpty() @MaxLength(255)
  name: string;

  @IsOptional() @IsString() @MaxLength(500)
  logo_url?: string;

  @IsOptional() @IsString() @MaxLength(500)
  website_url?: string;

  @IsOptional() @IsString() @MaxLength(100)
  sector?: string;

  @IsOptional() @IsString() @MaxLength(50)
  partnership_type?: string;

  @IsOptional() @IsString()
  description?: string;

  @IsOptional() @IsBoolean()
  is_active?: boolean;

  @IsOptional() @Type(() => Number) @IsInt()
  display_order?: number;
}
