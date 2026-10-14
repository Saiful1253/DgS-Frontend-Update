import { Transform, Type } from 'class-transformer';
import { OmitType } from '@nestjs/swagger';
import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';

export class WarrantyComponentDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  warranty_policy_id: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  warranty_months?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  warranty_duration_days?: number;

  @IsOptional()
  @IsBoolean()
  service_coverage?: boolean;

  @IsOptional()
  @IsBoolean()
  parts_coverage?: boolean;

  @IsOptional()
  @IsString()
  customer_policy_note?: string;
}

/**
 * Numbers arriving in a JSON body are strings when a form was serialised rather
 * than `JSON.stringify`'d from JS. Coercing here means `{ base_price: "19.99" }`
 * validates the same as a real number, instead of failing IsNumber and reporting
 * a type error the operator cannot act on.
 */
const numeric = () =>
  Transform(({ value }) => (value === '' || value === null || value === undefined ? undefined : Number(value)));

const numericInt = () => numeric();

export class CreateProductDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  name: string;

  @IsOptional()
  @IsString()
  @MaxLength(220)
  slug?: string;

  @numericInt()
  @IsInt()
  @Min(1)
  category_id: number;

  @IsOptional()
  @numericInt()
  @IsInt()
  @Min(1)
  brand_id?: number;

  @IsString()
  @IsNotEmpty()
  description: string;

  @numeric()
  @IsNumber()
  @Min(0)
  base_price: number;

  @IsOptional()
  @numeric()
  @IsNumber()
  @Min(0)
  weight_grams?: number;

  @IsOptional()
  @IsIn(['fixed', 'percentage', 'none'])
  discount_type?: string;

  @IsOptional()
  @numeric()
  @IsNumber()
  @Min(0)
  discount_value?: number;

  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => WarrantyComponentDto)
  warranty_components?: WarrantyComponentDto[];

  @IsOptional()
  @IsString()
  @MaxLength(100)
  country_of_origin?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  serial_number?: string;

  @IsOptional()
  @IsBoolean()
  emi_available?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  product_video_url?: string;

  @IsOptional()
  @IsObject()
  specifications_json?: Record<string, unknown>;

  @IsIn(['active', 'inactive', 'archived'])
  status: string;

  @IsOptional()
  @IsBoolean()
  is_featured?: boolean;

  @IsOptional()
  @numericInt()
  @IsInt()
  @Min(0)
  low_stock_threshold?: number;

  @IsOptional()
  @numericInt()
  @IsInt()
  @Min(1)
  lifecycle_months?: number;
}

export class UpdateProductSeoDto {
  // Matches the shared `seo_meta` row and the admin's SEO form: `keywords` is a
  // free-text field and `indexable` is the inverse of a "no_index" flag, so the
  // column names have to match the form exactly.
  @IsOptional()
  @IsString()
  meta_title?: string;

  @IsOptional()
  @IsString()
  meta_description?: string;

  @IsOptional()
  @IsString()
  og_image_url?: string;

  @IsOptional()
  @IsString()
  keywords?: string;

  @IsOptional()
  @IsBoolean()
  indexable?: boolean;
}

export class ToggleFeaturedDto {
  // The admin sends the target state explicitly. A server-side toggle would flip
  // the wrong product if the request were retried or replayed.
  @Transform(({ value }) => value === true || value === 'true' || value === 1 || value === '1')
  @IsBoolean()
  is_featured: boolean;
}

export class CreateBrandDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  name: string;

  @IsOptional()
  @IsString()
  @MaxLength(220)
  slug?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  logo_url?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  website_url?: string;

  @IsOptional()
  @IsIn(['active', 'inactive'])
  status?: string;
}

export class CreateCategoryDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  name: string;

  @IsOptional()
  @IsString()
  @MaxLength(220)
  slug?: string;

  @IsOptional()
  @IsString()
  description?: string;

  // The category modals upload the image through `/upload/*` first and then post
  // the resulting URL here, so the column is written by the create/update call.
  @IsOptional()
  @IsString()
  @MaxLength(500)
  image_url?: string | null;

  @IsOptional()
  @numericInt()
  @IsInt()
  parent_id?: number;

  @IsOptional()
  @IsIn(['active', 'inactive', 'archived'])
  status?: string;
}

export class CreateCategoryAttributeDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  name: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  unit?: string;

  @IsOptional()
  @IsBoolean()
  is_filterable?: boolean;

  @IsOptional()
  @numericInt()
  @IsInt()
  @Min(0)
  sort_order?: number;
}

export class ProductQueryDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @numericInt()
  @IsInt()
  categoryId?: number;

  @IsOptional()
  @numericInt()
  @IsInt()
  brandId?: number;

  /**
   * Storefront filters, keyed by slug because that is what the public URLs carry
   * (`/products?category=audio,wearables`). Comma-separated to match the
   * multi-select filter UI; the `categoryId` / `brandId` above stay for the
   * admin panel, which addresses rows by primary key.
   */
  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsString()
  brand?: string;

  @IsOptional()
  @numeric()
  @IsNumber()
  @Min(0)
  minPrice?: number;

  @IsOptional()
  @numeric()
  @IsNumber()
  @Min(0)
  maxPrice?: number;

  // Query strings carry "true"/"false"; implicit conversion alone leaves them as
  // truthy strings, so `?isFeatured=false` would filter on featured products.
  @IsOptional()
  @Transform(({ value }) => value === true || value === 'true' || value === 1 || value === '1')
  @IsBoolean()
  isFeatured?: boolean;

  /**
   * A JSON object such as `{ "Colour": "Black", "Warranty": "2 years" }`,
   * matched with jsonb containment so every listed pair must be present.
   */
  @IsOptional()
  @IsString()
  @MaxLength(4000)
  specifications?: string;

  @IsOptional()
  @IsString()
  status?: string;

  // Restricted to a known set: this reaches an ORDER BY, so a free-form column
  // name would be an injection vector.
  @IsOptional()
  @IsIn(['name', 'created_at', 'base_price', 'updated_at'])
  sortBy?: string;

  @IsOptional()
  @IsIn(['asc', 'desc'])
  sortOrder?: string;

  /**
   * Storefront sort, for the three options the catalogue UI offers. A closed
   * enum for the same reason `sortBy` is: this reaches an ORDER BY.
   */
  @IsOptional()
  @IsIn(['newest', 'price_asc', 'price_desc'])
  sort?: string;

  @IsOptional()
  @numericInt()
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @numericInt()
  @IsInt()
  @Min(1)
  limit?: number;
}

/**
 * The storefront's `/client/products` query.
 *
 * `status` is omitted on purpose. `whitelist: true` strips the property before it
 * reaches the service, so an anonymous caller cannot ask for unpublished rows -
 * without this, `?status=archived` would happily list them.
 */
export class ClientProductQueryDto extends OmitType(ProductQueryDto, ['status'] as const) {}
