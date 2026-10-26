import { CloudinaryService } from '@/upload/cloudinary.service';
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CompanySetting } from './entities/company-setting.entity';
import { OfficeHub } from './entities/office-hub.entity';
import { Certificate } from './entities/certificate.entity';
import { ComplianceDocument } from './entities/compliance-document.entity';
import { PublicCertificateQueryDto } from './dto/public-certificate-query.dto';
import { AdminCertificateQueryDto } from './dto/admin-certificate-query.dto';

/**
 * Collapse cleared inputs to `null`.
 *
 * A form that empties an optional field submits `""`, and storing that empties
 * the column no worse than a null — except that `thumb_url: ''` renders as a
 * broken image while `thumb_url: null` falls back to `file_url`, and
 * `issuing_authority: ''` prints an empty line under the title.
 */
function emptyStringsToNull<T extends Record<string, unknown>>(data: T): Partial<T> {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(data)) {
    out[key] = typeof value === 'string' && value.trim() === '' ? null : value;
  }
  return out as Partial<T>;
}

@Injectable()
export class SettingsService {
  constructor(
    @InjectRepository(CompanySetting)
    private companyRepo: Repository<CompanySetting>,
    private cloudinary: CloudinaryService,
    @InjectRepository(OfficeHub)
    private hubRepo: Repository<OfficeHub>,
    @InjectRepository(Certificate)
    private certRepo: Repository<Certificate>,
    @InjectRepository(ComplianceDocument)
    private complianceRepo: Repository<ComplianceDocument>,
  ) { }

  // Technologies
  //


  // Company Overview Settings
  async getCompanySettings() {
    let settings = await this.companyRepo.findOne({ where: { id: 1 } });
    if (!settings) {
      settings = this.companyRepo.create({
        id: 1,
        legal_company_name: 'Milanova Technologies S.R.L.',
        brand_name: 'Milanova Technologies',
        primary_headquarters_address: 'Via Rome 45, Milan, Italy',
        official_emails: { general: 'info@milanovatech.com', sales: 'sales@milanovatech.com' },
        calendly_url: 'https://calendly.com/milanova-tech/30min',
      });
      await this.companyRepo.save(settings);
    }
    return settings;
  }

  async updateCompanySettings(data: any) {
    const settings = await this.getCompanySettings();
    Object.assign(settings, data);
    return this.companyRepo.save(settings);
  }

  // Office Hubs
  async findAllOfficeHubs() {
    const qb = this.hubRepo.createQueryBuilder('h')
      .where('h.is_deleted = false')
      .orderBy('h.is_headquarters', 'DESC')
      .addOrderBy('h.display_order', 'ASC');
    return qb.getMany();
  }

  async findAllOfficeHubsPublic() {
    return this.hubRepo.find({
      where: { is_active: true, is_deleted: false },
      order: { is_headquarters: 'DESC', display_order: 'ASC' },
    });
  }

  async findOfficeHub(id: number) {
    const item = await this.hubRepo.findOneBy({ id });
    if (!item || item.is_deleted) throw new NotFoundException('Office hub not found');
    return item;
  }

  async createOfficeHub(data: Partial<OfficeHub>) {
    const item = this.hubRepo.create(data);
    return this.hubRepo.save(item);
  }

  async updateOfficeHub(id: number, data: Partial<OfficeHub>) {
    const item = await this.findOfficeHub(id);
    Object.assign(item, data);
    return this.hubRepo.save(item);
  }

  async removeOfficeHub(id: number) {
    const item = await this.findOfficeHub(id);
    item.is_deleted = true;
    await this.hubRepo.save(item);
    return { success: true };
  }

  async reorderOfficeHubs(order: { id: number; display_order: number }[]) {
    for (const item of order) {
      await this.hubRepo.update(item.id, { display_order: item.display_order });
    }
    return this.findAllOfficeHubs();
  }

  // Certificates
  /**
   * Admin listing: server-paginated, searchable, sortable, filterable.
   *
   * The admin table reads one page at a time rather than the whole library, so
   * `display_order` and `created_at` are the only columns the browser can sort
   * by — those are the two an editor actually reaches for, and keeping the list
   * narrow keeps the ORDER BY allow-list in the DTO short.
   */
  async findAllCertificates(query: AdminCertificateQueryDto = {}) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const term = query.search?.trim();

    const qb = this.certRepo
      .createQueryBuilder('c')
      .where('c.is_deleted = false');

    if (term) {
      // `reg_no` is searched alongside the copy: it is the string a client
      // reads off the storefront card and quotes when asking about a licence.
      qb.andWhere(
        '(c.title ILIKE :term OR c.reg_no ILIKE :term OR c.issuing_authority ILIKE :term OR c.sub_label ILIKE :term)',
        { term: `%${term}%` },
      );
    }

    if (typeof query.is_active === 'boolean') {
      qb.andWhere('c.is_active = :isActive', { isActive: query.is_active });
    }
    if (typeof query.is_featured === 'boolean') {
      qb.andWhere('c.is_featured = :isFeatured', { isFeatured: query.is_featured });
    }
    if (query.file_type) {
      qb.andWhere('c.file_type = :fileType', { fileType: query.file_type });
    }

