import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsBoolean,
  IsInt,
  MaxLength,
  Min,
  ValidateIf,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateWhyChooseUsDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  title: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsOptional()
  @ValidateIf((o, v) => v !== null && v !== undefined)
  @IsString()
  @MaxLength(500)
  image_url?: string | null;

  @IsOptional()
  @ValidateIf((o, v) => v !== null && v !== undefined)
  @IsString()
  @MaxLength(500)
  icon_url?: string | null;

  @IsOptional()
  @ValidateIf((o, v) => v !== null && v !== undefined)
  @IsString()
  @MaxLength(50)
  icon_color?: string | null;

  @IsOptional()
  @ValidateIf((o, v) => v !== null && v !== undefined)
  @IsString()
  @MaxLength(50)
  badge_color?: string | null;

  @IsOptional()
  @ValidateIf((o, v) => v !== null && v !== undefined)
  @IsString()
  @MaxLength(100)
  icon_name?: string | null;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  display_order?: number;

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  is_active?: boolean;
}
