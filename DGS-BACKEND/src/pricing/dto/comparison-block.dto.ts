import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  ValidateNested,
} from 'class-validator';

export class ComparisonRowDto {
  @IsOptional()
  @IsString()
  standard_approach?: string;

  @IsOptional()
  @IsString()
  our_approach?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  display_order?: number;
}

export class UpsertComparisonBlockDto {
  @IsOptional()
  @IsBoolean()
  enabled?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  title?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  subtitle?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ComparisonRowDto)
  rows?: ComparisonRowDto[];
}
