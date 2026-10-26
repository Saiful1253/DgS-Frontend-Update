import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Portfolio } from './entities/portfolio.entity';
import { PortfolioChallenge } from './entities/portfolio-challenge.entity';
import { PortfolioPricingTier } from './entities/portfolio-pricing-tier.entity';
import { PortfolioCategory } from './entities/portfolio-category.entity';

const DEFAULT_CATEGORIES = [
  'Software & Cloud',
  'Software Engineering',
  'Creative & Post-Production',
  'Marketing & Growth',
  'Mobile Apps & Platforms',
  'AI & Automation',
  'FinTech & Web3',
];

@Injectable()
export class PortfolioService {
  constructor(
    @InjectRepository(Portfolio)
    private portfolioRepo: Repository<Portfolio>,
    @InjectRepository(PortfolioChallenge)
    private challengeRepo: Repository<PortfolioChallenge>,
    @InjectRepository(PortfolioPricingTier)
    private tierRepo: Repository<PortfolioPricingTier>,
    @InjectRepository(PortfolioCategory)
    private categoryRepo: Repository<PortfolioCategory>,
  ) {}

  async findAll(
    category?: string,
    search?: string,
    featuredOnly?: boolean,
    page?: number,
    limit?: number,
    status?: string,
    projectType?: string,
    district?: string,
    area?: string,
  ) {
    const qb = this.portfolioRepo.createQueryBuilder('p')
      .leftJoinAndSelect('p.challenges', 'c')
      .leftJoinAndSelect('p.pricing_tiers', 't')
      .orderBy('p.created_at', 'DESC')
      .addOrderBy('c.sort_order', 'ASC')
      .addOrderBy('t.sort_order', 'ASC');

    if (category && category !== 'All Projects') {
      qb.andWhere('p.category ILIKE :category', { category: `%${category}%` });
    }

    if (featuredOnly) {
      qb.andWhere('p.is_featured = true');
    }

    if (search) {
      qb.andWhere('(p.project_name ILIKE :s OR p.primary_challenge ILIKE :s OR p.primary_solution ILIKE :s)', { s: `%${search}%` });
    }

    if (status) {
      qb.andWhere('p.project_status = :status', { status });
    }

    if (projectType) {
      qb.andWhere('p.project_type = :projectType', { projectType });
    }

    if (district) {
      qb.andWhere('p.district ILIKE :district', { district: `%${district}%` });
    }

    if (area) {
      qb.andWhere('p.area ILIKE :area', { area: `%${area}%` });
    }

    // Always return the paginated envelope (spec §7.4). This previously
    // returned a bare array when `page`/`limit` were absent, so the response
    // shape depended on whether the caller supplied query params — which is
    // why the frontend had to accept both.
    const currentPage = page ?? 1;
    const currentLimit = limit ?? 20;
    const [data, total] = await qb
      .skip((currentPage - 1) * currentLimit)
      .take(currentLimit)
      .getManyAndCount();

    return {
      data,
      total,
      page: currentPage,
      limit: currentLimit,
      totalPages: Math.ceil(total / currentLimit),
    };
  }

  async findBySlug(slug: string) {
    const item = await this.portfolioRepo.findOne({
      where: { slug },
      relations: ['challenges', 'pricing_tiers'],
      order: {
        challenges: { sort_order: 'ASC' },
        pricing_tiers: { sort_order: 'ASC' },
      },
    });
    if (!item) {
      throw new NotFoundException(`Portfolio item with slug "${slug}" not found`);
    }
    return item;
  }

