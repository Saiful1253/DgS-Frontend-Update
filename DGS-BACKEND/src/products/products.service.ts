import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Product } from './entities/product.entity';
import { ProductImage } from './entities/product-image.entity';
import { ProductBrand } from './entities/product-brand.entity';
import { ProductCategory } from './entities/product-category.entity';
import { ProductCategoryAttribute } from './entities/product-category-attribute.entity';
import { SeoMeta } from '../seo/entities/seo-meta.entity';
import { CloudinaryService } from '../upload/cloudinary.service';
import {
  CreateProductDto,
  UpdateProductSeoDto,
  ProductQueryDto,
  ClientProductQueryDto,
  CreateBrandDto,
  CreateCategoryDto,
  CreateCategoryAttributeDto,
} from './dto/product.dto';

const cleanSlug = (str: string) =>
  str
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

/** Admin sort keys → qualified column names. Only these may be ordered by. */
const SORTABLE_COLUMNS: Record<string, string> = {
  name: 'p.name',
  created_at: 'p.created_at',
  updated_at: 'p.updated_at',
  base_price: 'p.base_price',
};

/** The storefront's three sort options, as a closed column/direction map. */
const STOREFRONT_SORT: Record<string, [string, 'ASC' | 'DESC']> = {
  newest: ['p.created_at', 'DESC'],
  price_asc: ['p.base_price', 'ASC'],
  price_desc: ['p.base_price', 'DESC'],
};

/**
 * Split a comma-separated slug filter, dropping blanks.
 *
 * An empty entry would become `IN ('')`, matching nothing and silently emptying
 * the catalogue, so the filter is skipped entirely when nothing valid is left.
 */
function splitSlugs(raw?: string): string[] {
  if (!raw) return [];
  return raw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 50);
}

/**
 * Parse the storefront's `specifications` param into a jsonb containment probe.
 *
 * Returns null for anything that is not a flat object of scalars, so a
 * malformed or hostile value narrows to "no spec filter" instead of reaching
 * the query. `{}` is treated as absent for the same reason - it would otherwise
 * match every row, including the ones with no `specifications_json` at all.
 */
function parseSpecFilter(raw?: string): Record<string, string | number | boolean> | null {
  if (!raw) return null;
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return null;
  }
  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) return null;

  const entries = Object.entries(parsed as Record<string, unknown>).filter(
    (entry): entry is [string, string | number | boolean] =>
      ['string', 'number', 'boolean'].includes(typeof entry[1]),
  );
  if (entries.length === 0) return null;
  return Object.fromEntries(entries);
}

/** The DTO's money columns, keyed as the entity expects them. */
const MONEY_KEYS = ['base_price', 'weight_grams', 'discount_value'] as const;

/**
 * `base_price` and friends are `numeric` columns, and pg returns those as
 * strings. A DTO carrying JSON numbers therefore has to be stringified before
 * it reaches `repo.create`, or TypeORM rejects the shape outright.
 *
 * The money keys are removed from the passthrough rather than merged over it:
 * a later spread of an index-signature type does not win against a property
 * already present, so `{ ...dto, ...{ base_price: '1' } }` would still type
 * `base_price` as a number.
 */
