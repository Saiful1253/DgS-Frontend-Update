import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

/**
 * A certificate shown on the storefront (spec §4).
 *
 * Content is authored in English only. The storefront renders it into Bangla at
 * runtime through the `<AutoTranslate>` layer, so a second Bangla column would
 * be a second source of truth that silently drifts out of sync with the first.
 *
 * `file_type` discriminates the single `file_url` between an image (rendered
 * inline, opened in the lightbox) and a PDF (opened in the embedded viewer).
 * `thumb_url` is what a grid card shows: the image itself, or page 1 of a PDF
 * exported by Cloudinary.
 */
@Entity('certificates')
export class Certificate {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 255 })
  title: string;

  /** Rich text (HTML). */
  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ type: 'varchar', length: 10, default: 'image' })
  file_type: 'image' | 'pdf';

  /**
   * The document itself. Nullable on purpose: a licence is registered with its
   * authority and its number long before the scan is uploaded, and a card that
   * refuses to publish until then hides the certificate the customer is
   * actually asking about. A null file renders a "document on request" panel.
   */
  @Column({ type: 'varchar', length: 500, nullable: true })
  file_url: string | null;

  /** Grid thumbnail. Same as `file_url` for images, page 1 for PDFs. */
  @Column({ type: 'varchar', length: 500, nullable: true })
  thumb_url: string | null;

  /** Registration / licence number shown as a pill, e.g. `REG #TGS-1C-4402`. */
  @Column({ type: 'varchar', length: 100, nullable: true })
  reg_no: string | null;

  /**
   * Key into the storefront's icon map — `award` | `medal` | `flame` |
   * `shield` | `scale` | `file`.
   *
   * A key, not a URL: a re-brand should not mean re-uploading an icon for every
   * certificate. Unknown keys fall back to a neutral document icon.
   */
  @Column({ type: 'varchar', length: 500, nullable: true })
  category_icon: string | null;

  /** One-line footer note under the card, e.g. "Verified & Active License". */
  @Column({ type: 'varchar', length: 100, nullable: true })
  sub_label: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  issuing_authority: string | null;

  @Column({ type: 'int', nullable: true })
  year: number | null;

  @Column({ type: 'varchar', length: 500, nullable: true })
  verification_link: string | null;

  /** Landing-page placement (spec §4: max 8 featured shown there). */
  @Column({ type: 'boolean', default: false })
  is_featured: boolean;

  @Column({ type: 'int', default: 0 })
  display_order: number;

  @Column({ type: 'boolean', default: true })
  is_active: boolean;

  @Column({ type: 'boolean', default: false })
  is_deleted: boolean;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}