import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { ComparisonRow } from './comparison-row.entity';

@Entity('comparison_blocks')
export class ComparisonBlock {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 50 })
  entity_type: string; // 'portfolio' | 'product'

  @Column({ type: 'int' })
  entity_id: number;

  @Column({ type: 'boolean', default: true })
  enabled: boolean;

  @Column({ type: 'varchar', length: 255, nullable: true })
  title: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  subtitle: string;

  @OneToMany(() => ComparisonRow, (row) => row.block, { cascade: true })
  rows: ComparisonRow[];

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}