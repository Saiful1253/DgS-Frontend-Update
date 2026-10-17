import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsBoolean,
  IsIn,
  MaxLength,
} from 'class-validator';

export const HERO_STATUSES = ['draft', 'active', 'inactive'] as const;

export type HeroStatus = (typeof HERO_STATUSES)[number];

export class CreateHeroSectionDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  headline: string;

  @IsString()
  @IsNotEmpty()
  sub_headline: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  primary_cta_label: string;

  @IsString()
  @IsNotEmpty()
  primary_cta_link: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  secondary_cta_label?: string;

  @IsString()
  @IsOptional()
  secondary_cta_link?: string;

  @IsString()
  @IsOptional()
  @MaxLength(255)
  badge_text?: string;

  @IsString()
  @IsOptional()
  @MaxLength(150)
  highlight_text?: string;

  @IsIn([...HERO_STATUSES])
  @IsOptional()
  status?: HeroStatus;

  @IsBoolean()
  @IsOptional()
  is_active?: boolean;
}
