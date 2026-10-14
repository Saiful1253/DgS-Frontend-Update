import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PricingTier } from './entities/pricing-tier.entity';
import { ComparisonBlock } from './entities/comparison-block.entity';
import { ComparisonRow } from './entities/comparison-row.entity';
import { PricingService } from './pricing.service';
import { PricingController } from './pricing.controller';

@Module({
  imports: [TypeOrmModule.forFeature([PricingTier, ComparisonBlock, ComparisonRow])],
  controllers: [PricingController],
  providers: [PricingService],
  exports: [PricingService],
})
export class PricingModule {}