import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WhyChooseUs } from './entities/why-choose-us.entity';
import { CreateWhyChooseUsDto } from './dto/create-why-choose-us.dto';
import { UpdateWhyChooseUsDto } from './dto/update-why-choose-us.dto';
import { QueryWhyChooseUsDto } from './dto/query-why-choose-us.dto';
import { ReorderItemDto } from './dto/reorder-why-choose-us.dto';

import { SiteSetting } from '../site-settings/entities/site-setting.entity';
import { UpdateWhyChooseUsMetricsDto } from './dto/why-choose-us-metrics.dto';
import { CloudinaryService } from '../upload/cloudinary.service';

const MAX_ACTIVE_COUNT = 3;

export const DEFAULT_WHY_CHOOSE_US_METRICS = {
  metric1: {
    value: '0',
    label: 'Completed Projects',
    subtitle: 'Residential, Commercial & Industrial',
  },
  metric2: {
    value: '0',
    label: 'Years Experience',
    subtitle: 'Excellence Since 2009',
  },
  metric3: {
    value: '0%',
    label: 'Safety Record',
    subtitle: 'Zero Critical Accident Incident',
  },
  metric4: {
    value: '0',
    label: 'Restaurants & Food Courts',
    subtitle: 'Commercial Kitchen Networks',
  },
};

@Injectable()
export class WhyChooseUsService {
  constructor(
    @InjectRepository(WhyChooseUs)
    private readonly repo: Repository<WhyChooseUs>,
    @InjectRepository(SiteSetting)
    private readonly siteSettingRepo: Repository<SiteSetting>,
    private readonly cloudinary: CloudinaryService,
  ) {}

