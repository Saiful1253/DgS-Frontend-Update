import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { ProductImage } from './product-image.entity';
import { ProductCategory } from './product-category.entity';
import { ProductBrand } from './product-brand.entity';
import { SeoMeta } from '../../seo/entities/seo-meta.entity';

/**
 * Catalogue product (SKU).
 *
 * Distinct from `ProductSaas` in `products-saas/`, which stores a marketing
 * landing page for a proprietary platform. That record is public-facing and read
 * by `client/client.controller.ts`; this one is the purchasable catalogue item
 * managed in the admin `/products` screen, with brand, category, pricing,
 * warranty and stock fields.
 */
@Entity('products')
export class Product {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 200 })
  name: string;

  @Column({ type: 'varchar', length: 220, unique: true })
  slug: string;

  @Column({ type: 'int' })
  category_id: number;

  @Column({ type: 'int', nullable: true })
  brand_id: number;

  @Column({ type: 'text' })
  description: string;

  // Money is `numeric`, which pg returns as a string — the admin renders it
  // directly. A float column would lose cents on values like 19.99.
  @Column({ type: 'numeric', precision: 12, scale: 2, default: 0 })
  base_price: string;

  @Column({ type: 'numeric', precision: 12, scale: 2, nullable: true })
  weight_grams: string;

  @Column({ type: 'varchar', length: 20, default: 'none' })
  discount_type: string; // fixed | percentage | none

  @Column({ type: 'numeric', precision: 12, scale: 2, nullable: true })
  discount_value: string;

  @Column({ type: 'jsonb', nullable: true })
  warranty_components: ProductWarrantyComponent[];

  @Column({ type: 'varchar', length: 100, nullable: true })
  country_of_origin: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  serial_number: string;

  @Column({ type: 'boolean', default: false })
  emi_available: boolean;

  @Column({ type: 'varchar', length: 500, nullable: true })
  product_video_url: string;

  // Grouped spec keys use the `Group__Label` form, which is what the admin's
  // specification-template builder parses back into groups.
  @Column({ type: 'jsonb', nullable: true })
  specifications_json: Record<string, unknown>;

  @Column({ type: 'varchar', length: 20, default: 'active' })
  status: string; // active | inactive | archived

  @Column({ type: 'boolean', default: false })
  is_featured: boolean;

  @Column({ type: 'int', default: 10 })
  low_stock_threshold: number;

  @Column({ type: 'int', default: 6 })
  lifecycle_months: number;

  @Column({ type: 'int', default: 30 })
  default_shelf_life_days: number;

  // ── SEO ────────────────────────────────────────────────────────────────────
  // Not columns: SEO lives in the shared `seo_meta` table keyed by
  // (entity_type, entity_id), the same way `blogs` does it. The service attaches
  // it as `seo_meta` on every read, which is what the admin modals read.

  @Column({ type: 'boolean', default: false })
  is_deleted: boolean;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @OneToMany(() => ProductImage, (img) => img.product, { cascade: true })
  images: ProductImage[];

  @ManyToOne(() => ProductCategory, (c) => c.products, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'category_id' })
  category: ProductCategory;

  @ManyToOne(() => ProductBrand, (b) => b.products, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'brand_id' })
  brand: ProductBrand;

  /**
   * Attached by the service from the shared `seo_meta` row, not a relation.
   * Declared here so the read shape is visible on the entity.
   */
  seo_meta?: SeoMeta | null;
}

export interface ProductWarrantyComponent {
  warranty_policy_id: number;
  warranty_months?: number;
  warranty_duration_days?: number;
  service_coverage?: boolean;
  parts_coverage?: boolean;
  customer_policy_note?: string;
}
