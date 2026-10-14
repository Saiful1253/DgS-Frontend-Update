import { IsString, IsOptional, IsInt, IsBoolean, IsIn, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { HERO_MEDIA_TYPES, HeroMediaType } from './add-hero-media-by-url.dto';

export class UpdateHeroMediaDto {
  @IsIn([...HERO_MEDIA_TYPES])
  @IsOptional()
  media_type?: HeroMediaType;

  @IsString()
  @IsOptional()
  media_url?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  sort_order?: number;

  @IsBoolean()
  @IsOptional()
  is_active?: boolean;
}
