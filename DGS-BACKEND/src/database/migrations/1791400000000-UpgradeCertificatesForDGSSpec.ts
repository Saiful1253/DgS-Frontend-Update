import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Reshapes `certificates` for the DGS certificate module (spec §4).
 *
 * The table was authored for the MilanoVA badge strip: one English `name`, a
 * `badge_image_url` and a `display_locations` array. The storefront needs an
 * image *or* a PDF per record, an editor-authored description in two languages,
 * and a featured flag for the landing page — none of which the old columns can
 * express.
 *
 * Bilingual content follows the column-pair convention chosen for the site
 * (`title_bn` / `title_en`) rather than a JSONB blob, so a column can be indexed
 * and searched with plain ILIKE.
 *
 * Legacy rows are backfilled, not dropped: `name` seeds both titles and
 * `badge_image_url` seeds the media columns, so the existing certificates
 * survive the migration.
 */
export class UpgradeCertificatesForDGSSpec1791400000000
  implements MigrationInterface
{
  name = 'UpgradeCertificatesForDGSSpec1791400000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "certificates" ADD COLUMN IF NOT EXISTS "title_bn" character varying(255)`,
    );
    await queryRunner.query(
      `ALTER TABLE "certificates" ADD COLUMN IF NOT EXISTS "title_en" character varying(255)`,
    );
    await queryRunner.query(
      `ALTER TABLE "certificates" ADD COLUMN IF NOT EXISTS "description_bn" text`,
    );
    await queryRunner.query(
      `ALTER TABLE "certificates" ADD COLUMN IF NOT EXISTS "description_en" text`,
    );
    await queryRunner.query(
      `ALTER TABLE "certificates" ADD COLUMN IF NOT EXISTS "file_type" character varying(10) NOT NULL DEFAULT 'image'`,
    );
    await queryRunner.query(
      `ALTER TABLE "certificates" ADD COLUMN IF NOT EXISTS "file_url" character varying(500)`,
    );
    await queryRunner.query(
      `ALTER TABLE "certificates" ADD COLUMN IF NOT EXISTS "thumb_url" character varying(500)`,
    );
    await queryRunner.query(
      `ALTER TABLE "certificates" ADD COLUMN IF NOT EXISTS "is_featured" boolean NOT NULL DEFAULT false`,
    );
    await queryRunner.query(
      `ALTER TABLE "certificates" ADD COLUMN IF NOT EXISTS "display_order" integer NOT NULL DEFAULT 0`,
    );

    // ── Backfill from the legacy columns ──────────────────────────────────
    // Bangla falls back to the English title rather than to an empty string, so
    // a record authored before the column split still renders in both locales.
    await queryRunner.query(
      `UPDATE "certificates" SET "title_en" = "name" WHERE "title_en" IS NULL`,
    );
    await queryRunner.query(
      `UPDATE "certificates" SET "title_bn" = COALESCE("title_en", "name") WHERE "title_bn" IS NULL`,
    );
    await queryRunner.query(
      `UPDATE "certificates" SET "file_url" = "badge_image_url" WHERE "file_url" IS NULL AND "badge_image_url" IS NOT NULL`,
    );
    await queryRunner.query(
      `UPDATE "certificates" SET "thumb_url" = "badge_image_url" WHERE "thumb_url" IS NULL AND "badge_image_url" IS NOT NULL`,
    );

    await queryRunner.query(`ALTER TABLE "certificates" DROP COLUMN IF EXISTS "name"`);
    await queryRunner.query(
      `ALTER TABLE "certificates" DROP COLUMN IF EXISTS "badge_image_url"`,
    );
    await queryRunner.query(
      `ALTER TABLE "certificates" DROP COLUMN IF EXISTS "display_locations"`,
    );

    // The public read always filters on (is_active, is_deleted) and orders by
    // display_order, optionally narrowed to is_featured.
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_certificates_public" ON "certificates" ("is_active", "is_deleted", "is_featured", "display_order")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_certificates_public"`);

    await queryRunner.query(
      `ALTER TABLE "certificates" ADD COLUMN IF NOT EXISTS "name" character varying(255)`,
    );
    await queryRunner.query(
      `ALTER TABLE "certificates" ADD COLUMN IF NOT EXISTS "badge_image_url" character varying(500)`,
    );
    await queryRunner.query(
      `ALTER TABLE "certificates" ADD COLUMN IF NOT EXISTS "display_locations" jsonb`,
    );

    await queryRunner.query(
      `UPDATE "certificates" SET "name" = COALESCE("title_en", "title_bn") WHERE "name" IS NULL`,
    );
    await queryRunner.query(
      `UPDATE "certificates" SET "badge_image_url" = "file_url" WHERE "badge_image_url" IS NULL AND "file_url" IS NOT NULL`,
    );

    await queryRunner.query(
      `ALTER TABLE "certificates" DROP COLUMN IF EXISTS "display_order"`,
    );
    await queryRunner.query(
      `ALTER TABLE "certificates" DROP COLUMN IF EXISTS "is_featured"`,
    );
    await queryRunner.query(
      `ALTER TABLE "certificates" DROP COLUMN IF EXISTS "thumb_url"`,
    );
    await queryRunner.query(
      `ALTER TABLE "certificates" DROP COLUMN IF EXISTS "file_url"`,
    );
    await queryRunner.query(
      `ALTER TABLE "certificates" DROP COLUMN IF EXISTS "file_type"`,
    );
    await queryRunner.query(
      `ALTER TABLE "certificates" DROP COLUMN IF EXISTS "description_en"`,
    );
    await queryRunner.query(
      `ALTER TABLE "certificates" DROP COLUMN IF EXISTS "description_bn"`,
    );
    await queryRunner.query(
      `ALTER TABLE "certificates" DROP COLUMN IF EXISTS "title_en"`,
    );
    await queryRunner.query(
      `ALTER TABLE "certificates" DROP COLUMN IF EXISTS "title_bn"`,
    );
  }
}