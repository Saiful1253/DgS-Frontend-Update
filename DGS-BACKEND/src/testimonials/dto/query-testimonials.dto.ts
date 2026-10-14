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

/**
 * Coerce a query-string boolean ("true"/"false"/"1"/"0") to a real boolean.
 *
 * The global ValidationPipe runs with `enableImplicitConversion: true`, and
 * class-transformer 0.5.1 applies implicit conversion BEFORE `@Transform`
 * (TransformOperationExecutor.js:250 for type resolution, :91 for
 * `Boolean(value)`). Since `Boolean("false") === true`, reading `value` here
 * would hand us an already-inverted flag. `obj` is the untouched source
 * object, so read the original from it instead.
 */
const toBool = ({ value, obj, key }: TransformFnParams): boolean => {
  const raw = obj?.[key] ?? value;
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
  is_active?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  source_platform?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  search?: string;

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
