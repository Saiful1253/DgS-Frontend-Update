import { Transform, TransformFnParams, Type } from 'class-transformer';
import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

const toBool = ({ value, obj, key }: TransformFnParams): boolean | undefined => {
  const raw = obj?.[key] ?? value;
  if (raw === undefined || raw === null || raw === '') return undefined;
  return raw === true || raw === 'true' || raw === 1 || raw === '1';
};

export class QueryTestimonialsDto {
  @IsOptional()
  @Transform(toBool)
  @IsBoolean()
  featuredOnly?: boolean;

  @IsOptional()
  @Transform(toBool)
  @IsBoolean()
  is_featured?: boolean;

  @IsOptional()
  @Transform(toBool)
  @IsBoolean()
  is_active?: boolean;

  @IsOptional()
  @IsString()
  status?: string; // 'pending' | 'approved' | 'rejected' | 'all'

  @IsOptional()
  @IsString()
  type?: string; // 'text' | 'image' | 'all'

  @IsOptional()
  @IsString()
  @MaxLength(50)
  source_platform?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  search?: string;

  @IsOptional()
  @IsString()
  sortBy?: string; // 'created_at' | 'rating' | 'author_name'

  @IsOptional()
  @IsString()
  order?: 'asc' | 'desc' | 'ASC' | 'DESC';

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(200)
  limit?: number;
}
