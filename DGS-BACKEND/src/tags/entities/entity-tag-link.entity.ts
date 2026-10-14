import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  Unique,
  Index,
} from 'typeorm';
import { EntityTag } from './entity-tag.entity';

// ER: ENTITY_TAGS link — polymorphic join (entity_type + entity_id) → tag_id
@Entity('entity_tag_links')
@Unique(['entity_type', 'entity_id', 'tag_id'])
@Index(['entity_type', 'entity_id'])
export class EntityTagLink {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 50 })
  entity_type: string;

  @Column({ type: 'bigint' })
  entity_id: number;

  @Column({ type: 'int' })
  tag_id: number;

  @ManyToOne(() => EntityTag, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tag_id' })
  tag: EntityTag;

  @CreateDateColumn()
  created_at: Date;
}