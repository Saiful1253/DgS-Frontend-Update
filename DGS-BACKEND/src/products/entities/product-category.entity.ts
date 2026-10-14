import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { Product } from './product.entity';

/**
 * Catalogue category. Self-referencing through `parent_id` so the admin's tree
 * (`_depth` in `categories-client.tsx`) can nest; `is_deleted` keeps the
 * soft-delete the admin table expects instead of dropping rows that still have
 * products attached.
 */
@Entity('product_categories')
export class ProductCategory {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 200 })
  name: string;

  @Column({ type: 'varchar', length: 220, unique: true })
  slug: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  image_url: string;

  @Column({ type: 'varchar', length: 200, nullable: true })
  cloudinary_public_id: string;

  @Column({ type: 'int', nullable: true })
  parent_id: number;

  @Column({ type: 'varchar', length: 20, default: 'active' })
  status: string; // active | inactive | archived

  @Column({ type: 'int', default: 0 })
  sort_order: number;

  @Column({ type: 'boolean', default: false })
  is_deleted: boolean;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @OneToMany(() => Product, (p) => p.category)
  products: Product[];
}
