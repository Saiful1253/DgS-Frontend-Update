import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Testimonial } from './entities/testimonial.entity';
import { QueryTestimonialsDto } from './dto/query-testimonials.dto';
import { CloudinaryService } from '../upload/cloudinary.service';

@Injectable()
export class TestimonialsService {
  constructor(
    @InjectRepository(Testimonial)
    private readonly repo: Repository<Testimonial>,
    private readonly cloudinary: CloudinaryService,
  ) {}

  /**
   * Helper to serialize a testimonial with customer_name and unified image_url
   */
  private formatItem(item: Testimonial): Testimonial & { customer_name: string } {
    return {
      ...item,
      customer_name: item.author_name,
      image_url: item.image_url || item.avatar_url,
      avatar_url: item.avatar_url || item.image_url,
    };
  }

  /**
   * ADMIN: List testimonials with filters & pagination
   */
  async findAll(query: QueryTestimonialsDto = {}) {
    const qb = this.repo
      .createQueryBuilder('t')
      .where('t.is_deleted = false');

    const sortBy = query.sortBy || 'created_at';
    const order = (query.order?.toUpperCase() === 'ASC') ? 'ASC' : 'DESC';

    if (sortBy === 'rating') {
      qb.orderBy('t.rating', order).addOrderBy('t.created_at', 'DESC');
    } else if (sortBy === 'author_name' || sortBy === 'name') {
      qb.orderBy('t.author_name', order).addOrderBy('t.created_at', 'DESC');
    } else {
      qb.orderBy('t.created_at', order);
    }

    if (query.featuredOnly || query.is_featured === true) {
      qb.andWhere('t.is_featured = true');
    } else if (query.is_featured === false) {
      qb.andWhere('t.is_featured = false');
    }

    if (query.status && query.status !== 'all') {
      qb.andWhere('t.status = :status', { status: query.status });
    }

    if (query.type && query.type !== 'all') {
      qb.andWhere('t.type = :type', { type: query.type });
    }

    if (query.is_active !== undefined) {
      qb.andWhere('t.is_active = :is_active', { is_active: query.is_active });
    }

    if (query.source_platform) {
      qb.andWhere('t.source_platform = :source_platform', {
        source_platform: query.source_platform,
      });
    }

    if (query.search) {
      qb.andWhere(
        '(t.author_name ILIKE :q OR t.author_company ILIKE :q OR t.content ILIKE :q)',
        { q: `%${query.search}%` },
      );
    }

    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    qb.skip((page - 1) * limit).take(limit);

    const [rawItems, total] = await qb.getManyAndCount();
    const data = rawItems.map((item) => this.formatItem(item));

    return {
      data,
      total,
      page,
      limit,
      pages: Math.max(1, Math.ceil(total / limit)),
    };
  }

  /**
   * ADMIN: Stats summary
   */
  async getStats() {
    const qb = this.repo.createQueryBuilder('t').where('t.is_deleted = false');

    const total = await qb.getCount();
    const approved = await this.repo.count({ where: { status: 'approved', is_deleted: false } });
    const pending = await this.repo.count({ where: { status: 'pending', is_deleted: false } });
    const rejected = await this.repo.count({ where: { status: 'rejected', is_deleted: false } });
    const featured = await this.repo.count({ where: { is_featured: true, is_deleted: false } });

    const avgResult = await this.repo
      .createQueryBuilder('t')
      .select('AVG(t.rating)', 'avg')
      .where('t.is_deleted = false AND t.status = :status', { status: 'approved' })
      .getRawOne();

    const averageRating = avgResult?.avg ? parseFloat(Number(avgResult.avg).toFixed(1)) : 5.0;

    return {
      total,
      approved,
      pending,
      rejected,
      featured,
      averageRating,
    };
  }

  /**
   * PUBLIC: List all approved testimonials (storefront / client)
   */
  async findApproved(page = 1, limit = 10, type?: string) {
    const qb = this.repo
      .createQueryBuilder('t')
      .where('t.is_deleted = false')
      .andWhere('t.status = :status', { status: 'approved' })
      .orderBy('t.is_featured', 'DESC')
      .addOrderBy('t.display_order', 'ASC')
      .addOrderBy('t.created_at', 'DESC');

    if (type && type !== 'all') {
      qb.andWhere('t.type = :type', { type });
    }

    const [rawItems, total] = await qb.skip((page - 1) * limit).take(limit).getManyAndCount();
    const data = rawItems.map((item) => this.formatItem(item));

    return {
      data,
      total,
      page,
      limit,
      pages: Math.max(1, Math.ceil(total / limit)),
    };
  }

  /**
   * PUBLIC: All featured and approved testimonials for client marquee loop
   */
  async findFeatured() {
    const rawItems = await this.repo.find({
      where: { status: 'approved', is_featured: true, is_deleted: false },
      order: { display_order: 'ASC', created_at: 'DESC' },
    });
    return rawItems.map((item) => this.formatItem(item));
  }

  /**
   * Public legacy endpoint compatibility
   */
  async findAllPublic() {
    const rawItems = await this.repo.find({
      where: { status: 'approved', is_deleted: false },
      order: { is_featured: 'DESC', display_order: 'ASC' },
    });
    return rawItems.map((item) => this.formatItem(item));
  }

  async findOne(id: number) {
    const item = await this.repo.findOneBy({ id });
    if (!item || item.is_deleted) throw new NotFoundException('Testimonial not found');
    return this.formatItem(item);
  }

