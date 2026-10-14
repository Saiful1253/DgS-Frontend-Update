import { IsString, IsOptional, MaxLength } from 'class-validator';

export class UpsertSiteSettingDto {
  @IsString()
  @IsOptional()
  @MaxLength(100000)
  value?: string;
}
