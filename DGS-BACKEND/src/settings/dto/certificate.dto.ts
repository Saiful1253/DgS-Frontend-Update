import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class CreateCertificateDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  issuing_authority?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  year?: number;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  badge_image_url?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  verification_link?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  display_locations?: string[];

  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}
