import { Transform, Type } from 'class-transformer';
import { IsBoolean, IsIn, IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';

/**
 * Admin list query for certificates.
 *
 * Page-based (not offset) because the admin table shows "Showing X to Y of Z"
 * and jumps to arbitrary page numbers — an offset would need the page number
 * converted before every jump.
 *
 * `sortBy` is an enum of column names rather than a free string: the value is
 * interpolated into `ORDER BY`, which is not a bound parameter in any driver,
 * so an allow-list is the only thing standing between a query parameter and
 * injected SQL.
 */
export class AdminCertificateQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  search?: string;

  @IsOptional()
  @IsIn(['display_order', 'year', 'title', 'reg_no', 'issuing_authority', 'created_at'])
  @Transform(({ value }) => (value === undefined || value === null || value === '' ? undefined : String(value)))
  sortBy?: 'display_order' | 'year' | 'title' | 'reg_no' | 'issuing_authority' | 'created_at';

  @IsOptional()
  @IsIn(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc';

  /** Tri-state: omitted means "both", so an explicit "all" is expressible. */
  @IsOptional()
  @Transform(({ value }) => (value === '' || value === 'all' ? undefined : value))
  @Type(() => Boolean)
  @IsBoolean()
  is_active?: boolean;

  @IsOptional()
  @Transform(({ value }) => (value === '' || value === 'all' ? undefined : value))
  @Type(() => Boolean)
  @IsBoolean()
  is_featured?: boolean;

  @IsOptional()
  @IsIn(['image', 'pdf'])
  file_type?: 'image' | 'pdf';
}