  private extractCloudinaryPublicId(url?: string | null): string | null {
    if (!url || !url.includes('cloudinary.com')) return null;
    try {
      const parts = url.split('/upload/');
      if (parts.length < 2) return null;
      let path = parts[1];
      path = path.replace(/^v\d+\//, '');
      path = path.split('?')[0].split('#')[0];
      const lastDot = path.lastIndexOf('.');
      if (lastDot > 0) {
        path = path.substring(0, lastDot);
      }
      return path || null;
    } catch {
      return null;
    }
  }

  private async tryDeleteCloudinaryImage(url?: string | null): Promise<void> {
    const publicId = this.extractCloudinaryPublicId(url);
    if (!publicId) return;
    try {
      await this.cloudinary.deleteFile(publicId);
    } catch {
      // Non-blocking catch so asset cleanup doesn't abort DB update
    }
  }

  async countActive(): Promise<number> {
    return this.repo.count({
      where: { is_active: true, is_deleted: false },
    });
  }

  async getStats() {
    const [total, active] = await Promise.all([
      this.repo.count({ where: { is_deleted: false } }),
      this.repo.count({ where: { is_active: true, is_deleted: false } }),
    ]);

    return {
      total,
      active,
      inactive: Math.max(0, total - active),
      maxActiveCount: MAX_ACTIVE_COUNT,
      requiredActiveCount: MAX_ACTIVE_COUNT,
    };
  }

  async findAllPublic(): Promise<WhyChooseUs[]> {
    return this.repo.find({
      where: { is_active: true, is_deleted: false },
      order: { display_order: 'ASC', id: 'ASC' },
      take: 20,
    });
  }

  async findAll(query: QueryWhyChooseUsDto) {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 20;
    const skip = (page - 1) * limit;

    const qb = this.repo
      .createQueryBuilder('item')
      .where('item.is_deleted = false');

    if (query.search?.trim()) {
      qb.andWhere(
        '(LOWER(item.title) LIKE :search OR LOWER(item.description) LIKE :search)',
        { search: `%${query.search.trim().toLowerCase()}%` },
      );
    }

    if (query.status === 'active') {
      qb.andWhere('item.is_active = true');
    } else if (query.status === 'inactive') {
      qb.andWhere('item.is_active = false');
    }

    const sortCol =
      query.sortBy === 'created_at'
        ? 'item.created_at'
        : query.sortBy === 'title'
        ? 'item.title'
        : 'item.display_order';
    const sortDir = (query.sortOrder || 'ASC').toUpperCase() === 'DESC' ? 'DESC' : 'ASC';

    qb.orderBy(sortCol, sortDir).addOrderBy('item.id', 'ASC');

    const [data, total] = await qb.skip(skip).take(limit).getManyAndCount();

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  async findOne(id: number): Promise<WhyChooseUs> {
    const item = await this.repo.findOne({
      where: { id, is_deleted: false },
    });
    if (!item) {
      throw new NotFoundException(`Why Choose Us item with ID ${id} not found`);
    }
    return item;
  }

  async create(dto: CreateWhyChooseUsDto): Promise<WhyChooseUs> {
    const activeCount = await this.countActive();
    const wantsActive = dto.is_active !== undefined ? dto.is_active : activeCount < MAX_ACTIVE_COUNT;

    if (wantsActive && activeCount >= MAX_ACTIVE_COUNT) {
      throw new BadRequestException(
        `At most ${MAX_ACTIVE_COUNT} items can be active at a time. Please create as inactive or deactivate another item first.`,
      );
    }

    let displayOrder = dto.display_order;
    if (displayOrder === undefined) {
      const highest = await this.repo
        .createQueryBuilder('item')
        .select('MAX(item.display_order)', 'max')
        .where('item.is_deleted = false')
        .getRawOne();
      displayOrder = (highest?.max ?? -1) + 1;
    }

    const item = this.repo.create({
      title: dto.title.trim(),
      description: dto.description.trim(),
      image_url: dto.image_url?.trim() || null,
      icon_url: dto.icon_url?.trim() || null,
      icon_color: dto.icon_color?.trim() || null,
      badge_color: dto.badge_color?.trim() || null,
      icon_name: dto.icon_name?.trim() || null,
      display_order: displayOrder,
      is_active: wantsActive,
    });

    return this.repo.save(item);
  }

  async update(id: number, dto: UpdateWhyChooseUsDto): Promise<WhyChooseUs> {
    const item = await this.findOne(id);

    if (dto.is_active !== undefined && dto.is_active && !item.is_active) {
      const activeCount = await this.countActive();
      if (activeCount >= MAX_ACTIVE_COUNT) {
        throw new BadRequestException(
          `At most ${MAX_ACTIVE_COUNT} items can be active at a time. Deactivate an active item first before activating this one.`,
        );
      }
    }

    const oldImage = item.image_url || item.icon_url;
    const newImage =
      dto.image_url !== undefined
        ? dto.image_url
        : dto.icon_url !== undefined
        ? dto.icon_url
        : oldImage;

    if (oldImage && (newImage === null || (newImage && newImage !== oldImage))) {
      await this.tryDeleteCloudinaryImage(oldImage);
    }

    Object.assign(item, {
      ...(dto.title !== undefined ? { title: dto.title.trim() } : {}),
      ...(dto.description !== undefined ? { description: dto.description.trim() } : {}),
      ...(dto.image_url !== undefined ? { image_url: dto.image_url?.trim() || null } : {}),
      ...(dto.icon_url !== undefined ? { icon_url: dto.icon_url?.trim() || null } : {}),
      ...(dto.icon_color !== undefined ? { icon_color: dto.icon_color?.trim() || null } : {}),
      ...(dto.badge_color !== undefined ? { badge_color: dto.badge_color?.trim() || null } : {}),
      ...(dto.icon_name !== undefined ? { icon_name: dto.icon_name?.trim() || null } : {}),
      ...(dto.display_order !== undefined ? { display_order: dto.display_order } : {}),
      ...(dto.is_active !== undefined ? { is_active: dto.is_active } : {}),
    });

    return this.repo.save(item);
  }

  async toggleStatus(id: number, isActive: boolean): Promise<WhyChooseUs> {
    return this.update(id, { is_active: isActive });
  }

  async remove(id: number): Promise<WhyChooseUs> {
    const item = await this.findOne(id);

    const oldImage = item.image_url || item.icon_url;
    if (oldImage) {
      await this.tryDeleteCloudinaryImage(oldImage);
    }

    item.is_deleted = true;
    item.is_active = false;
    return this.repo.save(item);
  }

  async reorder(order: ReorderItemDto[]): Promise<void> {
    if (!order || order.length === 0) return;

    await this.repo.manager.transaction(async (em) => {
      for (const item of order) {
        await em.update(WhyChooseUs, { id: item.id }, { display_order: item.display_order });
      }
    });
  }

  async getMetrics() {
    const setting = await this.siteSettingRepo.findOne({
      where: { key: 'why_choose_us_metrics' },
    });
    if (!setting || !setting.value) {
      return DEFAULT_WHY_CHOOSE_US_METRICS;
    }
    try {
      const parsed = JSON.parse(setting.value);
      return {
        metric1: {
          value: parsed?.metric1?.value || DEFAULT_WHY_CHOOSE_US_METRICS.metric1.value,
          label: parsed?.metric1?.label || DEFAULT_WHY_CHOOSE_US_METRICS.metric1.label,
          subtitle: parsed?.metric1?.subtitle || DEFAULT_WHY_CHOOSE_US_METRICS.metric1.subtitle,
        },
        metric2: {
          value: parsed?.metric2?.value || DEFAULT_WHY_CHOOSE_US_METRICS.metric2.value,
          label: parsed?.metric2?.label || DEFAULT_WHY_CHOOSE_US_METRICS.metric2.label,
          subtitle: parsed?.metric2?.subtitle || DEFAULT_WHY_CHOOSE_US_METRICS.metric2.subtitle,
        },
        metric3: {
          value: parsed?.metric3?.value || DEFAULT_WHY_CHOOSE_US_METRICS.metric3.value,
          label: parsed?.metric3?.label || DEFAULT_WHY_CHOOSE_US_METRICS.metric3.label,
          subtitle: parsed?.metric3?.subtitle || DEFAULT_WHY_CHOOSE_US_METRICS.metric3.subtitle,
        },
        metric4: {
          value: parsed?.metric4?.value || DEFAULT_WHY_CHOOSE_US_METRICS.metric4.value,
          label: parsed?.metric4?.label || DEFAULT_WHY_CHOOSE_US_METRICS.metric4.label,
          subtitle: parsed?.metric4?.subtitle || DEFAULT_WHY_CHOOSE_US_METRICS.metric4.subtitle,
        },
      };
    } catch {
      return DEFAULT_WHY_CHOOSE_US_METRICS;
    }
  }

  async updateMetrics(dto: UpdateWhyChooseUsMetricsDto) {
    const sanitizeValue = (val: string | undefined, fallback: string): string => {
      const target = val !== undefined ? val : fallback;
      if (target.includes('-') || (parseFloat(target) < 0 && !isNaN(parseFloat(target)))) {
        throw new BadRequestException(
          'Metric values cannot be negative. Only positive values or 0 are allowed.',
        );
      }
      return target.trim();
    };

    const current = await this.getMetrics();
    const merged = {
      metric1: {
        value: sanitizeValue(dto?.metric1?.value, current.metric1.value),
        label: dto?.metric1?.label !== undefined ? dto.metric1.label.trim() : current.metric1.label,
        subtitle: dto?.metric1?.subtitle !== undefined ? dto.metric1.subtitle.trim() : current.metric1.subtitle,
      },
      metric2: {
        value: sanitizeValue(dto?.metric2?.value, current.metric2.value),
        label: dto?.metric2?.label !== undefined ? dto.metric2.label.trim() : current.metric2.label,
        subtitle: dto?.metric2?.subtitle !== undefined ? dto.metric2.subtitle.trim() : current.metric2.subtitle,
      },
      metric3: {
        value: sanitizeValue(dto?.metric3?.value, current.metric3.value),
        label: dto?.metric3?.label !== undefined ? dto.metric3.label.trim() : current.metric3.label,
        subtitle: dto?.metric3?.subtitle !== undefined ? dto.metric3.subtitle.trim() : current.metric3.subtitle,
      },
      metric4: {
        value: sanitizeValue(dto?.metric4?.value, current.metric4.value),
        label: dto?.metric4?.label !== undefined ? dto.metric4.label.trim() : current.metric4.label,
        subtitle: dto?.metric4?.subtitle !== undefined ? dto.metric4.subtitle.trim() : current.metric4.subtitle,
      },
    };

    let setting = await this.siteSettingRepo.findOne({
      where: { key: 'why_choose_us_metrics' },
    });
    if (!setting) {
      setting = this.siteSettingRepo.create({
        key: 'why_choose_us_metrics',
        value: JSON.stringify(merged),
      });
    } else {
      setting.value = JSON.stringify(merged);
    }
    await this.siteSettingRepo.save(setting);
    return merged;
  }
}
