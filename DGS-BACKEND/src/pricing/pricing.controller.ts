import { Controller, Get, Post, Put, Delete, Body, Param, ParseIntPipe } from '@nestjs/common';
import { PricingService } from './pricing.service';
import { CreatePricingTierDto } from './dto/pricing-tier.dto';
import { UpdatePricingTierDto } from './dto/update-pricing-tier.dto';
import { UpsertComparisonBlockDto } from './dto/comparison-block.dto';
import { UpdateComparisonBlockDto } from './dto/update-comparison-block.dto';
import { Public } from '../auth/decorators/public.decorator';

@Controller('pricing')
export class PricingController {
  constructor(private readonly service: PricingService) {}

  @Get(':ownerType/:ownerId')
  @Public()
  async getBundle(
    @Param('ownerType') ownerType: string,
    @Param('ownerId', ParseIntPipe) ownerId: number,
  ) {
    return this.service.getBundle(ownerType, ownerId);
  }

  @Post('tiers')
  async createTier(@Body() body: CreatePricingTierDto) {
    return this.service.createTier(body);
  }

  @Put('tiers/:id')
  async updateTier(@Param('id', ParseIntPipe) id: number, @Body() body: UpdatePricingTierDto) {
    return this.service.updateTier(id, body);
  }

  @Delete('tiers/:id')
  async deleteTier(@Param('id', ParseIntPipe) id: number) {
    return this.service.deleteTier(id);
  }

  @Post('comparison/:ownerType/:ownerId')
  async upsertComparison(
    @Param('ownerType') ownerType: string,
    @Param('ownerId', ParseIntPipe) ownerId: number,
    @Body() body: UpsertComparisonBlockDto,
  ) {
    return this.service.upsertComparisonBlock(ownerType, ownerId, body);
  }

  @Put('comparison/:id')
  async updateComparison(@Param('id', ParseIntPipe) id: number, @Body() body: UpdateComparisonBlockDto) {
    return this.service.updateComparisonBlock(id, body);
  }

  @Delete('comparison/:id')
  async deleteComparison(@Param('id', ParseIntPipe) id: number) {
    return this.service.deleteComparisonBlock(id);
  }
}