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

  // Relations use the string target form with `import type` siblings so that
  // Service <-> ServiceGroup <-> ServicePillar form no import cycle. See service-pillar.entity.ts.
  @ManyToOne('ServicePillar', { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'pillar_id' })
  pillarEntity: Relation<ServicePillar>;

  @ManyToOne('ServiceGroup', { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'group_id' })
  group: Relation<ServiceGroup>;
}
