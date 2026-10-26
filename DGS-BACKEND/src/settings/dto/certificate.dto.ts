import { Type } from 'class-transformer';
import {
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
  Min,
} from 'class-validator';

/**
 * Create payload for a certificate.
 *
 * English only. The storefront translates it into Bangla at runtime, so there
 * is no second language field to keep in step — a Bangla column alongside this
 * one produced records whose headline and body were in different languages.
 */
export class CreateCertificateDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsIn(['image', 'pdf'])
  @Type(() => String)
  file_type?: 'image' | 'pdf';

  /**
   * Optional. A certificate is registered with its authority and registration
   * number well before the scan exists, and the storefront publishes it either
   * way — with a "document on request" panel when there is nothing to open.
   */
  @IsOptional()
  @IsString()
  @MaxLength(500)
  file_url?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  thumb_url?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  reg_no?: string;

  /**
   * Icon key for the storefront, restricted to the map the client renders.
   *
   * Validated against the list rather than left open: an unrecognised key would
   * silently render a blank square on the storefront.
   */
  @IsOptional()
  @IsString()
  @MaxLength(500)
  category_icon?: string;

  /** One-line footer note under the card, e.g. "Verified & Active License". */
  @IsOptional()
  @IsString()
  @MaxLength(100)
  sub_label?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  issuing_authority?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1900)
  year?: number;

  @IsOptional()
  @IsUrl({ require_protocol: true })
  @MaxLength(500)
  verification_link?: string;

  @IsOptional()
  @Type(() => Boolean)
  is_featured?: boolean;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  display_order?: number;

  @IsOptional()
  @Type(() => Boolean)
  is_active?: boolean;
}