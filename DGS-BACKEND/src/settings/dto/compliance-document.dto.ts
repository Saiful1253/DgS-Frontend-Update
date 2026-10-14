import { IsArray, IsBoolean, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateComplianceDocumentDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  title: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  issuing_authority?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  reg_id?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  file_url?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  display_mode?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  display_locations?: string[];

  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}
