import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { PortfolioChallenge } from './portfolio-challenge.entity';
import { PortfolioPricingTier } from './portfolio-pricing-tier.entity';

export enum PortfolioMediaType {
  IMAGE = 'image',
  YOUTUBE = 'youtube',
}

export enum PortfolioProjectStatus {
  COMPLETED = 'completed',
  ONGOING = 'ongoing',
}

export enum PortfolioProjectType {
  RESIDENTIAL = 'residential',
  INDUSTRIAL = 'industrial',
  COMMERCIAL_RESTAURANT = 'commercial_restaurant',
}

@Entity('portfolios')
export class Portfolio {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 255 })
  project_name: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  slug: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  client_name: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  client_logo: string;

  @Column({ type: 'varchar', length: 100 })
  category: string; // 'Software Engineering' | 'Creative & Post Production' | 'Digital Marketing'

  @Column({ type: 'jsonb', nullable: true })
  tags: string[];

  @Column({ type: 'varchar', length: 500, nullable: true })
  live_url: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  app_store_url: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  play_store_url: string;

  @Column({ type: 'boolean', default: false })
  is_featured: boolean;

  // Media
  @Column({
    type: 'enum',
    enum: PortfolioMediaType,
    default: PortfolioMediaType.IMAGE,
  })
  media_type: PortfolioMediaType;

  @Column({ type: 'varchar', length: 500, nullable: true })
  media_url: string;

  // Project Meta
  @Column({
    type: 'enum',
    enum: PortfolioProjectStatus,
    default: PortfolioProjectStatus.COMPLETED,
  })
  project_status: PortfolioProjectStatus;

  @Column({
    type: 'enum',
    enum: PortfolioProjectType,
    default: PortfolioProjectType.RESIDENTIAL,
  })
  project_type: PortfolioProjectType;

  // Location
  @Column({ type: 'text', nullable: true })
  address: string;

  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  latitude: number | null;

  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  longitude: number | null;

  // Description
  @Column({ type: 'text', nullable: true })
  description: string;

  // Primary Highlight
  @Column({ type: 'varchar', length: 500, nullable: true })
  cover_image: string;

  @Column({ type: 'text', nullable: true })
  primary_challenge: string;

  @Column({ type: 'text', nullable: true })
  primary_solution: string;

  // Standard vs Ours Comparison Matrix
  @Column({ type: 'boolean', default: true })
  comparison_enabled: boolean;

  @Column({ type: 'varchar', length: 255, default: 'Industry Standard vs. Our Approach' })
  comparison_title: string;

  @Column({ type: 'text', nullable: true })
  industry_standard_text: string;

  @Column({ type: 'text', nullable: true })
  our_approach_text: string;

  // Pricing Section
  @Column({ type: 'boolean', default: true })
  pricing_enabled: boolean;

  @Column({ type: 'varchar', length: 255, default: 'Transparent Pricing & Engagement Models' })
  pricing_title: string;

  // Relations
  @OneToMany(() => PortfolioChallenge, (challenge) => challenge.portfolio, { cascade: true })
  challenges: PortfolioChallenge[];

  @OneToMany(() => PortfolioPricingTier, (tier) => tier.portfolio, { cascade: true })
  pricing_tiers: PortfolioPricingTier[];

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
