import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany, Relation } from 'typeorm';
import type { ServiceGroup } from './service-group.entity';
import type { Service } from './service.entity';

@Entity('service_pillars')
export class ServicePillar {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Column({ type: 'varchar', length: 120, unique: true })
  slug: string;

  @Column({ type: 'varchar', length: 150 })
  display_label: string;

  @Column({ type: 'text', nullable: true })
  blurb: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  icon: string;

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

  // Relations use the string target form with `import type` siblings. The three service
  // entities are mutually referential, so a value import here would create a module cycle
  // and TypeScript would resolve `ServiceGroup`/`Service` as incomplete class shapes
  // (dropping `pillar_id` and `pillarEntity`) depending on evaluation order.
  // TypeORM resolves the target lazily from its entity registry at metadata build time.
  @OneToMany('ServiceGroup', 'pillarEntity')
  groups: Relation<ServiceGroup[]>;

  @OneToMany('Service', 'pillarEntity')
  services: Relation<Service[]>;
}
