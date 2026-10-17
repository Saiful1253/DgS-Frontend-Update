import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { LeadTrialAsset } from './lead-trial-asset.entity';
import { LeadCommunicationLog } from './lead-communication-log.entity';
import { LeadConsultation } from './lead-consultation.entity';

@Entity('leads')
export class Lead {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 50, default: 'Inquiry' })
  type: string; // 'Inquiry' | 'Consultation' | 'Free Trial'

  @Column({ type: 'varchar', length: 100, default: 'Website Form', nullable: true })
  source_channel: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  country: string;

  @Column({ type: 'varchar', length: 10, nullable: true })
  currency: string;

  @Column({ type: 'numeric', precision: 12, scale: 2, nullable: true })
  est_deal_value: string | number;

  @Column({ type: 'varchar', length: 500, nullable: true })
  source_page_url: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  client_ip: string;

  @Column({ type: 'int', nullable: true })
  assigned_owner_id: number;

  @Column({ type: 'date', nullable: true })
  follow_up_date: string;

  @Column({ type: 'text', nullable: true })
  follow_up_notes: string;

  @Column({ type: 'boolean', default: false })
  is_deleted: boolean;

  @Column({ type: 'varchar', length: 255 })
  full_name: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  email: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  mobile_prefix: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  mobile_number: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  company_name: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  designation: string;

  @Column({ type: 'text', nullable: true })
  message: string;

  // Consultation slot
  @Column({ type: 'jsonb', nullable: true })
  calendly_slot: { date?: string; time?: string; url?: string };

  // Free trial post-production specifications
  @Column({ type: 'jsonb', nullable: true })
  service_requirements: string[]; // ['Clipping Path', 'Shadow Adding', 'Background Removal', 'Photo Retouching', ...]

  @Column({ type: 'varchar', length: 50, nullable: true })
  return_file_format: string; // 'PSD' | 'JPG' | 'PNG' | 'TIFF' | 'PDF'

  @Column({ type: 'text', nullable: true })
  detailed_instructions: string;

  @Column({ type: 'boolean', default: false })
  want_commercial_quote: boolean;

  // Status & Logs
  @Column({ type: 'varchar', length: 50, default: 'New' })
  status: string; // 'New' | 'Contacted' | 'In Progress' | 'Closed' | 'Rejected'

  @OneToMany(() => LeadTrialAsset, (asset) => asset.lead, { cascade: true })
  trial_assets: LeadTrialAsset[];

  @OneToMany(() => LeadCommunicationLog, (log) => log.lead, { cascade: true })
  communication_logs: LeadCommunicationLog[];

  @OneToMany(() => LeadConsultation, (c) => c.lead, { cascade: true })
  consultations: LeadConsultation[];

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