    const sortBy = query.sortBy ?? 'display_order';
    const direction = (query.sortOrder ?? 'asc').toUpperCase() as 'ASC' | 'DESC';
    // `sortBy` comes from the DTO allow-list, so it is safe to interpolate.
    // `id` breaks ties, otherwise two rows sharing a display order can swap
    // places between pages and the table appears to skip a row.
    qb.orderBy(`c.${sortBy}`, direction).addOrderBy('c.id', 'DESC');

    const [data, total] = await qb.skip((page - 1) * limit).take(limit).getManyAndCount();

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  /**
   * Public listing (spec §4): featured-only for the landing page, otherwise an
   * offset-paged slice for the certificates page. Search spans both title
   * columns plus the issuing authority, which is what a visitor remembers about
   * a licence ("Titas", "ISO 9001") rather than its exact wording.
   */
  async findAllCertificatesPublic(query: PublicCertificateQueryDto = {}) {
    const limit = Math.min(query.limit ?? 20, 60);
    const offset = query.offset ?? 0;
    const term = query.search?.trim();

    const qb = this.certRepo
      .createQueryBuilder('c')
      .where('c.is_active = true')
      .andWhere('c.is_deleted = false');

    if (query.featured) {
      qb.andWhere('c.is_featured = true');
    }

    if (term) {
      qb.andWhere(
        '(c.title ILIKE :term OR c.issuing_authority ILIKE :term)',
        { term: `%${term}%` },
      );
    }

    const [data, total] = await qb
      .orderBy('c.display_order', 'ASC')
      .addOrderBy('c.id', 'DESC')
      .skip(offset)
      .take(limit)
      .getManyAndCount();

    return { data, total, limit, offset, hasMore: offset + data.length < total };
  }

  async findCertificate(id: number) {
    const item = await this.certRepo.findOneBy({ id });
    if (!item || item.is_deleted) throw new NotFoundException('Certificate not found');
    return item;
  }

  async createCertificate(data: Partial<Certificate>) {
    const item = this.certRepo.create({ ...data, ...emptyStringsToNull(data) });
    return this.certRepo.save(item);
  }

  async updateCertificate(id: number, data: Partial<Certificate>) {
    const item = await this.findCertificate(id);
    Object.assign(item, data, emptyStringsToNull(data));
    return this.certRepo.save(item);
  }

  async getCertificateStats() {
    const [total, active, featured] = await Promise.all([
      this.certRepo.count({ where: { is_deleted: false } }),
      this.certRepo.count({ where: { is_active: true, is_deleted: false } }),
      this.certRepo.count({ where: { is_featured: true, is_deleted: false } }),
    ]);
    return { total, active, featured, inactive: total - active };
  }

  async reorderCertificates(order: { id: number; display_order: number }[]) {
    for (const item of order) {
      await this.certRepo.update(item.id, { display_order: item.display_order });
    }
    return { success: true };
  }

  async removeCertificate(id: number) {
    const item = await this.findCertificate(id);
    item.is_deleted = true;
    await this.certRepo.save(item);
    return { success: true };
  }

  // Compliance Documents
  async findAllComplianceDocs() {
    return this.complianceRepo.find({
      where: { is_deleted: false },
      order: { id: 'ASC' },
    });
  }

  async findAllComplianceDocsPublic() {
    return this.complianceRepo.find({
      where: { is_active: true, is_deleted: false },
      order: { id: 'ASC' },
    });
  }

  async findComplianceDoc(id: number) {
    const item = await this.complianceRepo.findOneBy({ id });
    if (!item || item.is_deleted) throw new NotFoundException('Compliance document not found');
    return item;
  }

  async createComplianceDoc(data: Partial<ComplianceDocument>) {
    const item = this.complianceRepo.create(data);
    return this.complianceRepo.save(item);
  }

  async updateComplianceDoc(id: number, data: Partial<ComplianceDocument>) {
    const item = await this.findComplianceDoc(id);
    Object.assign(item, data);
    return this.complianceRepo.save(item);
  }

  async removeComplianceDoc(id: number) {
    const item = await this.findComplianceDoc(id);
    item.is_deleted = true;
    await this.complianceRepo.save(item);
    return { success: true };
  }

  async uploadCompanyLogo(file: Express.Multer.File) {
    const settings = await this.getCompanySettings();
    if ((settings as any).company_logo_public_id) {
      try {
        await this.cloudinary.deleteFile((settings as any).company_logo_public_id);
      } catch {}
    }

    const uploaded = await this.cloudinary.uploadFile(
      file,
      'company',
      `logo-${Date.now()}`,
    );

    settings.company_logo = uploaded.url;
    (settings as any).company_logo_public_id = uploaded.public_id;
    await this.companyRepo.save(settings);

    return {
      url: uploaded.url,
      public_id: uploaded.public_id,
      width: uploaded.width,
      height: uploaded.height,
      format: uploaded.format,
    };
  }
}
