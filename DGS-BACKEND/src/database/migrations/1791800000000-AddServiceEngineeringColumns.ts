import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddServiceEngineeringColumns1791800000000
  implements MigrationInterface
{
  name = 'AddServiceEngineeringColumns1791800000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "services" ADD COLUMN IF NOT EXISTS "spec_code" character varying(50)`,
    );
    await queryRunner.query(
      `ALTER TABLE "services" ADD COLUMN IF NOT EXISTS "badge_label" character varying(100)`,
    );
    await queryRunner.query(
      `ALTER TABLE "services" ADD COLUMN IF NOT EXISTS "badge_status" character varying(100)`,
    );
    await queryRunner.query(
      `ALTER TABLE "services" ADD COLUMN IF NOT EXISTS "sub_title" character varying(255)`,
    );
    await queryRunner.query(
      `ALTER TABLE "services" ADD COLUMN IF NOT EXISTS "category_tag" character varying(100)`,
    );
    await queryRunner.query(
      `ALTER TABLE "services" ADD COLUMN IF NOT EXISTS "tier_label" character varying(100)`,
    );
    await queryRunner.query(
      `ALTER TABLE "services" ADD COLUMN IF NOT EXISTS "image_url" character varying(500)`,
    );
    await queryRunner.query(
      `ALTER TABLE "services" ADD COLUMN IF NOT EXISTS "is_flagship" boolean NOT NULL DEFAULT false`,
    );
    await queryRunner.query(
      `ALTER TABLE "services" ADD COLUMN IF NOT EXISTS "features" jsonb`,
    );
    await queryRunner.query(
      `ALTER TABLE "services" ADD COLUMN IF NOT EXISTS "compliance_codes" character varying(255)`,
    );
    await queryRunner.query(
      `ALTER TABLE "services" ADD COLUMN IF NOT EXISTS "cta_label" character varying(100)`,
    );
    await queryRunner.query(
      `ALTER TABLE "services" ADD COLUMN IF NOT EXISTS "cta_url" character varying(255)`,
    );

    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_services_is_flagship" ON "services" ("is_flagship")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_services_is_flagship"`);

    await queryRunner.query(
      `ALTER TABLE "services" DROP COLUMN IF EXISTS "cta_url"`,
    );
    await queryRunner.query(
      `ALTER TABLE "services" DROP COLUMN IF EXISTS "cta_label"`,
    );
    await queryRunner.query(
      `ALTER TABLE "services" DROP COLUMN IF EXISTS "compliance_codes"`,
    );
    await queryRunner.query(
      `ALTER TABLE "services" DROP COLUMN IF EXISTS "features"`,
    );
    await queryRunner.query(
      `ALTER TABLE "services" DROP COLUMN IF EXISTS "is_flagship"`,
    );
    await queryRunner.query(
      `ALTER TABLE "services" DROP COLUMN IF EXISTS "image_url"`,
    );
    await queryRunner.query(
      `ALTER TABLE "services" DROP COLUMN IF EXISTS "tier_label"`,
    );
    await queryRunner.query(
      `ALTER TABLE "services" DROP COLUMN IF EXISTS "category_tag"`,
    );
    await queryRunner.query(
      `ALTER TABLE "services" DROP COLUMN IF EXISTS "sub_title"`,
    );
    await queryRunner.query(
      `ALTER TABLE "services" DROP COLUMN IF EXISTS "badge_status"`,
    );
    await queryRunner.query(
      `ALTER TABLE "services" DROP COLUMN IF EXISTS "badge_label"`,
    );
    await queryRunner.query(
      `ALTER TABLE "services" DROP COLUMN IF EXISTS "spec_code"`,
    );
  }
}
