import { IsBoolean, IsOptional } from 'class-validator';

export class ToggleBlogFeaturedDto {
  @IsBoolean()
  @IsOptional()
  featured?: boolean;
}
