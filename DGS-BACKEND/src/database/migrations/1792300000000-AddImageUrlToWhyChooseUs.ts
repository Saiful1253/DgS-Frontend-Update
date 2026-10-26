import { MigrationInterface, QueryRunner } from "typeorm";

export class AddImageUrlToWhyChooseUs1792300000000 implements MigrationInterface {
  name = 'AddImageUrlToWhyChooseUs1792300000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "why_choose_us"
      ADD COLUMN IF NOT EXISTS "image_url" character varying(500)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "why_choose_us"
      DROP COLUMN IF EXISTS "image_url"
    `);
  }
}
