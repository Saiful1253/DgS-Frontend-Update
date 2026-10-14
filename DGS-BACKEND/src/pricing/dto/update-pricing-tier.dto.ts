import { PartialType } from '@nestjs/swagger';
import { CreatePricingTierDto } from './pricing-tier.dto';

export class UpdatePricingTierDto extends PartialType(CreatePricingTierDto) {}
