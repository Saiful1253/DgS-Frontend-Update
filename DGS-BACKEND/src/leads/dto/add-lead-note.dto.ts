import { Type } from 'class-transformer';
import { IsInt, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class AddLeadNoteDto {
  @IsString()
  @IsNotEmpty()
  notes: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  adminUserId?: number;
}
