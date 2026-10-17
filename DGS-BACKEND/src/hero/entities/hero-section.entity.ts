import { Entity, PrimaryGeneratedColumn, Column, OneToMany, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { HeroMedia } from './hero-media.entity';

@Entity('hero_sections')
export class HeroSection {
  @PrimaryGeneratedColumn('increment', { type: 'bigint' }) id: number;
  @Column({ type: 'varchar', length: 200 }) headline: string;
  @Column({ type: 'text' }) sub_headline: string;
  @Column({ type: 'varchar', length: 100, nullable: true }) primary_cta_label: string;
  @Column({ type: 'text', nullable: true }) primary_cta_link: string;
  @Column({ type: 'varchar', length: 100, nullable: true }) secondary_cta_label: string;
  @Column({ type: 'text', nullable: true }) secondary_cta_link: string;
  @Column({ type: 'varchar', length: 255, nullable: true }) badge_text?: string;
  @Column({ type: 'varchar', length: 150, nullable: true }) highlight_text?: string;
  @Column({ type: 'varchar', length: 20, default: 'draft' }) status: string;
  @Column({ type: 'boolean', default: false }) is_deleted: boolean;
  @CreateDateColumn() created_at: Date;
  @UpdateDateColumn() updated_at: Date;
  @OneToMany(() => HeroMedia, (m) => m.heroSection) media: HeroMedia[];
}
