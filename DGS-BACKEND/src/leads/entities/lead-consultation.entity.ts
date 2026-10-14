import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Lead } from './lead.entity';

@Entity('lead_consultations')
export class LeadConsultation {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int' })
  lead_id: number;

  @ManyToOne(() => Lead, (lead) => lead.consultations, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'lead_id' })
  lead: Lead;

  @Column({ type: 'timestamp', nullable: true })
  scheduled_at: Date;

  @Column({ type: 'varchar', length: 100, nullable: true })
  timezone: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  calendly_event_id: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  meeting_link: string;

  @Column({ type: 'varchar', length: 50, default: 'scheduled' })
  meeting_status: string; // 'scheduled' | 'completed' | 'cancelled' | 'no-show'

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}