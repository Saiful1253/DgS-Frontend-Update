import { BadRequestException, Injectable, NotFoundException, OnModuleInit } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, LessThanOrEqual } from 'typeorm';
import { Blog } from './entities/blog.entity';
import { BlogCategory } from './entities/blog-category.entity';
import { BlogAuthor } from './entities/blog-author.entity';
import { BlogPostAuthor } from './entities/blog-post-author.entity';
import { EntityTag } from '../tags/entities/entity-tag.entity';
import { EntityTagLink } from '../tags/entities/entity-tag-link.entity';
import { CloudinaryService } from '@/upload/cloudinary.service';
import { SeoMeta } from '../seo/entities/seo-meta.entity';

const slugify = (str: string) =>
  str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') + '-' + Date.now();

// Clean slug WITHOUT timestamp — used for manually-edited slugs (uniqueness checked separately)
const cleanSlug = (str: string) =>
  str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

/**
 * Normalize pasted media links inside blog HTML so embeds actually play.
 * - Google Drive /view or /open?id= → /preview (the only embeddable URL form)
 */
const normalizeEmbedUrls = (html: string | null | undefined): string => {
  if (!html) return '';
  return html
    .replace(
      /drive\.google\.com\/file\/d\/([\w-]+)\/view(?:\?[^"'\s>]*)?/g,
      'drive.google.com/file/d/$1/preview',
    )
    .replace(
      /drive\.google\.com\/open\?id=([\w-]+)(?:&[^"'\s>]*)?/g,
      'drive.google.com/file/d/$1/preview',
    );
};

@Injectable()
export class BlogsService implements OnModuleInit {
  constructor(
    @InjectRepository(Blog) private blogRepo: Repository<Blog>,
    @InjectRepository(SeoMeta) private seoRepo: Repository<SeoMeta>,
    @InjectRepository(BlogCategory) private categoryRepo: Repository<BlogCategory>,
    @InjectRepository(BlogAuthor) private authorRepo: Repository<BlogAuthor>,
    @InjectRepository(BlogPostAuthor) private postAuthorRepo: Repository<BlogPostAuthor>,
    @InjectRepository(EntityTag) private tagRepo: Repository<EntityTag>,
    @InjectRepository(EntityTagLink) private tagLinkRepo: Repository<EntityTagLink>,
    private cloudinary: CloudinaryService,
  ) {}

  // ── Blogs ─────────────────────────────────────────────────────
  async findBlogs(
    page = 1,
    limit = 10,
    status?: string,
    search?: string,
    category?: string,
    featured?: boolean,
  ) {
    const qb = this.blogRepo.createQueryBuilder('b')
      .where('b.is_deleted = :is_deleted', { is_deleted: false })
      .orderBy('b.featured_status', 'DESC')
      .addOrderBy('b.published_at', 'DESC')
      .addOrderBy('b.created_at', 'DESC');
    if (status) qb.andWhere('b.status = :status', { status });
    if (search) {
      qb.andWhere(
        '(b.title ILIKE :search OR b.excerpt ILIKE :search OR b.category ILIKE :search)',
        { search: `%${search}%` },
      );
    }
    if (category) qb.andWhere('b.category = :category', { category });
    if (featured !== undefined) qb.andWhere('b.featured_status = :featured', { featured });
    const [data, total] = await qb.skip((page - 1) * limit).take(limit).getManyAndCount();

    if (data.length > 0) {
      const blogIds = data.map((b) => b.id);
      const seos = await this.seoRepo.find({
        where: { entity_type: 'blog', entity_id: In(blogIds) },
      });
      const seoMap = new Map(seos.map((s) => [s.entity_id, s]));
      data.forEach((b) => {
        (b as any).seo_meta = seoMap.get(b.id) || null;
      });

      // Enrich posts with author avatars for the card grid (one join + one author lookup)
      const paRows = await this.postAuthorRepo.find({ where: { post_id: In(blogIds) } });
      const authorById = new Map<number, BlogAuthor>();
      if (paRows.length) {
        const authorIds = Array.from(new Set(paRows.map((r) => Number(r.author_id))));
        if (authorIds.length) {
          const authors = await this.authorRepo.find({ where: { id: In(authorIds) } });
          authors.forEach((a) => authorById.set(Number(a.id), a));
        }
      }
      const rowsByPost = new Map<number, BlogPostAuthor[]>();
      for (const r of paRows) {
        const pid = Number(r.post_id);
        rowsByPost.set(pid, [...(rowsByPost.get(pid) || []), r]);
      }
      data.forEach((b) => {
        const rows = (rowsByPost.get(Number(b.id)) || [])
          .sort((x, y) => Number(y.is_primary) - Number(x.is_primary));
        const primaryRow = rows.find((r) => r.is_primary);
        const primary = primaryRow ? authorById.get(Number(primaryRow.author_id)) : undefined;
        (b as any).primary_author = primary
          ? { id: Number(primary.id), name: primary.name, designation: primary.designation, avatar_url: primary.avatar_url }
          : null;
        (b as any).co_authors = (b.co_authors || []).map((c) => {
          const row = rows.find((r) => {
            const a = authorById.get(Number(r.author_id));
            return a && a.name.toLowerCase() === (c.name || '').toLowerCase();
          });
          const a = row ? authorById.get(Number(row.author_id)) : undefined;
          return { ...c, avatar_url: a?.avatar_url || null };
        });
      });
    }

    return { data, total, page, limit, pages: Math.ceil(total / limit) };
  }

  private async enrichBlogWithAuthors(b: Blog): Promise<Blog> {
    const seo = await this.seoRepo.findOne({ where: { entity_type: 'blog', entity_id: b.id } });
    (b as any).seo_meta = seo || null;

    const paRows = await this.postAuthorRepo.find({ where: { post_id: b.id } });
    if (paRows.length) {
      const authorIds = Array.from(new Set(paRows.map((r) => Number(r.author_id))));
      const authors = authorIds.length ? await this.authorRepo.find({ where: { id: In(authorIds) } }) : [];
      const authorById = new Map<number, BlogAuthor>();
      authors.forEach((a) => authorById.set(Number(a.id), a));

      const rows = paRows.sort((x, y) => Number(y.is_primary) - Number(x.is_primary));
      const primaryRow = rows.find((r) => r.is_primary);
      const primary = primaryRow ? authorById.get(Number(primaryRow.author_id)) : undefined;
      (b as any).primary_author = primary
        ? { id: Number(primary.id), name: primary.name, designation: primary.designation, avatar_url: primary.avatar_url }
        : null;
      (b as any).co_authors = (b.co_authors || []).map((c) => {
        const row = rows.find((r) => {
          const a = authorById.get(Number(r.author_id));
          return a && a.name.toLowerCase() === (c.name || '').toLowerCase();
        });
        const a = row ? authorById.get(Number(row.author_id)) : undefined;
        return { ...c, avatar_url: a?.avatar_url || null };
      });
    } else {
      (b as any).primary_author = b.primary_author_name
        ? { id: 0, name: b.primary_author_name, designation: null, avatar_url: null }
        : null;
    }
    return b;
  }

  async findBlog(id: number) {
    const b = await this.blogRepo.findOne({ where: { id, is_deleted: false } });
    if (!b) throw new NotFoundException('Blog not found');
    return this.enrichBlogWithAuthors(b);
  }

  async findBlogBySlug(slug: string) {
    const b = await this.blogRepo.findOne({ where: { slug, is_deleted: false } });
    if (!b) return null;
    return this.enrichBlogWithAuthors(b);
  }

  // ── Public (published-only) ──────────────────────────────────
  /**
   * Slug + timestamp projection of published posts for the public sitemap.
   *
   * Mirrors the published filter in `findPublishedBlogs` exactly — including the
   * scheduled-post cutoff — but selects two columns and skips the SEO join. If
   * these two drift apart the sitemap advertises URLs that 404.
   */
  async findPublishedSlugs() {
    // Explicit aliases: a dotted select list returns raw keys prefixed with the
    // alias (`b_slug`), which is not the shape the sitemap consumer expects.
    return this.blogRepo
      .createQueryBuilder('b')
      .select('b.slug', 'slug')
      .addSelect('b.updated_at', 'updated_at')
      .where('b.is_deleted = :is_deleted', { is_deleted: false })
      .andWhere('b.status = :status', { status: 'published' })
      .andWhere('(b.scheduled_at IS NULL OR b.scheduled_at <= :now)', { now: new Date() })
      .orderBy('b.updated_at', 'DESC')
      .getRawMany<{ slug: string; updated_at: Date }>();
  }

  async findPublishedBlogs(page = 1, limit = 10, search?: string, category?: string) {
    const qb = this.blogRepo.createQueryBuilder('b')
      .where('b.is_deleted = :is_deleted', { is_deleted: false })
      .andWhere('b.status = :status', { status: 'published' })
      .andWhere('(b.scheduled_at IS NULL OR b.scheduled_at <= :now)', { now: new Date() })
      .orderBy('b.featured_status', 'DESC')
      .addOrderBy('b.published_at', 'DESC')
      .addOrderBy('b.created_at', 'DESC');
    if (search) {
      qb.andWhere(
        '(b.title ILIKE :search OR b.excerpt ILIKE :search OR b.category ILIKE :search OR b.tags::text ILIKE :search)',
        { search: `%${search}%` },
      );
    }
    if (category) qb.andWhere('b.category = :category', { category });
    const [data, total] = await qb.skip((page - 1) * limit).take(limit).getManyAndCount();

    if (data.length > 0) {
      const blogIds = data.map((b) => b.id);
      const seos = await this.seoRepo.find({ where: { entity_type: 'blog', entity_id: In(blogIds) } });
      const seoMap = new Map(seos.map((s) => [s.entity_id, s]));
      data.forEach((b) => { (b as any).seo_meta = seoMap.get(b.id) || null; });
    }

    return { data, total, page, limit, pages: Math.ceil(total / limit) };
  }

  async findPublishedBlog(idOrSlug: string | number) {
    const numericId = Number(idOrSlug);
    const isNumeric = Number.isInteger(numericId) && numericId > 0;
    const where: any = { is_deleted: false, status: 'published' };
    if (isNumeric) where.id = numericId;
    else where.slug = idOrSlug;

    const b = await this.blogRepo.findOne({ where });
    if (!b) return null;
    if (b.scheduled_at && b.scheduled_at > new Date()) return null;

    return this.enrichBlogWithAuthors(b);
  }

  async findRelatedBlogs(postId: number, limit = 3) {
    const post = await this.blogRepo.findOne({ where: { id: postId, is_deleted: false } });
    if (!post) return [];

    const { data } = await this.findPublishedBlogs(1, 50);
    const candidates = data.filter((b) => b.id !== post.id);

    if (candidates.length === 0) return [];

    if (post.tags && post.tags.length > 0) {
      const postTags = post.tags.map((t) => t.toLowerCase());
      const scored = candidates
        .map((b) => {
          const shared = (b.tags || []).filter((t) => postTags.includes(t.toLowerCase())).length;
          return { blog: b, shared };
        })
        .filter((x) => x.shared > 0)
        .sort((a, b) => b.shared - a.shared || (b.blog.published_at?.getTime() || 0) - (a.blog.published_at?.getTime() || 0));

      if (scored.length >= limit) {
        return scored.slice(0, limit).map((x) => x.blog);
      }

      const byTag = scored.map((x) => x.blog);
      const rest = candidates.filter((b) => !byTag.includes(b));
      return [...byTag, ...rest].slice(0, limit);
    }

    const sameCategory = post.category
      ? candidates
          .filter((b) => b.category === post.category)
          .sort((a, b) => (b.published_at?.getTime() || 0) - (a.published_at?.getTime() || 0))
      : [];

    return (sameCategory.length ? sameCategory : candidates).slice(0, limit);
  }

  // ── Status transition machine ────────────────────────────────
  async changeBlogStatus(id: number, status: string, publishAt?: string) {
    const b = await this.findBlog(id);

    if (['published', 'scheduled'].includes(status) && !b.content) {
      throw new BadRequestException('A blog post must have content before it can be published.');
    }

    const allowed: Record<string, string[]> = {
      internal_review: ['draft', 'archived', 'scheduled', 'published'],
      draft: ['internal_review', 'archived', 'scheduled', 'published'],
      published: ['draft', 'internal_review', 'archived', 'scheduled'],
      scheduled: ['draft', 'internal_review', 'archived', 'published'],
      archived: ['published', 'internal_review', 'draft', 'scheduled'],
    };

    const from = b.status;
    if (from !== status && !(allowed[status] || []).includes(from)) {
      throw new BadRequestException(
        `Invalid status transition: ${from} → ${status}. Allowed moves: ${(allowed[status] || []).join(', ') || 'none'}`,
      );
    }

    if (status === 'scheduled') {
      if (!publishAt) {
        throw new BadRequestException('publish_at (date) is required when scheduling a post.');
      }
      const dateStr = publishAt.includes('T') ? publishAt : `${publishAt}T23:59:00`;
      const at = new Date(dateStr);
      if (isNaN(at.getTime())) throw new BadRequestException('publish_at is not a valid date.');
      const now = new Date();
      if (at.getTime() < now.getTime() && at.toDateString() !== now.toDateString()) {
        throw new BadRequestException('Scheduled date cannot be in the past.');
      }
      b.status = 'scheduled';
      b.scheduled_at = at;
    } else {
      b.status = status;
      b.scheduled_at = null;
      if (status === 'published' && !b.published_at) {
        b.published_at = new Date();
      }
      if (status === 'draft') {
        b.published_at = null;
      }
    }

    const saved = await this.blogRepo.save(b);
    await this.autoGenerateSeoForBlog(saved);
    return saved;
  }

  async toggleBlogFeatured(id: number, featured?: boolean) {
    const b = await this.findBlog(id);
    b.featured_status = featured !== undefined ? Boolean(featured) : !b.featured_status;
    return this.blogRepo.save(b);
  }

  async createBlog(
    dto: {
      title:                string;
      slug?:                string;
      excerpt?:             string;
      content?:             string;
      content_delta?:       object;
      featured_image_alt?:  string;
      reading_time?:        string;
      category?:            string;
      tags?:                string[];
      primary_author_name?: string;
      co_authors?:          Array<{ name: string; designation?: string }>;
      related_article_ids?: number[];
      related_service_keys?: string[];
      canonical_url?:       string;
      custom_og_image?:     string;
      no_index?:            boolean;
      no_follow?:           boolean;
      featured_status?:     boolean;
      status?:              string;
      scheduled_at?:        string;
      published_at?:        string;
    },
    file?: Express.Multer.File,
    ogFile?: Express.Multer.File,
  ) {
    let slug: string;
    if (dto.slug && dto.slug.trim()) {
      slug = await this.ensureUniqueSlug(cleanSlug(dto.slug));
    } else {
      slug = slugify(dto.title);
    }

    let featured_image_url:       string | null = null;
    let featured_image_public_id: string | null = null;

    // ── Upload featured image if provided ─────────────────────
    if (file) {
      const uploaded = await this.cloudinary.uploadFile(
        file,
        'cms/blogs',
        `blog-featured-${Date.now()}`,
      );
      featured_image_url       = uploaded.url;
      featured_image_public_id = uploaded.public_id;
    }

    // ── Upload OG image if provided ───────────────────────────
    let custom_og_image = (dto.custom_og_image || '').trim() || null;
    if (ogFile) {
      const uploaded = await this.cloudinary.uploadFile(
        ogFile,
        'cms/blogs/og',
        `blog-og-${Date.now()}`,
      );
      custom_og_image = uploaded.url;
    }

    const status = dto.status ?? 'draft';
    const featured_image_alt = (dto.featured_image_alt || dto.title || '').trim() || null;
    const excerpt = (dto.excerpt || '').trim()
      || this.autoExcerpt(dto.content)
      || (dto.title || '').trim()
      || null;
    const reading_time = (dto.reading_time || '').trim()
      || this.autoReadingTime(dto.content)
      || null;

    const saved = await this.blogRepo.save(
      this.blogRepo.create({
        ...dto,
        content: normalizeEmbedUrls(dto.content),
        slug,
        status,
        excerpt,
        reading_time,
        custom_og_image,
        featured_image_alt,
        published_at: status === 'published' ? (dto.published_at ? new Date(dto.published_at) : new Date()) : null,
        scheduled_at: status === 'scheduled' && dto.scheduled_at ? new Date(dto.scheduled_at) : null,
        featured_image_url,
        featured_image_public_id,
      }),
    );

    await this.syncBlogTaxonomy(saved.id, dto);
    await this.autoGenerateSeoForBlog(saved);
    if (ogFile) await this.applySeoOgImage(saved.id, custom_og_image);
    return saved;
  }

  async updateBlog(
    id: number,
    dto: {
      title?:               string;
      slug?:                string;
      excerpt?:             string;
      content?:             string;
      content_delta?:       object;
      featured_image_alt?:  string;
      reading_time?:        string;
      category?:            string;
      tags?:                string[];
      primary_author_name?: string;
      co_authors?:          Array<{ name: string; designation?: string }>;
      related_article_ids?: number[];
      related_service_keys?: string[];
      canonical_url?:       string;
      custom_og_image?:     string;
      no_index?:            boolean;
      no_follow?:           boolean;
      featured_status?:     boolean;
      status?:              string;
      scheduled_at?:        string;
      published_at?:        string;
    },
    file?: Express.Multer.File,
    ogFile?: Express.Multer.File,
  ) {
    const b = await this.findBlog(id);

    // ── Sync status/schedule if explicitly supplied in dto ─────────────
    if (dto.status && (dto.status !== b.status || (dto.status === 'scheduled' && dto.scheduled_at))) {
      const updated = await this.changeBlogStatus(id, dto.status, dto.scheduled_at);
      b.status = updated.status;
      b.scheduled_at = updated.scheduled_at;
      b.published_at = updated.published_at;
    }
    delete (dto as any).status;
    delete (dto as any).scheduled_at;
    delete (dto as any).published_at;

    // ── Auto published_at ─────────────────────────────────────
    if (dto.status === 'published' && !b.published_at) {
      (dto as any).published_at = new Date();
    }

    // ── Slug: only regenerate when a new one is explicitly provided ──
    if (dto.slug !== undefined && dto.slug.trim()) {
      const candidate = cleanSlug(dto.slug);
      const unique = await this.ensureUniqueSlug(candidate, id);
      (dto as any).slug = unique;
    }

    // ── Replace featured image if new file provided ───────────
    let featured_image_url       = b.featured_image_url;
    let featured_image_public_id = b.featured_image_public_id;

    if (file) {
      // Delete old from Cloudinary
      if (b.featured_image_public_id) {
        await this.cloudinary.deleteFile(b.featured_image_public_id);
      }
      const uploaded = await this.cloudinary.uploadFile(
        file,
        'cms/blogs',
        `blog-featured-${id}-${Date.now()}`,
      );
      featured_image_url       = uploaded.url;
      featured_image_public_id = uploaded.public_id;
    }

    // ── OG image ──────────────────────────────────────────────
    const dtoCustomOg = (dto.custom_og_image === undefined || dto.custom_og_image === null)
      ? undefined
      : String(dto.custom_og_image).trim();
    let customOgImage = dtoCustomOg === undefined ? b.custom_og_image : dtoCustomOg || null;
    let hasOgUpload = false;
    if (ogFile) {
      const uploaded = await this.cloudinary.uploadFile(
        ogFile,
        'cms/blogs/og',
        `blog-og-${id}-${Date.now()}`,
      );
      customOgImage = uploaded.url;
      hasOgUpload = true;
    }

    const { seo_meta, ...blogData } = b as any;
    const featured_image_alt =
      dto.featured_image_alt !== undefined && dto.featured_image_alt !== ''
        ? dto.featured_image_alt.trim()
        : (dto.title && dto.title.trim()) || b.featured_image_alt || null;

    const excerpt =
      dto.excerpt !== undefined && dto.excerpt !== ''
        ? dto.excerpt.trim()
        : this.autoExcerpt(dto.content !== undefined ? dto.content : b.content)
          || (dto.title && dto.title.trim())
          || b.excerpt
          || null;

    const reading_time =
      dto.reading_time !== undefined && dto.reading_time.trim() !== ''
        ? dto.reading_time.trim()
        : this.autoReadingTime(dto.content !== undefined ? dto.content : b.content)
          || b.reading_time
          || null;

    const saved = await this.blogRepo.save({
      ...blogData,
      ...dto,
      excerpt,
      reading_time,
      featured_image_alt,
      custom_og_image: customOgImage,
      content: dto.content !== undefined ? normalizeEmbedUrls(dto.content) : b.content,
      featured_image_url,
      featured_image_public_id,
    });

    await this.syncBlogTaxonomy(saved.id, dto);
    await this.autoGenerateSeoForBlog(saved);
    if (hasOgUpload) await this.applySeoOgImage(saved.id, customOgImage);
    return saved;
  }

  async deleteBlog(id: number) {
    const b = await this.findBlog(id);
    b.is_deleted = true;
    b.slug = `${b.slug}-deleted-${Date.now()}`;
    await this.blogRepo.save(b);
    return { message: 'Blog deleted' };
  }

  // ── Blog Taxonomy Sync (ER wiring) ─────────────────────────────
  // Resolves the denormalized JSON-friendly fields (category / tags / authors)
  // into the normalized ER tables:
  //   category  → blog_categories (+ category_id FK on blogs)
  //   tags      → entity_tags + entity_tag_links (entity_type='blog')
  //   authors   → blog_authors + blog_post_authors (is_primary / display_order)
  private async ensureUniqueSlug(baseSlug: string, excludeId?: number): Promise<string> {
    let candidate = baseSlug || 'post';
    let i = 1;
    for (;;) {
      const qb = this.blogRepo.createQueryBuilder('b')
        .where('b.slug = :candidate', { candidate })
        .andWhere('b.is_deleted = :deleted', { deleted: false });
      if (excludeId) qb.andWhere('b.id != :excludeId', { excludeId });
      const existing = await qb.getOne();
      if (!existing) return candidate;
      candidate = `${baseSlug || 'post'}-${++i}`;
    }
  }

  private autoReadingTime(content?: string): string | null {
    if (!content) return null;
    const plain = content
      .replace(/<[^>]*>/g, ' ')
      .replace(/&nbsp;/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    if (!plain) return null;
    const words = plain.split(' ').filter(Boolean).length;
    const minutes = Math.max(1, Math.ceil(words / 200));
    return `${minutes} min read`;
  }

  private async syncBlogTags(postId: number, rawTags?: string[]) {
    const tagNames = Array.from(new Set(
      (rawTags || [])
        .map((t) => String(t).trim().replace(/,/g, ''))
        .filter(Boolean)
        .map((t) => t.toLowerCase()),
    ));

    let tagIds: number[] = [];
    if (tagNames.length > 0) {
      // 1) Single indexed round-trip on LOWER(entity_tags.name)
      const existing = await this.tagRepo.createQueryBuilder('t')
        .where('LOWER(t.name) IN (:...names)', { names: tagNames })
        .getMany();

      const tagByLower = new Map(existing.map((t) => [t.name.toLowerCase(), t]));

      // Revive soft-deleted matches in one batch (unique name constraint)
      const toRevive = existing.filter((t) => t.is_deleted);
      if (toRevive.length) {
        await this.tagRepo.save(
          toRevive.map((t) => ({ ...t, is_deleted: false, slug: cleanSlug(t.name) })),
        );
      }

      // 2) Batch-insert only genuinely new tags
      const missing = tagNames.filter((n) => !tagByLower.has(n));
      if (missing.length) {
        const created = await this.tagRepo.save(
          missing.map((n) => this.tagRepo.create({ name: n, slug: cleanSlug(n) })),
        );
        created.forEach((t) => tagByLower.set(t.name.toLowerCase(), t));
      }

      tagIds = tagNames
        .map((n) => tagByLower.get(n))
        .filter((t): t is EntityTag => Boolean(t))
        .map((t) => Number(t.id));
    }

    // 3) Synchronize polymorphic entity_tag_links + clean array on blogs.tags
    await this.tagLinkRepo.delete({ entity_type: 'blog', entity_id: postId });
    if (tagIds.length > 0) {
      await this.tagLinkRepo.insert(
        tagIds.map((tag_id) => this.tagLinkRepo.create({
          entity_type: 'blog',
          entity_id: postId,
          tag_id,
        })),
      );
    }
    await this.blogRepo.update(postId, { tags: tagNames });
  }

  private async syncBlogTaxonomy(
    postId: number,
    dto: {
      category?: string;
      tags?: string[];
      primary_author_name?: string;
      co_authors?: Array<{ name: string; designation?: string }>;
    },
  ) {
    // ── Category → blog_categories + category_id FK ──
    if (dto.category !== undefined) {
      const name = String(dto.category).trim();
      let categoryRecord: BlogCategory | null = null;
      if (name) {
        categoryRecord = await this.categoryRepo
          .createQueryBuilder('c')
          .where('LOWER(c.name) = LOWER(:name)', { name })
          .andWhere('c.is_deleted = :deleted', { deleted: false })
          .getOne();
        if (!categoryRecord) {
          // Revive soft-deleted category (unique name/slug) instead of a fresh row
          const deleted = await this.categoryRepo
            .createQueryBuilder('c')
            .where('LOWER(c.name) = LOWER(:name)', { name })
            .getOne();
          if (deleted) {
            deleted.is_deleted = false;
            deleted.slug = cleanSlug(name);
            categoryRecord = await this.categoryRepo.save(deleted);
          } else {
            categoryRecord = await this.categoryRepo.save(
              this.categoryRepo.create({
                name,
                slug: cleanSlug(name),
              }),
            );
          }
        }
      }
      await this.blogRepo.update(postId, {
        category: name || null,
        category_id: categoryRecord ? Number(categoryRecord.id) : null,
      });
    }

    // ── Tags → entity_tags + entity_tag_links (indexed batch sync) ──
    if (dto.tags !== undefined) {
      await this.syncBlogTags(postId, dto.tags);
    }

    // ── Authors → blog_authors + blog_post_authors ──
    if (dto.primary_author_name !== undefined || dto.co_authors !== undefined) {
      const authors: Array<{ name: string; designation?: string }> = [];
      const primary = (dto.primary_author_name || '').trim();
      if (primary) authors.push({ name: primary });
      for (const c of (dto.co_authors || [])) {
        const name = (c.name || '').trim();
        if (name) authors.push({ name, designation: (c.designation || '').trim() || undefined });
      }

      const resolved: Array<{ authorId: number; isPrimary: boolean; order: number }> = [];
      for (let i = 0; i < authors.length; i++) {
        const a = authors[i];
        let author = await this.authorRepo
          .createQueryBuilder('a')
          .where('LOWER(a.name) = LOWER(:name)', { name: a.name })
          .getOne();
        if (!author) {
          author = await this.authorRepo.save(
            this.authorRepo.create({ name: a.name, designation: a.designation ?? null }),
          );
        }
        resolved.push({ authorId: Number(author.id), isPrimary: i === 0, order: i });
      }

      await this.postAuthorRepo.delete({ post_id: postId });
      if (resolved.length > 0) {
        await this.postAuthorRepo.save(
          resolved.map((r) => this.postAuthorRepo.create({
            post_id: postId,
            author_id: r.authorId,
            is_primary: r.isPrimary,
            display_order: r.order,
          })),
        );
      }
    }
  }

  private async applySeoOgImage(blogId: number, ogImageUrl: string | null) {
    const seo = await this.seoRepo.findOne({ where: { entity_type: 'blog', entity_id: blogId } });
    if (seo) {
      seo.og_image_url = ogImageUrl;
      await this.seoRepo.save(seo);
    }
  }

  private async backfillBlogTaxonomy() {
    const blogs = await this.blogRepo.find({ where: { is_deleted: false } });
    for (const b of blogs) {
      if (b.category || (Array.isArray(b.tags) && b.tags.length) || b.primary_author_name) {
        await this.syncBlogTaxonomy(b.id, {
          category: b.category ?? undefined,
          tags: b.tags ?? undefined,
          primary_author_name: b.primary_author_name ?? undefined,
          co_authors: b.co_authors ?? undefined,
        });
      }
    }
    console.log(`[BlogTaxonomy] Backfilled ER taxonomy for ${blogs.length} blog(s).`);
  }

  // ── Blog Categories ────────────────────────────────────────────
  async findAllCategories() {
    const categories = await this.categoryRepo.find({ where: { is_deleted: false }, order: { name: 'ASC' } });
    const rows = await this.blogRepo
      .createQueryBuilder('b')
      .select('b.category_id', 'category_id')
      .addSelect('COUNT(*)', 'cnt')
      .where('b.is_deleted = :deleted', { deleted: false })
      .andWhere('b.category_id IS NOT NULL')
      .groupBy('b.category_id')
      .getRawMany();
    const countMap = new Map(rows.map((r) => [Number(r.category_id), Number(r.cnt)]));
    return categories.map((c) => ({ ...c, posts_count: countMap.get(Number(c.id)) || 0 }));
  }

  async createCategory(data: Partial<BlogCategory>) {
    const name = String(data.name || '').trim();
    if (!name) throw new BadRequestException('Category name is required');
    const slug = (data.slug || cleanSlug(name));
    const existing = await this.categoryRepo
      .createQueryBuilder('c')
      .where('LOWER(c.name) = LOWER(:name)', { name })
      .getOne();
    if (existing) {
      // Revive soft-deleted category instead of violating the unique name
      if (existing.is_deleted) {
        existing.is_deleted = false;
        existing.name = name;
        existing.slug = slug;
        return this.categoryRepo.save(existing);
      }
      return existing;
    }
    return this.categoryRepo.save(this.categoryRepo.create({ ...data, name, slug }));
  }

  async updateCategory(id: number, data: Partial<BlogCategory>) {
    const item = await this.categoryRepo.findOneBy({ id });
    if (!item) throw new NotFoundException('Blog category not found');
    Object.assign(item, data);
    if (item.is_deleted) item.is_deleted = false;
    return this.categoryRepo.save(item);
  }

  async deleteCategory(id: number) {
    const item = await this.categoryRepo.findOneBy({ id });
    if (!item) throw new NotFoundException('Blog category not found');
    item.is_deleted = true;
    await this.categoryRepo.save(item);
    return { message: 'Blog category deleted' };
  }

  // ── Blog Authors ───────────────────────────────────────────────
  async findAllAuthors(search?: string, excludeNames?: string[], excludeIds?: number[]) {
    let qb = this.authorRepo.createQueryBuilder('a');
    if (search && search.trim()) {
      qb = qb.andWhere('(a.name ILIKE :s OR a.designation ILIKE :s OR a.bio ILIKE :s)', { s: `%${search.trim()}%` });
    }
    if (excludeIds && excludeIds.length > 0) {
      qb = qb.andWhere('a.id NOT IN (:...excludeIds)', { excludeIds });
    }
    if (excludeNames && excludeNames.length > 0) {
      qb = qb.andWhere('LOWER(a.name) NOT IN (:...excludeNames)', {
        excludeNames: excludeNames.map((n) => n.toLowerCase().trim()),
      });
    }
    const authors = await qb.orderBy('a.name', 'ASC').getMany();
    const rows = await this.postAuthorRepo
      .createQueryBuilder('pa')
      .select('pa.author_id', 'author_id')
      .addSelect('COUNT(*)', 'cnt')
      .groupBy('pa.author_id')
      .getRawMany();
    const countMap = new Map(rows.map((r) => [Number(r.author_id), Number(r.cnt)]));
    return authors.map((a) => ({ ...a, posts_count: countMap.get(Number(a.id)) || 0 }));
  }

  async uploadAuthorAvatar(id: number, file: Express.Multer.File) {
    const item = await this.authorRepo.findOneBy({ id });
    if (!item) throw new NotFoundException('Blog author not found');
    const uploaded = await this.cloudinary.uploadFile(
      file,
      'cms/authors',
      `author-avatar-${id}-${Date.now()}`,
    );
    if (item.avatar_public_id) {
      await this.cloudinary.deleteFile(item.avatar_public_id).catch(() => {});
    }
    item.avatar_url = uploaded.url;
    item.avatar_public_id = uploaded.public_id;
    return this.authorRepo.save(item);
  }

  async deleteAuthorAvatar(id: number) {
    const item = await this.authorRepo.findOneBy({ id });
    if (!item) throw new NotFoundException('Blog author not found');
    if (item.avatar_public_id) {
      await this.cloudinary.deleteFile(item.avatar_public_id).catch(() => {});
    }
    item.avatar_url = null;
    item.avatar_public_id = null;
    await this.authorRepo.save(item);
    return { message: 'Avatar removed' };
  }

  async createAuthor(data: Partial<BlogAuthor>) {
    return this.authorRepo.save(this.authorRepo.create(data));
  }

  async updateAuthor(id: number, data: Partial<BlogAuthor>) {
    const item = await this.authorRepo.findOneBy({ id });
    if (!item) throw new NotFoundException('Blog author not found');
    Object.assign(item, data);
    return this.authorRepo.save(item);
  }

  async deleteAuthor(id: number) {
    const item = await this.authorRepo.findOneBy({ id });
    if (!item) throw new NotFoundException('Blog author not found');
    if (item.avatar_public_id) {
      await this.cloudinary.deleteFile(item.avatar_public_id).catch(() => {});
    }
    await this.authorRepo.remove(item);
    return { message: 'Blog author deleted' };
  }

  // ── Scheduled Publishing Cron ──────────────────────────────────
  @Cron('59 23 * * *') // Every day at 11:59 PM server time
  async publishScheduledBlogs() {
    try {
      const due = await this.blogRepo.find({
        where: { status: 'scheduled', is_deleted: false, scheduled_at: LessThanOrEqual(new Date()) },
      });
      for (const blog of due) {
        blog.status = 'published';
        if (!blog.published_at) blog.published_at = new Date();
        blog.scheduled_at = null;
        await this.blogRepo.save(blog);
        await this.autoGenerateSeoForBlog(blog);
      }
      if (due.length > 0) console.log(`[BlogCron] Nightly publish executed: ${due.length} scheduled blog(s) published.`);
    } catch (err) {
      console.error('[BlogCron] Scheduled publish failed:', err);
    }
  }

  async onModuleInit() {
    setTimeout(() => this.backfillBlogSeo(), 5000);
    setTimeout(() => this.backfillBlogTaxonomy(), 8000);
  }

  async backfillBlogSeo() {
    try {
      const blogs = await this.blogRepo.find({
        where: { is_deleted: false },
      });
      for (const b of blogs) {
        await this.autoGenerateSeoForBlog(b);
      }
      console.log(`[SEO Backfill] Completed blog SEO backfill for ${blogs.length} blogs.`);
    } catch (err) {
      console.error('[SEO Backfill] Failed blog SEO backfill:', err);
    }
  }

  private autoExcerpt(content?: string): string | null {
    if (!content) return null;
    const plain = content
      .replace(/<[^>]*>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&#39;/g, "'")
      .replace(/&quot;/g, '"')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/\s+/g, ' ')
      .trim();
    if (!plain) return null;
    return plain.length > 160 ? plain.slice(0, 160).trim() + '...' : plain;
  }

  async autoGenerateSeoForBlog(blog: Blog) {
    const defaultTitle = blog.title;
    const defaultDesc = this.autoExcerpt(blog.content);
    const defaultOgUrl = blog.featured_image_url || null;
    
    const defaultKeywords = [
      ...(Array.isArray(blog.tags) ? blog.tags.map(t => String(t).trim().replace(/,/g, '')).filter(Boolean) : []),
      blog.title,
      'MilanoVA Technologies',
      'software engineering',
      'technology blog',
    ]
      .filter(Boolean)
      .join(', ');

    let seo = await this.seoRepo.findOne({ where: { entity_type: 'blog', entity_id: blog.id } });
    if (!seo) {
      seo = this.seoRepo.create({
        entity_type: 'blog',
        entity_id: blog.id,
        meta_title: defaultTitle,
        meta_description: defaultDesc || null,
        og_image_url: defaultOgUrl || null,
        keywords: defaultKeywords,
        indexable: true,
      });
      await this.seoRepo.save(seo);
    } else {
      let changed = false;
      if (!seo.meta_title) { seo.meta_title = defaultTitle; changed = true; }
      if (!seo.meta_description && defaultDesc) { seo.meta_description = defaultDesc; changed = true; }
      if (!seo.og_image_url && defaultOgUrl) { seo.og_image_url = defaultOgUrl; changed = true; }
      if (!seo.keywords) { seo.keywords = defaultKeywords; changed = true; }
      if (changed) {
        await this.seoRepo.save(seo);
      }
    }
  }

  async upsertBlogSeo(blogId: number, dto: any) {
    if (dto.meta_description) {
      dto.meta_description = dto.meta_description
        .replace(/<[^>]*>/g, ' ')
        .replace(/&nbsp;/g, ' ')
        .replace(/&#39;/g, "'")
        .replace(/&quot;/g, '"')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&[a-zA-Z0-9#]+;/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
    }

    // Default keywords derive from the blog's tags when not provided
    if (dto.keywords === undefined || String(dto.keywords).trim() === '') {
      const blog = await this.blogRepo.findOneBy({ id: blogId });
      const tags = Array.isArray(blog?.tags)
        ? blog.tags.map(t => String(t).trim().replace(/,/g, '')).filter(Boolean)
        : [];
      const fallback = [
        ...tags,
        blog?.title,
        'MilanoVA Technologies',
        'software engineering',
        'technology blog',
      ].filter(Boolean).join(', ');
      if (fallback) dto.keywords = fallback;
    }

    const seo = await this.seoRepo.findOne({ where: { entity_type: 'blog', entity_id: blogId } });
    if (seo) return this.seoRepo.save({ ...seo, ...dto });
    return this.seoRepo.save(this.seoRepo.create({ entity_type: 'blog', entity_id: blogId, ...dto }));
  }
}
