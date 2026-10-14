import { Type } from 'class-transformer';
import { IsInt, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateApplicantStatusDto {
  @IsString() @IsNotEmpty() @MaxLength(100)
  status: string;

  @IsOptional() @IsString()
  notes?: string;

  @IsOptional() @Type(() => Number) @IsInt()
  userId?: number;
}
