import { MigrationInterface, QueryRunner } from "typeorm";

export class AddIconColorToWhyChooseUs1792400000000 implements MigrationInterface {
  name = 'AddIconColorToWhyChooseUs1792400000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "why_choose_us"
      ADD COLUMN IF NOT EXISTS "icon_color" character varying(50),
      ADD COLUMN IF NOT EXISTS "badge_color" character varying(50),
      ADD COLUMN IF NOT EXISTS "icon_name" character varying(100)
    `);

    // Backfill default themes for screenshot 1 items
    await queryRunner.query(`
      UPDATE "why_choose_us"
      SET "icon_color" = '#10b981', "badge_color" = '#043e2d', "icon_name" = 'shield-check'
      WHERE "id" = 1 AND "icon_color" IS NULL;

      UPDATE "why_choose_us"
      SET "icon_color" = '#ffffff', "badge_color" = '#1c355e', "icon_name" = 'badge-check'
      WHERE "id" = 2 AND "icon_color" IS NULL;

      UPDATE "why_choose_us"
      SET "icon_color" = '#f95700', "badge_color" = '#e0eaff', "icon_name" = 'users'
      WHERE "id" = 3 AND "icon_color" IS NULL;

      UPDATE "why_choose_us"
      SET "icon_color" = '#8b1e1e', "badge_color" = '#ffe8dc', "icon_name" = 'asterisk'
      WHERE "id" = 4 AND "icon_color" IS NULL;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "why_choose_us"
      DROP COLUMN IF EXISTS "icon_color",
      DROP COLUMN IF EXISTS "badge_color",
      DROP COLUMN IF EXISTS "icon_name"
    `);
  }
}
