import { Type } from 'class-transformer';
import { IsInt, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateLeadStatusDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  status: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  adminUserId?: number;
}
