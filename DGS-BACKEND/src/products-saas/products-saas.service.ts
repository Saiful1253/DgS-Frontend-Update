import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProductSaas } from './entities/product-saas.entity';
import { CreateProductSaasDto } from './dto/product-saas.dto';
import { UpdateProductSaasDto } from './dto/update-product-saas.dto';

@Injectable()
export class ProductsSaasService {
  constructor(
    @InjectRepository(ProductSaas)
    private productRepo: Repository<ProductSaas>,
  ) {}

  async findAll(industry?: string, category?: string, search?: string) {
    const qb = this.productRepo.createQueryBuilder('p')
      .leftJoinAndSelect('p.modules', 'm')
      .orderBy('p.created_at', 'DESC')
      .addOrderBy('m.sort_order', 'ASC');

    if (category) {
      qb.andWhere('p.category ILIKE :category', { category: `%${category}%` });
    }

    if (search) {
      qb.andWhere('(p.product_name ILIKE :s OR p.primary_challenge ILIKE :s OR p.primary_solution ILIKE :s)', { s: `%${search}%` });
    }

    const items = await qb.getMany();

    if (industry && industry !== 'All Industries') {
      return items.filter(item => 
        item.industry_focus && item.industry_focus.some(i => i.toLowerCase().includes(industry.toLowerCase()))
      );
    }

    return items;
  }

  async findAllPublic() {
    const qb = this.productRepo.createQueryBuilder('p')
      .leftJoinAndSelect('p.modules', 'm')
      .orderBy('p.is_featured', 'DESC')
      .addOrderBy('p.created_at', 'DESC')
      .addOrderBy('m.sort_order', 'ASC');
    return qb.getMany();
  }

  /**
   * Slug + timestamp projection for the public sitemap.
   *
   * Deliberately selects two columns rather than reusing `findAllPublic`, which
   * joins every product module and returns full entities. A crawler asking for
   * a URL list should not pull the entire catalogue payload.
   */
  async findPublicSlugs() {
    // Raw results are keyed by the alias prefix (`p_slug`) when a select uses a
    // dotted path, so alias the columns explicitly rather than relying on
    // entity property names.
    return this.productRepo
      .createQueryBuilder('p')
      .select('p.slug', 'slug')
      .addSelect('p.updated_at', 'updated_at')
      .orderBy('p.updated_at', 'DESC')
      .getRawMany<{ slug: string; updated_at: Date }>();
  }

  async findBySlug(slug: string) {
    const item = await this.productRepo.findOne({
      where: { slug },
      relations: ['modules'],
      order: {
        modules: { sort_order: 'ASC' },
      },
    });
    if (!item) {
      throw new NotFoundException(`SaaS Product with slug "${slug}" not found`);
    }
    return item;
  }

  async create(data: CreateProductSaasDto) {
    const item = this.productRepo.create(data);
    return this.productRepo.save(item);
  }

  async update(id: number, data: UpdateProductSaasDto) {
    await this.productRepo.update(id, data);
    return this.productRepo.findOne({
      where: { id },
      relations: ['modules'],
    });
  }

  async remove(id: number) {
    const item = await this.productRepo.findOneBy({ id });
    if (!item) throw new NotFoundException('Product not found');
    await this.productRepo.remove(item);
    return { success: true };
  }
}
