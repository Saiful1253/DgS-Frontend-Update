import { IsOptional, IsString, IsInt, Min, Max, IsEnum, IsIn } from 'class-validator';
import { Type } from 'class-transformer';

export enum ServiceStatusFilter {
  ALL = 'all',
  ACTIVE = 'active',
  INACTIVE = 'inactive',
}

export enum ServiceSortBy {
  NAME = 'name',
  PILLAR = 'pillar',
  DISPLAY_ORDER = 'display_order',
  CREATED_AT = 'created_at',
  UPDATED_AT = 'updated_at',
}

export enum SortOrder {
  ASC = 'asc',
  DESC = 'desc',
}

export class ServiceQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 21;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsString()
  pillar?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  group_id?: number;

  // `@IsString()` alone let anything through, and the handler maps
  // `status === 'active'` to a boolean — so an unrecognised value silently
  // became "inactive" instead of being rejected.
  @IsOptional()
  @IsIn(['all', 'active', 'inactive'])
  status?: ServiceStatusFilter;

  @IsOptional()
  @IsEnum(ServiceSortBy)
  sortBy?: ServiceSortBy = ServiceSortBy.DISPLAY_ORDER;

  @IsOptional()
  @IsEnum(SortOrder)
  sortOrder?: SortOrder = SortOrder.ASC;
}
