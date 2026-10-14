import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as ExcelJS from 'exceljs';
import * as path from 'path';
import { Lead } from './entities/lead.entity';
import { LeadTrialAsset } from './entities/lead-trial-asset.entity';
import { LeadCommunicationLog } from './entities/lead-communication-log.entity';
import { LeadConsultation } from './entities/lead-consultation.entity';

@Injectable()
export class LeadsService {
  constructor(
    @InjectRepository(Lead)
    private leadRepo: Repository<Lead>,
    @InjectRepository(LeadTrialAsset)
    private assetRepo: Repository<LeadTrialAsset>,
    @InjectRepository(LeadCommunicationLog)
    private commRepo: Repository<LeadCommunicationLog>,
    @InjectRepository(LeadConsultation)
    private consultRepo: Repository<LeadConsultation>,
  ) {}

  async findAll(type?: string, status?: string, search?: string) {
    const qb = this.leadRepo.createQueryBuilder('l')
      .leftJoinAndSelect('l.trial_assets', 'a')
      .leftJoinAndSelect('l.communication_logs', 'c')
      .leftJoinAndSelect('l.consultations', 'v')
      .where('l.is_deleted = false')
      .orderBy('l.created_at', 'DESC');

    if (type) {
      qb.andWhere('l.type = :type', { type });
    }

    if (status) {
      qb.andWhere('l.status = :status', { status });
    }

    if (search) {
      qb.andWhere('(l.full_name ILIKE :s OR l.email ILIKE :s OR l.company_name ILIKE :s)', { s: `%${search}%` });
    }

    return qb.getMany();
  }

  async findOne(id: number) {
    const lead = await this.leadRepo.findOne({
      where: { id, is_deleted: false },
      relations: ['trial_assets', 'communication_logs', 'consultations'],
    });
    if (!lead) throw new NotFoundException('Lead not found');
    return lead;
  }

  async createInquiry(data: Partial<Lead>) {
    const lead = this.leadRepo.create({ ...data, type: data.type || 'Inquiry' });
    return this.leadRepo.save(lead);
  }

  async createFreeTrial(data: Partial<Lead>, assets?: Array<{ file_name: string; original_name: string; file_path: string; file_size?: number; file_type?: string }>) {
    const lead = this.leadRepo.create({
      ...data,
      type: 'Free Trial',
    });
    const saved = await this.leadRepo.save(lead);

    if (assets && assets.length > 0) {
      const assetEntities = assets.map((a, idx) =>
        this.assetRepo.create({
          lead_id: saved.id,
          file_name: a.file_name,
          original_name: a.original_name,
          file_path: a.file_path,
          file_size: a.file_size,
          file_type: a.file_type,
          sort_order: idx,
        })
      );
      await this.assetRepo.save(assetEntities);
    }

    return this.findOne(saved.id);
  }

  async updateLead(id: number, data: Partial<Lead>) {
    const lead = await this.findOne(id);
    Object.assign(lead, data);
    await this.leadRepo.save(lead);
    return this.findOne(id);
  }

  async updateStatus(id: number, status: string, adminUserId?: number, notes?: string) {
    const lead = await this.findOne(id);
    lead.status = status;
    await this.leadRepo.save(lead);

    if (notes) {
      await this.commRepo.save({
        lead_id: id,
        admin_user_id: adminUserId,
        notes,
      });
    }

    return this.findOne(id);
  }

  async addNote(id: number, notes: string, adminUserId?: number) {
    await this.findOne(id);
    const log = await this.commRepo.save({
      lead_id: id,
      admin_user_id: adminUserId,
      notes,
    });
    return this.findOne(id);
  }

  async export(type?: string, status?: string, search?: string, format = 'xlsx') {
    const leads = await this.findAll(type, status, search);
    const rows = leads.map((l) => ({
      id: l.id,
      type: l.type,
      full_name: l.full_name,
      email: l.email,
      mobile_prefix: l.mobile_prefix,
      mobile_number: l.mobile_number,
      company_name: l.company_name,
      designation: l.designation,
      message: l.message,
      status: l.status,
      calendly_slot: l.calendly_slot ? JSON.stringify(l.calendly_slot) : '',
      service_requirements: l.service_requirements ? l.service_requirements.join(', ') : '',
      return_file_format: l.return_file_format,
      detailed_instructions: l.detailed_instructions,
      want_commercial_quote: l.want_commercial_quote ? 'Yes' : 'No',
      created_at: l.created_at?.toISOString(),
    }));

    const columns = [
      { header: 'ID', key: 'id', width: 6 },
      { header: 'Type', key: 'type', width: 14 },
      { header: 'Full Name', key: 'full_name', width: 22 },
      { header: 'Email', key: 'email', width: 30 },
      { header: 'Mobile Prefix', key: 'mobile_prefix', width: 12 },
      { header: 'Mobile Number', key: 'mobile_number', width: 16 },
      { header: 'Company', key: 'company_name', width: 24 },
      { header: 'Designation', key: 'designation', width: 18 },
      { header: 'Message', key: 'message', width: 40 },
      { header: 'Status', key: 'status', width: 14 },
      { header: 'Calendly Slot', key: 'calendly_slot', width: 30 },
      { header: 'Service Requirements', key: 'service_requirements', width: 40 },
      { header: 'Return Format', key: 'return_file_format', width: 14 },
      { header: 'Detailed Instructions', key: 'detailed_instructions', width: 40 },
      { header: 'Want Commercial Quote', key: 'want_commercial_quote', width: 20 },
      { header: 'Created At', key: 'created_at', width: 24 },
    ];

    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet('Leads');
    ws.columns = columns as any;
    rows.forEach((r) => ws.addRow(r));

    if (format === 'csv') {
      const buffer = await wb.csv.writeBuffer();
      return { buffer: Buffer.from(buffer), mime: 'text/csv', ext: 'csv' };
    }

    const buffer = await wb.xlsx.writeBuffer();
    return {
      buffer: Buffer.from(buffer),
      mime: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      ext: 'xlsx',
    };
  }