  /**
   * Public read model for the client panel.
   *
   * Returns the authoritative category list alongside the projects rather than
   * letting the page infer it from the rows it receives, so a category with no
   * published work still appears as a tab.
   *
   * Unlike `findAll` this does not paginate: the public grid filters and
   * searches client-side against the full set, so truncating here would make
   * an empty-looking tab indistinguishable from an exhausted one.
   */
  async findAllPublic(
    category?: string,
    search?: string,
    featuredOnly = false,
    page?: number,
    limit?: number,
    status?: string,
    projectType?: string,
  ) {
    const qb = this.portfolioRepo
      .createQueryBuilder('p')
      .leftJoinAndSelect('p.challenges', 'c')
      .leftJoinAndSelect('p.pricing_tiers', 't')
      .orderBy('p.created_at', 'DESC')
      .addOrderBy('c.sort_order', 'ASC')
      .addOrderBy('t.sort_order', 'ASC');

    if (category && category !== 'All Projects') {
      qb.andWhere('p.category ILIKE :category', { category: `%${category}%` });
    }

    if (featuredOnly) {
      qb.andWhere('p.is_featured = true');
    }

    if (search) {
      // SRS §4.1 — search targets name, challenge, solution, and tags.
      // `tags` is a text[] column, so ILIKE ANY covers the array elements.
      qb.andWhere(
        `(p.project_name ILIKE :s
          OR p.primary_challenge ILIKE :s
          OR p.primary_solution ILIKE :s
          OR p.description ILIKE :s
          OR p.address ILIKE :s
          OR EXISTS (SELECT 1 FROM unnest(p.tags) AS tag WHERE tag ILIKE :s))`,
        { s: `%${search}%` },
      );
    }

    if (status) {
      qb.andWhere('p.project_status = :status', { status });
    }

    if (projectType) {
      qb.andWhere('p.project_type = :projectType', { projectType });
    }

    const currentPage = page ?? 1;
    const currentLimit = limit ?? (featuredOnly ? 8 : 20);
    const [projects, total] = await qb
      .skip((currentPage - 1) * currentLimit)
      .take(currentLimit)
      .getManyAndCount();

    // portfolio_categories has no soft-delete column, so this is the full set.
    // `p.slug` is the column name on the alias `p`, not the entity property.
    const categories = await this.categoryRepo
      .createQueryBuilder('c')
      .select('c.name', 'name')
      .orderBy('c.name', 'ASC')
      .getRawMany<{ name: string }>()
      .then((rows) => rows.map((r) => r.name));

    // Fall back to the seed list when no categories have been created yet, so
    // the public tab bar is never empty on a fresh install.
    return {
      projects,
      data: projects,
      categories: categories.length > 0 ? categories : DEFAULT_CATEGORIES,
      meta: {
        total,
        page: currentPage,
        limit: currentLimit,
        totalPages: Math.ceil(total / currentLimit),
      },
    };
  }

  /** Public single-project read. Throws 404 for unpublished/unknown slugs. */
  async findOnePublic(slug: string) {
    return this.findBySlug(slug);
  }

  async getLocations() {
    const locations = await this.portfolioRepo
      .createQueryBuilder('p')
      .select([
        'p.id AS id',
        'p.project_name AS project_name',
        'p.slug AS slug',
        'p.address AS address',
        'p.latitude AS latitude',
        'p.longitude AS longitude',
        'p.project_status AS project_status',
        'p.project_type AS project_type',
        'p.is_featured AS is_featured',
      ])
      .where("p.address IS NOT NULL AND p.address <> ''")
      .andWhere('p.latitude IS NOT NULL')
      .andWhere('p.longitude IS NOT NULL')
      .orderBy('p.created_at', 'DESC')
      .getRawMany();

    return locations.map((loc) => ({
      id: Number(loc.id),
      project_name: loc.project_name,
      slug: loc.slug,
      address: loc.address,
      latitude: loc.latitude !== null ? Number(loc.latitude) : null,
      longitude: loc.longitude !== null ? Number(loc.longitude) : null,
      project_status: loc.project_status,
      project_type: loc.project_type,
      is_featured: loc.is_featured,
    }));
  }

  /**
   * Slug + timestamp projection for the public sitemap. Selects two columns
   * rather than reusing `findAllPublic`, which joins challenges and pricing
   * tiers for every row.
   */
  async findPublicSlugs() {
    // Explicit aliases: a dotted select list returns raw keys prefixed with the
    // alias (`p_slug`), which is not the shape the sitemap consumer expects.
    return this.portfolioRepo
      .createQueryBuilder('p')
      .select('p.slug', 'slug')
      .addSelect('p.updated_at', 'updated_at')
      .orderBy('p.updated_at', 'DESC')
      .getRawMany<{ slug: string; updated_at: Date }>();
  }

  async create(data: any) {
    const { challenges, pricing_tiers, ...portfolioData } = data;
    const item = this.portfolioRepo.create(portfolioData as Partial<Portfolio>);
    const saved = await this.portfolioRepo.save(item);

    if (challenges && Array.isArray(challenges) && challenges.length > 0) {
      const challengeEntities = this.challengeRepo.create(
        challenges.map((c: any, index: number) => ({
          ...c,
          portfolio_id: saved.id,
          sort_order: c.sort_order ?? index + 1,
        })),
      );
      await this.challengeRepo.save(challengeEntities);
    }

    return this.portfolioRepo.findOne({
      where: { id: saved.id },
      relations: ['challenges', 'pricing_tiers'],
    });
  }