  /**
   * ADMIN: Create review with optional image upload
   */
  async create(data: Record<string, any>, file?: Express.Multer.File) {
    let image_url = data.image_url || data.avatar_url || null;
    let image_public_id = data.image_public_id || null;

    if (file) {
      const uploaded = await this.cloudinary.uploadFile(file, 'testimonials', `testimonial-${Date.now()}`);
      image_url = uploaded.url;
      image_public_id = uploaded.public_id;
    }

    const author_name = data.author_name || data.customer_name || 'Anonymous';
    const status = data.status ?? 'approved';
    const is_active = status === 'approved';
    const is_featured = status === 'rejected' ? false : Boolean(data.is_featured ?? false);
    const type = data.type ?? (file || image_url ? 'image' : 'text');

    const item = this.repo.create({
      ...data,
      author_name,
      rating: data.rating ? Number(data.rating) : 5,
      content: data.content,
      type,
      status,
      is_active,
      is_featured,
      source: data.source ?? 'admin',
      image_url,
      avatar_url: image_url,
      image_public_id,
      kind: data.kind ?? 'review',
    });

    const saved = await this.repo.save(item);
    return this.formatItem(saved);
  }

  /**
   * ADMIN: Update review with optional replacement image
   */
  async update(id: number, data: Record<string, any>, file?: Express.Multer.File) {
    const item = await this.repo.findOneBy({ id });
    if (!item || item.is_deleted) throw new NotFoundException('Testimonial not found');

    let image_url = data.image_url ?? item.image_url;
    let image_public_id = item.image_public_id;

    if (file) {
      if (item.image_public_id) {
        try {
          await this.cloudinary.deleteFile(item.image_public_id);
        } catch {
          // ignore cleanup failures
        }
      }
      const uploaded = await this.cloudinary.uploadFile(file, 'testimonials', `testimonial-${id}-${Date.now()}`);
      image_url = uploaded.url;
      image_public_id = uploaded.public_id;
    }

    if (data.author_name || data.customer_name) {
      item.author_name = data.author_name || data.customer_name;
    }
    if (data.content !== undefined) item.content = data.content;
    if (data.rating !== undefined) item.rating = Number(data.rating);
    if (data.type !== undefined) item.type = data.type;
    if (data.author_role !== undefined) item.author_role = data.author_role;
    if (data.author_company !== undefined) item.author_company = data.author_company;
    if (data.source_platform !== undefined) item.source_platform = data.source_platform;
    if (data.display_order !== undefined) item.display_order = Number(data.display_order);

    if (data.status !== undefined) {
      item.status = data.status;
      item.is_active = data.status === 'approved';
      if (data.status === 'rejected') {
        item.is_featured = false;
      }
    }

    if (data.is_featured !== undefined) {
      item.is_featured = (item.status === 'rejected') ? false : Boolean(data.is_featured);
    }

    item.image_url = image_url;
    item.avatar_url = image_url;
    item.image_public_id = image_public_id;

    const saved = await this.repo.save(item);
    return this.formatItem(saved);
  }

  /**
   * ADMIN: Update review status (approved/pending/rejected)
   */
  async setStatus(id: number, status: 'pending' | 'approved' | 'rejected') {
    const item = await this.repo.findOneBy({ id });
    if (!item || item.is_deleted) throw new NotFoundException('Testimonial not found');
    item.status = status;
    item.is_active = status === 'approved';
    if (status === 'rejected') {
      item.is_featured = false;
    }
    const saved = await this.repo.save(item);
    return this.formatItem(saved);
  }

  /**
   * ADMIN: Make review featured or remove it
   */
  async setFeatured(id: number, is_featured: boolean) {
    const item = await this.repo.findOneBy({ id });
    if (!item || item.is_deleted) throw new NotFoundException('Testimonial not found');
    if (is_featured && item.status === 'rejected') {
      throw new BadRequestException('Cannot feature a rejected testimonial');
    }
    item.is_featured = Boolean(is_featured);
    const saved = await this.repo.save(item);
    return this.formatItem(saved);
  }

  /**
   * ADMIN: Delete review
   */
  async remove(id: number) {
    const item = await this.repo.findOneBy({ id });
    if (!item || item.is_deleted) throw new NotFoundException('Testimonial not found');

    if (item.image_public_id) {
      try {
        await this.cloudinary.deleteFile(item.image_public_id);
      } catch {
        // ignore asset cleanup failure
      }
    }

    item.is_deleted = true;
    item.is_active = false;
    await this.repo.save(item);
    return { success: true, message: 'Testimonial deleted successfully' };
  }

  /**
   * STOREFRONT / CLIENT: Customer submits feedback (pending moderation)
   */
  async submit(
    dto: {
      customer_name?: string;
      author_name?: string;
      rating?: number;
      content?: string;
      author_role?: string;
      author_company?: string;
    },
    file?: Express.Multer.File,
  ) {
    let image_url: string | null = null;
    let image_public_id: string | null = null;

    if (file) {
      const uploaded = await this.cloudinary.uploadFile(file, 'testimonials', `testimonial-client-${Date.now()}`);
      image_url = uploaded.url;
      image_public_id = uploaded.public_id;
    }

    const author_name = dto.customer_name || dto.author_name || 'Valued Client';

    const item = this.repo.create({
      author_name,
      rating: dto.rating ? Number(dto.rating) : 5,
      content: dto.content,
      author_role: dto.author_role || null,
      author_company: dto.author_company || null,
      type: file ? 'image' : 'text',
      status: 'pending',
      is_active: false,
      is_featured: false,
      source: 'client',
      image_url,
      avatar_url: image_url,
      image_public_id,
      kind: 'review',
    });

    const saved = await this.repo.save(item);
    return this.formatItem(saved);
  }
}