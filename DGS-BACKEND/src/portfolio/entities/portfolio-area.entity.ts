import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('portfolio_areas')
export class PortfolioArea {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 150, unique: true })
  name: string;

  @Column({ type: 'varchar', length: 200, nullable: true })
  slug: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
