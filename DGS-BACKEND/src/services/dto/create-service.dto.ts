import { IsString, IsNotEmpty, IsOptional, IsInt, IsBoolean, Min, MaxLength, Matches } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateServiceDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  group_id?: number | null;

  @IsString()
  @IsNotEmpty()
  @MaxLength(160)
  name: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(180)
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
    message: 'Slug may only contain lowercase letters, numbers, and hyphens',
  })
  slug: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  pillar: string;

  @IsOptional()
  @IsString()
  @MaxLength(600)
  description?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  icon_url?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  display_order?: number;

  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}
