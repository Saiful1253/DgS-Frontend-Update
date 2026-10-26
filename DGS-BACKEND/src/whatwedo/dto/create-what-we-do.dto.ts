import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class CreateWhatWeDoDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  category: string;

  @IsOptional()
  @IsBoolean()
  is_available?: boolean;

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  problem: string;

  @IsString()
  @IsNotEmpty()
  problem_desc: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  solution: string;

  @IsString()
  @IsNotEmpty()
  solution_desc: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  sort_order?: number;
}
