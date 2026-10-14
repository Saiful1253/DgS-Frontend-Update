import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { HeroSection } from './entities/hero-section.entity';
import { HeroMedia } from './entities/hero-media.entity';
import { CloudinaryService } from '@/upload/cloudinary.service';

@Injectable()
export class HeroService {
  constructor(
    @InjectRepository(HeroSection) private heroRepo: Repository<HeroSection>,
    @InjectRepository(HeroMedia) private mediaRepo: Repository<HeroMedia>,
    private cloudinary: CloudinaryService,
  ) {}

  // ── Hero Sections ─────────────────────────────────────────────
  async findHero(page = 1, limit = 10) {
    const safePage  = Math.max(1, +page);
    const safeLimit = Math.min(50, Math.max(1, +limit));

    const [data, total] = await this.heroRepo.findAndCount({
      where: { is_deleted: false },
      relations: ['media'],
      order:     { id: 'ASC' },
      skip:      (safePage - 1) * safeLimit,
      take:      safeLimit,
    });

    data.forEach(h => {
      if (h.media) {
        h.media = h.media.filter(m => !m.is_deleted);
      }
    });

    return {
      data,
      total,
      page:  safePage,
      limit: safeLimit,
      pages: Math.ceil(total / safeLimit),
    };
  }

  async findOneHero(id: number) {
    const h = await this.heroRepo.findOne({ where: { id, is_deleted: false }, relations: ['media'] });
    if (!h) throw new NotFoundException('Hero section not found');
    if (h.media) {
      h.media = h.media.filter(m => !m.is_deleted);
    }
    return h;
  }

  async createHeroSection(dto: any) {
    const status = this.resolveHeroStatus(dto) ?? 'draft';
    delete dto.is_active;

    // ── If publishing variant → demote all other variants to inactive (single-active) ──
    if (status === 'active') {
      await this.heroRepo.update({ status: 'active' }, { status: 'inactive' });
    }
    const { media, ...cleanDto } = dto;
    return this.heroRepo.save(this.heroRepo.create({ ...cleanDto, status }));
  }

  async updateHeroSection(id: number, dto: any) {
    const h = await this.findOneHero(id);
    const status = this.resolveHeroStatus(dto) ?? h.status ?? 'draft';
    delete dto.is_active;

    // ── If publishing variant → demote all other variants to inactive (single-active) ──
    if (status === 'active') {
      await this.heroRepo.update({ status: 'active' }, { status: 'inactive' });
    }
    const { media, ...cleanHero } = { ...h, ...dto, status };
    return this.heroRepo.save(cleanHero);
  }

  async findActiveHero() {
    const hero = await this.heroRepo.findOne({
      where: { status: 'active', is_deleted: false },
      relations: ['media'],
    });
    if (!hero) return null;
    if (hero.media) {
      hero.media = hero.media.filter((m) => !m.is_deleted && m.is_active);
    }
    return hero;
  }

  private resolveHeroStatus(dto: any): 'active' | 'inactive' | 'draft' | undefined {
    if (dto.status === 'active' || dto.status === 'inactive' || dto.status === 'draft') return dto.status;
    if (dto.is_active === true || String(dto.is_active) === 'true') return 'active';
    if (dto.is_active === false || String(dto.is_active) === 'false') return 'inactive';
    return undefined;
  }

  async deleteHeroSection(id: number) {
    const h = await this.findOneHero(id);
    const mediaToClean = h.media || [];
    const { media, ...cleanHero } = h;
    cleanHero.is_deleted = true;
    await this.heroRepo.save(cleanHero);
    for (const m of mediaToClean) {
      m.is_deleted = true;
      await this.mediaRepo.save(m);
      if (m.cloudinary_public_id) {
        await this.cloudinary.deleteFile(m.cloudinary_public_id).catch(() => {});
      }
    }
    return { message: 'Hero section deleted' };
  }

  // ── Hero Media ────────────────────────────────────────────────
  async getHeroMedia(heroSectionId: number) {
    return this.mediaRepo.find({
      where: { hero_section_id: heroSectionId, is_deleted: false },
      order: { sort_order: 'ASC' },
    });
  }

  // Upload image file → Cloudinary → save
  async uploadHeroImage(
    heroSectionId: number,
    file: Express.Multer.File,
    dto: { sort_order?: number; is_active?: boolean },
  ) {
    await this.findOneHero(heroSectionId);

    const uploaded = await this.cloudinary.uploadFile(
      file,
      `cms/hero-${heroSectionId}`,
      `hero-${heroSectionId}-${Date.now()}`,
    );

    const media = await this.mediaRepo.save(
      this.mediaRepo.create({
        hero_section_id:      heroSectionId,
        media_type:           'image',
        media_url:            uploaded.url,
        cloudinary_public_id: uploaded.public_id,
        sort_order:           dto.sort_order ?? 0,
        is_active:            dto.is_active  ?? true,
      }),
    );

    return {
      ...media,
      width:  uploaded.width,
      height: uploaded.height,
      format: uploaded.format,
      bytes:  uploaded.bytes,
    };
  }

