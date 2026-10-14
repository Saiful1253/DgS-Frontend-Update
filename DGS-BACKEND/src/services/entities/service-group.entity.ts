import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany, ManyToOne, JoinColumn, Relation } from 'typeorm';
import type { Service } from './service.entity';
import type { ServicePillar } from './service-pillar.entity';

@Entity('service_groups')
export class ServiceGroup {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int', nullable: true })
  pillar_id: number | null;

  @Column({ type: 'varchar', length: 100 })
  pillar: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  slug: string;

  @Column({ type: 'int', default: 0 })
  display_order: number;

  // Groups publish independently of their services: a group can be staged
  // before its first service exists, and unpublishing it must not require
  // touching each child row.
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

  @OneToMany('Service', 'group')
  services: Relation<Service[]>;
}
