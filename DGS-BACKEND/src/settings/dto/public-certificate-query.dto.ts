import { Type } from 'class-transformer';
import { IsBoolean, IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';

/**
 * Query for the public certificate list (spec §4).
 *
 * Offset paging rather than page paging: the storefront appends one more batch
 * per "Load more" press, so it already knows `offset` and never has to convert
 * from a page number. `limit` is capped so a hand-crafted `?limit=100000`
 * cannot pull the whole table in one request.
 */
export class PublicCertificateQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(60)
  limit?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  offset?: number;

  /** Landing page reads only the featured subset (max 8 rendered there). */
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  featured?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  search?: string;
}