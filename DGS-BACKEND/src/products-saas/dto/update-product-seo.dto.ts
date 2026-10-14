import { PickType } from '@nestjs/swagger';
import { CreateProductSaasDto } from './product-saas.dto';

export class UpdateProductSeoDto extends PickType(CreateProductSaasDto, [
  'meta_title',
  'meta_description',
  'keywords',
  'canonical_url',
  'custom_og_image',
  'no_index',
  'no_follow',
] as const) {}
