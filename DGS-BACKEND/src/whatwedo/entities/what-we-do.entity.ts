import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity('what_we_do')
@Index(['category', 'sort_order'])
export class WhatWeDo {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 100 })
  category: string;

  @Column({ name: 'is_available', type: 'boolean', default: true })
  is_available: boolean;

  @Column({ type: 'varchar', length: 255 })
  problem: string;

  @Column({ name: 'problem_desc', type: 'text' })
  problem_desc: string;

  @Column({ type: 'varchar', length: 255 })
  solution: string;

  @Column({ name: 'solution_desc', type: 'text' })
  solution_desc: string;

  @Column({ name: 'sort_order', type: 'int', default: 0 })
  sort_order: number;

  @Column({ type: 'boolean', default: false })
  is_deleted: boolean;

  @CreateDateColumn({ name: 'created_at' })
  created_at: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updated_at: Date;
}