  async update(id: number, data: any) {
    const existing = await this.portfolioRepo.findOne({
      where: { id },
      relations: ['challenges', 'pricing_tiers'],
    });
    if (!existing) throw new NotFoundException('Portfolio item not found');

    const { challenges, pricing_tiers, ...portfolioData } = data;
    Object.assign(existing, portfolioData);
    await this.portfolioRepo.save(existing);

    if (Array.isArray(challenges)) {
      await this.syncChildren(this.challengeRepo, existing.challenges, challenges, id);
    }

    if (Array.isArray(pricing_tiers)) {
      await this.syncChildren(this.tierRepo, existing.pricing_tiers, pricing_tiers, id);
    }

    return this.portfolioRepo.findOne({
      where: { id },
      relations: ['challenges', 'pricing_tiers'],
    });
  }

  /**
   * Reconcile a child collection by diffing instead of delete-then-recreate.
   *
   * The previous implementation removed every row and reinserted, which churned
   * primary keys on each save: any external reference to a challenge or pricing
   * tier id silently detached, and audit/ordering by id was reset. Rows that
   * arrive with an `id` belonging to this parent are updated in place; rows
   * without one are inserted; rows the client omitted are deleted.
   */
  private async syncChildren<T extends { id: number }>(
    repo: Repository<T>,
    existingRows: T[],
    incoming: any[],
    portfolioId: number,
  ): Promise<void> {
    const incomingIds = new Set<number>();

    for (const [index, row] of incoming.entries()) {
      const current = existingRows.find((e) => e.id === row.id);

      if (current) {
        incomingIds.add(current.id);
        const { id, portfolio_id, ...changes } = row;
        Object.assign(current, changes, { sort_order: row.sort_order ?? index + 1 });
        await repo.save(current);
      } else {
        const created = repo.create({
          ...row,
          portfolio_id: portfolioId,
          sort_order: row.sort_order ?? index + 1,
        });
        // `create` with an array input is typed as returning an array, so
        // narrow to the single row before reading its generated id.
        const saved = (await repo.save(created)) as unknown as T;
        incomingIds.add(saved.id);
      }
    }

    const removed = existingRows.filter((e) => !incomingIds.has(e.id));
    if (removed.length > 0) {
      await repo.remove(removed);
    }
  }

  async remove(id: number) {
    const item = await this.portfolioRepo.findOneBy({ id });
    if (!item) throw new NotFoundException('Portfolio item not found');
    await this.challengeRepo.delete({ portfolio_id: id });
    await this.portfolioRepo.remove(item);
    return { success: true };
  }

  // --- Portfolio Category Management ---

  async findAllCategories(page = 1, limit = 20) {
    const safePage = Math.max(1, Math.floor(Number(page) || 1));
    const safeLimit = Math.min(Math.max(1, Math.floor(Number(limit) || 20)), 100);

    // Auto-seed default categories if database table is empty
    const currentTotal = await this.categoryRepo.count();
    if (currentTotal === 0) {
      const toSeed = DEFAULT_CATEGORIES.map((name) =>
        this.categoryRepo.create({
          name,
          slug: name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, ''),
        }),
      );
      await this.categoryRepo.save(toSeed);
    }

    const [data, total] = await this.categoryRepo.findAndCount({
      order: { created_at: 'DESC' },
      skip: (safePage - 1) * safeLimit,
      take: safeLimit,
    });

    return {
      data,
      meta: {
        total,
        page: safePage,
        limit: safeLimit,
        totalPages: Math.ceil(total / safeLimit),
      },
    };
  }

  async createCategory(name: string) {
    const trimmed = name.trim();
    const slug = trimmed.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
    const category = this.categoryRepo.create({ name: trimmed, slug });
    return this.categoryRepo.save(category);
  }

  async updateCategory(id: number, name: string) {
    const category = await this.categoryRepo.findOneBy({ id });
    if (!category) throw new NotFoundException('Category not found');

    const trimmed = name.trim();
    category.name = trimmed;
    category.slug = trimmed.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
    return this.categoryRepo.save(category);
  }

  async deleteCategory(id: number) {
    const category = await this.categoryRepo.findOneBy({ id });
    if (!category) throw new NotFoundException('Category not found');
    await this.categoryRepo.remove(category);
    return { success: true };
  }
}
