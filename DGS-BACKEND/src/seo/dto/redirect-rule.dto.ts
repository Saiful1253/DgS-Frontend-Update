import { Type } from 'class-transformer';
import { IsBoolean, IsIn, IsInt, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateRedirectRuleDto {
  @IsString() @IsNotEmpty() @MaxLength(255)
  source_path: string;

  @IsString() @IsNotEmpty() @MaxLength(255)
  target_path: string;

  @Type(() => Number) @IsInt() @IsIn([301, 302, 307, 308])
  status_code: number;

  @IsOptional() @IsBoolean()
  is_active?: boolean;
}
