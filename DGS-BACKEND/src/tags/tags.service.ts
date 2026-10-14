import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { EntityTag } from './entities/entity-tag.entity';
import { EntityTagLink } from './entities/entity-tag-link.entity';
import { Blog } from '../blogs/entities/blog.entity';

// Clean slug WITHOUT timestamp — used for manually-edited slugs (uniqueness checked separately)
const cleanSlug = (str: string) =>
  str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

@Injectable()
export class TagsService {
  constructor(
    @InjectRepository(EntityTag) private tagRepo: Repository<EntityTag>,
    @InjectRepository(EntityTagLink) private tagLinkRepo: Repository<EntityTagLink>,
    @InjectRepository(Blog) private blogRepo: Repository<Blog>,
  ) {}

  // ── Global Tags Manager (ENTITY_TAGS) ──────────────────────────
  async findAllTags() {
    const tags = await this.tagRepo.find({ where: { is_deleted: false }, order: { name: 'ASC' } });
    const linkRows = await this.tagLinkRepo
      .createQueryBuilder('tl')
      .select('tl.tag_id', 'tag_id')
      .addSelect('tl.entity_type', 'entity_type')
      .addSelect('COUNT(*)', 'cnt')
      .groupBy('tl.tag_id')
      .addGroupBy('tl.entity_type')
      .getRawMany();

    const counts = new Map<string, number>();
    const postCounts = new Map<string, number>();
    for (const r of linkRows) {
      const key = `${r.entity_type}:${Number(r.tag_id)}`;
      counts.set(key, Number(r.cnt));
      if (r.entity_type === 'blog') {
        postCounts.set(`blog:${Number(r.tag_id)}`, Number(r.cnt));
      }
    }

    // Blog post usage counts (published posts referencing a tag)
    const blogIds = await this.tagLinkRepo.find({
      where: { entity_type: 'blog' },
      select: { tag_id: true, entity_id: true },
    });
    const distinctPosts = new Set(blogIds.map((l) => Number(l.entity_id)));
    const linkedPosts = distinctPosts.size ? await this.blogRepo.find({ where: { id: In(Array.from(distinctPosts)) } }) : [];
    const tagPostCounts = new Map<number, number>();
    if (linkedPosts.length) {
      const activePostIds = new Set(linkedPosts.filter((p) => !p.is_deleted).map((p) => Number(p.id)));
      for (const l of blogIds) {
        if (activePostIds.has(Number(l.entity_id))) {
          tagPostCounts.set(Number(l.tag_id), (tagPostCounts.get(Number(l.tag_id)) || 0) + 1);
        }
      }
    }

    return tags.map((t) => ({
      ...t,
      usages: postCounts.get(`blog:${Number(t.id)}`) || 0,
      posts_count: tagPostCounts.get(Number(t.id)) || 0,
      scope: 'blog',
    }));
  }

  async createTag(name: string) {
    const trimmed = String(name || '').trim();
    if (!trimmed) throw new BadRequestException('Tag name is required');
    const lower = trimmed.toLowerCase();
    const existing = await this.tagRepo.findOne({ where: { name: lower } });
    if (existing) {
      // Revive soft-deleted tags instead of violating the unique name
      if (existing.is_deleted) {
        existing.is_deleted = false;
        existing.slug = cleanSlug(lower);
        return this.tagRepo.save(existing);
      }
      return existing;
    }
    return this.tagRepo.save(this.tagRepo.create({ name: lower, slug: cleanSlug(lower) }));
  }

  async updateTag(id: number, name: string) {
    const item = await this.tagRepo.findOneBy({ id });
    if (!item) throw new NotFoundException('Tag not found');
    const lower = String(name || '').trim().toLowerCase();
    if (!lower) throw new BadRequestException('Tag name is required');
    return this.tagRepo.save({ ...item, name: lower, slug: cleanSlug(lower) });
  }

  async deleteTag(id: number) {
    const item = await this.tagRepo.findOneBy({ id });
    if (!item) throw new NotFoundException('Tag not found');
    await this.tagLinkRepo.delete({ tag_id: id });
    item.is_deleted = true;
    await this.tagRepo.save(item);
    return { message: 'Tag deleted' };
  }
}
