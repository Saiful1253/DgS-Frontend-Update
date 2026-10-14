import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
  UpdateDateColumn, OneToMany,
} from 'typeorm';
import { User } from '../users/user.entity';

@Entity('roles')
export class Role {
  @PrimaryGeneratedColumn('increment', { type: 'bigint' })
  id: number;

  @Column({ type: 'varchar', length: 50, unique: true })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'varchar', length: 20, default: 'active' })
  status: string;

  /**
   * is_system = true মানে এই role টা system-protected।
   * শুধু owner এই role এর user দের touch করতে পারবে।
   * DB migration: ALTER TABLE roles ADD COLUMN is_system BOOLEAN DEFAULT false;
   *               UPDATE roles SET is_system = true WHERE name = 'owner';
   */
  @Column({ type: 'boolean', default: false })
  is_system: boolean;

  @Column({ type: 'boolean', default: false }) is_deleted: boolean;

  @CreateDateColumn() created_at: Date;
  @UpdateDateColumn() updated_at: Date;

  @OneToMany(() => User, (u) => u.role)
  users: User[];
}
