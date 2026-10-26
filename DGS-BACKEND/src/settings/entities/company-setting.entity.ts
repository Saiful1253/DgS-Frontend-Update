import { Entity, PrimaryGeneratedColumn, Column, UpdateDateColumn } from 'typeorm';

@Entity('company_settings')
export class CompanySetting {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 255, default: 'Milanova Technologies S.R.L.' })
  legal_company_name: string;

  @Column({ type: 'varchar', length: 255, default: 'Milanova Technologies' })
  brand_name: string;

  @Column({ type: 'text', nullable: true })
  mission_purpose: string;

  @Column({ type: 'text', nullable: true })
  incorporation_details: string; // Country/State, Tax/Business ID

  @Column({ type: 'text', nullable: true })
  eu_standards_badge_info: string;

  // Contact & Hubs
  @Column({ type: 'text', nullable: true })
  primary_headquarters_address: string; // Italy HQ

  @Column({ type: 'jsonb', nullable: true })
  branch_addresses: Array<{ city: string; country: string; address: string; phone?: string }>;

  @Column({ type: 'jsonb', nullable: true })
  official_emails: { general?: string; support?: string; sales?: string; careers?: string };

  @Column({ type: 'jsonb', nullable: true })
  official_phones: { phone?: string; whatsapp?: string; country_code?: string };

  // Social & Booking Links
  @Column({ type: 'jsonb', nullable: true })
  social_links: { linkedin?: string; facebook?: string; twitter?: string; github?: string; youtube?: string };

  @Column({ type: 'varchar', length: 500, nullable: true })
  calendly_url: string;

  // Section 3 Goals & Conversion Strategy
  @Column({ type: 'varchar', length: 100, default: 'Book Consultation' })
  core_cta_objective: string; // 'Book Consultation' | 'Request Live Demo' | 'Start Free Trial' | 'Direct Sales Inquiry'

  @Column({ type: 'int', default: 100 })
  target_monthly_lead_capacity: number; // Internal KPI dashboard benchmark

  @Column({ type: 'jsonb', nullable: true })
  target_geographies: string[]; // ['North America', 'EU', 'Asia-Pacific', 'Local Market']

  @Column({ type: 'text', nullable: true })
  ideal_client_persona_focus: string; // Enterprise size, industry focus, deal size guidance

  @Column({ type: 'jsonb', nullable: true })
  priority_focus_offerings: string[]; // Multi-select database offerings for Homepage/Hero

  @Column({ type: 'jsonb', nullable: true })
  secondary_conversion_events: string[]; // ['Newsletter Signups', 'Whitepaper Downloads', 'Job Applications']

  // Integrations & Scripts (Submenu 4)
  @Column({ type: 'varchar', length: 100, nullable: true })
  ga4_measurement_id: string; // e.g. G-XXXXXXXXXX

  @Column({ type: 'varchar', length: 100, nullable: true })
  gtm_container_id: string; // e.g. GTM-XXXXXXX

  @Column({ type: 'varchar', length: 100, nullable: true })
  meta_pixel_id: string; // Meta/Facebook Pixel ID

  @Column({ type: 'text', nullable: true })
  custom_head_scripts: string; // <head> scripts & meta verification tags

  @Column({ type: 'text', nullable: true })
  custom_body_scripts: string; // </body> footer scripts & chat widgets


  // Branding & Media
  @Column({ type: 'varchar', length: 500, nullable: true })
  company_logo: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  company_logo_public_id: string;

  @Column({ type: 'text', nullable: true })
  footer_text: string;

  @Column({ type: 'varchar', length: 10, nullable: true })
  copyright_year: string;

  // SEO Defaults
  @Column({ type: 'varchar', length: 255, nullable: true })
  site_meta_title: string;

  @Column({ type: 'text', nullable: true })
  site_meta_description: string;

  @Column({ type: 'text', nullable: true })
  site_meta_keywords: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  site_og_image: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  canonical_url: string;

  // Legal
  @Column({ type: 'text', nullable: true })
  terms_and_conditions: string;

  @Column({ type: 'text', nullable: true })
  privacy_policy: string;

  // WhatsApp Popup
  @Column({ type: 'varchar', length: 10, nullable: true })
  whatsapp_popup: string;

  // EMI Settings
  @Column({ type: 'varchar', length: 10, nullable: true })
  emi_enabled: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  emi_interest_rate: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  emi_min_amount: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  emi_tenures: string;

  @Column({ type: 'text', nullable: true })
  emi_tenure_rates: string;

  // Feature Flags
  @Column({ type: 'varchar', length: 10, nullable: true })
  hide_advanced_routes: string;


  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  company_latitude: number;

  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  company_longitude: number;

  @UpdateDateColumn()
  updated_at: Date;
}
