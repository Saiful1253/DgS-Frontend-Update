import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { Blog } from './blog.entity';
import { BlogAuthor } from './blog-author.entity';

@Entity('blog_post_authors')
export class BlogPostAuthor {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'bigint' })
  post_id: number;

  @Column({ type: 'int' })
  author_id: number;

  @Column({ type: 'boolean', default: false })
  is_primary: boolean;

  @Column({ type: 'int', default: 0 })
  display_order: number;

  @ManyToOne(() => Blog, (b) => b.post_authors, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'post_id' })
  post: Blog;

  @ManyToOne(() => BlogAuthor, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'author_id' })
  author: BlogAuthor;

  @CreateDateColumn()
  created_at: Date;
}