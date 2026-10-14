import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BlogsController } from './blogs.controller';
import { BlogCategoriesController } from './blog-categories.controller';
import { BlogAuthorsController } from './blog-authors.controller';
import { BlogsService } from './blogs.service';
import { Blog } from './entities/blog.entity';
import { BlogCategory } from './entities/blog-category.entity';
import { BlogAuthor } from './entities/blog-author.entity';
import { BlogPostAuthor } from './entities/blog-post-author.entity';
import { EntityTag } from '../tags/entities/entity-tag.entity';
import { EntityTagLink } from '../tags/entities/entity-tag-link.entity';
import { SeoMeta } from '../seo/entities/seo-meta.entity';

@Module({
  imports: [TypeOrmModule.forFeature([
    Blog, BlogCategory, BlogAuthor, BlogPostAuthor,
    EntityTag, EntityTagLink, SeoMeta,  ])],
  controllers: [BlogsController, BlogCategoriesController, BlogAuthorsController],
  providers: [BlogsService],
  exports: [BlogsService],
})
export class BlogsModule {}
