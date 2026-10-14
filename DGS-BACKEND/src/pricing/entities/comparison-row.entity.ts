import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { ComparisonBlock } from './comparison-block.entity';

@Entity('comparison_rows')
export class ComparisonRow {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int' })
  comparison_block_id: number;

  @ManyToOne(() => ComparisonBlock, (block) => block.rows, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'comparison_block_id' })
  block: ComparisonBlock;

  @Column({ type: 'text', nullable: true })
  standard_approach: string;

  @Column({ type: 'text', nullable: true })
  our_approach: string;

  @Column({ type: 'int', default: 0 })
  display_order: number;

  @CreateDateColumn()
  created_at: Date;
}