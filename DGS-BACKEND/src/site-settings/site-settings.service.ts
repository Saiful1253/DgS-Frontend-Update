import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SiteSetting } from './entities/site-setting.entity';
import { CloudinaryService } from '@/upload/cloudinary.service';

@Injectable()
export class SiteSettingsService {
  constructor(
    @InjectRepository(SiteSetting) private settingRepo: Repository<SiteSetting>,
    private cloudinary: CloudinaryService,
  ) {}

  async getAllSettings() {
    const rows = await this.settingRepo.find();
    return rows.reduce((acc, r) => ({ ...acc, [r.key]: r.value }), {});
  }

  async getSetting(key: string) {
    return this.settingRepo.findOne({ where: { key } });
  }

  async upsertSetting(key: string, value: string) {
    const existing = await this.settingRepo.findOne({ where: { key } });
    if (existing) return this.settingRepo.save({ ...existing, value });
    return this.settingRepo.save(this.settingRepo.create({ key, value }));
  }

  async bulkUpsertSettings(settings: Record<string, string>) {
    // Arbitrary key→value map: a class-validator DTO cannot express dynamic keys,
    // so the shape is validated explicitly here (never trust the raw payload).
    if (!settings || typeof settings !== 'object' || Array.isArray(settings)) {
      throw new BadRequestException('Body must be a flat key-value object');
    }

    const entries = Object.entries(settings);
    if (entries.length === 0) {
      throw new BadRequestException('Body must contain at least one setting');
    }

    for (const [key, value] of entries) {
      if (!key || key.length > 100) {
        throw new BadRequestException(`Invalid setting key: "${key}" (max 100 chars)`);
      }
      if (typeof value !== 'string') {
        throw new BadRequestException(`Setting "${key}" must be a string`);
      }
    }

    const results = [];
    for (const [key, value] of entries) {
      results.push(await this.upsertSetting(key, value));
    }
    return results;
  }

  async uploadCompanyLogo(file: Express.Multer.File) {
    // Delete old logo from Cloudinary if one exists
    const existing = await this.settingRepo.findOne({ where: { key: 'company_logo_public_id' } });
    if (existing?.value) {
      await this.cloudinary.deleteFile(existing.value);
    }

    const uploaded = await this.cloudinary.uploadFile(
      file,
      'company',
      `logo-${Date.now()}`,
    );

    await this.upsertSetting('company_logo', uploaded.url);
    await this.upsertSetting('company_logo_public_id', uploaded.public_id);

    return {
      url: uploaded.url,
      public_id: uploaded.public_id,
      width: uploaded.width,
      height: uploaded.height,
      format: uploaded.format,
    };
  }

  async uploadFavicon(file: Express.Multer.File) {
    const existing = await this.settingRepo.findOne({ where: { key: 'site_favicon_public_id' } });
    if (existing?.value) {
      await this.cloudinary.deleteFile(existing.value);
    }

    const uploaded = await this.cloudinary.uploadFile(
      file,
      'company',
      `favicon-${Date.now()}`,
    );

    await this.upsertSetting('site_favicon', uploaded.url);
    await this.upsertSetting('site_favicon_public_id', uploaded.public_id);

    return {
      url: uploaded.url,
      public_id: uploaded.public_id,
      width: uploaded.width,
      height: uploaded.height,
      format: uploaded.format,
    };
  }
}
