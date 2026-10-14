import { Type } from 'class-transformer';
import { IsInt, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateClientLogoDto {
  @IsString() @IsNotEmpty() @MaxLength(255)
  company_name: string;

  @IsOptional() @IsString() @MaxLength(500)
  logo_url?: string;

  @IsOptional() @IsString() @MaxLength(500)
  website_url?: string;

  @IsOptional() @Type(() => Number) @IsInt()
  display_order?: number;

  @IsOptional() @IsString() @MaxLength(50)
  status?: string;
}
