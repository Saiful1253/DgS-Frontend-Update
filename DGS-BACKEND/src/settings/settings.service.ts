import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Technology } from './entities/technology.entity';
import { CompanySetting } from './entities/company-setting.entity';
import { OfficeHub } from './entities/office-hub.entity';
import { Certificate } from './entities/certificate.entity';
import { ComplianceDocument } from './entities/compliance-document.entity';

@Injectable()
export class SettingsService {
  constructor(
    @InjectRepository(Technology)
    private techRepo: Repository<Technology>,
    @InjectRepository(CompanySetting)
    private companyRepo: Repository<CompanySetting>,
    @InjectRepository(OfficeHub)
    private hubRepo: Repository<OfficeHub>,
    @InjectRepository(Certificate)
    private certRepo: Repository<Certificate>,
    @InjectRepository(ComplianceDocument)
    private complianceRepo: Repository<ComplianceDocument>,
  ) { }

  // Technologies
  //
  // `includeInactive` exists because the admin CMS has to manage entries it has
  // switched off. The previous unconditional `is_active = true` filter meant a
  // deactivated technology disappeared from the admin list with no way to bring
  // it back — the row was still in the table, just invisible to the only screen
  // that could edit it. The public catalogue keeps the active-only default.
  async findAllTechnologies(category?: string, includeInactive = false) {
    const qb = this.techRepo.createQueryBuilder('t')
      .orderBy('t.display_order', 'ASC')
      .addOrderBy('t.name', 'ASC');

    if (!includeInactive) {
      qb.where('t.is_active = true');
    }

    if (category && category !== 'All') {
      qb.andWhere('t.category ILIKE :category', { category: `%${category}%` });
    }

    return qb.getMany();
  }

  async createTechnology(data: Partial<Technology>) {
    const tech = this.techRepo.create(data);
    return this.techRepo.save(tech);
  }

  async updateTechnology(id: number, data: Partial<Technology>) {
    await this.techRepo.update(id, data);
    return this.techRepo.findOneBy({ id });
  }

  async reorderTechnologies(order: { id: number; display_order: number }[]): Promise<boolean> {
    if (!order || !order.length) return true;
    const ids = order.map((o) => o.id);
    const uniqueIds = [...new Set(ids)];
    if (uniqueIds.length !== ids.length) {
      throw new BadRequestException('Duplicate ids in technology reorder payload');
    }
    return this.techRepo.manager.transaction(async (manager) => {
      for (const item of order) {
        await manager.update(Technology, { id: item.id }, {
          display_order: item.display_order,
        });
      }
      return true;
    });
  }

  async removeTechnology(id: number) {
    await this.techRepo.delete(id);
    return { success: true };
  }

  // Company Overview Settings
  async getCompanySettings() {
    let settings = await this.companyRepo.findOne({ where: { id: 1 } });
    if (!settings) {
      settings = this.companyRepo.create({
        id: 1,
        legal_company_name: 'Milanova Technologies S.R.L.',
        brand_name: 'Digital Gas Service',
        primary_headquarters_address: 'Via Rome 45, Milan, Italy',
        official_emails: { general: 'info@milanovatech.com', sales: 'sales@milanovatech.com' },
        calendly_url: 'https://calendly.com/milanova-tech/30min',
      });
      await this.companyRepo.save(settings);
    }
    return settings;
  }

  async updateCompanySettings(data: Partial<CompanySetting>) {
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
  async findAllCertificates() {
    return this.certRepo.find({
      where: { is_deleted: false },
      order: { year: 'DESC', id: 'ASC' },
    });
  }

  async findAllCertificatesPublic() {
    return this.certRepo.find({
      where: { is_active: true, is_deleted: false },
      order: { year: 'DESC', id: 'ASC' },
    });
  }

  async findCertificate(id: number) {
    const item = await this.certRepo.findOneBy({ id });
    if (!item || item.is_deleted) throw new NotFoundException('Certificate not found');
    return item;
  }

  async createCertificate(data: Partial<Certificate>) {
    const item = this.certRepo.create(data);
    return this.certRepo.save(item);
  }

  async updateCertificate(id: number, data: Partial<Certificate>) {
    const item = await this.findCertificate(id);
    Object.assign(item, data);
    return this.certRepo.save(item);
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
}
