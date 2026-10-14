import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PricingTier } from './entities/pricing-tier.entity';
import { CreatePricingTierDto } from './dto/pricing-tier.dto';
import { UpdatePricingTierDto } from './dto/update-pricing-tier.dto';
import { ComparisonBlock } from './entities/comparison-block.entity';
import { ComparisonRow } from './entities/comparison-row.entity';

@Injectable()
export class PricingService {
  constructor(
    @InjectRepository(PricingTier)
    private tierRepo: Repository<PricingTier>,
    @InjectRepository(ComparisonBlock)
    private blockRepo: Repository<ComparisonBlock>,
    @InjectRepository(ComparisonRow)
    private rowRepo: Repository<ComparisonRow>,
  ) {}

  async getBundle(ownerType: string, ownerId: number) {
    const tiers = await this.tierRepo.find({
      where: { entity_type: ownerType, entity_id: ownerId },
      order: { display_order: 'ASC', id: 'ASC' },
    });
    const blocks = await this.blockRepo.find({
      where: { entity_type: ownerType, entity_id: ownerId },
      relations: ['rows'],
      order: { id: 'ASC' },
    });
    if (blocks.length > 0) {
      blocks.forEach((b) => {
        b.rows = (b.rows || []).sort((x, y) => x.display_order - y.display_order);
      });
    }
    return { pricing_tiers: tiers, comparison_blocks: blocks };
  }

  async createTier(data: CreatePricingTierDto) {
    if (!data.entity_type || !data.entity_id) {
      throw new NotFoundException('entity_type and entity_id are required');
    }
    const item = this.tierRepo.create(data);
    return this.tierRepo.save(item);
  }

  async updateTier(id: number, data: UpdatePricingTierDto) {
    const item = await this.tierRepo.findOneBy({ id });
    if (!item) throw new NotFoundException('Pricing tier not found');
    Object.assign(item, data);
    return this.tierRepo.save(item);
  }

  async deleteTier(id: number) {
    const item = await this.tierRepo.findOneBy({ id });
    if (!item) throw new NotFoundException('Pricing tier not found');
    await this.tierRepo.remove(item);
    return { success: true };
  }

  async upsertComparisonBlock(ownerType: string, ownerId: number, data: {
    enabled?: boolean;
    title?: string;
    subtitle?: string;
    rows?: { standard_approach?: string; our_approach?: string; display_order?: number }[];
  }) {
    let block = await this.blockRepo.findOne({
      where: { entity_type: ownerType, entity_id: ownerId },
      relations: ['rows'],
    });

    if (!block) {
      block = this.blockRepo.create({
        entity_type: ownerType,
        entity_id: ownerId,
        enabled: data.enabled ?? true,
        title: data.title ?? null,
        subtitle: data.subtitle ?? null,
      });
      block = await this.blockRepo.save(block);
    } else {
      if (data.enabled !== undefined) block.enabled = data.enabled;
      if (data.title !== undefined) block.title = data.title;
      if (data.subtitle !== undefined) block.subtitle = data.subtitle;
      block = await this.blockRepo.save(block);
    }

    if (data.rows !== undefined) {
      await this.rowRepo.delete({ comparison_block_id: block.id });
      const rows = (data.rows || []).map((r, idx) =>
        this.rowRepo.create({
          comparison_block_id: block.id,
          standard_approach: r.standard_approach,
          our_approach: r.our_approach,
          display_order: r.display_order ?? idx,
        }),
      );
      if (rows.length > 0) await this.rowRepo.save(rows);
    }

    return this.blockRepo.findOne({
      where: { id: block.id },
      relations: ['rows'],
    });
  }

  async updateComparisonBlock(id: number, data: {
    entity_type?: string;
    entity_id?: number;
    enabled?: boolean;
    title?: string;
    subtitle?: string;
    rows?: { standard_approach?: string; our_approach?: string; display_order?: number }[];
  }) {
    const block = await this.blockRepo.findOneBy({ id });
    if (!block) throw new NotFoundException('Comparison block not found');

    if (data.entity_type !== undefined) block.entity_type = data.entity_type;
    if (data.entity_id !== undefined) block.entity_id = data.entity_id;
    if (data.enabled !== undefined) block.enabled = data.enabled;
    if (data.title !== undefined) block.title = data.title;
    if (data.subtitle !== undefined) block.subtitle = data.subtitle;
    await this.blockRepo.save(block);

    if (data.rows !== undefined) {
      await this.rowRepo.delete({ comparison_block_id: block.id });
      const rows = (data.rows || []).map((r, idx) =>
        this.rowRepo.create({
          comparison_block_id: block.id,
          standard_approach: r.standard_approach,
          our_approach: r.our_approach,
          display_order: r.display_order ?? idx,
        }),
      );
      if (rows.length > 0) await this.rowRepo.save(rows);
    }

    return this.blockRepo.findOne({ where: { id: block.id }, relations: ['rows'] });
  }

  async deleteComparisonBlock(id: number) {
    const block = await this.blockRepo.findOneBy({ id });
    if (!block) throw new NotFoundException('Comparison block not found');
    await this.blockRepo.remove(block);
    return { success: true };
  }
}