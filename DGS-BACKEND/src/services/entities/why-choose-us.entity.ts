import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('why_choose_us')
export class WhyChooseUs {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  image_url: string | null;

  @Column({ type: 'varchar', length: 500, nullable: true })
  icon_url: string | null;

  @Column({ type: 'varchar', length: 50, nullable: true })
  icon_color: string | null;

  @Column({ type: 'varchar', length: 50, nullable: true })
  badge_color: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  icon_name: string | null;

  @Column({ type: 'int', default: 0 })
  display_order: number;

  @Column({ type: 'boolean', default: false })
  is_active: boolean;

  @Column({ type: 'boolean', default: false })
  is_deleted: boolean;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;
}
