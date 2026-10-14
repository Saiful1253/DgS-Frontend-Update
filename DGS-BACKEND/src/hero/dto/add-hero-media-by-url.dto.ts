import { IsString, IsNotEmpty, IsOptional, IsInt, IsBoolean, IsIn, Min } from 'class-validator';
import { Type } from 'class-transformer';

export const HERO_MEDIA_TYPES = ['image', 'youtube'] as const;

export type HeroMediaType = (typeof HERO_MEDIA_TYPES)[number];

export class AddHeroMediaByUrlDto {
  @IsString()
  @IsNotEmpty()
  media_url: string;

  @IsIn([...HERO_MEDIA_TYPES])
  @IsOptional()
  media_type?: HeroMediaType;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  sort_order?: number;

  @IsBoolean()
  @IsOptional()
  is_active?: boolean;
}
