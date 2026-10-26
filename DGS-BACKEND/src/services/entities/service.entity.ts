import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, Relation } from 'typeorm';
import type { ServiceGroup } from './service-group.entity';
import type { ServicePillar } from './service-pillar.entity';

@Entity('services')
export class Service {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int', nullable: true })
  group_id: number | null;

  @Column({ type: 'int', nullable: true })
  pillar_id: number | null;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  slug: string;

  @Column({ type: 'varchar', length: 100 })
  pillar: string; // 'Software Development' | 'Creative Services' | 'Digital Marketing'

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  icon_url: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  spec_code: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  badge_label: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  badge_status: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  sub_title: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  category_tag: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  tier_label: string | null;

  @Column({ type: 'varchar', length: 500, nullable: true })
  image_url: string | null;

  @Column({ type: 'boolean', default: false })
  is_flagship: boolean;

  @Column({ type: 'jsonb', nullable: true })
  features: Array<{ title: string; description?: string; icon?: string }> | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  compliance_codes: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  cta_label: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  cta_url: string | null;

  @Column({ type: 'boolean', default: true })
  is_active: boolean;

  @Column({ type: 'boolean', default: false })
  is_deleted: boolean;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  // Relations use the string target form with `import type` siblings so that
  // Service <-> ServiceGroup <-> ServicePillar form no import cycle. See service-pillar.entity.ts.
  @ManyToOne('ServicePillar', { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'pillar_id' })
  pillarEntity: Relation<ServicePillar>;

  @ManyToOne('ServiceGroup', { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'group_id' })
  group: Relation<ServiceGroup>;
}
