import { PartialType } from '@nestjs/swagger';
import { CreateProductSaasDto } from './product-saas.dto';

export class UpdateProductSaasDto extends PartialType(CreateProductSaasDto) {}