const splitMoney = <T extends Partial<CreateProductDto>>(
  dto: T,
): { rest: Omit<T, (typeof MONEY_KEYS)[number]>; money: Partial<Record<string, string>> } => {
  const rest = { ...dto } as Record<string, unknown>;
  const money: Record<string, string> = {};
  for (const key of MONEY_KEYS) {
    const value = dto[key];
    if (value === undefined) continue;
    money[key] = String(value);
    delete rest[key];
  }
  return { rest: rest as Omit<T, (typeof MONEY_KEYS)[number]>, money };
};

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private readonly productRepo: Repository<Product>,
    @InjectRepository(ProductImage)
    private readonly imageRepo: Repository<ProductImage>,
    @InjectRepository(ProductBrand)
    private readonly brandRepo: Repository<ProductBrand>,
    @InjectRepository(ProductCategory)
    private readonly categoryRepo: Repository<ProductCategory>,
    @InjectRepository(ProductCategoryAttribute)
    private readonly attributeRepo: Repository<ProductCategoryAttribute>,
    @InjectRepository(SeoMeta)
    private readonly seoRepo: Repository<SeoMeta>,
    private readonly cloudinary: CloudinaryService,
  ) {}

  // ── Products ──────────────────────────────────────────────────────────────

  /**
   * Paged product list with its relations eager-loaded.
   *
   * The admin's `ProductTable` renders each row's brand, category and gallery
   * inline, so a list without `relations` would emit one extra query per row and
   * show `undefined` for the labels.
   */
  async findAll(query: ProductQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;

    const qb = this.productRepo
      .createQueryBuilder('p')
      .leftJoinAndSelect('p.images', 'img')
      .leftJoinAndSelect('p.category', 'cat')
      .leftJoinAndSelect('p.brand', 'brand')
      .where('p.is_deleted = false')
      .skip((page - 1) * limit)
      .take(limit);

    if (query.search) {
      qb.andWhere('(p.name ILIKE :q OR p.description ILIKE :q)', { q: `%${query.search}%` });
    }
    if (query.categoryId) {
      qb.andWhere('p.category_id = :categoryId', { categoryId: query.categoryId });
    }
    if (query.brandId) {
      qb.andWhere('p.brand_id = :brandId', { brandId: query.brandId });
    }
    if (query.status && query.status !== 'all') {
      qb.andWhere('p.status = :status', { status: query.status });
    }

    // Slug filters: the storefront addresses catalogue rows by slug, and its
    // filter UI is multi-select, so `audio,wearables` means "either".
    const categorySlugs = splitSlugs(query.category);
    if (categorySlugs.length) {
      qb.andWhere('cat.slug IN (:...categorySlugs)', { categorySlugs });
    }
    const brandSlugs = splitSlugs(query.brand);
    if (brandSlugs.length) {
      qb.andWhere('brand.slug IN (:...brandSlugs)', { brandSlugs });
    }

    if (query.minPrice != null) {
      qb.andWhere('p.base_price >= :minPrice', { minPrice: query.minPrice });
    }
    if (query.maxPrice != null) {
      qb.andWhere('p.base_price <= :maxPrice', { maxPrice: query.maxPrice });
    }

    if (query.isFeatured != null) {
      qb.andWhere('p.is_featured = :isFeatured', { isFeatured: query.isFeatured });
    }

    const specFilter = parseSpecFilter(query.specifications);
    if (specFilter) {
      // jsonb containment: every listed pair must be present on the row. The
      // value is bound as a parameter, never interpolated into the SQL text.
      qb.andWhere('p.specifications_json @> :spec', { spec: specFilter });
    }

    // Precedence: the admin's explicit column wins, then the storefront enum,
    // then newest. Both are closed whitelists — a free-form name reaching an
    // ORDER BY is an injection vector.
    if (query.sortBy && SORTABLE_COLUMNS[query.sortBy]) {
      qb.orderBy(SORTABLE_COLUMNS[query.sortBy], query.sortOrder === 'asc' ? 'ASC' : 'DESC');
    } else if (STOREFRONT_SORT[query.sort ?? '']) {
      const [column, direction] = STOREFRONT_SORT[query.sort!];
      qb.orderBy(column, direction);
    } else {
      qb.orderBy('p.created_at', 'DESC');
    }

    const [data, total] = await qb.getManyAndCount();
    await this.attachSeo(data);
    return { data, total, page, limit, pages: Math.ceil(total / limit) };
  }

  /**
   * The storefront list: `findAll` pinned to `status = 'active'`.
   *
   * Kept as its own method rather than letting the caller pass a status, so the
   * published-only rule lives here and cannot be forgotten at a call site.
   */
  async findAllPublic(query: ClientProductQueryDto) {
    return this.findAll({ ...query, status: 'active' });
  }

  async findOne(id: number) {
    const product = await this.productRepo.findOne({
      where: { id, is_deleted: false },
      relations: ['images', 'category', 'brand'],
    });
    if (!product) throw new NotFoundException(`Product #${id} not found`);
    await this.attachSeo([product]);
    return product;
  }

  /**
   * One product by slug, for the storefront detail page.
   *
   * Scoped to `status = 'active'`: the public route reaches here without a JWT,
   * so an archived row must read as missing rather than as a 200.
   */
  async findBySlug(slug: string) {
    const product = await this.productRepo.findOne({
      where: { slug, is_deleted: false, status: 'active' },
      relations: ['images', 'category', 'brand'],
    });
    if (!product) throw new NotFoundException(`Product "${slug}" not found`);
    await this.attachSeo([product]);
    return product;
  }

  /**
   * Slug + timestamp projection for the public sitemap.
   *
   * Selects two columns rather than reusing `findAll`, which eager-loads every
   * product's gallery and relations: a crawler asking for a URL list should not
   * pull the whole catalogue payload. Same reasoning as the SaaS counterpart.
   */
  async findPublicSlugs() {
    return this.productRepo
      .createQueryBuilder('p')
      .select('p.slug', 'slug')
      .addSelect('p.updated_at', 'updated_at')
      .where('p.is_deleted = false')
      .andWhere('p.status = :status', { status: 'active' })
      .orderBy('p.updated_at', 'DESC')
      .getRawMany<{ slug: string; updated_at: Date }>();
  }

  /**
   * Attach each product's shared `seo_meta` row.
   *
   * `seo_meta` is a plain (entity_type, entity_id) table, not a relation, so it
   * cannot be eager-loaded — one query for the whole page instead of one per row.
   */
  private async attachSeo(products: Product[]) {
    if (products.length === 0) return;
    const seos = await this.seoRepo.find({
      where: { entity_type: 'product', entity_id: In(products.map((p) => p.id)) },
    });
    const byId = new Map(seos.map((s) => [s.entity_id, s]));
    for (const product of products) {
      product.seo_meta = byId.get(product.id) ?? null;
    }
  }

  async create(dto: CreateProductDto) {
    await this.assertCategory(dto.category_id);
    if (dto.brand_id) await this.assertBrand(dto.brand_id);

    const { rest, money } = splitMoney(dto);
    const product = this.productRepo.create({
      ...rest,
      ...money,
      slug: await this.uniqueSlug(dto.slug || dto.name),
    });
    const saved = await this.productRepo.save(product);
    return this.findOne(saved.id);
  }

  /**
   * Partial update. The admin's edit form omits untouched fields, and clearing an
   * optional value (brand, serial number, discount) has to be expressible — so
   * `undefined` keys are skipped while `null` is written through.
   */
  async update(id: number, dto: Partial<CreateProductDto>) {
    await this.findOne(id);
    if (dto.category_id) await this.assertCategory(dto.category_id);
    if (dto.brand_id) await this.assertBrand(dto.brand_id);

    const { rest, money } = splitMoney(dto);
    const changes: Record<string, unknown> = { ...money };
    for (const [key, value] of Object.entries(rest)) {
      if (value === undefined) continue;
      changes[key] = value;
    }
    if (dto.name && !dto.slug) {
      changes.slug = await this.uniqueSlug(dto.name, id);
    }

    if (Object.keys(changes).length === 0) return this.findOne(id);

    await this.productRepo.update(id, changes);
    return this.findOne(id);
  }

  /**
   * Soft delete. The admin table lists archived rows, and a hard delete would
   * cascade away `product_images` rows that a rollback could not restore.
   */
  async remove(id: number) {
    await this.findOne(id);
    await this.productRepo.update(id, { is_deleted: true, status: 'archived' });
    return { success: true, message: `Product #${id} deleted successfully` };
  }

  async toggleFeatured(id: number, isFeatured: boolean) {
    await this.findOne(id);
    await this.productRepo.update(id, { is_featured: isFeatured });
    return this.findOne(id);
  }

  async updateSeo(id: number, dto: UpdateProductSeoDto) {
    await this.findOne(id);
    const existing = await this.seoRepo.findOne({ where: { entity_type: 'product', entity_id: id } });
    if (existing) return this.seoRepo.save({ ...existing, ...dto });
    return this.seoRepo.save(this.seoRepo.create({ entity_type: 'product', entity_id: id, ...dto }));
  }

  // ── Product images ────────────────────────────────────────────────────────

  /**
   * Append images to a gallery.
   *
   * `primaryIndex` is the position of the primary file *within this upload*, not a
   * flag: the admin's form sends `isPrimary` as the index of the primary image in
   * its own file list, and the edit modal separately calls `setPrimaryImage` for
   * an existing image. On a product with no gallery the first file becomes
   * primary regardless, so a fresh product always has a thumbnail.
   */
  async addImages(
    productId: number,
    files: Express.Multer.File[],
    primaryIndex?: number,
  ) {
    const product = await this.findOne(productId);
    if (!files?.length) throw new BadRequestException('No files uploaded');

    const galleryEmpty = product.images.length === 0;
    const index =
      primaryIndex != null && primaryIndex >= 0 && primaryIndex < files.length
        ? primaryIndex
        : 0;

    const saved: ProductImage[] = [];
    for (const [i, file] of files.entries()) {
      const uploaded = await this.cloudinary.uploadFile(
        file,
        `products/product-${productId}`,
        `product-${productId}-${Date.now()}-${i}`,
      );
      const image = this.imageRepo.create({
        product_id: productId,
        image_url: uploaded.url,
        cloudinary_public_id: uploaded.public_id,
        is_primary: (galleryEmpty && i === 0) || i === index,
        sort_order: product.images.length + i,
      });
      saved.push(await this.imageRepo.save(image));
    }
    return saved;
  }

  async deleteImage(productId: number, imageId: number) {
    const image = await this.imageRepo.findOneBy({ id: imageId, product_id: productId });
    if (!image) throw new NotFoundException(`Image #${imageId} not found on product #${productId}`);

    // Remove the remote asset first: a row deleted while the Cloudinary asset
    // survives would leak storage on every re-upload.
    if (image.cloudinary_public_id) {
      try {
        await this.cloudinary.deleteFile(image.cloudinary_public_id);
      } catch {
        // A Cloudinary outage must not block the DB cleanup below.
      }
    }
    await this.imageRepo.delete(imageId);

    // Promoting a replacement keeps the gallery from having no primary after the
    // last one is removed.
    if (image.is_primary) {
      const next = await this.imageRepo.findOne({
        where: { product_id: productId },
        order: { sort_order: 'ASC', id: 'ASC' },
      });
      if (next) await this.imageRepo.update(next.id, { is_primary: true });
    }

    return { success: true, message: 'Image deleted successfully' };
  }

  async setPrimaryImage(productId: number, imageId: number) {
    const image = await this.imageRepo.findOneBy({ id: imageId, product_id: productId });
    if (!image) throw new NotFoundException(`Image #${imageId} not found on product #${productId}`);

    await this.imageRepo.update({ product_id: productId }, { is_primary: false });
    await this.imageRepo.update(imageId, { is_primary: true });
    return this.imageRepo.findOneBy({ id: imageId });
  }

  // ── Brands ────────────────────────────────────────────────────────────────

  async findAllBrands() {
    return this.brandRepo.find({
      where: { is_deleted: false },
      order: { name: 'ASC' },
    });
  }

  async createBrand(dto: CreateBrandDto) {
    const brand = this.brandRepo.create({
      ...dto,
      slug: await this.uniqueBrandSlug(dto.slug || dto.name),
    });
    return this.brandRepo.save(brand);
  }

  async updateBrand(id: number, dto: Partial<CreateBrandDto>) {
    const brand = await this.brandRepo.findOneBy({ id, is_deleted: false });
    if (!brand) throw new NotFoundException(`Brand #${id} not found`);

    const changes: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(dto)) {
      if (value === undefined) continue;
      changes[key] = value;
    }
    await this.brandRepo.update(id, changes);
    return this.brandRepo.findOneBy({ id });
  }

  /**
   * Soft delete, blocked while products still reference the brand. The FK is
   * `ON DELETE SET NULL`, so a hard delete would silently strip the brand from
   * every product instead of reporting the conflict.
   */
  async removeBrand(id: number) {
    const brand = await this.brandRepo.findOneBy({ id, is_deleted: false });
    if (!brand) throw new NotFoundException(`Brand #${id} not found`);

    const inUse = await this.productRepo.count({ where: { brand_id: id, is_deleted: false } });
    if (inUse > 0) {
      throw new BadRequestException(
        `Cannot delete "${brand.name}" — ${inUse} product(s) still reference it. Reassign them first.`,
      );
    }

    await this.brandRepo.update(id, { is_deleted: true });
    return { success: true, message: `Brand "${brand.name}" deleted successfully` };
  }

  async uploadBrandLogo(id: number, file: Express.Multer.File) {
    const brand = await this.brandRepo.findOneBy({ id, is_deleted: false });
    if (!brand) throw new NotFoundException(`Brand #${id} not found`);

    if (brand.cloudinary_public_id) {
      try {
        await this.cloudinary.deleteFile(brand.cloudinary_public_id);
      } catch {
        // Keep going: the new upload must not be blocked by a stale asset.
      }
    }

    const uploaded = await this.cloudinary.uploadFile(
      file,
      'products/brands',
      `brand-${id}-${Date.now()}`,
    );
    await this.brandRepo.update(id, {
      logo_url: uploaded.url,
      cloudinary_public_id: uploaded.public_id,
    });
    return { url: uploaded.url, public_id: uploaded.public_id };
  }

  // ── Categories ────────────────────────────────────────────────────────────

  async findAllCategories() {
    return this.categoryRepo.find({
      where: { is_deleted: false },
      order: { sort_order: 'ASC', name: 'ASC' },
    });
  }

  async createCategory(dto: CreateCategoryDto) {
    if (dto.parent_id) {
      const parent = await this.categoryRepo.findOneBy({ id: dto.parent_id, is_deleted: false });
      if (!parent) throw new NotFoundException(`Parent category #${dto.parent_id} not found`);
    }
    const category = this.categoryRepo.create({
      ...dto,
      slug: await this.uniqueCategorySlug(dto.slug || dto.name),
    });
    return this.categoryRepo.save(category);
  }

  async updateCategory(id: number, dto: Partial<CreateCategoryDto>) {
    const category = await this.categoryRepo.findOneBy({ id, is_deleted: false });
    if (!category) throw new NotFoundException(`Category #${id} not found`);

    // Guard the self-reference: a category parented to itself would make the
    // admin's tree walker recurse until it ran out of stack.
    if (dto.parent_id === id) {
      throw new BadRequestException('A category cannot be its own parent');
    }
    if (dto.parent_id) {
      const parent = await this.categoryRepo.findOneBy({ id: dto.parent_id, is_deleted: false });
      if (!parent) throw new NotFoundException(`Parent category #${dto.parent_id} not found`);
    }

    const changes: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(dto)) {
      if (value === undefined) continue;
      changes[key] = value;
    }
    await this.categoryRepo.update(id, changes);
    return this.categoryRepo.findOneBy({ id });
  }

  async removeCategory(id: number) {
    const category = await this.categoryRepo.findOneBy({ id, is_deleted: false });
    if (!category) throw new NotFoundException(`Category #${id} not found`);

    const childCount = await this.categoryRepo.count({ where: { parent_id: id, is_deleted: false } });
    if (childCount > 0) {
      throw new BadRequestException(
        `Cannot delete "${category.name}" — it has ${childCount} sub-category(ies). Remove them first.`,
      );
    }

    const inUse = await this.productRepo.count({ where: { category_id: id, is_deleted: false } });
    if (inUse > 0) {
      throw new BadRequestException(
        `Cannot delete "${category.name}" — ${inUse} product(s) still reference it. Reassign them first.`,
      );
    }

    await this.categoryRepo.update(id, { is_deleted: true });
    return { success: true, message: `Category "${category.name}" deleted successfully` };
  }

  // ── Category attributes ───────────────────────────────────────────────────

  async findCategoryAttributes(categoryId: number) {
    return this.attributeRepo.find({
      where: { category_id: categoryId, is_deleted: false },
      order: { sort_order: 'ASC', name: 'ASC' },
    });
  }

  /**
   * Distinct specification values actually in use within a category.
   *
   * The storefront's spec filter needs a key *and* its options to render, and
   * `findCategoryAttributes` only returns the slots ("Capacity", unit "GB") -
   * never the values. Without this the filter had no selectable options at all.
   *
   * Keys are the `Group__Label` form written into `specifications_json`; the
   * storefront splits on the separator for display. Scoped to published rows so
   * the facets never advertise a value that no visible product carries.
   */
  async findCategorySpecValues(categoryId: number) {
    return this.productRepo
      .createQueryBuilder('p')
      .select('spec.key', 'key')
      .addSelect('spec.value::text', 'value')
      .addSelect('COUNT(*)', 'count')
      .innerJoin(
        `LATERAL jsonb_each(COALESCE(p.specifications_json, '{}'::jsonb))`,
        'spec',
        'TRUE',
      )
      .where('p.category_id = :categoryId', { categoryId })
      .andWhere('p.is_deleted = false')
      .andWhere('p.status = :status', { status: 'active' })
      .groupBy('spec.key')
      .addGroupBy('spec.value::text')
      .orderBy('spec.key', 'ASC')
      .addOrderBy('spec.value::text', 'ASC')
      .getRawMany<{ key: string; value: string; count: string }>();
  }

  async createCategoryAttribute(categoryId: number, dto: CreateCategoryAttributeDto) {
    const category = await this.categoryRepo.findOneBy({ id: categoryId, is_deleted: false });
    if (!category) throw new NotFoundException(`Category #${categoryId} not found`);

    const attribute = this.attributeRepo.create({ ...dto, category_id: categoryId });
    return this.attributeRepo.save(attribute);
  }

  async deleteCategoryAttribute(attributeId: number) {
    const attribute = await this.attributeRepo.findOneBy({ id: attributeId, is_deleted: false });
    if (!attribute) throw new NotFoundException(`Attribute #${attributeId} not found`);
    await this.attributeRepo.update(attributeId, { is_deleted: true });
    return { success: true, message: 'Attribute definition deleted successfully' };
  }

  // ── Internals ─────────────────────────────────────────────────────────────

  private async assertCategory(id: number) {
    const category = await this.categoryRepo.findOneBy({ id, is_deleted: false });
    if (!category) throw new BadRequestException(`Category #${id} not found`);
  }

  private async assertBrand(id: number) {
    const brand = await this.brandRepo.findOneBy({ id, is_deleted: false });
    if (!brand) throw new BadRequestException(`Brand #${id} not found`);
  }

  /** Append a numeric suffix until the slug is free, so a duplicate name saves. */
  private async uniqueSlug(base: string, excludeId?: number): Promise<string> {
    const root = cleanSlug(base) || `product-${Date.now()}`;
    let candidate = root;
    let suffix = 1;
    // eslint-disable-next-line no-constant-condition
    while (true) {
      const clash = await this.productRepo.findOneBy({ slug: candidate });
      if (!clash || clash.id === excludeId) return candidate;
      candidate = `${root}-${++suffix}`;
    }
  }

  private async uniqueBrandSlug(base: string): Promise<string> {
    const root = cleanSlug(base) || `brand-${Date.now()}`;
    let candidate = root;
    let suffix = 1;
    // eslint-disable-next-line no-constant-condition
    while (true) {
      const clash = await this.brandRepo.findOneBy({ slug: candidate });
      if (!clash) return candidate;
      candidate = `${root}-${++suffix}`;
    }
  }

  private async uniqueCategorySlug(base: string): Promise<string> {
    const root = cleanSlug(base) || `category-${Date.now()}`;
    let candidate = root;
    let suffix = 1;
    // eslint-disable-next-line no-constant-condition
    while (true) {
      const clash = await this.categoryRepo.findOneBy({ slug: candidate });
      if (!clash) return candidate;
      candidate = `${root}-${++suffix}`;
    }
  }
}