  // Upload multiple images at once
  async uploadMultipleHeroImages(
    heroSectionId: number,
    files: Express.Multer.File[],
  ) {
    await this.findOneHero(heroSectionId);

    const results = await Promise.all(
      files.map(async (file, index) => {
        const uploaded = await this.cloudinary.uploadFile(
          file,
          `cms/hero-${heroSectionId}`,
          `hero-${heroSectionId}-${Date.now()}-${index}`,
        );
        const media = await this.mediaRepo.save(
          this.mediaRepo.create({
            hero_section_id:      heroSectionId,
            media_type:           'image',
            media_url:            uploaded.url,
            cloudinary_public_id: uploaded.public_id,
            sort_order:           index,
            is_active:            true,
          }),
        );
        return { ...media, width: uploaded.width, height: uploaded.height, format: uploaded.format, bytes: uploaded.bytes };
      }),
    );

    return results;
  }

  // Add YouTube video by URL
  async addHeroMediaByUrl(
    heroSectionId: number,
    dto: { media_url: string; media_type?: string; sort_order?: number; is_active?: boolean },
  ) {
    await this.findOneHero(heroSectionId);
    if (!dto.media_url || typeof dto.media_url !== 'string') {
      throw new BadRequestException('media_url is required');
    }
    const mediaType = dto.media_type ?? 'youtube';
    const isImageUrl = /\.(png|jpe?g|webp|gif|avif|svg)(\?|$)/i.test(dto.media_url);
    if (mediaType === 'youtube' && !isImageUrl) {
      const isYouTube = /(youtube\.com\/(?:watch\?v=|embed\/|shorts\/|live\/)|youtu\.be\/)/.test(dto.media_url);
      if (!isYouTube) {
        throw new BadRequestException(
          'Invalid video URL. Only YouTube links are allowed (watch?v= | youtu.be | /embed/ | /shorts/).',
        );
      }
    }
    return this.mediaRepo.save(
      this.mediaRepo.create({
        hero_section_id: heroSectionId,
        media_type:      mediaType,
        media_url:       dto.media_url,
        sort_order:      dto.sort_order ?? 0,
        is_active:       dto.is_active  ?? true,
      }),
    );
  }

  // Replace existing media image
  async replaceHeroImage(mediaId: number, heroSectionId: number, file: Express.Multer.File) {
    const m = await this.mediaRepo.findOne({
      where: { id: mediaId, hero_section_id: heroSectionId, is_deleted: false },
    });
    if (!m) throw new NotFoundException('Media not found');

    if (m.cloudinary_public_id) {
      await this.cloudinary.deleteFile(m.cloudinary_public_id);
    }

    const uploaded = await this.cloudinary.uploadFile(
      file,
      `cms/hero-${heroSectionId}`,
      `hero-${heroSectionId}-${Date.now()}`,
    );

    const updated = await this.mediaRepo.save({
      ...m,
      media_url:            uploaded.url,
      cloudinary_public_id: uploaded.public_id,
    });

    return { ...updated, width: uploaded.width, height: uploaded.height, format: uploaded.format, bytes: uploaded.bytes };
  }

  async updateHeroMedia(id: number, dto: any) {
    const m = await this.mediaRepo.findOne({ where: { id, is_deleted: false } });
    if (!m) throw new NotFoundException('Media not found');
    return this.mediaRepo.save({ ...m, ...dto });
  }

  async deleteHeroMedia(id: number) {
    const m = await this.mediaRepo.findOne({ where: { id, is_deleted: false } });
    if (!m) throw new NotFoundException('Media not found');
    if (m.cloudinary_public_id) {
      await this.cloudinary.deleteFile(m.cloudinary_public_id).catch(() => {});
    }
    m.is_deleted = true;
    await this.mediaRepo.save(m);
    return { message: 'Media deleted' };
  }

  async reorderHeroMedia(heroSectionId: number, order: { id: number; sort_order: number }[]) {
    await this.findOneHero(heroSectionId);
    for (const item of order) {
      await this.mediaRepo.update({ id: item.id, hero_section_id: heroSectionId }, { sort_order: item.sort_order });
    }
    return this.getHeroMedia(heroSectionId);
  }
}
