import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Adds the three presentation columns the "Government & Regulatory
 * Certifications" section needs (see certifications_implementation_plan.md).
 *
 * - `reg_no`         the registration/licence number shown as a pill, e.g.
 *                    `REG #TGS-1C-4402`. Visitors quote it back to us, so it is
 *                    indexed.
 * - `category_icon`  a key into the storefront's icon map
 *                    (award|medal|flame|shield|scale|file). Stored as a key
 *                    rather than a URL so a re-brand is a mapping change, not a
 *                    re-upload of every certificate.
 * - `sub_label`      the one-line footer note under a card, e.g.
 *                    "Verified & Active License".
 *
 * All three are nullable: a certificate added before this migration still
 * renders, it just has no pill and falls back to its issuing authority.
 */
export class AddCertificateDesignColumns1791500000000
  implements MigrationInterface
{
  name = 'AddCertificateDesignColumns1791500000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "certificates" ADD COLUMN IF NOT EXISTS "reg_no" character varying(100)`,
    );
    await queryRunner.query(
      `ALTER TABLE "certificates" ADD COLUMN IF NOT EXISTS "category_icon" character varying(50)`,
    );
    await queryRunner.query(
      `ALTER TABLE "certificates" ADD COLUMN IF NOT EXISTS "sub_label" character varying(100)`,
    );

    // The public query filters on (is_active, is_deleted) and the section sorts
    // by display_order; reg_no is searched by the site's search box.
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_certificates_reg_no" ON "certificates" ("reg_no")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_certificates_reg_no"`);

    await queryRunner.query(
      `ALTER TABLE "certificates" DROP COLUMN IF EXISTS "sub_label"`,
    );
    await queryRunner.query(
      `ALTER TABLE "certificates" DROP COLUMN IF EXISTS "category_icon"`,
    );
    await queryRunner.query(
      `ALTER TABLE "certificates" DROP COLUMN IF EXISTS "reg_no"`,
    );
  }
}