import { MigrationInterface, QueryRunner } from "typeorm";

export class UpgradeTestimonialsForReviewsSpec1792900000000 implements MigrationInterface {
  name = 'UpgradeTestimonialsForReviewsSpec1792900000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "testimonials" ADD COLUMN IF NOT EXISTS "type" character varying(20) NOT NULL DEFAULT 'text'`);
    await queryRunner.query(`ALTER TABLE "testimonials" ADD COLUMN IF NOT EXISTS "image_url" character varying(512)`);
    await queryRunner.query(`ALTER TABLE "testimonials" ADD COLUMN IF NOT EXISTS "image_public_id" text`);
    await queryRunner.query(`ALTER TABLE "testimonials" ADD COLUMN IF NOT EXISTS "status" character varying(20) NOT NULL DEFAULT 'approved'`);
    await queryRunner.query(`ALTER TABLE "testimonials" ADD COLUMN IF NOT EXISTS "source" character varying(20) NOT NULL DEFAULT 'admin'`);

    // Backfill image_url from avatar_url if available
    await queryRunner.query(`
      UPDATE "testimonials" 
      SET "image_url" = "avatar_url" 
      WHERE "image_url" IS NULL AND "avatar_url" IS NOT NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "testimonials" DROP COLUMN IF EXISTS "source"`);
    await queryRunner.query(`ALTER TABLE "testimonials" DROP COLUMN IF EXISTS "status"`);
    await queryRunner.query(`ALTER TABLE "testimonials" DROP COLUMN IF EXISTS "image_public_id"`);
    await queryRunner.query(`ALTER TABLE "testimonials" DROP COLUMN IF EXISTS "image_url"`);
    await queryRunner.query(`ALTER TABLE "testimonials" DROP COLUMN IF EXISTS "type"`);
  }
}