  async assignLead(id: number, assignedOwnerId: number) {
    const lead = await this.findOne(id);
    lead.assigned_owner_id = assignedOwnerId;
    await this.leadRepo.save(lead);
    return this.findOne(id);
  }

  async findByClientEmail(email?: string) {
    if (!email) return [];
    const leads = await this.leadRepo.find({
      where: { email: email.toLowerCase(), is_deleted: false },
      relations: ['trial_assets', 'communication_logs', 'consultations'],
      order: { created_at: 'DESC' },
    });
    return leads;
  }

  async upsertConsultationFromCalendly(payload: any) {
    const event = payload.payload || payload;
    const email = event.email?.toLowerCase() || null;
    const eventId = event.event_uri || event.uri || event.event || `cal-${Date.now()}`;
    const startTime = event.start_time ? new Date(event.start_time) : new Date();
    const statusMap: Record<string, string> = {
      scheduled: 'scheduled',
      invitee_scheduled: 'scheduled',
      completed: 'completed',
      canceled: 'cancelled',
      cancelled: 'cancelled',
      invitee_cancelled: 'cancelled',
    };

    let lead: Lead;
    if (email) {
      lead = await this.leadRepo.findOne({
        where: { email, is_deleted: false },
      });
      if (lead) {
        lead.type = 'Consultation';
        await this.leadRepo.save(lead);
      } else {
        lead = await this.leadRepo.save(
          this.leadRepo.create({
            type: 'Consultation',
            full_name: event.name || null,
            email,
            company_name: event.company || null,
            message: event.variables?.message || event.questions_and_answers || null,
            source_channel: 'Calendly',
          }),
        );
      }
    } else {
      throw new NotFoundException('Calendly payload missing email');
    }

    let consultation = await this.consultRepo.findOne({
      where: { calendly_event_id: eventId },
    });
    if (consultation) {
      consultation.scheduled_at = startTime;
      consultation.timezone = event.timezone || consultation.timezone;
      consultation.meeting_link = event.location?.join_url || consultation.meeting_link;
      consultation.meeting_status = statusMap[event.status] || consultation.meeting_status;
      consultation = await this.consultRepo.save(consultation);
    } else {
      consultation = await this.consultRepo.save(
        this.consultRepo.create({
          lead_id: lead.id,
          scheduled_at: startTime,
          timezone: event.timezone || null,
          calendly_event_id: eventId,
          meeting_link: event.location?.join_url || null,
          meeting_status: statusMap[event.status] || 'scheduled',
        }),
      );
    }

    return this.findOne(lead.id);
  }

  async findTrialAssets(id: number) {
    const lead = await this.findOne(id);
    return lead.trial_assets || [];
  }

  async downloadTrialAssetsZip(id: number): Promise<{ stream: any; filename: string }> {
    const lead = await this.findOne(id);
    const assets = lead.trial_assets || [];

    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const archive = require('archiver')('zip', { zlib: { level: 9 } }) as any;
    const safeName = (lead.full_name || `lead-${lead.id}`).replace(/[^a-z0-9-_ ]/gi, '').trim() || `lead-${lead.id}`;
    const filename = `${safeName}-trial-assets.zip`;

    for (const asset of assets) {
      const ext = path.extname(asset.file_name || asset.original_name || '') || '.file';
      const archiveName = `${asset.original_name || asset.file_name}${ext}`;
      const source = asset.file_path;
      try {
        if (/^https?:\/\//i.test(source)) {
          archive.append(this._resolveRemote(source), { name: archiveName });
        } else {
          archive.file(path.resolve(source), { name: archiveName });
        }
      } catch {
        // skip unreadable files
      }
    }

    archive.finalize();
    return { stream: archive, filename };
  }

  private _resolveRemote(url: string): NodeJS.ReadableStream {
    const lib = url.startsWith('https') ? require('https') : require('http');
    return lib.get(url, (res: any) => res);
  }

  async remove(id: number) {
    const lead = await this.findOne(id);
    lead.is_deleted = true;
    await this.leadRepo.save(lead);
    return { success: true };
  }
}