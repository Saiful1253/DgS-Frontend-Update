import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('testimonials')
export class Testimonial {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 50, default: 'review' })
  kind: string; // 'review' | 'logo'

  @Column({ type: 'varchar', length: 255 })
  author_name: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  author_role: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  author_company: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  avatar_url: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  client_logo_url: string;

  @Column({ type: 'varchar', length: 20, default: 'text' })
  type: string; // 'text' | 'image'

  @Column({ type: 'varchar', length: 512, nullable: true })
  image_url: string;

  @Column({ type: 'text', nullable: true })
  image_public_id: string;

  @Column({ type: 'int', default: 5 })
  rating: number;

  @Column({ type: 'text', nullable: true })
  content: string;

  @Column({ type: 'varchar', length: 20, default: 'approved' })
  status: 'pending' | 'approved' | 'rejected';

  @Column({ type: 'varchar', length: 20, default: 'admin' })
  source: string; // 'admin' | 'storefront' | 'client'

  @Column({ type: 'varchar', length: 50, nullable: true })
  source_platform: string; // Google | Facebook | Clutch | Upwork

  @Column({ type: 'boolean', default: false })
  is_featured: boolean;

  @Column({ type: 'int', default: 0 })
  display_order: number;

  @Column({ type: 'boolean', default: true })
  is_active: boolean;

  @Column({ type: 'boolean', default: false })
  is_deleted: boolean;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  // Compatibility getter/setter for customer_name
  get customer_name(): string {
    return this.author_name;
  }

  set customer_name(val: string) {
    this.author_name = val;
  }
}