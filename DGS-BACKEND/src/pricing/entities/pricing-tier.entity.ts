import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('pricing_tiers')
export class PricingTier {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 50 })
  entity_type: string; // 'portfolio' | 'product'

  @Column({ type: 'int' })
  entity_id: number;

  @Column({ type: 'varchar', length: 255 })
  tier_title: string;

  @Column({ type: 'numeric', precision: 12, scale: 2, nullable: true })
  primary_price: string | number;

  @Column({ type: 'varchar', length: 10, default: 'USD' })
  primary_currency: string;

  @Column({ type: 'jsonb', nullable: true })
  regional_prices: Record<string, string>;

  @Column({ type: 'varchar', length: 50, default: 'one-time' })
  billing_cycle: string; // 'monthly' | 'annually' | 'one-time'

  @Column({ type: 'jsonb', nullable: true })
  included_features: string[];

  @Column({ type: 'varchar', length: 100, nullable: true })
  badge_text: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  cta_text: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  cta_link: string;

  @Column({ type: 'boolean', default: false })
  is_most_popular: boolean;

  @Column({ type: 'int', default: 0 })
  display_order: number;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}