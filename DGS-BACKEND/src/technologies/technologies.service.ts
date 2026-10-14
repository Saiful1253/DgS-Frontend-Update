import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Technology } from '../settings/entities/technology.entity';
import { TechnologyCategory } from './entities/technology-category.entity';
import { CreateTechnologyDto } from '../settings/dto/technology.dto';
import { UpdateTechnologyDto } from '../settings/dto/update-technology.dto';

@Injectable()
export class TechnologiesService {
  constructor(
    @InjectRepository(Technology)
    private readonly techRepo: Repository<Technology>,
    @InjectRepository(TechnologyCategory)
    private readonly catRepo: Repository<TechnologyCategory>,
  ) {}

  // ── Technologies ──────────────────────────────────────────────────────────
  async findAll(category?: string, includeInactive = true) {
    const qb = this.techRepo.createQueryBuilder('t')
      .orderBy('t.display_order', 'ASC')
      .addOrderBy('t.name', 'ASC');

    if (!includeInactive) {
      qb.where('t.is_active = true');
    }

    if (category && category !== 'All') {
      // Exact match, case-insensitive. This was `ILIKE %category%`, which meant
      // filtering "Cloud" also returned "Cloud & DevOps" and filtering
      // "Marketing" returned "Digital Marketing" — the filter chips in the admin
      // are driven by these names, so a substring match silently mixes buckets.
      qb.andWhere('LOWER(t.category) = LOWER(:category)', { category });
    }

    return qb.getMany();
  }

  async findOne(id: number) {
    const tech = await this.techRepo.findOneBy({ id });
    if (!tech) throw new NotFoundException(`Technology #${id} not found`);
    return tech;
  }

  async create(data: CreateTechnologyDto) {
    const tech = this.techRepo.create(data);
    return this.techRepo.save(tech);
  }

  async update(id: number, data: UpdateTechnologyDto) {
    await this.techRepo.update(id, data);
    return this.findOne(id);
  }

  async reorder(order: { id: number; display_order: number }[]): Promise<boolean> {
    if (!order || !order.length) return true;
    const ids = order.map((o) => o.id);
    const uniqueIds = [...new Set(ids)];
    if (uniqueIds.length !== ids.length) {
      throw new BadRequestException('Duplicate ids in technology reorder payload');
    }
    return this.techRepo.manager.transaction(async (manager) => {
      for (const item of order) {
        await manager.update(Technology, { id: item.id }, {
          display_order: item.display_order,
        });
      }
      return true;
    });
  }

  async remove(id: number) {
    const res = await this.techRepo.delete(id);
    if (!res.affected) {
      throw new NotFoundException(`Technology #${id} not found`);
    }
    return { success: true, message: `Technology #${id} deleted successfully` };
  }

  // ── Categories (Dynamic like Portfolio Categories) ────────────────────────
  async findAllCategories(page = 1, limit = 100) {
    const take = Math.max(1, limit);
    const skip = (Math.max(1, page) - 1) * take;

    const [data, total] = await this.catRepo.findAndCount({
      order: { display_order: 'ASC', name: 'ASC' },
      skip,
      take,
    });

    return {
      data,
      meta: {
        total,
        page,
        limit: take,
        totalPages: Math.ceil(total / take) || 1,
      },
    };
  }

  async createCategory(name: string) {
    const trimmed = name.trim();
    if (!trimmed) throw new BadRequestException('Category name is required');

    const existing = await this.catRepo.findOne({ where: { name: trimmed } });
    if (existing) throw new ConflictException('Category with this name already exists');

    const cat = this.catRepo.create({ name: trimmed });
    return this.catRepo.save(cat);
  }

  async updateCategory(id: number, name: string) {
    const trimmed = name.trim();
    if (!trimmed) throw new BadRequestException('Category name is required');

    const cat = await this.catRepo.findOneBy({ id });
    if (!cat) throw new NotFoundException(`Category #${id} not found`);

    const existing = await this.catRepo.findOne({ where: { name: trimmed } });
    if (existing && existing.id !== id) {
      throw new ConflictException('Another category with this name already exists');
    }

    const oldName = cat.name;
    cat.name = trimmed;
    const updated = await this.catRepo.save(cat);

    // Also update any technologies tagged with old name
    if (oldName !== trimmed) {
      await this.techRepo
        .createQueryBuilder()
        .update(Technology)
        .set({ category: trimmed })
        .where('category = :oldName', { oldName })
        .execute();
    }

    return updated;
  }

  async deleteCategory(id: number) {
    const cat = await this.catRepo.findOneBy({ id });
    if (!cat) throw new NotFoundException(`Category #${id} not found`);

    // `Technology.category` is a plain string column, not a foreign key, so
    // deleting the row leaves every technology tagged with that name pointing
    // at a category that no longer exists. The admin filter chips are built
    // from these names, so the technologies vanish from the UI with no way to
    // recover them from there. Refuse the delete and report the blocking
    // technologies instead.
    const dependents = await this.techRepo.find({
      where: { category: cat.name },
      select: ['id', 'name'],
      order: { name: 'ASC' },
    });

    if (dependents.length) {
      const names = dependents.map((t) => `#${t.id} ${t.name}`).join(', ');
      throw new ConflictException(
        `Cannot delete category "${cat.name}": ${dependents.length} ` +
          `technolog${dependents.length === 1 ? 'y' : 'ies'} still use it (${names}). ` +
          'Reassign or delete them first.',
      );
    }

    await this.catRepo.delete(id);
    return { success: true, message: `Category "${cat.name}" deleted successfully` };
  }
}
