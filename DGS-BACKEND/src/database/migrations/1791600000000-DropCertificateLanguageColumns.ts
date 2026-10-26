import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Collapses the per-language certificate columns into one English source.
 *
 * `title_en`/`description_en` are renamed rather than re-created, so the rows
 * keep their data; the Bangla columns are dropped.
 *
 * They existed so an editor could author Bangla alongside English, but the
 * storefront does not need two sources of truth: `AutoTranslate` already renders
 * English content into Bangla at runtime. Authoring both meant editing one field
 * and forgetting the other, which shows up as an English headline above a Bangla
 * body — worse than no Bangla at all, because it looks authored.
 *
 * `down()` restores the Bangla columns from the English text, so this is
 * reversible if human-edited Bangla copy is ever needed.
 */
export class DropCertificateLanguageColumns1791600000000
  implements MigrationInterface
{
  name = 'DropCertificateLanguageColumns1791600000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "certificates" RENAME COLUMN "title_en" TO "title"`,
    );
    await queryRunner.query(
      `ALTER TABLE "certificates" RENAME COLUMN "description_en" TO "description"`,
    );
    await queryRunner.query(
      `ALTER TABLE "certificates" DROP COLUMN IF EXISTS "title_bn"`,
    );
    await queryRunner.query(
      `ALTER TABLE "certificates" DROP COLUMN IF EXISTS "description_bn"`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "certificates" ADD COLUMN IF NOT EXISTS "title_bn" character varying(255)`,
    );
    await queryRunner.query(
      `ALTER TABLE "certificates" ADD COLUMN IF NOT EXISTS "description_bn" text`,
    );

    // Seed the Bangla columns from the English text so a reverted database
    // renders in both locales instead of blanking every Bangla page.
    await queryRunner.query(
      `UPDATE "certificates" SET "title_bn" = "title" WHERE "title_bn" IS NULL`,
    );
    await queryRunner.query(
      `UPDATE "certificates" SET "description_bn" = "description" WHERE "description_bn" IS NULL`,
    );

    await queryRunner.query(
      `ALTER TABLE "certificates" RENAME COLUMN "title" TO "title_en"`,
    );
    await queryRunner.query(
      `ALTER TABLE "certificates" RENAME COLUMN "description" TO "description_en"`,
    );
  }
}