import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Testimonial } from './entities/testimonial.entity';
import { QueryTestimonialsDto } from './dto/query-testimonials.dto';

@Injectable()
export class TestimonialsService {
  constructor(
    @InjectRepository(Testimonial)
    private readonly repo: Repository<Testimonial>,
  ) { }

  async findAll(query: QueryTestimonialsDto = {}) {
    const qb = this.repo
      .createQueryBuilder('t')
      .where('t.is_deleted = false')
      .orderBy('t.is_featured', 'DESC')
      .addOrderBy('t.display_order', 'ASC');

    if (query.featuredOnly) {
      qb.andWhere('t.is_featured = true');
    }

    if (query.is_active !== undefined) {
      qb.andWhere('t.is_active = :is_active', { is_active: query.is_active });
    }

    if (query.source_platform) {
      qb.andWhere('t.source_platform = :source_platform', {
        source_platform: query.source_platform,
      });
    }

    if (query.search) {
      qb.andWhere(
        '(t.author_name ILIKE :q OR t.author_company ILIKE :q OR t.content ILIKE :q)',
        { q: `%${query.search}%` },
      );
    }

    const page = query.page ?? 1;
    const limit = query.limit ?? 50;
    qb.skip((page - 1) * limit).take(limit);

    return qb.getMany();
  }

  async findAllPublic() {
    return this.repo.find({
      where: { is_active: true, is_deleted: false },
      order: { is_featured: 'DESC', display_order: 'ASC' },
    });
  }

  async findOne(id: number) {
    const item = await this.repo.findOneBy({ id });
    if (!item || item.is_deleted) throw new NotFoundException('Testimonial not found');
    return item;
  }

  async create(data: Partial<Testimonial>) {
    const item = this.repo.create(data);
    return this.repo.save(item);
  }

  async update(id: number, data: Partial<Testimonial>) {
    const item = await this.findOne(id);
    Object.assign(item, data);
    return this.repo.save(item);
  }

  async remove(id: number) {
    const item = await this.findOne(id);
    item.is_deleted = true;
    await this.repo.save(item);
    return { success: true };
  }
}